import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { guarded, requireAuth, parseBody, ok, fail } from '@/lib/api'
import { verifyPassword, hashPassword } from '@/lib/auth'
import { publicUser } from '@/lib/user-dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const profileSchema = z.object({
  pseudo: z.string().trim().min(2).max(24).optional(),
  fullName: z.string().trim().max(120).nullable().optional(),
  country: z.string().trim().max(80).optional(),
  avatarUrl: z
    .string()
    .trim()
    .max(500)
    .refine(v => !v || /^https?:\/\//.test(v), 'doit commencer par http(s)://')
    .nullable()
    .optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  currentPassword: z.string().max(200).optional(),
  newPassword: z.string().min(8, '8 caractères minimum').max(200).optional(),
})

// PATCH /api/auth/profile — informations personnelles et mot de passe.
export const PATCH = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const body = await parseBody(req, profileSchema)

  const user = await db.user.findUnique({ where: { id: auth.userId } })
  if (!user) return fail('Utilisateur introuvable', 404)

  const data: Record<string, unknown> = {}
  for (const key of ['pseudo', 'fullName', 'country', 'phone'] as const) {
    if (body[key] !== undefined) data[key] = body[key] || null
  }
  if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl || null
  // `pseudo` ne doit jamais devenir vide : il sert d'identité publique.
  if (data.pseudo === null) delete data.pseudo

  if (body.newPassword) {
    if (!body.currentPassword) {
      return fail('Le mot de passe actuel est requis pour en définir un nouveau', 400)
    }
    if (!verifyPassword(body.currentPassword, user.passwordHash)) {
      return fail('Mot de passe actuel incorrect', 403)
    }
    data.passwordHash = hashPassword(body.newPassword)
  }

  if (!Object.keys(data).length) return fail('Aucune modification fournie', 400)

  const updated = await db.user.update({ where: { id: auth.userId }, data })
  return ok({ user: publicUser(updated) })
})
