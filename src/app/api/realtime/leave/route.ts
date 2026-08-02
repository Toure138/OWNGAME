import { NextRequest } from 'next/server'
import { realtime } from '@/lib/realtime'
import { guarded, requireAuth, ok } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/realtime/leave — sortie du salon (déconnexion, fermeture d'onglet).
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  realtime.leave(auth.userId)
  return ok({ ok: true })
})
