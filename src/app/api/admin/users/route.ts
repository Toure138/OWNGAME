import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { guarded, requireAdmin, parseBody, ok, fail } from '@/lib/api'
import { publicUser } from '@/lib/user-dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/users?q=…&role=…&limit=…
export const GET = guarded(async (req: NextRequest) => {
  requireAdmin(req)
  const url = new URL(req.url)
  const search = url.searchParams.get('q')?.trim() || ''
  const role = url.searchParams.get('role') || undefined
  const requested = parseInt(url.searchParams.get('limit') || '100', 10)
  const take = Math.min(Math.max(Number.isFinite(requested) ? requested : 100, 1), 500)

  const users = await db.user.findMany({
    where: {
      ...(role && ['USER', 'ADMIN'].includes(role) ? { role } : {}),
      // `mode: 'insensitive'` est indispensable sous PostgreSQL : contrairement
      // à SQLite, son opérateur LIKE respecte la casse. Sans lui, chercher
      // « alice » ne trouverait pas « Alice ».
      ...(search
        ? {
            OR: [
              { pseudo: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { fullName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
  })

  return ok({ users: users.map(u => publicUser(u)), total: users.length })
})

const patchSchema = z.object({
  pseudo: z.string().trim().min(2).max(24).optional(),
  fullName: z.string().trim().max(120).nullable().optional(),
  country: z.string().trim().max(80).optional(),
  avatarUrl: z.string().trim().max(500).nullable().optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  banned: z.boolean().optional(),
})

// PATCH /api/admin/users?id=… — rôle, suspension, informations.
export const PATCH = guarded(async (req: NextRequest) => {
  const auth = requireAdmin(req)
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return fail('Paramètre « id » requis', 400)

  const body = await parseBody(req, patchSchema)
  if (!Object.keys(body).length) return fail('Aucune modification fournie', 400)

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return fail('Utilisateur introuvable', 404)

  // Un administrateur ne peut ni se rétrograder ni se suspendre lui-même :
  // cela pourrait laisser la plateforme sans administrateur accessible.
  if (id === auth.userId) {
    if (body.role && body.role !== 'ADMIN') {
      return fail('Vous ne pouvez pas retirer votre propre rôle administrateur', 400)
    }
    if (body.banned) return fail('Vous ne pouvez pas suspendre votre propre compte', 400)
  }

  if (body.role === 'USER' && target.role === 'ADMIN') {
    const admins = await db.user.count({ where: { role: 'ADMIN' } })
    if (admins <= 1) return fail('Impossible de retirer le dernier administrateur', 400)
  }

  const updated = await db.user.update({ where: { id }, data: body })
  return ok({ user: publicUser(updated) })
})

// DELETE /api/admin/users?id=…
export const DELETE = guarded(async (req: NextRequest) => {
  const auth = requireAdmin(req)
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return fail('Paramètre « id » requis', 400)
  if (id === auth.userId) return fail('Vous ne pouvez pas supprimer votre propre compte', 400)

  const target = await db.user.findUnique({ where: { id } })
  if (!target) return fail('Utilisateur introuvable', 404)
  if (target.role === 'ADMIN') {
    const admins = await db.user.count({ where: { role: 'ADMIN' } })
    if (admins <= 1) return fail('Impossible de supprimer le dernier administrateur', 400)
  }

  // Les parties, notifications et succès sont supprimés en cascade (schéma).
  await db.user.delete({ where: { id } })
  return ok({ ok: true, deleted: id })
})
