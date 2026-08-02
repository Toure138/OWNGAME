import { createServer } from 'http'
import { Server } from 'socket.io'

// ===========================================================================
// Qui veut gagner 20 millions ? — Real-time service
// Responsibilities:
//   1. Presence (online players, status: online / in-game / available)
//   2. Matchmaking & invitations (challenge a specific player)
//   3. Game lifecycle (start, alternating questions, timer, scoring)
//   4. In-game real-time chat
//   5. Live notifications
// All in-memory; the database is updated by the Next.js API routes via REST.
// ===========================================================================

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Status = 'ONLINE' | 'IN_GAME' | 'AVAILABLE'

interface OnlinePlayer {
  socketId: string
  userId: string
  pseudo: string
  avatarUrl: string | null
  country: string
  level: number
  status: Status
  lastSeen: number
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
  index: number          // 0..19
  questionId: string
  text: string
  propositions: { A: string; B: string; C: string; D: string }
  correct: 'A' | 'B' | 'C' | 'D'
  explanation?: string
  categoryId: string
  // turn order: even index -> A, odd index -> B (or whatever was decided at start)
  answeredBy: 'A' | 'B'
  // results
  answered: boolean
  chosen?: 'A' | 'B' | 'C' | 'D' | null
  correctA?: boolean | null
  correctB?: boolean | null
  responseTime?: number  // ms
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
}

// ---------------------------------------------------------------------------
// State (in-memory)
// ---------------------------------------------------------------------------
const onlinePlayers = new Map<string, OnlinePlayer>()        // userId -> player
const socketToUser = new Map<string, string>()               // socketId -> userId
const invitations = new Map<string, Invitation>()            // invitationId -> Invitation
const games = new Map<string, GameSession>()                 // gameId -> GameSession
const userToGame = new Map<string, string>()                 // userId -> gameId

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function publicPlayer(p: OnlinePlayer) {
  return {
    userId: p.userId,
    pseudo: p.pseudo,
    avatarUrl: p.avatarUrl,
    country: p.country,
    level: p.level,
    status: p.status,
  }
}

function broadcastOnlinePlayers() {
  const list = Array.from(onlinePlayers.values()).map(publicPlayer)
  io.emit('presence:update', list)
}

function setStatus(userId: string, status: Status) {
  const p = onlinePlayers.get(userId)
  if (p && p.status !== status) {
    p.status = status
    broadcastOnlinePlayers()
  }
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

// ---------------------------------------------------------------------------
// Connection handling
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[socket] connected ${socket.id}`)

  // --- Presence ---
  socket.on('presence:join', (payload: { userId: string; pseudo: string; avatarUrl: string | null; country: string; level: number }) => {
    if (!payload?.userId) return
    // Disconnect previous socket for the same user (single session)
    const existing = onlinePlayers.get(payload.userId)
    if (existing && existing.socketId !== socket.id) {
      io.to(existing.socketId).emit('force:disconnect', 'Session ouverte ailleurs')
    }
    const player: OnlinePlayer = {
      socketId: socket.id,
      userId: payload.userId,
      pseudo: payload.pseudo,
      avatarUrl: payload.avatarUrl,
      country: payload.country,
      level: payload.level,
      status: 'AVAILABLE',
      lastSeen: Date.now(),
    }
    onlinePlayers.set(payload.userId, player)
    socketToUser.set(socket.id, payload.userId)
    socket.join(`user:${payload.userId}`)
    broadcastOnlinePlayers()
    socket.emit('presence:joined', { ok: true })
    console.log(`[presence] ${payload.pseudo} online (${onlinePlayers.size} total)`)
  })

  socket.on('presence:set-status', (payload: { status: Status }) => {
    const userId = socketToUser.get(socket.id)
    if (!userId) return
    setStatus(userId, payload.status)
  })

  // --- Matchmaking / invitations ---
  socket.on('invite:send', (payload: { toUserId: string; categoryFilter: string | null }, ack?: (r: any) => void) => {
    const fromUserId = socketToUser.get(socket.id)
    if (!fromUserId) return ack?.({ ok: false, error: 'Non authentifié' })
    const from = onlinePlayers.get(fromUserId)
    const to = onlinePlayers.get(payload.toUserId)
    if (!to) return ack?.({ ok: false, error: 'Joueur hors ligne' })
    if (to.status === 'IN_GAME') return ack?.({ ok: false, error: 'Joueur déjà en partie' })

    const invitation: Invitation = {
      id: uid('inv'),
      fromUserId,
      fromPseudo: from?.pseudo ?? '',
      fromAvatarUrl: from?.avatarUrl ?? null,
      toUserId: payload.toUserId,
      categoryFilter: payload.categoryFilter,
      createdAt: Date.now(),
    }
    invitations.set(invitation.id, invitation)
    io.to(`user:${payload.toUserId}`).emit('invite:received', invitation)
    ack?.({ ok: true, invitationId: invitation.id })
  })

  socket.on('invite:respond', (payload: { invitationId: string; accept: boolean }, ack?: (r: any) => void) => {
    const userId = socketToUser.get(socket.id)
    if (!userId) return ack?.({ ok: false, error: 'Non authentifié' })
    const inv = invitations.get(payload.invitationId)
    if (!inv) return ack?.({ ok: false, error: 'Invitation introuvable' })
    if (inv.toUserId !== userId) return ack?.({ ok: false, error: 'Non autorisé' })

    if (!payload.accept) {
      io.to(`user:${inv.fromUserId}`).emit('invite:declined', { invitationId: inv.id, byPseudo: onlinePlayers.get(userId)?.pseudo })
      invitations.delete(payload.invitationId)
      return ack?.({ ok: true })
    }

    // Accept -> create game session
    const playerA = onlinePlayers.get(inv.fromUserId)
    const playerB = onlinePlayers.get(inv.toUserId)
    if (!playerA || !playerB) return ack?.({ ok: false, error: 'Un joueur est hors ligne' })

    // The questions payload is sent by the client (fetched via REST beforehand).
    // For safety we re-validate the shape.
    socket.to(`user:${inv.fromUserId}`).emit('invite:accepted', { invitationId: inv.id, gameId: 'pending' })
    ack?.({ ok: true, needQuestions: true, categoryFilter: inv.categoryFilter, opponentId: inv.toUserId, opponentPseudo: playerB.pseudo })
    // Tell the inviter to fetch questions and start the game
    io.to(`user:${inv.fromUserId}`).emit('game:prepare', {
      opponentId: inv.toUserId,
      opponentPseudo: playerB.pseudo,
      opponentAvatarUrl: playerB.avatarUrl,
      categoryFilter: inv.categoryFilter,
    })
    invitations.delete(payload.invitationId)
  })

  socket.on('invite:cancel', (payload: { invitationId: string }) => {
    invitations.delete(payload.invitationId)
  })

  // --- Game lifecycle ---
  socket.on('game:start', (payload: {
    opponentId: string
    categoryFilter: string | null
    questions: Array<{
      questionId: string
      text: string
      propositions: { A: string; B: string; C: string; D: string }
      correct: 'A' | 'B' | 'C' | 'D'
      explanation?: string
      categoryId: string
    }>
  }, ack?: (r: any) => void) => {
    const fromUserId = socketToUser.get(socket.id)
    if (!fromUserId) return ack?.({ ok: false, error: 'Non authentifié' })
    const playerA = onlinePlayers.get(fromUserId)
    const playerB = onlinePlayers.get(payload.opponentId)
    if (!playerA || !playerB) return ack?.({ ok: false, error: 'Adversaire introuvable' })

    // Build 20 alternating questions (player A answers even indexes, B answers odd)
    const qs: GameQuestion[] = payload.questions.slice(0, 20).map((q, i) => ({
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
      categoryFilter: payload.categoryFilter,
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
    }
    games.set(gameId, session)
    userToGame.set(playerA.userId, gameId)
    userToGame.set(playerB.userId, gameId)
    setStatus(playerA.userId, 'IN_GAME')
    setStatus(playerB.userId, 'IN_GAME')

    // Notify both players
    io.to(`user:${playerA.userId}`).emit('game:started', { game: publicGame(session), youAre: 'A' })
    io.to(`user:${playerB.userId}`).emit('game:started', { game: publicGame(session), youAre: 'B' })

    // Start the first question
    sendQuestion(session)
    ack?.({ ok: true, gameId })
  })

  socket.on('game:answer', (payload: { gameId: string; choice: 'A' | 'B' | 'C' | 'D' | null; responseTime: number }) => {
    const userId = socketToUser.get(socket.id)
    if (!userId) return
    const game = games.get(payload.gameId)
    if (!game || game.status !== 'IN_PROGRESS') return
    const q = game.questions[game.currentTurn]
    if (!q || q.answered) return

    // Determine if the answering player is the one whose turn it is
    const isPlayerA = game.playerA.userId === userId
    const isPlayerB = game.playerB.userId === userId
    if (!isPlayerA && !isPlayerB) return
    const expectedSide = q.answeredBy
    if ((expectedSide === 'A' && !isPlayerA) || (expectedSide === 'B' && !isPlayerB)) return

    q.answered = true
    q.chosen = payload.choice
    const isCorrect = payload.choice === q.correct
    if (expectedSide === 'A') {
      q.correctA = isCorrect
      if (isCorrect) {
        game.scoreA += pointsFor(game, payload.responseTime)
        game.correctA += 1
      }
      game.timesA.push(payload.responseTime)
    } else {
      q.correctB = isCorrect
      if (isCorrect) {
        game.scoreB += pointsFor(game, payload.responseTime)
        game.correctB += 1
      }
      game.timesB.push(payload.responseTime)
    }
    game.questionStartedAt = null

    // Broadcast the result to both players
    io.to(`user:${game.playerA.userId}`).emit('game:question-result', {
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
    })
    io.to(`user:${game.playerB.userId}`).emit('game:question-result', {
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
    })

    // Move to next question after a short delay
    setTimeout(() => advanceGame(game), 2500)
  })

  socket.on('game:chat:send', (payload: { gameId: string; content: string }) => {
    const userId = socketToUser.get(socket.id)
    if (!userId) return
    const game = games.get(payload.gameId)
    if (!game) return
    const sender = game.playerA.userId === userId ? game.playerA : game.playerB
    if (!sender) return
    const msg: ChatMessage = {
      id: uid('msg'),
      gameId: game.id,
      senderId: userId,
      senderPseudo: sender.pseudo,
      content: payload.content.slice(0, 500),
      timestamp: Date.now(),
    }
    game.chat.push(msg)
    io.to(`user:${game.playerA.userId}`).emit('game:chat:message', msg)
    io.to(`user:${game.playerB.userId}`).emit('game:chat:message', msg)
  })

  socket.on('game:leave', (payload: { gameId: string }) => {
    const userId = socketToUser.get(socket.id)
    if (!userId) return
    const game = games.get(payload.gameId)
    if (!game) return
    // Forfeit: opponent wins
    finishGame(game, userId === game.playerA.userId ? game.playerB.userId : game.playerA.userId, true)
  })

  // --- Direct notifications (e.g. from REST API) ---
  socket.on('notify:user', (payload: { userId: string; type: string; title: string; body: string }) => {
    io.to(`user:${payload.userId}`).emit('notification', {
      type: payload.type,
      title: payload.title,
      body: payload.body,
      createdAt: Date.now(),
    })
  })

  socket.on('disconnect', () => {
    const userId = socketToUser.get(socket.id)
    if (!userId) {
      console.log(`[socket] disconnected ${socket.id} (no user)`)
      return
    }
    socketToUser.delete(socket.id)
    const player = onlinePlayers.get(userId)
    // If user has another socket (reconnect), keep them
    if (player && player.socketId === socket.id) {
      onlinePlayers.delete(userId)
      // Forfeit any active game
      const gameId = userToGame.get(userId)
      if (gameId) {
        const game = games.get(gameId)
        if (game && game.status === 'IN_PROGRESS') {
          const winnerId = userId === game.playerA.userId ? game.playerB.userId : game.playerA.userId
          finishGame(game, winnerId, true)
        }
      }
      broadcastOnlinePlayers()
      console.log(`[presence] ${player.pseudo} offline`)
    }
  })
})

// ---------------------------------------------------------------------------
// Game helpers
// ---------------------------------------------------------------------------
function pointsFor(game: GameSession, responseTimeMs: number) {
  // 100 base + up to 50 bonus for fast answers
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
  io.to(`user:${game.playerA.userId}`).emit('game:question', payload)
  io.to(`user:${game.playerB.userId}`).emit('game:question', payload)

  // Auto-skip after timer expires
  setTimeout(() => {
    if (game.status !== 'IN_PROGRESS') return
    const current = game.questions[game.currentTurn]
    if (current && !current.answered && game.questionStartedAt) {
      current.answered = true
      current.chosen = null
      if (current.answeredBy === 'A') {
        current.correctA = false
        game.timesA.push(game.timerSeconds * 1000)
      } else {
        current.correctB = false
        game.timesB.push(game.timerSeconds * 1000)
      }
      game.questionStartedAt = null
      io.to(`user:${game.playerA.userId}`).emit('game:question-result', {
        gameId: game.id,
        questionIndex: current.index,
        correct: current.correct,
        chosen: null,
        isCorrect: false,
        timeout: true,
        scoreA: game.scoreA,
        scoreB: game.scoreB,
        correctA: game.correctA,
        correctB: game.correctB,
        answeredBy: current.answeredBy,
      })
      io.to(`user:${game.playerB.userId}`).emit('game:question-result', {
        gameId: game.id,
        questionIndex: current.index,
        correct: current.correct,
        chosen: null,
        isCorrect: false,
        timeout: true,
        scoreA: game.scoreA,
        scoreB: game.scoreB,
        correctA: game.correctA,
        correctB: game.correctB,
        answeredBy: current.answeredBy,
      })
      setTimeout(() => advanceGame(game), 2500)
    }
  }, (game.timerSeconds + 1) * 1000)
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
    else winnerId = null // draw
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

  io.to(`user:${game.playerA.userId}`).emit('game:finished', { ...summary, youAre: 'A' })
  io.to(`user:${game.playerB.userId}`).emit('game:finished', { ...summary, youAre: 'B' })

  // Free up players
  setStatus(game.playerA.userId, 'AVAILABLE')
  setStatus(game.playerB.userId, 'AVAILABLE')
  userToGame.delete(game.playerA.userId)
  userToGame.delete(game.playerB.userId)

  // Keep the game in memory for a while so clients can fetch the summary
  setTimeout(() => games.delete(game.id), 5 * 60 * 1000)
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[quiz-game] WebSocket service running on port ${PORT}`)
})

// Heartbeat to keep the process alive and detect crashes
setInterval(() => {
  console.log(`[quiz-game] heartbeat ${new Date().toISOString()} - online: ${onlinePlayers.size}, games: ${games.size}`)
}, 30000)

process.on('SIGTERM', () => { console.log('[quiz-game] SIGTERM received'); httpServer.close(() => process.exit(0)) })
process.on('SIGINT', () => { console.log('[quiz-game] SIGINT received'); httpServer.close(() => process.exit(0)) })
process.on('uncaughtException', (err) => { console.error('[quiz-game] uncaughtException:', err) })
process.on('unhandledRejection', (err) => { console.error('[quiz-game] unhandledRejection:', err) })
