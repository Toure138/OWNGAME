import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

// GET /api/leaderboard?scope=global|national|weekly|monthly|yearly
export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req)
  const url = new URL(req.url)
  const scope = url.searchParams.get('scope') || 'global'
  const country = url.searchParams.get('country') || undefined

  let where: any = {}
  if (scope === 'national') {
    if (!country && auth) {
      const me = await db.user.findUnique({ where: { id: auth.userId } })
      if (me) where.country = me.country
    } else if (country) {
      where.country = country
    }
  }

  let dateFilter: any = undefined
  const now = new Date()
  if (scope === 'weekly') {
    dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (scope === 'monthly') {
    dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  } else if (scope === 'yearly') {
    dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
  }

  let players: any[]
  if (dateFilter) {
    // Aggregate from games in the period
    const games = await db.game.findMany({
      where: { finishedAt: { gte: dateFilter } },
      include: { playerA: true, playerB: true },
    })
    const map = new Map<string, { user: any; score: number; wins: number; games: number }>()
    for (const g of games) {
      for (const [p, score, isWinner] of [
        [g.playerA, g.scoreA, g.winnerId === g.playerAId],
        [g.playerB, g.scoreB, g.winnerId === g.playerBId],
      ] as any[]) {
        if (where.country && p.country !== where.country) continue
        const cur = map.get(p.id) || { user: p, score: 0, wins: 0, games: 0 }
        cur.score += score
        if (isWinner) cur.wins += 1
        cur.games += 1
        map.set(p.id, cur)
      }
    }
    players = Array.from(map.values())
      .map(v => ({
        id: v.user.id,
        pseudo: v.user.pseudo,
        avatarUrl: v.user.avatarUrl,
        country: v.user.country,
        level: v.user.level,
        totalScore: v.score,
        wins: v.wins,
        gamesPlayed: v.games,
        winRate: v.games ? Math.round((v.wins / v.games) * 100) : 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 100)
  } else {
    const users = await db.user.findMany({
      where,
      orderBy: { totalScore: 'desc' },
      take: 100,
    })
    players = users.map((u, i) => ({
      id: u.id,
      pseudo: u.pseudo,
      avatarUrl: u.avatarUrl,
      country: u.country,
      level: u.level,
      totalScore: u.totalScore,
      wins: u.wins,
      gamesPlayed: u.gamesPlayed,
      winRate: u.gamesPlayed ? Math.round((u.wins / u.gamesPlayed) * 100) : 0,
    }))
  }

  let myRank: number | null = null
  if (auth) {
    const idx = players.findIndex(p => p.id === auth.userId)
    if (idx >= 0) myRank = idx + 1
    else if (scope === 'global' || scope === 'national') {
      // Compute global position
      const me = await db.user.findUnique({ where: { id: auth.userId } })
      if (me) {
        const better = await db.user.count({
          where: { totalScore: { gt: me.totalScore }, ...(where.country ? { country: where.country } : {}) },
        })
        myRank = better + 1
      }
    }
  }

  return NextResponse.json({ players, myRank, scope })
}
