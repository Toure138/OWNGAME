import { Prisma } from '@prisma/client'
import { db } from './db'
import type { StartQuestionInput } from './realtime'

interface PickedRow {
  id: string
  text: string
  propositionA: string
  propositionB: string
  propositionC: string
  propositionD: string
  correctAnswer: string
  explanation: string | null
  difficulty: string
  academicLevel: string
  categoryId: string
  categoryName: string
}

function toInput(r: PickedRow): StartQuestionInput {
  return {
    questionId: r.id,
    text: r.text,
    propositions: {
      A: r.propositionA,
      B: r.propositionB,
      C: r.propositionC,
      D: r.propositionD,
    },
    correct: r.correctAnswer as 'A' | 'B' | 'C' | 'D',
    explanation: r.explanation,
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    difficulty: r.difficulty,
    academicLevel: r.academicLevel,
  }
}

async function query(where: Prisma.Sql, count: number): Promise<StartQuestionInput[]> {
  const rows = await db.$queryRaw<PickedRow[]>`
    SELECT q."id", q."text",
           q."propositionA", q."propositionB", q."propositionC", q."propositionD",
           q."correctAnswer", q."explanation", q."difficulty", q."academicLevel",
           q."categoryId", c."name" AS "categoryName"
    FROM "Question" q
    JOIN "Category" c ON c."id" = q."categoryId"
    ${where}
    ORDER BY RANDOM()
    LIMIT ${count}
  `
  return rows.map(toInput)
}

/**
 * Tire au sort les questions d'une partie, côté serveur.
 *
 * La sélection était auparavant faite par le navigateur de l'invitant, qui
 * recevait donc les bonnes réponses avant même le début de la partie et les
 * transmettait au serveur. Les énoncés complets ne quittent désormais le
 * serveur que question par question, au fil du jeu.
 */
export async function pickQuestions(
  categoryId: string | null,
  count: number
): Promise<StartQuestionInput[]> {
  const where = categoryId
    ? Prisma.sql`WHERE q."categoryId" = ${categoryId}`
    : Prisma.empty
  return query(where, count)
}

/**
 * Tire les questions d'un examen : uniquement le palier visé, toutes
 * catégories confondues.
 *
 * Le filtre par catégorie n'est volontairement pas proposé ici. Le doctorat ne
 * compte que 70 questions sur l'ensemble de la banque : restreintes à une
 * catégorie, elles seraient trois ou quatre — l'examen se réduirait à réciter
 * les mêmes énoncés à chaque tentative.
 */
export async function pickExamQuestions(
  academicLevel: string,
  count: number
): Promise<StartQuestionInput[]> {
  return query(Prisma.sql`WHERE q."academicLevel" = ${academicLevel}`, count)
}

/**
 * Tire les questions d'une partie contre l'ordinateur, en montée progressive :
 * la partie commence au niveau du joueur et s'achève un cran au-dessus. Un
 * tirage uniforme sur toute la banque donnait des duels sans relief, où une
 * question de doctorat pouvait tomber en ouverture.
 */
export async function pickProgressiveQuestions(
  categoryId: string | null,
  count: number,
  levels: string[]
): Promise<StartQuestionInput[]> {
  if (!levels.length) return pickQuestions(categoryId, count)

  // Répartition : les paliers hauts sont moins nombreux que les bas.
  const weights = levels.map((_, i) => levels.length - i)
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  const picked: StartQuestionInput[] = []
  const seen = new Set<string>()

  for (let i = 0; i < levels.length; i++) {
    const share = Math.round((count * weights[i]) / totalWeight)
    if (share <= 0) continue
    const filters = [Prisma.sql`q."academicLevel" = ${levels[i]}`]
    if (categoryId) filters.push(Prisma.sql`q."categoryId" = ${categoryId}`)
    const rows = await query(Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`, share)
    for (const row of rows) {
      if (seen.has(row.questionId)) continue
      seen.add(row.questionId)
      picked.push(row)
    }
  }

  // Complément si un palier manquait de questions — le cas se produit dès qu'un
  // filtre de catégorie est appliqué sur les paliers les plus élevés.
  if (picked.length < count) {
    const fallback = await pickQuestions(categoryId, count * 2)
    for (const row of fallback) {
      if (picked.length >= count) break
      if (seen.has(row.questionId)) continue
      seen.add(row.questionId)
      picked.push(row)
    }
  }

  // Les questions arrivent groupées par palier : on les ordonne du plus simple
  // au plus difficile, pour une montée en tension régulière.
  const rank = (q: StartQuestionInput) => levels.indexOf(q.academicLevel || '')
  return picked.slice(0, count).sort((a, b) => rank(a) - rank(b))
}

/** Nombre de questions disponibles pour un filtre de catégorie donné. */
export async function countAvailable(categoryId: string | null): Promise<number> {
  return db.question.count({ where: categoryId ? { categoryId } : undefined })
}

/** Nombre de questions disponibles pour chaque palier académique. */
export async function countByLevel(): Promise<Record<string, number>> {
  const rows = await db.question.groupBy({
    by: ['academicLevel'],
    _count: { _all: true },
  })
  return Object.fromEntries(rows.map(r => [r.academicLevel, r._count._all]))
}
