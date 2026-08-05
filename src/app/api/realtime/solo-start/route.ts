import { NextRequest } from 'next/server'
import { z } from 'zod'
import { realtime, GAME_CONFIG } from '@/lib/realtime'
import { pickProgressiveQuestions } from '@/lib/question-picker'
import { BOT_PROFILES } from '@/lib/bot'
import { DEGREE_CODES, degreeIndex } from '@/lib/academic.mjs'
import { db } from '@/lib/db'
import { guarded, requireAuth, parseBody, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  botProfile: z.enum(BOT_PROFILES.map(p => p.code) as [string, ...string[]]),
  categoryFilter: z.string().nullable().optional(),
})

/**
 * Paliers dans lesquels puiser les questions d'une partie solo.
 *
 * On part du diplôme déjà obtenu par le joueur et on monte de deux crans : un
 * bachelier affronte des questions de niveau bac, licence et master. Sans
 * diplôme, on démarre au CEP. Le joueur retrouve ainsi la difficulté qu'il a
 * démontré savoir traiter, plus une marge de progression.
 */
function levelsFor(highestDegree: string | null): string[] {
  const start = Math.max(0, degreeIndex(highestDegree))
  return DEGREE_CODES.slice(start, start + 3)
}

// POST /api/realtime/solo-start — duel contre l'ordinateur, sans adversaire humain.
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const { botProfile, categoryFilter } = await parseBody(req, schema)

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: { highestDegree: true },
  })

  const questions = await pickProgressiveQuestions(
    categoryFilter ?? null,
    GAME_CONFIG.questionsPerGame,
    levelsFor(user?.highestDegree ?? null)
  )
  if (questions.length < 4) {
    return fail(
      `Pas assez de questions disponibles (${questions.length}) pour lancer une partie`,
      400
    )
  }

  const result = realtime.startSoloGame(
    auth.userId,
    botProfile,
    categoryFilter ?? null,
    questions
  )
  if (!result.ok) return fail(result.error || 'Impossible de lancer la partie', 409)

  return ok({ ok: true, gameId: result.gameId, totalQuestions: questions.length })
})
