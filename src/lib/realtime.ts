// Moteur temps réel du jeu, en mémoire.
//
// Les échanges se font par interrogation HTTP (`/api/realtime/poll`) plutôt que
// par WebSocket : l'application tourne en une seule instance, ce qui suffit et
// évite toute infrastructure supplémentaire. L'état est perdu au redémarrage du
// serveur — acceptable, les parties en cours sont alors clôturées côté client.
//
// La persistance des parties terminées est déléguée à `game-persistence.ts` et
// déclenchée une seule fois, ici, par le serveur.

import { persistFinishedGame, type PersistQuestion } from './game-persistence'

export const GAME_CONFIG = {
  questionsPerGame: 20,
  timerSeconds: 20,
  /** Délai d'affichage du résultat avant la question suivante. */
  resultDelayMs: 2600,
  /** Une invitation sans réponse expire au bout de ce délai. */
  invitationTtlMs: 60_000,
  /** Un joueur qui n'interroge plus le serveur est considéré déconnecté. */
  staleAfterMs: 30_000,
  /** Points de base d'une bonne réponse, avant bonus de rapidité. */
  basePoints: 100,
  maxSpeedBonus: 50,
}

type Status = 'AVAILABLE' | 'IN_GAME'
type Choice = 'A' | 'B' | 'C' | 'D'

interface OnlinePlayer {
  userId: string
  pseudo: string
  avatarUrl: string | null
  country: string
  level: number
  status: Status
  lastPoll: number
  joinedAt: number
}

interface ChatMessage {
  id: string
  gameId: string
  senderId: string
  senderPseudo: string
  content: string
  timestamp: number
}

interface Invitation {
  id: string
  fromUserId: string
  fromPseudo: string
  fromAvatarUrl: string | null
  fromLevel: number
  toUserId: string
  categoryFilter: string | null
  createdAt: number
}

interface GameQuestion {
  index: number
  questionId: string
  text: string
  propositions: Record<Choice, string>
  correct: Choice
  explanation?: string | null
  categoryId: string
  categoryName?: string | null
  difficulty?: string | null
  answeredBy: 'A' | 'B'
  answered: boolean
  chosen: Choice | null
  correctA: boolean | null
  correctB: boolean | null
  responseTime?: number
  pointsAwarded?: number
}

interface GameSession {
  id: string
  playerA: OnlinePlayer
  playerB: OnlinePlayer
  categoryFilter: string | null
  questions: GameQuestion[]
  currentTurn: number
  scoreA: number
  scoreB: number
  correctA: number
  correctB: number
  streakA: number
  streakB: number
  bestStreakA: number
  bestStreakB: number
  timesA: number[]
  timesB: number[]
  status: 'IN_PROGRESS' | 'FINISHED'
  questionStartedAt: number | null
  timerSeconds: number
  chat: ChatMessage[]
  createdAt: number
  finishedAt: number | null
  persisted: boolean
  advanceTimer: ReturnType<typeof setTimeout> | null
}

interface UserEvent {
  id: string
  type: string
  data: unknown
  createdAt: number
}

interface QuizState {
  onlinePlayers: Map<string, OnlinePlayer>
  invitations: Map<string, Invitation>
  games: Map<string, GameSession>
  userToGame: Map<string, string>
  userEvents: Map<string, UserEvent[]>
}

declare global {
  var __quizState: QuizState | undefined
  var __quizTimers: boolean | undefined
}

const state: QuizState = (globalThis.__quizState ??= {
  onlinePlayers: new Map(),
  invitations: new Map(),
  games: new Map(),
  userToGame: new Map(),
  userEvents: new Map(),
})

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function pushEvent(userId: string, type: string, data: unknown) {
  const events = state.userEvents.get(userId) || []
  events.push({ id: uid('evt'), type, data, createdAt: Date.now() })
  // On conserve les 80 derniers événements : au-delà, le client a de toute
  // façon perdu le fil et se resynchronisera.
  while (events.length > 80) events.shift()
  state.userEvents.set(userId, events)
}

function presenceList() {
  return Array.from(state.onlinePlayers.values()).map(p => ({
    userId: p.userId,
    pseudo: p.pseudo,
    avatarUrl: p.avatarUrl,
    country: p.country,
    level: p.level,
    status: p.status,
  }))
}

function broadcastPresence() {
  const list = presenceList()
  for (const userId of state.onlinePlayers.keys()) {
    pushEvent(userId, 'presence:update', list)
  }
}

function setStatus(userId: string, status: Status) {
  const p = state.onlinePlayers.get(userId)
  if (p && p.status !== status) {
    p.status = status
    broadcastPresence()
  }
}

/** 100 points de base, plus un bonus décroissant avec le temps de réponse. */
function pointsFor(responseTimeMs: number, timerSeconds: number) {
  const seconds = Math.max(0, responseTimeMs / 1000)
  const ratio = Math.max(0, 1 - seconds / timerSeconds)
  return GAME_CONFIG.basePoints + Math.round(GAME_CONFIG.maxSpeedBonus * ratio)
}

function publicPlayer(p: OnlinePlayer) {
  return {
    userId: p.userId,
    pseudo: p.pseudo,
    avatarUrl: p.avatarUrl,
    country: p.country,
    level: p.level,
  }
}

function publicGame(game: GameSession) {
  return {
    id: game.id,
    playerA: publicPlayer(game.playerA),
    playerB: publicPlayer(game.playerB),
    categoryFilter: game.categoryFilter,
    currentTurn: game.currentTurn,
    totalQuestions: game.questions.length,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    correctA: game.correctA,
    correctB: game.correctB,
    streakA: game.streakA,
    streakB: game.streakB,
    status: game.status,
    timerSeconds: game.timerSeconds,
  }
}

// ---------------------------------------------------------------------------
// Déroulement d'une partie
// ---------------------------------------------------------------------------

function sendQuestion(game: GameSession) {
  const q = game.questions[game.currentTurn]
  if (!q) {
    finishGame(game, null, false)
    return
  }
  game.questionStartedAt = Date.now()
  const payload = {
    gameId: game.id,
    index: q.index,
    total: game.questions.length,
    text: q.text,
    propositions: q.propositions,
    categoryId: q.categoryId,
    categoryName: q.categoryName,
    difficulty: q.difficulty,
    answeredBy: q.answeredBy,
    timerSeconds: game.timerSeconds,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    startedAt: game.questionStartedAt,
  }
  pushEvent(game.playerA.userId, 'game:question', payload)
  pushEvent(game.playerB.userId, 'game:question', payload)
}

function scheduleAdvance(game: GameSession) {
  if (game.advanceTimer) clearTimeout(game.advanceTimer)
  game.advanceTimer = setTimeout(() => {
    game.advanceTimer = null
    advanceGame(game)
  }, GAME_CONFIG.resultDelayMs)
  game.advanceTimer.unref?.()
}

function advanceGame(game: GameSession) {
  if (game.status !== 'IN_PROGRESS') return
  game.currentTurn += 1
  if (game.currentTurn >= game.questions.length) {
    finishGame(game, null, false)
  } else {
    sendQuestion(game)
  }
}

function finishGame(game: GameSession, forcedWinnerId: string | null, forfeit: boolean) {
  if (game.status === 'FINISHED') return
  game.status = 'FINISHED'
  game.finishedAt = Date.now()
  if (game.advanceTimer) {
    clearTimeout(game.advanceTimer)
    game.advanceTimer = null
  }

  let winnerId = forcedWinnerId
  if (!winnerId) {
    if (game.scoreA > game.scoreB) winnerId = game.playerA.userId
    else if (game.scoreB > game.scoreA) winnerId = game.playerB.userId
    else winnerId = null
  }

  const avg = (arr: number[]) =>
    arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0

  const questions: PersistQuestion[] = game.questions.map(q => ({
    index: q.index,
    questionId: q.questionId,
    text: q.text,
    propositions: q.propositions,
    correct: q.correct,
    chosen: q.chosen,
    answeredBy: q.answeredBy,
    correctA: q.correctA,
    correctB: q.correctB,
    explanation: q.explanation ?? null,
    responseTime: q.responseTime,
  }))

  const summary = {
    gameId: game.id,
    status: 'FINISHED' as const,
    winnerId,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    correctA: game.correctA,
    correctB: game.correctB,
    avgTimeA: avg(game.timesA),
    avgTimeB: avg(game.timesB),
    bestStreakA: game.bestStreakA,
    bestStreakB: game.bestStreakB,
    totalQuestions: game.questions.length,
    forfeit,
    playerA: publicPlayer(game.playerA),
    playerB: publicPlayer(game.playerB),
    questions,
  }

  pushEvent(game.playerA.userId, 'game:finished', { ...summary, youAre: 'A' })
  pushEvent(game.playerB.userId, 'game:finished', { ...summary, youAre: 'B' })

  setStatus(game.playerA.userId, 'AVAILABLE')
  setStatus(game.playerB.userId, 'AVAILABLE')
  state.userToGame.delete(game.playerA.userId)
  state.userToGame.delete(game.playerB.userId)

  // Écriture unique en base, côté serveur.
  if (!game.persisted) {
    game.persisted = true
    persistFinishedGame({
      playerAId: game.playerA.userId,
      playerBId: game.playerB.userId,
      categoryFilter: game.categoryFilter,
      questions,
      totalQuestions: game.questions.length,
      scoreA: game.scoreA,
      scoreB: game.scoreB,
      correctA: game.correctA,
      correctB: game.correctB,
      avgTimeA: summary.avgTimeA,
      avgTimeB: summary.avgTimeB,
      streakA: game.bestStreakA,
      streakB: game.bestStreakB,
      winnerId,
      forfeit,
      startedAt: new Date(game.createdAt),
    })
      .then(() => {
        // Le client rafraîchit son profil dès qu'il reçoit cet événement.
        pushEvent(game.playerA.userId, 'profile:refresh', { gameId: game.id })
        pushEvent(game.playerB.userId, 'profile:refresh', { gameId: game.id })
      })
      .catch(err => {
        console.error('[realtime] échec de la persistance de la partie', err)
      })
  }

  const cleanup = setTimeout(() => state.games.delete(game.id), 5 * 60 * 1000)
  cleanup.unref?.()
}

/** Clôt les questions dont le temps imparti est écoulé. */
function processTimeouts() {
  const now = Date.now()
  for (const game of state.games.values()) {
    if (game.status !== 'IN_PROGRESS' || !game.questionStartedAt) continue
    const elapsed = (now - game.questionStartedAt) / 1000
    if (elapsed < game.timerSeconds + 1) continue

    const q = game.questions[game.currentTurn]
    if (!q || q.answered) continue

    q.answered = true
    q.chosen = null
    if (q.answeredBy === 'A') {
      q.correctA = false
      game.timesA.push(game.timerSeconds * 1000)
      game.streakA = 0
    } else {
      q.correctB = false
      game.timesB.push(game.timerSeconds * 1000)
      game.streakB = 0
    }
    game.questionStartedAt = null

    const result = {
      gameId: game.id,
      questionIndex: q.index,
      correct: q.correct,
      chosen: null,
      isCorrect: false,
      timeout: true,
      points: 0,
      explanation: q.explanation ?? null,
      scoreA: game.scoreA,
      scoreB: game.scoreB,
      correctA: game.correctA,
      correctB: game.correctB,
      streakA: game.streakA,
      streakB: game.streakB,
      answeredBy: q.answeredBy,
    }
    pushEvent(game.playerA.userId, 'game:question-result', result)
    pushEvent(game.playerB.userId, 'game:question-result', result)
    scheduleAdvance(game)
  }
}

function expireInvitations() {
  const now = Date.now()
  for (const [id, inv] of state.invitations) {
    if (now - inv.createdAt > GAME_CONFIG.invitationTtlMs) {
      state.invitations.delete(id)
      pushEvent(inv.fromUserId, 'invite:expired', { invitationId: id, toUserId: inv.toUserId })
      pushEvent(inv.toUserId, 'invite:expired', { invitationId: id })
    }
  }
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

export interface StartQuestionInput {
  questionId: string
  text: string
  propositions: Record<Choice, string>
  correct: Choice
  explanation?: string | null
  categoryId: string
  categoryName?: string | null
  difficulty?: string | null
}

export const realtime = {
  join(
    userId: string,
    pseudo: string,
    avatarUrl: string | null,
    country: string,
    level: number
  ) {
    // Un joueur qui recharge la page en pleine partie abandonne celle-ci.
    const existing = state.onlinePlayers.get(userId)
    if (existing && existing.status === 'IN_GAME') {
      const gameId = state.userToGame.get(userId)
      const game = gameId ? state.games.get(gameId) : null
      if (game && game.status === 'IN_PROGRESS') {
        const winnerId =
          userId === game.playerA.userId ? game.playerB.userId : game.playerA.userId
        finishGame(game, winnerId, true)
      }
    }

    const player: OnlinePlayer = {
      userId,
      pseudo,
      avatarUrl: avatarUrl ?? null,
      country: country || 'France',
      level: level || 1,
      status: 'AVAILABLE',
      lastPoll: Date.now(),
      joinedAt: existing?.joinedAt ?? Date.now(),
    }
    state.onlinePlayers.set(userId, player)
    broadcastPresence()
    // Le joueur qui vient d'arriver reçoit immédiatement la liste courante.
    return { player, players: presenceList() }
  },

  leave(userId: string) {
    const gameId = state.userToGame.get(userId)
    const game = gameId ? state.games.get(gameId) : null
    if (game && game.status === 'IN_PROGRESS') {
      const winnerId =
        userId === game.playerA.userId ? game.playerB.userId : game.playerA.userId
      finishGame(game, winnerId, true)
    }
    // Les invitations émises ou reçues par ce joueur n'ont plus lieu d'être.
    for (const [id, inv] of state.invitations) {
      if (inv.fromUserId === userId || inv.toUserId === userId) state.invitations.delete(id)
    }
    state.onlinePlayers.delete(userId)
    state.userEvents.delete(userId)
    broadcastPresence()
  },

  poll(userId: string) {
    const player = state.onlinePlayers.get(userId)
    if (player) player.lastPoll = Date.now()
    const events = state.userEvents.get(userId) || []
    state.userEvents.set(userId, [])
    return { events, online: !!player }
  },

  /** Partie en cours pour ce joueur, s'il y en a une (reprise après rechargement). */
  currentGame(userId: string) {
    const gameId = state.userToGame.get(userId)
    const game = gameId ? state.games.get(gameId) : null
    if (!game || game.status !== 'IN_PROGRESS') return null
    return {
      game: publicGame(game),
      youAre: game.playerA.userId === userId ? ('A' as const) : ('B' as const),
    }
  },

  // ----- Invitations -----

  sendInvite(
    fromUserId: string,
    toUserId: string,
    categoryFilter: string | null
  ): { ok: boolean; invitationId?: string; error?: string } {
    if (fromUserId === toUserId) {
      return { ok: false, error: 'Vous ne pouvez pas vous défier vous-même' }
    }
    const from = state.onlinePlayers.get(fromUserId)
    const to = state.onlinePlayers.get(toUserId)
    if (!from) return { ok: false, error: "Vous n'êtes plus connecté au salon" }
    if (!to) return { ok: false, error: 'Ce joueur est hors ligne' }
    if (from.status === 'IN_GAME') return { ok: false, error: 'Vous êtes déjà en partie' }
    if (to.status === 'IN_GAME') return { ok: false, error: 'Ce joueur est déjà en partie' }

    // Une seule invitation en attente par couple de joueurs.
    for (const inv of state.invitations.values()) {
      if (inv.fromUserId === fromUserId && inv.toUserId === toUserId) {
        return { ok: false, error: 'Une invitation est déjà en attente' }
      }
    }

    const invitation: Invitation = {
      id: uid('inv'),
      fromUserId,
      fromPseudo: from.pseudo,
      fromAvatarUrl: from.avatarUrl,
      fromLevel: from.level,
      toUserId,
      categoryFilter,
      createdAt: Date.now(),
    }
    state.invitations.set(invitation.id, invitation)
    pushEvent(toUserId, 'invite:received', invitation)
    return { ok: true, invitationId: invitation.id }
  },

  respondInvite(
    userId: string,
    invitationId: string,
    accept: boolean
  ): {
    ok: boolean
    error?: string
    categoryFilter?: string | null
    opponentId?: string
    opponentPseudo?: string
  } {
    const inv = state.invitations.get(invitationId)
    if (!inv) return { ok: false, error: 'Invitation introuvable ou expirée' }
    if (inv.toUserId !== userId) return { ok: false, error: 'Non autorisé' }

    state.invitations.delete(invitationId)

    if (!accept) {
      pushEvent(inv.fromUserId, 'invite:declined', {
        invitationId: inv.id,
        byPseudo: state.onlinePlayers.get(userId)?.pseudo,
      })
      return { ok: true }
    }

    const playerA = state.onlinePlayers.get(inv.fromUserId)
    const playerB = state.onlinePlayers.get(inv.toUserId)
    if (!playerA) return { ok: false, error: "L'adversaire s'est déconnecté" }
    if (!playerB) return { ok: false, error: "Vous n'êtes plus connecté au salon" }
    if (playerA.status === 'IN_GAME') {
      return { ok: false, error: "L'adversaire a déjà lancé une partie" }
    }

    // L'invitant charge les questions puis appelle `startGame`.
    pushEvent(inv.fromUserId, 'game:prepare', {
      opponentId: inv.toUserId,
      opponentPseudo: playerB.pseudo,
      opponentAvatarUrl: playerB.avatarUrl,
      opponentLevel: playerB.level,
      categoryFilter: inv.categoryFilter,
    })
    pushEvent(inv.toUserId, 'game:pending', { opponentPseudo: playerA.pseudo })

    return {
      ok: true,
      categoryFilter: inv.categoryFilter,
      opponentId: inv.toUserId,
      opponentPseudo: playerB.pseudo,
    }
  },

  cancelInvite(userId: string, invitationId: string) {
    const inv = state.invitations.get(invitationId)
    if (!inv || inv.fromUserId !== userId) return { ok: false, error: 'Invitation introuvable' }
    state.invitations.delete(invitationId)
    pushEvent(inv.toUserId, 'invite:cancelled', { invitationId })
    return { ok: true }
  },

  // ----- Partie -----

  startGame(
    fromUserId: string,
    opponentId: string,
    categoryFilter: string | null,
    questions: StartQuestionInput[]
  ): { ok: boolean; gameId?: string; error?: string } {
    const playerA = state.onlinePlayers.get(fromUserId)
    const playerB = state.onlinePlayers.get(opponentId)
    if (!playerA) return { ok: false, error: "Vous n'êtes plus connecté au salon" }
    if (!playerB) return { ok: false, error: 'Adversaire introuvable' }
    if (playerA.status === 'IN_GAME' || playerB.status === 'IN_GAME') {
      return { ok: false, error: 'Un des joueurs est déjà en partie' }
    }
    if (!Array.isArray(questions) || questions.length < 4) {
      return { ok: false, error: 'Pas assez de questions pour lancer la partie' }
    }

    // Nombre pair de questions : chaque joueur en traite exactement la moitié.
    const count = Math.min(questions.length, GAME_CONFIG.questionsPerGame)
    const evenCount = count - (count % 2)

    const qs: GameQuestion[] = questions.slice(0, evenCount).map((q, i) => ({
      index: i,
      questionId: q.questionId,
      text: q.text,
      propositions: q.propositions,
      correct: q.correct,
      explanation: q.explanation ?? null,
      categoryId: q.categoryId,
      categoryName: q.categoryName ?? null,
      difficulty: q.difficulty ?? null,
      answeredBy: i % 2 === 0 ? 'A' : 'B',
      answered: false,
      chosen: null,
      correctA: null,
      correctB: null,
    }))

    const gameId = uid('game')
    const session: GameSession = {
      id: gameId,
      playerA,
      playerB,
      categoryFilter,
      questions: qs,
      currentTurn: 0,
      scoreA: 0,
      scoreB: 0,
      correctA: 0,
      correctB: 0,
      streakA: 0,
      streakB: 0,
      bestStreakA: 0,
      bestStreakB: 0,
      timesA: [],
      timesB: [],
      status: 'IN_PROGRESS',
      questionStartedAt: null,
      timerSeconds: GAME_CONFIG.timerSeconds,
      chat: [],
      createdAt: Date.now(),
      finishedAt: null,
      persisted: false,
      advanceTimer: null,
    }

    state.games.set(gameId, session)
    state.userToGame.set(playerA.userId, gameId)
    state.userToGame.set(playerB.userId, gameId)
    setStatus(playerA.userId, 'IN_GAME')
    setStatus(playerB.userId, 'IN_GAME')

    pushEvent(playerA.userId, 'game:started', { game: publicGame(session), youAre: 'A' })
    pushEvent(playerB.userId, 'game:started', { game: publicGame(session), youAre: 'B' })

    sendQuestion(session)
    return { ok: true, gameId }
  },

  answerQuestion(
    userId: string,
    gameId: string,
    choice: Choice | null,
    responseTime: number
  ): { ok: boolean; error?: string } {
    const game = state.games.get(gameId)
    if (!game || game.status !== 'IN_PROGRESS') return { ok: false, error: 'Partie introuvable' }

    const q = game.questions[game.currentTurn]
    if (!q || q.answered) return { ok: false, error: 'Question déjà traitée' }

    const isPlayerA = game.playerA.userId === userId
    const isPlayerB = game.playerB.userId === userId
    if (!isPlayerA && !isPlayerB) return { ok: false, error: 'Non autorisé' }
    if ((q.answeredBy === 'A' && !isPlayerA) || (q.answeredBy === 'B' && !isPlayerB)) {
      return { ok: false, error: "Ce n'est pas votre tour" }
    }

    // Le temps est recalculé côté serveur : un client ne peut pas s'attribuer
    // un bonus de rapidité en annonçant un temps de réponse fantaisiste.
    const elapsed = game.questionStartedAt
      ? Date.now() - game.questionStartedAt
      : Math.max(0, responseTime)
    const clamped = Math.min(Math.max(elapsed, 0), game.timerSeconds * 1000)

    q.answered = true
    q.chosen = choice
    q.responseTime = clamped

    const isCorrect = choice !== null && choice === q.correct
    const points = isCorrect ? pointsFor(clamped, game.timerSeconds) : 0
    q.pointsAwarded = points

    if (q.answeredBy === 'A') {
      q.correctA = isCorrect
      game.timesA.push(clamped)
      if (isCorrect) {
        game.scoreA += points
        game.correctA += 1
        game.streakA += 1
        game.bestStreakA = Math.max(game.bestStreakA, game.streakA)
      } else {
        game.streakA = 0
      }
    } else {
      q.correctB = isCorrect
      game.timesB.push(clamped)
      if (isCorrect) {
        game.scoreB += points
        game.correctB += 1
        game.streakB += 1
        game.bestStreakB = Math.max(game.bestStreakB, game.streakB)
      } else {
        game.streakB = 0
      }
    }
    game.questionStartedAt = null

    const result = {
      gameId: game.id,
      questionIndex: q.index,
      correct: q.correct,
      chosen: q.chosen,
      isCorrect,
      timeout: false,
      points,
      responseTime: clamped,
      explanation: q.explanation ?? null,
      scoreA: game.scoreA,
      scoreB: game.scoreB,
      correctA: game.correctA,
      correctB: game.correctB,
      streakA: game.streakA,
      streakB: game.streakB,
      answeredBy: q.answeredBy,
    }
    pushEvent(game.playerA.userId, 'game:question-result', result)
    pushEvent(game.playerB.userId, 'game:question-result', result)

    scheduleAdvance(game)
    return { ok: true }
  },

  sendChat(userId: string, gameId: string, content: string): { ok: boolean; error?: string } {
    const game = state.games.get(gameId)
    if (!game) return { ok: false, error: 'Partie introuvable' }
    const sender =
      game.playerA.userId === userId
        ? game.playerA
        : game.playerB.userId === userId
          ? game.playerB
          : null
    if (!sender) return { ok: false, error: 'Non autorisé' }

    const trimmed = content.trim().slice(0, 300)
    if (!trimmed) return { ok: false, error: 'Message vide' }

    const msg: ChatMessage = {
      id: uid('msg'),
      gameId: game.id,
      senderId: userId,
      senderPseudo: sender.pseudo,
      content: trimmed,
      timestamp: Date.now(),
    }
    game.chat.push(msg)
    if (game.chat.length > 200) game.chat.shift()
    pushEvent(game.playerA.userId, 'game:chat:message', msg)
    pushEvent(game.playerB.userId, 'game:chat:message', msg)
    return { ok: true }
  },

  leaveGame(userId: string, gameId: string): { ok: boolean; error?: string } {
    const game = state.games.get(gameId)
    if (!game) return { ok: false, error: 'Partie introuvable' }
    if (game.playerA.userId !== userId && game.playerB.userId !== userId) {
      return { ok: false, error: 'Non autorisé' }
    }
    const winnerId =
      userId === game.playerA.userId ? game.playerB.userId : game.playerA.userId
    finishGame(game, winnerId, true)
    return { ok: true }
  },

  /** Retire les joueurs qui n'interrogent plus le serveur. */
  cleanupStale() {
    const now = Date.now()
    const stale: string[] = []
    for (const [userId, p] of state.onlinePlayers) {
      if (now - p.lastPoll > GAME_CONFIG.staleAfterMs) stale.push(userId)
    }
    for (const userId of stale) realtime.leave(userId)
  },

  /** Instantané de l'état, pour la supervision. */
  snapshot() {
    return {
      onlinePlayers: state.onlinePlayers.size,
      activeGames: Array.from(state.games.values()).filter(g => g.status === 'IN_PROGRESS')
        .length,
      pendingInvitations: state.invitations.size,
    }
  },
}

// Boucles d'entretien, démarrées une seule fois par processus.
if (!globalThis.__quizTimers) {
  globalThis.__quizTimers = true
  const timeouts = setInterval(processTimeouts, 1000)
  const cleanup = setInterval(() => {
    realtime.cleanupStale()
    expireInvitations()
  }, 10_000)
  timeouts.unref?.()
  cleanup.unref?.()
}
