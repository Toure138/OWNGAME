import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, signToken } from '@/lib/auth'

export const runtime = 'nodejs'

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body as { email?: string; password?: string }
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 })
    }
    const user = await db.user.findUnique({ where: { email } })
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
    }
    const token = signToken({ sub: user.id, role: user.role })
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
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
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur serveur' }, { status: 500 })
  }
}
