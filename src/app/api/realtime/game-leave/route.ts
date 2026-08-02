import { NextRequest } from 'next/server'
import { z } from 'zod'
import { realtime } from '@/lib/realtime'
import { guarded, requireAuth, parseBody, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({ gameId: z.string().min(1) })

// POST /api/realtime/game-leave — abandon. La victoire revient à l'adversaire.
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const { gameId } = await parseBody(req, schema)
  const result = realtime.leaveGame(auth.userId, gameId)
  if (!result.ok) return fail(result.error || 'Abandon impossible', 409)
  return ok({ ok: true })
})
