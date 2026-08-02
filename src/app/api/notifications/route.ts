import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { guarded, requireAuth, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/notifications?unread=true&limit=…
export const GET = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const url = new URL(req.url)
  const unreadOnly = url.searchParams.get('unread') === 'true'
  const requested = parseInt(url.searchParams.get('limit') || '50', 10)
  const take = Math.min(Math.max(Number.isFinite(requested) ? requested : 50, 1), 200)

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: auth.userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take,
    }),
    db.notification.count({ where: { userId: auth.userId, read: false } }),
  ])

  return ok({ notifications, unreadCount })
})

// PATCH /api/notifications?id=… | ?all=true — marquer comme lu.
export const PATCH = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const all = url.searchParams.get('all') === 'true'

  if (all) {
    const res = await db.notification.updateMany({
      where: { userId: auth.userId, read: false },
      data: { read: true },
    })
    return ok({ ok: true, updated: res.count })
  }
  if (!id) return fail('Paramètre « id » ou « all=true » requis', 400)

  // updateMany avec le filtre userId : un utilisateur ne peut pas toucher
  // aux notifications d'un autre compte.
  const res = await db.notification.updateMany({
    where: { id, userId: auth.userId },
    data: { read: true },
  })
  if (!res.count) return fail('Notification introuvable', 404)
  return ok({ ok: true, updated: res.count })
})

// DELETE /api/notifications?id=… | ?all=true
export const DELETE = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const all = url.searchParams.get('all') === 'true'

  if (all) {
    const res = await db.notification.deleteMany({ where: { userId: auth.userId } })
    return ok({ ok: true, deleted: res.count })
  }
  if (!id) return fail('Paramètre « id » ou « all=true » requis', 400)

  const res = await db.notification.deleteMany({ where: { id, userId: auth.userId } })
  if (!res.count) return fail('Notification introuvable', 404)
  return ok({ ok: true, deleted: res.count })
})
