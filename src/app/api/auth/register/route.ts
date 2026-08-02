import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'

export const runtime = 'nodejs'

// POST /api/auth/register
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, pseudo, fullName, country, phone } = body as {
      email?: string; password?: string; pseudo?: string; fullName?: string; country?: string; phone?: string
    }
    if (!email || !password || !pseudo) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Mot de passe trop court (min 6)' }, { status: 400 })
    }
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 })
    }
    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        pseudo,
        fullName: fullName || null,
        country: country || 'France',
        phone: phone || null,
        avatarUrl: null,
        role: 'USER',
      },
    })
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
