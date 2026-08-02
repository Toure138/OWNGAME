import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

// PATCH /api/auth/profile
export async function PATCH(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const body = await req.json()
  const allowed: any = {}
  for (const k of ['pseudo', 'fullName', 'country', 'avatarUrl', 'phone']) {
    if (body[k] !== undefined) allowed[k] = body[k]
  }
  const user = await db.user.update({ where: { id: auth.userId }, data: allowed })
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
    },
  })
}
