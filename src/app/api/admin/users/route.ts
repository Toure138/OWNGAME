import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

function requireAdmin(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth) return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  if (auth.role !== 'ADMIN') return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  return { auth }
}

// GET /api/admin/users
export async function GET(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || ''
  const users = await db.user.findMany({
    where: q ? {
      OR: [
        { pseudo: { contains: q } },
        { email: { contains: q } },
        { fullName: { contains: q } },
      ]
    } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, email: true, pseudo: true, fullName: true, country: true, role: true,
      level: true, xp: true, gamesPlayed: true, wins: true, losses: true, totalScore: true,
      avatarUrl: true, createdAt: true, passwordHash: false,
    },
  })
  return NextResponse.json({ users })
}

// PATCH /api/admin/users?id=... (update role / suspend)
export async function PATCH(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  const body = await req.json()
  const allowed: any = {}
  for (const k of ['pseudo', 'fullName', 'country', 'role', 'avatarUrl']) {
    if (body[k] !== undefined) allowed[k] = body[k]
  }
  const user = await db.user.update({ where: { id }, data: allowed, select: { id: true, pseudo: true, role: true } })
  return NextResponse.json({ user })
}

// DELETE /api/admin/users?id=...
export async function DELETE(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
