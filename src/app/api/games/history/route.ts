import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { guarded, requireAuth, ok } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/games/history?outcome=WIN|LOSS|DRAW&limit=…
export const GET = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const url = new URL(req.url)
  const outcomeFilter = url.searchParams.get('outcome')
  const requested = parseInt(url.searchParams.get('limit') || '100', 10)
  const take = Math.min(Math.max(Number.isFinite(requested) ? requested : 100, 1), 200)

  const games = await db.game.findMany({
    where: { OR: [{ playerAId: auth.userId }, { playerBId: auth.userId }] },
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      playerA: { select: { id: true, pseudo: true, avatarUrl: true, country: true, level: true } },
      playerB: { select: { id: true, pseudo: true, avatarUrl: true, country: true, level: true } },
    },
  })

  const mapped = games.map(g => {
    const isPlayerA = g.playerAId === auth.userId
    const opponent = isPlayerA ? g.playerB : g.playerA
    // Chaque joueur traite la moitié des questions de la partie.
    const myQuestions = Math.round(g.totalQuestions / 2)

    let outcome: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW'
    if (g.winnerId === auth.userId) outcome = 'WIN'
    else if (g.winnerId) outcome = 'LOSS'

    return {
      id: g.id,
      date: g.createdAt,
      finishedAt: g.finishedAt,
      status: g.status,
      outcome,
      forfeit: g.forfeit,
      categoryFilter: g.categoryFilter,
      totalQuestions: g.totalQuestions,
      myQuestions,
      myScore: isPlayerA ? g.scoreA : g.scoreB,
      oppScore: isPlayerA ? g.scoreB : g.scoreA,
      myCorrect: isPlayerA ? g.correctA : g.correctB,
      oppCorrect: isPlayerA ? g.correctB : g.correctA,
      myAvgTime: isPlayerA ? g.avgTimeA : g.avgTimeB,
      oppAvgTime: isPlayerA ? g.avgTimeB : g.avgTimeA,
      opponent,
    }
  })

  const games2 = outcomeFilter ? mapped.filter(g => g.outcome === outcomeFilter) : mapped

  // Statistiques agrégées sur l'ensemble de l'historique récupéré.
  const wins = mapped.filter(g => g.outcome === 'WIN').length
  const losses = mapped.filter(g => g.outcome === 'LOSS').length
  const draws = mapped.filter(g => g.outcome === 'DRAW').length
  const totalCorrect = mapped.reduce((s, g) => s + g.myCorrect, 0)
  const totalAnswered = mapped.reduce((s, g) => s + g.myQuestions, 0)
  const timed = mapped.filter(g => g.myAvgTime > 0)

  return ok({
    games: games2,
    stats: {
      total: mapped.length,
      wins,
      losses,
      draws,
      winRate: mapped.length ? Math.round((wins / mapped.length) * 100) : 0,
      accuracy: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
      avgTime: timed.length
        ? Math.round(timed.reduce((s, g) => s + g.myAvgTime, 0) / timed.length)
        : 0,
      bestScore: mapped.reduce((max, g) => Math.max(max, g.myScore), 0),
    },
  })
})
