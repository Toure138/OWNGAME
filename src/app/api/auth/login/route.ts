import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword, needsRehash, signToken, TOKEN_TTL_SECONDS } from '@/lib/auth'
import { guarded, parseBody, ok, fail, rateLimit, resetRateLimit, clientIp } from '@/lib/api'
import { publicUser } from '@/lib/user-dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  email: z.string().trim().min(1, 'requis').max(200),
  password: z.string().min(1, 'requis').max(200),
})

// POST /api/auth/login
export const POST = guarded(async (req: NextRequest) => {
  // Deux limites complémentaires.
  //
  // Par IP, largement dimensionnée : plusieurs joueurs partagent souvent une
  // même adresse publique (salle de classe, entreprise, partage de connexion),
  // et une limite trop basse les empêcherait simplement de se connecter.
  rateLimit(`login-ip:${clientIp(req)}`, 30, 60_000)

  const { email, password } = await parseBody(req, schema)
  const normalized = email.toLowerCase()

  // Par compte visé : c'est la limite qui contre réellement le bourrage
  // d'identifiants, lequel s'acharne sur une adresse donnée et peut provenir
  // de multiples adresses IP.
  rateLimit(`login-account:${normalized}`, 8, 15 * 60_000)

  const user = await db.user.findUnique({ where: { email: normalized } })

  // Message identique dans les deux cas : ne pas révéler l'existence d'un compte.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail('Identifiants invalides', 401)
  }
  if (user.banned) {
    return fail('Ce compte a été suspendu par un administrateur', 403)
  }

  // Connexion réussie : le compteur du compte est remis à zéro pour ne pas
  // pénaliser un utilisateur qui vient de retrouver son mot de passe.
  resetRateLimit(`login-account:${normalized}`)

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
