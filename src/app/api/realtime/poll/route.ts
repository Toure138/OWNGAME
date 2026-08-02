import { NextRequest } from 'next/server'
import { realtime } from '@/lib/realtime'
import { guarded, requireAuth, ok } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/realtime/poll — récupère les événements en attente pour le joueur.
//
// `online: false` signale au client qu'il a été retiré du salon (redémarrage du
// serveur ou inactivité) et qu'il doit se réinscrire via /api/realtime/join.
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const { events, online } = realtime.poll(auth.userId)
  return ok({ events, online, serverTime: Date.now() })
})
