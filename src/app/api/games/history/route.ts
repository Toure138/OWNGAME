import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/games/history
export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const games = await db.game.findMany({
    where: { OR: [{ playerAId: auth.userId }, { playerBId: auth.userId }] },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { playerA: true, playerB: true },
  })
  const result = games.map(g => {
    const isPlayerA = g.playerAId === auth.userId
    const opponent = isPlayerA ? g.playerB : g.playerA
    const myScore = isPlayerA ? g.scoreA : g.scoreB
    const oppScore = isPlayerA ? g.scoreB : g.scoreA
    const myCorrect = isPlayerA ? g.correctA : g.correctB
    const oppCorrect = isPlayerA ? g.correctB : g.correctA
    const myAvg = isPlayerA ? g.avgTimeA : g.avgTimeB
    let outcome: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW'
    if (g.winnerId === auth.userId) outcome = 'WIN'
    else if (g.winnerId && g.winnerId !== auth.userId) outcome = 'LOSS'
    return {
      id: g.id,
      date: g.createdAt,
      status: g.status,
      outcome,
      categoryFilter: g.categoryFilter,
      myScore,
      oppScore,
      myCorrect,
      oppCorrect,
      myAvgTime: myAvg,
      opponent: {
        id: opponent.id,
        pseudo: opponent.pseudo,
        avatarUrl: opponent.avatarUrl,
        country: opponent.country,
      },
    }
  })
  return NextResponse.json({ games: result })
}
