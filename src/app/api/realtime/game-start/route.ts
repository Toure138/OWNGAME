import { NextRequest } from 'next/server'
import { z } from 'zod'
import { realtime, GAME_CONFIG } from '@/lib/realtime'
import { pickQuestions } from '@/lib/question-picker'
import { guarded, requireAuth, parseBody, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  opponentId: z.string().min(1),
  categoryFilter: z.string().nullable().optional(),
})

// POST /api/realtime/game-start — lancement de la partie par l'invitant.
//
// Les questions sont tirées ici, côté serveur. Auparavant le client les
// envoyait dans le corps de la requête : il connaissait donc les bonnes
// réponses avant le début du match et pouvait fournir n'importe quel contenu.
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const { opponentId, categoryFilter } = await parseBody(req, schema)

  const questions = await pickQuestions(categoryFilter ?? null, GAME_CONFIG.questionsPerGame)
  if (questions.length < 4) {
    return fail(
      `Pas assez de questions disponibles (${questions.length}) pour lancer une partie`,
      400
    )
  }

  const result = realtime.startGame(auth.userId, opponentId, categoryFilter ?? null, questions)
  if (!result.ok) return fail(result.error || 'Impossible de lancer la partie', 409)

  return ok({ ok: true, gameId: result.gameId, totalQuestions: questions.length })
})
