import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

// GET /api/notifications
export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const notifs = await db.notification.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ notifications: notifs })
}

// PATCH /api/notifications?id=... (mark as read) or ?all=true
export async function PATCH(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const all = url.searchParams.get('all') === 'true'
  if (all) {
    await db.notification.updateMany({ where: { userId: auth.userId, read: false }, data: { read: true } })
  } else if (id) {
    await db.notification.updateMany({ where: { id, userId: auth.userId }, data: { read: true } })
  }
  return NextResponse.json({ ok: true })
}
