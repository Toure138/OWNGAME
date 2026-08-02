import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { guarded, requireAdmin, ok } from '@/lib/api'
import { realtime } from '@/lib/realtime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/stats — tableau de bord de l'administration.
export const GET = guarded(async (req: NextRequest) => {
  requireAdmin(req)

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  const weekAgo = new Date(now - 7 * day)

  const [
    totalPlayers,
    totalGames,
    totalQuestions,
    totalCategories,
    bannedPlayers,
    newPlayersThisWeek,
    gamesThisWeek,
    aggUsers,
  ] = await Promise.all([
    db.user.count(),
    db.game.count(),
    db.question.count(),
    db.category.count(),
    db.user.count({ where: { banned: true } }),
    db.user.count({ where: { createdAt: { gte: weekAgo } } }),
    db.game.count({ where: { createdAt: { gte: weekAgo } } }),
    db.user.aggregate({ _sum: { wins: true, gamesPlayed: true, totalScore: true } }),
  ])

  const totalWins = aggUsers._sum.wins ?? 0
  const totalPlayed = aggUsers._sum.gamesPlayed ?? 0
  const winRate = totalPlayed ? Math.round((totalWins / totalPlayed) * 100) : 0

  // Statistiques par catégorie, calculées à partir des compteurs de questions.
  const questions = await db.question.findMany({
    select: {
      id: true,
      text: true,
      categoryId: true,
      timesAnswered: true,
      timesCorrect: true,
      difficulty: true,
      category: { select: { name: true, color: true } },
    },
  })

  const byCat = new Map<
    string,
    { id: string; name: string; color: string | null; questions: number; answered: number; correct: number }
  >()
  for (const q of questions) {
    const entry =
      byCat.get(q.categoryId) ?? {
        id: q.categoryId,
        name: q.category.name,
        color: q.category.color,
        questions: 0,
        answered: 0,
        correct: 0,
      }
    entry.questions += 1
    entry.answered += q.timesAnswered
    entry.correct += q.timesCorrect
    byCat.set(q.categoryId, entry)
  }

  const categoryStats = Array.from(byCat.values())
    .map(c => ({
      ...c,
      successRate: c.answered ? Math.round((c.correct / c.answered) * 100) : null,
    }))
    .sort((a, b) => b.answered - a.answered)

  // Questions déjà jouées un minimum de fois : en dessous, le taux de réussite
  // n'est pas significatif.
  const MIN_SAMPLES = 3
  const rated = questions
    .filter(q => q.timesAnswered >= MIN_SAMPLES)
    .map(q => ({
      id: q.id,
      text: q.text,
      category: q.category.name,
      difficulty: q.difficulty,
      timesAnswered: q.timesAnswered,
      successRate: Math.round((q.timesCorrect / q.timesAnswered) * 100),
    }))

  const hardest = [...rated].sort((a, b) => a.successRate - b.successRate).slice(0, 5)
  const easiest = [...rated].sort((a, b) => b.successRate - a.successRate).slice(0, 5)

  const difficultyBreakdown = ['EASY', 'MEDIUM', 'HARD'].map(level => ({
    difficulty: level,
    count: questions.filter(q => q.difficulty === level).length,
  }))

  // Activité des 14 derniers jours, pour le graphique du tableau de bord.
  const recentGames = await db.game.findMany({
    where: { createdAt: { gte: new Date(now - 14 * day) } },
    select: { createdAt: true },
  })
  const activity: Array<{ date: string; games: number }> = []
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now - i * day)
    const key = dayStart.toISOString().slice(0, 10)
    activity.push({
      date: key,
      games: recentGames.filter(g => g.createdAt.toISOString().slice(0, 10) === key).length,
    })
  }

  const topPlayers = await db.user.findMany({
    orderBy: { totalScore: 'desc' },
    take: 5,
    select: { id: true, pseudo: true, country: true, totalScore: true, wins: true, level: true },
  })

  return ok({
    totalPlayers,
    totalGames,
    totalQuestions,
    totalCategories,
    bannedPlayers,
    newPlayersThisWeek,
    gamesThisWeek,
    winRate,
    totalScore: aggUsers._sum.totalScore ?? 0,
    topCategories: categoryStats.slice(0, 10),
    categoryStats,
    difficultyBreakdown,
    hardest,
    easiest,
    activity,
    topPlayers,
    realtime: realtime.snapshot(),
  })
})
