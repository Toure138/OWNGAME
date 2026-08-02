import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword, signToken, TOKEN_TTL_SECONDS } from '@/lib/auth'
import { guarded, parseBody, ok, fail, rateLimit, clientIp } from '@/lib/api'
import { publicUser } from '@/lib/user-dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().trim().toLowerCase().email('adresse e-mail invalide').max(200),
  password: z.string().min(8, '8 caractères minimum').max(200),
  pseudo: z
    .string()
    .trim()
    .min(2, '2 caractères minimum')
    .max(24, '24 caractères maximum')
    .regex(/^[\p{L}\p{N}_. -]+$/u, 'caractères non autorisés'),
  fullName: z.string().trim().max(120).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
})

// POST /api/auth/register
export const POST = guarded(async (req: NextRequest) => {
  // 5 créations de compte par IP et par heure.
  rateLimit(`register:${clientIp(req)}`, 5, 60 * 60_000)

  const body = await parseBody(req, schema)

  const existing = await db.user.findUnique({ where: { email: body.email } })
  if (existing) return fail('Cette adresse e-mail est déjà utilisée', 409)

  const user = await db.user.create({
    data: {
      email: body.email,
      passwordHash: hashPassword(body.password),
      pseudo: body.pseudo,
      fullName: body.fullName || null,
      country: body.country || 'France',
      phone: body.phone || null,
      avatarUrl: null,
      role: 'USER',
      lastSeenAt: new Date(),
    },
  })

  await db.notification.create({
    data: {
      userId: user.id,
      type: 'INFO',
      title: 'Bienvenue !',
      body: `Bonjour ${user.pseudo}, votre compte est prêt. Rendez-vous dans le salon pour défier un adversaire.`,
    },
  })

  const token = signToken({ sub: user.id, role: user.role })
  return ok({ token, expiresIn: TOKEN_TTL_SECONDS, user: publicUser(user) }, { status: 201 })
})
