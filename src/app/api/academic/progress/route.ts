import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { DEGREES, degreeIndex, holderTitle, xpForDegree } from '@/lib/academic.mjs'
import { countByLevel } from '@/lib/question-picker'
import { guarded, requireAuth, ok } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/academic/progress — état du parcours académique du joueur.
//
// Renvoie les six paliers dans l'ordre, avec pour chacun : le diplôme s'il est
// obtenu, le nombre de questions disponibles à ce niveau, et la raison d'un
// éventuel verrouillage. L'interface n'a ainsi aucune règle à recalculer.
export const GET = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)

  const [diplomas, counts] = await Promise.all([
    db.diploma.findMany({
      where: { userId: auth.userId },
      orderBy: { obtainedAt: 'asc' },
    }),
    countByLevel(),
  ])

  const byDegree = new Map(diplomas.map(d => [d.degree, d]))

  const steps = DEGREES.map((degree, index) => {
    const diploma = byDegree.get(degree.code) || null
    const previous = index > 0 ? DEGREES[index - 1] : null
    const locked = !!previous && !byDegree.has(previous.code)
    const available = counts[degree.code] ?? 0

    return {
      code: degree.code,
      name: degree.name,
      short: degree.short,
      holder: degree.holder,
      school: degree.school,
      icon: degree.icon,
      color: degree.color,
      questions: degree.questions,
      passRate: degree.passRate,
      timer: degree.timer,
      xpReward: xpForDegree(degree.code),
      availableQuestions: available,
      // Un palier dont la banque est trop maigre ne peut pas être présenté :
      // mieux vaut le dire que d'échouer au lancement de l'examen.
      playable: available >= 4,
      locked,
      lockedBy: locked && previous ? previous.name : null,
      obtained: !!diploma,
      diploma: diploma
        ? {
            mention: diploma.mention,
            percent: diploma.percent,
            correct: diploma.correct,
            total: diploma.total,
            attempts: diploma.attempts,
            obtainedAt: diploma.obtainedAt,
          }
        : null,
    }
  })

  const highest = diplomas
    .map(d => d.degree)
    .reduce<string | null>(
      (best, code) => (degreeIndex(code) > degreeIndex(best) ? code : best),
      null
    )

  return ok({
    steps,
    highestDegree: highest,
    title: holderTitle(highest),
    obtained: diplomas.length,
    total: DEGREES.length,
    // Prochain palier à présenter : le premier non obtenu et non verrouillé.
    next: steps.find(s => !s.obtained && !s.locked)?.code ?? null,
  })
})
