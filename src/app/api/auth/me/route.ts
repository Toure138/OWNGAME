import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { guarded, requireAuth, ok, notFound } from '@/lib/api'
import { publicUser } from '@/lib/user-dto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/auth/me — profil courant, enrichi du rang mondial.
export const GET = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const user = await db.user.findUnique({ where: { id: auth.userId } })
  if (!user) return notFound('Utilisateur introuvable')

  const better = await db.user.count({ where: { totalScore: { gt: user.totalScore } } })
  const nationalBetter = await db.user.count({
    where: { totalScore: { gt: user.totalScore }, country: user.country },
  })

  await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } })

  return ok({
    user: { ...publicUser(user, { rank: better + 1 }), nationalRank: nationalBetter + 1 },
  })
})
