import { NextRequest } from 'next/server'
import { z } from 'zod'
import { realtime } from '@/lib/realtime'
import { pickExamQuestions } from '@/lib/question-picker'
import { DEGREE_CODES, DEGREES, getDegree, degreeIndex } from '@/lib/academic.mjs'
import { db } from '@/lib/db'
import { guarded, requireAuth, parseBody, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const schema = z.object({
  degree: z.enum(DEGREE_CODES as [string, ...string[]]),
})

// POST /api/realtime/exam-start — présentation à un examen du parcours.
//
// L'ordre du cursus est vérifié ici et non seulement dans l'interface : sans ce
// contrôle, un appel direct permettrait de passer le doctorat sans avoir jamais
// obtenu le CEP.
export const POST = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const { degree: degreeCode } = await parseBody(req, schema)

  const degree = getDegree(degreeCode)
  if (!degree) return fail('Diplôme inconnu', 400)

  const held = await db.diploma.findMany({
    where: { userId: auth.userId },
    select: { degree: true },
  })
  const heldCodes = new Set(held.map(d => d.degree))

  const index = degreeIndex(degree.code)
  const previous = index > 0 ? DEGREES[index - 1] : null
  if (previous && !heldCodes.has(previous.code)) {
    return fail(`Il faut d’abord obtenir : ${previous.name}`, 403)
  }

  const questions = await pickExamQuestions(degree.code, degree.questions)
  if (questions.length < 4) {
    return fail(
      `La banque ne contient que ${questions.length} question(s) de niveau ${degree.short} : l’examen ne peut pas être composé`,
      400
    )
  }

  const result = realtime.startExam(auth.userId, degree.code, questions)
  if (!result.ok) return fail(result.error || 'Impossible de lancer l’examen', 409)

  return ok({
    ok: true,
    gameId: result.gameId,
    totalQuestions: questions.length,
    degree: degree.code,
    passRate: degree.passRate,
  })
})
