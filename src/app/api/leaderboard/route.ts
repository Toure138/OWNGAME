import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { route, ok, fail } from '@/lib/api'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SCOPES = ['global', 'national', 'weekly', 'monthly', 'yearly'] as const
type Scope = (typeof SCOPES)[number]

const PERIODS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
}

interface Entry {
  id: string
  pseudo: string
  avatarUrl: string | null
  country: string
  level: number
  totalScore: number
  wins: number
  losses: number
  gamesPlayed: number
  winRate: number
}

// GET /api/leaderboard?scope=global|national|weekly|monthly|yearly&country=…
export const GET = route(async (req: NextRequest) => {
  const auth = getUserFromRequest(req)
  const url = new URL(req.url)
  const scope = (url.searchParams.get('scope') || 'global') as Scope
  if (!SCOPES.includes(scope)) {
    return fail(`Portée invalide (${SCOPES.join(', ')})`, 400)
  }

  let country = url.searchParams.get('country') || undefined
  if (scope === 'national' && !country && auth) {
    const me = await db.user.findUnique({
      where: { id: auth.userId },
      select: { country: true },
    })
    country = me?.country
  }
  const countryFilter = scope === 'national' ? country : undefined

  let players: Entry[]
  let myRank: number | null = null

  const periodDays = PERIODS[scope]
  if (periodDays) {
    // Classement de période : on agrège les scores des parties terminées.
    const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
    const games = await db.game.findMany({
      where: { finishedAt: { gte: since } },
      include: {
        playerA: { select: { id: true, pseudo: true, avatarUrl: true, country: true, level: true } },
        playerB: { select: { id: true, pseudo: true, avatarUrl: true, country: true, level: true } },
      },
    })

    const map = new Map<string, Entry>()
    for (const g of games) {
      const sides = [
        { user: g.playerA, score: g.scoreA, won: g.winnerId === g.playerAId },
        { user: g.playerB, score: g.scoreB, won: g.winnerId === g.playerBId },
      ]
      for (const side of sides) {
        if (countryFilter && side.user.country !== countryFilter) continue
        const current =
          map.get(side.user.id) ??
          {
            id: side.user.id,
            pseudo: side.user.pseudo,
            avatarUrl: side.user.avatarUrl,
            country: side.user.country,
            level: side.user.level,
            totalScore: 0,
            wins: 0,
            losses: 0,
            gamesPlayed: 0,
            winRate: 0,
          }
        current.totalScore += side.score
        current.gamesPlayed += 1
        if (side.won) current.wins += 1
        else if (g.winnerId) current.losses += 1
        map.set(side.user.id, current)
      }
    }

    players = Array.from(map.values())
      .map(p => ({
        ...p,
        winRate: p.gamesPlayed ? Math.round((p.wins / p.gamesPlayed) * 100) : 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)

    // Sur une période, le rang n'a de sens que si le joueur y a disputé une
    // partie ; sinon on renvoie null plutôt qu'un rang trompeur.
    if (auth) {
      const idx = players.findIndex(p => p.id === auth.userId)
      myRank = idx >= 0 ? idx + 1 : null
    }
    players = players.slice(0, 100)
  } else {
    const users = await db.user.findMany({
      where: countryFilter ? { country: countryFilter } : undefined,
      orderBy: [{ totalScore: 'desc' }, { wins: 'desc' }],
      take: 100,
    })
    players = users.map(u => ({
      id: u.id,
      pseudo: u.pseudo,
      avatarUrl: u.avatarUrl,
      country: u.country,
      level: u.level,
      totalScore: u.totalScore,
      wins: u.wins,
      losses: u.losses,
      gamesPlayed: u.gamesPlayed,
      winRate: u.gamesPlayed ? Math.round((u.wins / u.gamesPlayed) * 100) : 0,
    }))

    if (auth) {
      const idx = players.findIndex(p => p.id === auth.userId)
      if (idx >= 0) {
        myRank = idx + 1
      } else {
        const me = await db.user.findUnique({ where: { id: auth.userId } })
        if (me) {
          const better = await db.user.count({
            where: {
              totalScore: { gt: me.totalScore },
              ...(countryFilter ? { country: countryFilter } : {}),
            },
          })
          myRank = better + 1
        }
      }
    }
  }

  return ok({ players, myRank, scope, country: countryFilter ?? null })
})
