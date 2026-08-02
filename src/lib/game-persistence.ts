import { db } from './db'

// Persistance d'une partie terminée.
//
// Auparavant, chaque client appelait POST /api/games à la fin d'une partie.
// Deux clients recevant l'événement de fin, la partie était enregistrée deux
// fois — et sans en-tête d'autorisation, l'appel échouait en 401, si bien
// qu'aucune partie n'était réellement sauvegardée. La source de vérité est
// désormais le serveur : le moteur temps réel appelle cette fonction une seule
// fois, à la clôture de la session.

export interface PersistQuestion {
  index: number
  questionId: string
  text: string
  propositions: { A: string; B: string; C: string; D: string }
  correct: 'A' | 'B' | 'C' | 'D'
  chosen: 'A' | 'B' | 'C' | 'D' | null
  answeredBy: 'A' | 'B'
  correctA: boolean | null
  correctB: boolean | null
  explanation?: string | null
  responseTime?: number
}

export interface PersistPayload {
  playerAId: string
  playerBId: string
  categoryFilter: string | null
  questions: PersistQuestion[]
  totalQuestions: number
  scoreA: number
  scoreB: number
  correctA: number
  correctB: number
  avgTimeA: number
  avgTimeB: number
  streakA: number
  streakB: number
  winnerId: string | null
  forfeit: boolean
  startedAt: Date
}

const ACHIEVEMENTS = [
  { code: 'FIRST_GAME', name: 'Première partie', description: 'Jouer sa première partie' },
  { code: 'FIRST_WIN', name: 'Première victoire', description: 'Remporter sa première partie' },
  { code: 'FIVE_WINS', name: 'Cinq victoires', description: 'Remporter 5 parties' },
  { code: 'TEN_WINS', name: 'Dix victoires', description: 'Remporter 10 parties' },
  { code: 'TWENTY_FIVE_WINS', name: 'Vingt-cinq victoires', description: 'Remporter 25 parties' },
  { code: 'LEVEL_5', name: 'Niveau 5', description: 'Atteindre le niveau 5' },
  { code: 'LEVEL_10', name: 'Niveau 10', description: 'Atteindre le niveau 10' },
  { code: 'LEVEL_20', name: 'Niveau 20', description: 'Atteindre le niveau 20' },
  { code: 'PERFECT_GAME', name: 'Sans faute', description: 'Répondre correctement à toutes ses questions' },
  { code: 'STREAK_5', name: 'Série de 5', description: 'Enchaîner 5 bonnes réponses' },
  { code: 'SPEEDSTER', name: 'Éclair', description: 'Terminer une partie avec moins de 5 s de moyenne' },
  { code: 'CENTURION', name: 'Centurion', description: 'Jouer 100 parties' },
] as const

export const ALL_ACHIEVEMENTS = ACHIEVEMENTS

export function xpForLevel(level: number): number {
  return level * 500
}

export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 500) + 1)
}

/** Enregistre la partie et met à jour les deux joueurs. Résiste aux erreurs. */
export async function persistFinishedGame(payload: PersistPayload) {
  const {
    playerAId, playerBId, categoryFilter, questions, totalQuestions,
    scoreA, scoreB, correctA, correctB, avgTimeA, avgTimeB,
    streakA, streakB, winnerId, forfeit, startedAt,
  } = payload

  const game = await db.game.create({
    data: {
      playerAId,
      playerBId,
      status: 'FINISHED',
      categoryFilter,
      questionsData: JSON.stringify(questions),
      totalQuestions,
      currentTurn: questions.length,
      scoreA, scoreB, correctA, correctB, avgTimeA, avgTimeB,
      winnerId,
      forfeit,
      startedAt,
      finishedAt: new Date(),
    },
  })

  await updateQuestionStats(questions)

  const sides = [
    {
      userId: playerAId,
      score: scoreA,
      correct: correctA,
      answered: questions.filter(q => q.answeredBy === 'A').length,
      avgTime: avgTimeA,
      streak: streakA,
      opponentScore: scoreB,
    },
    {
      userId: playerBId,
      score: scoreB,
      correct: correctB,
      answered: questions.filter(q => q.answeredBy === 'B').length,
      avgTime: avgTimeB,
      streak: streakB,
      opponentScore: scoreA,
    },
  ]

  for (const side of sides) {
    const won = winnerId === side.userId
    const drew = winnerId === null
    const lost = !won && !drew

    const user = await db.user.findUnique({ where: { id: side.userId } })
    if (!user) continue

    const gainedXp = (won ? 150 : drew ? 80 : 50) + side.correct * 10
    const newXp = user.xp + gainedXp
    const newLevel = levelForXp(newXp)
    const newWins = user.wins + (won ? 1 : 0)
    const newGamesPlayed = user.gamesPlayed + 1

    await db.user.update({
      where: { id: side.userId },
      data: {
        gamesPlayed: newGamesPlayed,
        wins: newWins,
        losses: user.losses + (lost ? 1 : 0),
        draws: user.draws + (drew ? 1 : 0),
        totalScore: user.totalScore + side.score,
        bestStreak: Math.max(user.bestStreak, side.streak),
        xp: newXp,
        level: newLevel,
      },
    })

    await db.notification.create({
      data: {
        userId: side.userId,
        type: won ? 'GAME_WON' : drew ? 'GAME_DRAW' : 'GAME_LOST',
        title: won ? 'Victoire !' : drew ? 'Match nul' : 'Défaite',
        body: `Score final ${side.score} — ${side.opponentScore}${forfeit ? ' (abandon)' : ''}. +${gainedXp} XP.`,
      },
    })

    await grantAchievements({
      userId: side.userId,
      wins: newWins,
      level: newLevel,
      gamesPlayed: newGamesPlayed,
      perfect: side.answered > 0 && side.correct === side.answered && !forfeit,
      streak: side.streak,
      avgTime: side.avgTime,
    })
  }

  return game
}

/** Met à jour les compteurs de réussite de chaque question jouée. */
async function updateQuestionStats(questions: PersistQuestion[]) {
  for (const q of questions) {
    if (!q.questionId) continue
    const answered = q.chosen !== null || q.correctA !== null || q.correctB !== null
    if (!answered) continue
    const wasCorrect = q.chosen === q.correct
    try {
      await db.question.update({
        where: { id: q.questionId },
        data: {
          timesAnswered: { increment: 1 },
          timesCorrect: { increment: wasCorrect ? 1 : 0 },
        },
      })
    } catch {
      // La question a pu être supprimée par un administrateur entre-temps.
    }
  }
}

interface AchievementContext {
  userId: string
  wins: number
  level: number
  gamesPlayed: number
  perfect: boolean
  streak: number
  avgTime: number
}

async function grantAchievements(ctx: AchievementContext) {
  const existing = await db.achievement.findMany({
    where: { userId: ctx.userId },
    select: { code: true },
  })
  const have = new Set(existing.map(a => a.code))

  const conditions: Record<string, boolean> = {
    FIRST_GAME: true,
    FIRST_WIN: ctx.wins >= 1,
    FIVE_WINS: ctx.wins >= 5,
    TEN_WINS: ctx.wins >= 10,
    TWENTY_FIVE_WINS: ctx.wins >= 25,
    LEVEL_5: ctx.level >= 5,
    LEVEL_10: ctx.level >= 10,
    LEVEL_20: ctx.level >= 20,
    PERFECT_GAME: ctx.perfect,
    STREAK_5: ctx.streak >= 5,
    SPEEDSTER: ctx.avgTime > 0 && ctx.avgTime < 5000,
    CENTURION: ctx.gamesPlayed >= 100,
  }

  const toCreate = ACHIEVEMENTS.filter(a => conditions[a.code] && !have.has(a.code))
  if (!toCreate.length) return

  try {
    await db.achievement.createMany({
      data: toCreate.map(a => ({
        userId: ctx.userId,
        code: a.code,
        name: a.name,
        description: a.description,
      })),
    })
  } catch {
    // Contrainte d'unicité (userId, code) : le succès a déjà été accordé par
    // une partie terminée en parallèle. Rien à faire.
    return
  }

  await db.notification.createMany({
    data: toCreate.map(a => ({
      userId: ctx.userId,
      type: 'ACHIEVEMENT',
      title: 'Succès débloqué',
      body: `${a.name} — ${a.description}`,
    })),
  })
}
