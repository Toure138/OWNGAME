import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { guarded, requireAuth, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RandomRow {
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

// GET /api/questions/random?categoryId=…&difficulty=…&limit=20
//
// Le tirage est délégué à PostgreSQL (`ORDER BY RANDOM()`) plutôt que fait en
// mémoire sur les premières lignes : avec un millier de questions, mélanger un
// sous-ensemble arbitraire aurait rendu une grande partie de la banque
// inatteignable.
//
// La bonne réponse n'est jamais exposée à un joueur : les questions d'une
// partie sont désormais tirées par le serveur (`lib/question-picker.ts`).
export const GET = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('categoryId') || null
  const difficulty = url.searchParams.get('difficulty')?.toUpperCase() || null
  const requested = parseInt(url.searchParams.get('limit') || '20', 10)
  const limit = Math.min(Math.max(Number.isFinite(requested) ? requested : 20, 1), 50)

  if (difficulty && !['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
    return fail('Difficulté invalide (EASY, MEDIUM ou HARD)', 400)
  }

  const filters: Prisma.Sql[] = []
  if (categoryId) filters.push(Prisma.sql`q."categoryId" = ${categoryId}`)
  if (difficulty) filters.push(Prisma.sql`q."difficulty" = ${difficulty}`)
  const where = filters.length
    ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`
    : Prisma.empty

  const rows = await db.$queryRaw<RandomRow[]>`
    SELECT q."id", q."text",
           q."propositionA", q."propositionB", q."propositionC", q."propositionD",
           q."correctAnswer", q."explanation", q."difficulty",
           q."categoryId", c."name" AS "categoryName"
    FROM "Question" q
    JOIN "Category" c ON c."id" = q."categoryId"
    ${where}
    ORDER BY RANDOM()
    LIMIT ${limit}
  `

  const isAdmin = auth.role === 'ADMIN'
  return ok({
    questions: rows.map(r => ({
      id: r.id,
      text: r.text,
      propositionA: r.propositionA,
      propositionB: r.propositionB,
      propositionC: r.propositionC,
      propositionD: r.propositionD,
      difficulty: r.difficulty,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      ...(isAdmin ? { correctAnswer: r.correctAnswer, explanation: r.explanation } : {}),
    })),
    count: rows.length,
    requested: limit,
  })
})
