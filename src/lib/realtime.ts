// In-memory realtime state for the quiz game.
// This replaces the WebSocket service with HTTP long-polling.
// State is lost on server restart, which is acceptable for a demo.

type Status = 'AVAILABLE' | 'IN_GAME'

interface OnlinePlayer {
  userId: string
  pseudo: string
  avatarUrl: string | null
  country: string
  level: number
  status: Status
  lastPoll: number
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
  toUserId: string
  categoryFilter: string | null
  createdAt: number
}

interface GameQuestion {
  index: number
  questionId: string
  text: string
  propositions: { A: string; B: string; C: string; D: string }
  correct: 'A' | 'B' | 'C' | 'D'
  explanation?: string
  categoryId: string
  answeredBy: 'A' | 'B'
  answered: boolean
  chosen?: 'A' | 'B' | 'C' | 'D' | null
  correctA?: boolean | null
  correctB?: boolean | null
  responseTime?: number
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
  timesA: number[]
  timesB: number[]
  status: 'IN_PROGRESS' | 'FINISHED'
  questionStartedAt: number | null
  timerSeconds: number
  chat: ChatMessage[]
  createdAt: number
  finishedAt: number | null
  events: Array<{ id: string; type: string; data: any; createdAt: number; targetUserId?: string }>
}

// Global state (persists across API calls within the same server process)
declare global {
  var __quizState: {
    onlinePlayers: Map<string, OnlinePlayer>
    invitations: Map<string, Invitation>
    games: Map<string, GameSession>
    userToGame: Map<string, string>
    userEvents: Map<string, Array<{ id: string; type: string; data: any; createdAt: number }>>
  } | undefined
}

const state = globalThis.__quizState ?? {
  onlinePlayers: new Map<string, OnlinePlayer>(),
  invitations: new Map<string, Invitation>(),
  games: new Map<string, GameSession>(),
  userToGame: new Map<string, string>(),
  userEvents: new Map<string, Array<{ id: string; type: string; data: any; createdAt: number }>>(),
}
globalThis.__quizState = state

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function pushEvent(userId: string, type: string, data: any) {
  const events = state.userEvents.get(userId) || []
  events.push({ id: uid('evt'), type, data, createdAt: Date.now() })
  // Keep last 50 events per user
  if (events.length > 50) events.shift()
  state.userEvents.set(userId, events)
}

function broadcastPresence() {
  const list = Array.from(state.onlinePlayers.values()).map(p => ({
    userId: p.userId,
    pseudo: p.pseudo,
    avatarUrl: p.avatarUrl,
    country: p.country,
    level: p.level,
    status: p.status,
  }))
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

function pointsFor(responseTimeMs: number) {
  const seconds = responseTimeMs / 1000
  const speedBonus = Math.max(0, Math.round(50 - (seconds * 2.5)))
  return 100 + speedBonus
}

function publicGame(game: GameSession) {
  return {
    id: game.id,
    playerA: { userId: game.playerA.userId, pseudo: game.playerA.pseudo, avatarUrl: game.playerA.avatarUrl, country: game.playerA.country, level: game.playerA.level },
    playerB: { userId: game.playerB.userId, pseudo: game.playerB.pseudo, avatarUrl: game.playerB.avatarUrl, country: game.playerB.country, level: game.playerB.level },
    categoryFilter: game.categoryFilter,
    currentTurn: game.currentTurn,
    totalQuestions: game.questions.length,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    correctA: game.correctA,
    correctB: game.correctB,
    status: game.status,
    timerSeconds: game.timerSeconds,
  }
}

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
    text: q.text,
    propositions: q.propositions,
    categoryId: q.categoryId,
    answeredBy: q.answeredBy,
    timerSeconds: game.timerSeconds,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
  }
  pushEvent(game.playerA.userId, 'game:question', payload)
  pushEvent(game.playerB.userId, 'game:question', payload)
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

  let winnerId = forcedWinnerId
  if (!winnerId) {
    if (game.scoreA > game.scoreB) winnerId = game.playerA.userId
    else if (game.scoreB > game.scoreA) winnerId = game.playerB.userId
    else winnerId = null
  }

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0
  const summary = {
    gameId: game.id,
    status: 'FINISHED',
    winnerId,
    scoreA: game.scoreA,
    scoreB: game.scoreB,
    correctA: game.correctA,
    correctB: game.correctB,
    avgTimeA: avg(game.timesA),
    avgTimeB: avg(game.timesB),
    forfeit,
    questions: game.questions.map(q => ({
      index: q.index,
      text: q.text,
      propositions: q.propositions,
      correct: q.correct,
      chosen: q.chosen,
      answeredBy: q.answeredBy,
      correctA: q.correctA,
      correctB: q.correctB,
      explanation: q.explanation,
    })),
  }

  pushEvent(game.playerA.userId, 'game:finished', { ...summary, youAre: 'A' })
  pushEvent(game.playerB.userId, 'game:finished', { ...summary, youAre: 'B' })

  setStatus(game.playerA.userId, 'AVAILABLE')
  setStatus(game.playerB.userId, 'AVAILABLE')
  state.userToGame.delete(game.playerA.userId)
  state.userToGame.delete(game.playerB.userId)

  setTimeout(() => state.games.delete(game.id), 5 * 60 * 1000)
}

// Process expired questions (timeout)
function processTimeouts() {
  const now = Date.now()
  for (const game of state.games.values()) {
    if (game.status !== 'IN_PROGRESS') continue
    if (!game.questionStartedAt) continue
    const elapsed = (now - game.questionStartedAt) / 1000
    if (elapsed >= game.timerSeconds + 1) {
      const q = game.questions[game.currentTurn]
      if (!q || q.answered) continue
      q.answered = true
      q.chosen = null
      if (q.answeredBy === 'A') {
        q.correctA = false
        game.timesA.push(game.timerSeconds * 1000)
      } else {
        q.correctB = false
        game.timesB.push(game.timerSeconds * 1000)
      }
      game.questionStartedAt = null
      const result = {
        gameId: game.id,
        questionIndex: q.index,
        correct: q.correct,
        chosen: null,
        isCorrect: false,
        timeout: true,
        scoreA: game.scoreA,
        scoreB: game.scoreB,
        correctA: game.correctA,
        correctB: game.correctB,
        answeredBy: q.answeredBy,
      }
      pushEvent(game.playerA.userId, 'game:question-result', result)
      pushEvent(game.playerB.userId, 'game:question-result', result)
      setTimeout(() => advanceGame(game), 2500)
    }
  }
}

// Run timeout check periodically
if (!(globalThis as any).__quizIntervalSet) {
  ;(globalThis as any).__quizIntervalSet = true
  setInterval(processTimeouts, 2000)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const realtime = {
  // Presence
  join(userId: string, pseudo: string, avatarUrl: string | null, country: string, level: number) {
    // If the player was in a game, forfeit it (they're loading a fresh page)
    const existing = state.onlinePlayers.get(userId)
    if (existing && existing.status === 'IN_GAME') {
      const gameId = state.userToGame.get(userId)
      if (gameId) {
        const game = state.games.get(gameId)
        if (game && game.status === 'IN_PROGRESS') {
          const winnerId = userId === game.playerA.userId ? game.playerB.userId : game.playerA.userId
          finishGame(game, winnerId, true)
        }
      }
    }
    const player: OnlinePlayer = {
      userId,
      pseudo,
      avatarUrl,
      country,
      level,
      status: 'AVAILABLE',
      lastPoll: Date.now(),
    }
    state.onlinePlayers.set(userId, player)
    broadcastPresence()
    return player
  },

  leave(userId: string) {
    const gameId = state.userToGame.get(userId)
    if (gameId) {
      const game = state.games.get(gameId)
      if (game && game.status === 'IN_PROGRESS') {
        const winnerId = userId === game.playerA.userId ? game.playerB.userId : game.playerA.userId
        finishGame(game, winnerId, true)
      }
    }
    state.onlinePlayers.delete(userId)
    state.userEvents.delete(userId)
    broadcastPresence()
  },

  poll(userId: string): { events: Array<{ id: string; type: string; data: any; createdAt: number }> } {
    const player = state.onlinePlayers.get(userId)
    if (player) {
      player.lastPoll = Date.now()
    }
    const events = state.userEvents.get(userId) || []
    // Clear events after polling
    state.userEvents.set(userId, [])
    return { events }
  },

  // Invitations
  sendInvite(fromUserId: string, toUserId: string, categoryFilter: string | null): { ok: boolean; invitationId?: string; error?: string } {
    const from = state.onlinePlayers.get(fromUserId)
    const to = state.onlinePlayers.get(toUserId)
    if (!to) return { ok: false, error: 'Joueur hors ligne' }
    if (to.status === 'IN_GAME') return { ok: false, error: 'Joueur déjà en partie' }
    const invitation: Invitation = {
      id: uid('inv'),
      fromUserId,
      fromPseudo: from?.pseudo || '',
      fromAvatarUrl: from?.avatarUrl || null,
      toUserId,
      categoryFilter,
      createdAt: Date.now(),
    }
    state.invitations.set(invitation.id, invitation)
    pushEvent(toUserId, 'invite:received', invitation)
    return { ok: true, invitationId: invitation.id }
  },

  respondInvite(userId: string, invitationId: string, accept: boolean): { ok: boolean; error?: string; categoryFilter?: string | null; opponentId?: string; opponentPseudo?: string } {
    const inv = state.invitations.get(invitationId)
    if (!inv) return { ok: false, error: 'Invitation introuvable' }
    if (inv.toUserId !== userId) return { ok: false, error: 'Non autorisé' }

    if (!accept) {
      pushEvent(inv.fromUserId, 'invite:declined', { invitationId: inv.id, byPseudo: state.onlinePlayers.get(userId)?.pseudo })
      state.invitations.delete(invitationId)
      return { ok: true }
    }

    const playerA = state.onlinePlayers.get(inv.fromUserId)
    const playerB = state.onlinePlayers.get(inv.toUserId)
    if (!playerA || !playerB) return { ok: false, error: 'Un joueur est hors ligne' }

    // Notify the inviter to prepare the game (fetch questions and call startGame)
    pushEvent(inv.fromUserId, 'game:prepare', {
      opponentId: inv.toUserId,
      opponentPseudo: playerB.pseudo,
      opponentAvatarUrl: playerB.avatarUrl,
      categoryFilter: inv.categoryFilter,
    })
    state.invitations.delete(invitationId)
    return { ok: true, categoryFilter: inv.categoryFilter, opponentId: inv.toUserId, opponentPseudo: playerB.pseudo }
  },

  cancelInvite(invitationId: string) {
    state.invitations.delete(invitationId)
  },

  // Game
  startGame(fromUserId: string, opponentId: string, categoryFilter: string | null, questions: Array<any>): { ok: boolean; gameId?: string; error?: string } {
    const playerA = state.onlinePlayers.get(fromUserId)
    const playerB = state.onlinePlayers.get(opponentId)
    if (!playerA || !playerB) return { ok: false, error: 'Adversaire introuvable' }

    const qs: GameQuestion[] = questions.slice(0, 20).map((q, i) => ({
      index: i,
      questionId: q.questionId,
      text: q.text,
      propositions: q.propositions,
      correct: q.correct,
      explanation: q.explanation,
      categoryId: q.categoryId,
      answeredBy: i % 2 === 0 ? 'A' : 'B',
      answered: false,
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
      timesA: [],
      timesB: [],
      status: 'IN_PROGRESS',
      questionStartedAt: Date.now(),
      timerSeconds: 20,
      chat: [],
      createdAt: Date.now(),
      finishedAt: null,
      events: [],
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

  answerQuestion(userId: string, gameId: string, choice: 'A' | 'B' | 'C' | 'D' | null, responseTime: number): { ok: boolean; error?: string } {
    const game = state.games.get(gameId)
    if (!game || game.status !== 'IN_PROGRESS') return { ok: false, error: 'Partie introuvable' }
    const q = game.questions[game.currentTurn]
    if (!q || q.answered) return { ok: false, error: 'Question déjà répondue' }

    const isPlayerA = game.playerA.userId === userId
    const isPlayerB = game.playerB.userId === userId
    if (!isPlayerA && !isPlayerB) return { ok: false, error: 'Non autorisé' }
    const expectedSide = q.answeredBy
    if ((expectedSide === 'A' && !isPlayerA) || (expectedSide === 'B' && !isPlayerB)) return { ok: false, error: 'Pas votre tour' }

    q.answered = true
    q.chosen = choice
    q.responseTime = responseTime
    const isCorrect = choice === q.correct
    if (expectedSide === 'A') {
      q.correctA = isCorrect
      if (isCorrect) {
        game.scoreA += pointsFor(responseTime)
        game.correctA += 1
      }
      game.timesA.push(responseTime)
    } else {
      q.correctB = isCorrect
      if (isCorrect) {
        game.scoreB += pointsFor(responseTime)
        game.correctB += 1
      }
      game.timesB.push(responseTime)
    }
    game.questionStartedAt = null

    const result = {
      gameId: game.id,
      questionIndex: q.index,
      correct: q.correct,
      chosen: q.chosen,
      isCorrect,
      scoreA: game.scoreA,
      scoreB: game.scoreB,
      correctA: game.correctA,
      correctB: game.correctB,
      answeredBy: q.answeredBy,
    }
    pushEvent(game.playerA.userId, 'game:question-result', result)
    pushEvent(game.playerB.userId, 'game:question-result', result)

    setTimeout(() => advanceGame(game), 2500)
    return { ok: true }
  },

  sendChat(userId: string, gameId: string, content: string): { ok: boolean } {
    const game = state.games.get(gameId)
    if (!game) return { ok: false }
    const sender = game.playerA.userId === userId ? game.playerA : game.playerB
    if (!sender) return { ok: false }
    const msg: ChatMessage = {
      id: uid('msg'),
      gameId: game.id,
      senderId: userId,
      senderPseudo: sender.pseudo,
      content: content.slice(0, 500),
      timestamp: Date.now(),
    }
    game.chat.push(msg)
    pushEvent(game.playerA.userId, 'game:chat:message', msg)
    pushEvent(game.playerB.userId, 'game:chat:message', msg)
    return { ok: true }
  },

  leaveGame(userId: string, gameId: string) {
    const game = state.games.get(gameId)
    if (!game) return
    const winnerId = userId === game.playerA.userId ? game.playerB.userId : game.playerA.userId
    finishGame(game, winnerId, true)
  },

  // Cleanup stale players (no poll in 30s)
  cleanupStale() {
    const now = Date.now()
    const stale: string[] = []
    for (const [userId, p] of state.onlinePlayers.entries()) {
      if (now - p.lastPoll > 30000) {
        stale.push(userId)
      }
    }
    for (const userId of stale) {
      this.leave(userId)
    }
  },
}

// Run cleanup every 15 seconds
if (!(globalThis as any).__quizCleanupSet) {
  ;(globalThis as any).__quizCleanupSet = true
  setInterval(() => realtime.cleanupStale(), 15000)
}
