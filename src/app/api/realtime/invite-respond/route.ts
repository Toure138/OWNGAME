import { NextRequest } from 'next/server'
import { z } from 'zod'
import { realtime } from '@/lib/realtime'
import { guarded, requireAuth, parseBody, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  invitationId: z.string().min(1),
  accept: z.boolean(),
})

// POST /api/realtime/invite-respond — accepter ou refuser un défi.
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const { invitationId, accept } = await parseBody(req, schema)
  const result = realtime.respondInvite(auth.userId, invitationId, accept)
  if (!result.ok) return fail(result.error || 'Réponse impossible', 409)
  return ok({
    ok: true,
    accepted: accept,
    categoryFilter: result.categoryFilter ?? null,
    opponentId: result.opponentId ?? null,
    opponentPseudo: result.opponentPseudo ?? null,
  })
})
