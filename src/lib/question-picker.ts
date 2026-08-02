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
  categoryId: string
  categoryName: string
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

  const rows = await db.$queryRaw<PickedRow[]>`
    SELECT q."id", q."text",
           q."propositionA", q."propositionB", q."propositionC", q."propositionD",
           q."correctAnswer", q."explanation", q."difficulty",
           q."categoryId", c."name" AS "categoryName"
    FROM "Question" q
    JOIN "Category" c ON c."id" = q."categoryId"
    ${where}
    ORDER BY RANDOM()
    LIMIT ${count}
  `

  return rows.map(r => ({
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
  }))
}

/** Nombre de questions disponibles pour un filtre de catégorie donné. */
export async function countAvailable(categoryId: string | null): Promise<number> {
  return db.question.count({ where: categoryId ? { categoryId } : undefined })
}
