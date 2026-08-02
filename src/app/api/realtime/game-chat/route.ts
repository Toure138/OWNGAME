import { NextRequest } from 'next/server'
import { z } from 'zod'
import { realtime } from '@/lib/realtime'
import { guarded, requireAuth, parseBody, ok, fail, rateLimit } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  gameId: z.string().min(1),
  content: z.string().trim().min(1, 'message vide').max(300),
})

// POST /api/realtime/game-chat
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  // 30 messages par minute : suffisant pour discuter, insuffisant pour inonder.
  rateLimit(`chat:${auth.userId}`, 30, 60_000)

  const { gameId, content } = await parseBody(req, schema)
  const result = realtime.sendChat(auth.userId, gameId, content)
  if (!result.ok) return fail(result.error || 'Message refusé', 409)
  return ok({ ok: true })
})
