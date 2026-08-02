import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword, needsRehash, signToken, TOKEN_TTL_SECONDS } from '@/lib/auth'
import { guarded, parseBody, ok, fail, rateLimit, clientIp } from '@/lib/api'
import { publicUser } from '@/lib/user-dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().trim().min(1, 'requis').max(200),
  password: z.string().min(1, 'requis').max(200),
})

// POST /api/auth/login
export const POST = guarded(async (req: NextRequest) => {
  // Freine le bourrage d'identifiants : 10 tentatives par minute et par IP.
  rateLimit(`login:${clientIp(req)}`, 10, 60_000)

  const { email, password } = await parseBody(req, schema)
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })

  // Message identique dans les deux cas : ne pas révéler l'existence d'un compte.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail('Identifiants invalides', 401)
  }
  if (user.banned) {
    return fail('Ce compte a été suspendu par un administrateur', 403)
  }

  // Migration silencieuse des empreintes héritées vers scrypt.
  if (needsRehash(user.passwordHash)) {
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(password) },
    })
  }

  await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } })

  const token = signToken({ sub: user.id, role: user.role })
  return ok({ token, expiresIn: TOKEN_TTL_SECONDS, user: publicUser(user) })
})
