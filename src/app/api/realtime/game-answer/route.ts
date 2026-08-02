import { NextRequest } from 'next/server'
import { z } from 'zod'
import { realtime } from '@/lib/realtime'
import { guarded, requireAuth, parseBody, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  gameId: z.string().min(1),
  choice: z.enum(['A', 'B', 'C', 'D']).nullable(),
  // Indicatif seulement : le serveur recalcule le temps écoulé à partir de
  // l'horodatage d'envoi de la question.
  responseTime: z.number().int().min(0).max(120_000).optional(),
})

// POST /api/realtime/game-answer
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const { gameId, choice, responseTime } = await parseBody(req, schema)
  const result = realtime.answerQuestion(auth.userId, gameId, choice, responseTime ?? 0)
  if (!result.ok) return fail(result.error || 'Réponse refusée', 409)
  return ok({ ok: true })
})
