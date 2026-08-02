import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { realtime, GAME_CONFIG } from '@/lib/realtime'
import { guarded, requireAuth, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/realtime/join — entrée dans le salon.
//
// L'identité affichée aux autres joueurs (pseudo, pays, niveau) est relue en
// base plutôt que reprise du corps de la requête : un client ne peut pas
// s'annoncer sous un autre nom ni avec un niveau fantaisiste.
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)

  const user = await db.user.findUnique({ where: { id: auth.userId } })
  if (!user) return fail('Utilisateur introuvable', 404)
  if (user.banned) return fail('Ce compte a été suspendu', 403)

  const { players } = realtime.join(
    user.id,
    user.pseudo,
    user.avatarUrl,
    user.country,
    user.level
  )

  await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } })

  return ok({
    ok: true,
    players: players.filter(p => p.userId !== user.id),
    config: {
      questionsPerGame: GAME_CONFIG.questionsPerGame,
      timerSeconds: GAME_CONFIG.timerSeconds,
    },
    currentGame: realtime.currentGame(user.id),
  })
})
