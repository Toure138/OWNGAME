import { NextRequest } from 'next/server'
import { z } from 'zod'
import { realtime, normaliseQuestionCount, GAME_CONFIG } from '@/lib/realtime'
import { countAvailable } from '@/lib/question-picker'
import { guarded, requireAuth, parseBody, ok, fail, rateLimit } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const inviteSchema = z.object({
  toUserId: z.string().min(1),
  categoryFilter: z.string().nullable().optional(),
  questionCount: z.number().int().optional(),
})

const cancelSchema = z.object({ invitationId: z.string().min(1) })

// POST /api/realtime/invite — défier un joueur.
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  // Évite le harcèlement par invitations en rafale.
  rateLimit(`invite:${auth.userId}`, 20, 60_000)

  const body = await parseBody(req, inviteSchema)
  const { toUserId, categoryFilter } = body
  const questionCount = normaliseQuestionCount(body.questionCount ?? GAME_CONFIG.questionsPerGame)

  // Vérifié avant d'envoyer l'invitation : inutile de déranger l'adversaire si
  // la catégorie choisie ne contient pas de quoi composer la partie demandée.
  const available = await countAvailable(categoryFilter ?? null)
  if (available < questionCount) {
    return fail(
      `Cette catégorie ne contient que ${available} question(s) : choisissez-en une autre ou raccourcissez la partie`,
      400
    )
  }

  const result = realtime.sendInvite(
    auth.userId,
    toUserId,
    categoryFilter ?? null,
    questionCount
  )
  if (!result.ok) return fail(result.error || 'Invitation impossible', 409)
  return ok({ ok: true, invitationId: result.invitationId })
})

// DELETE /api/realtime/invite — annuler une invitation en attente.
export const DELETE = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const { invitationId } = await parseBody(req, cancelSchema)
  const result = realtime.cancelInvite(auth.userId, invitationId)
  if (!result.ok) return fail(result.error || 'Annulation impossible', 404)
  return ok({ ok: true })
})
