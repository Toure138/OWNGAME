import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

// GET /api/auth/me
export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const user = await db.user.findUnique({ where: { id: auth.userId } })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  // Compute rank
  const better = await db.user.count({ where: { totalScore: { gt: user.totalScore } } })
  const rank = better + 1
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      pseudo: user.pseudo,
      fullName: user.fullName,
      country: user.country,
      avatarUrl: user.avatarUrl,
      role: user.role,
      level: user.level,
      xp: user.xp,
      gamesPlayed: user.gamesPlayed,
      wins: user.wins,
      losses: user.losses,
      totalScore: user.totalScore,
      createdAt: user.createdAt,
      rank,
    },
  })
}
