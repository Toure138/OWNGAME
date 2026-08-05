import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { DEGREE_CODES, levelForSingleQuestion } from '@/lib/academic.mjs'
import { guarded, requireAdmin, parseBody, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const baseQuestion = {
  text: z.string().trim().min(8, '8 caractères minimum').max(500),
  propositionA: z.string().trim().min(1).max(200),
  propositionB: z.string().trim().min(1).max(200),
  propositionC: z.string().trim().min(1).max(200),
  propositionD: z.string().trim().min(1).max(200),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().trim().max(500).nullable().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  // Facultatif à la création : sans valeur, le palier est estimé à partir de
  // l'énoncé et de la difficulté. L'administrateur peut toujours le corriger.
  academicLevel: z.enum(DEGREE_CODES as [string, ...string[]]).optional(),
  categoryId: z.string().min(1),
}

const createSchema = z.object(baseQuestion).refine(
  q =>
    new Set(
      [q.propositionA, q.propositionB, q.propositionC, q.propositionD].map(p =>
        p.toLowerCase()
      )
    ).size === 4,
  { message: 'Les quatre propositions doivent être distinctes' }
)

const updateSchema = z
  .object({
    text: baseQuestion.text.optional(),
    propositionA: baseQuestion.propositionA.optional(),
    propositionB: baseQuestion.propositionB.optional(),
    propositionC: baseQuestion.propositionC.optional(),
    propositionD: baseQuestion.propositionD.optional(),
    correctAnswer: baseQuestion.correctAnswer.optional(),
    explanation: baseQuestion.explanation,
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    academicLevel: z.enum(DEGREE_CODES as [string, ...string[]]).optional(),
    categoryId: z.string().min(1).optional(),
  })

// GET /api/admin/questions?categoryId=…&difficulty=…&q=…&limit=…
export const GET = guarded(async (req: NextRequest) => {
  requireAdmin(req)
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('categoryId') || undefined
  const difficulty = url.searchParams.get('difficulty')?.toUpperCase() || undefined
  const search = url.searchParams.get('q')?.trim() || ''
  const requested = parseInt(url.searchParams.get('limit') || '100', 10)
  const take = Math.min(Math.max(Number.isFinite(requested) ? requested : 100, 1), 500)

  const where = {
    ...(categoryId ? { categoryId } : {}),
    ...(difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? { difficulty } : {}),
    // PostgreSQL respecte la casse dans LIKE : sans `mode: 'insensitive'`,
    // la recherche ne trouverait que les énoncés écrits exactement ainsi.
    ...(search ? { text: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  const [questions, total] = await Promise.all([
    db.question.findMany({
      where,
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    }),
    db.question.count({ where }),
  ])

  return ok({ questions, total, returned: questions.length })
})

// POST /api/admin/questions
export const POST = guarded(async (req: NextRequest) => {
  requireAdmin(req)
  const body = await parseBody(req, createSchema)

  const category = await db.category.findUnique({ where: { id: body.categoryId } })
  if (!category) return fail('Catégorie introuvable', 400)

  const duplicate = await db.question.findUnique({ where: { text: body.text } })
  if (duplicate) return fail('Une question avec cet énoncé existe déjà', 409)

  const question = await db.question.create({
    data: {
      ...body,
      explanation: body.explanation || null,
      // Palier estimé si l'administrateur ne l'a pas choisi : une question sans
      // niveau ne serait jamais tirée par aucun examen.
      academicLevel: body.academicLevel || levelForSingleQuestion(body),
    },
    include: { category: { select: { id: true, name: true, color: true } } },
  })
  return ok({ question }, { status: 201 })
})

// PATCH /api/admin/questions?id=…
export const PATCH = guarded(async (req: NextRequest) => {
  requireAdmin(req)
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return fail('Paramètre « id » requis', 400)

  const body = await parseBody(req, updateSchema)
  if (!Object.keys(body).length) return fail('Aucune modification fournie', 400)

  const existing = await db.question.findUnique({ where: { id } })
  if (!existing) return fail('Question introuvable', 404)

  if (body.categoryId) {
    const category = await db.category.findUnique({ where: { id: body.categoryId } })
    if (!category) return fail('Catégorie introuvable', 400)
  }
  if (body.text && body.text !== existing.text) {
    const duplicate = await db.question.findUnique({ where: { text: body.text } })
    if (duplicate) return fail('Une question avec cet énoncé existe déjà', 409)
  }

  // Les propositions résultantes doivent rester distinctes après fusion.
  const merged = { ...existing, ...body }
  const props = [merged.propositionA, merged.propositionB, merged.propositionC, merged.propositionD]
  if (new Set(props.map(p => p.toLowerCase())).size !== 4) {
    return fail('Les quatre propositions doivent être distinctes', 400)
  }

  const question = await db.question.update({
    where: { id },
    data: body,
    include: { category: { select: { id: true, name: true, color: true } } },
  })
  return ok({ question })
})

// DELETE /api/admin/questions?id=…
export const DELETE = guarded(async (req: NextRequest) => {
  requireAdmin(req)
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return fail('Paramètre « id » requis', 400)

  const existing = await db.question.findUnique({ where: { id } })
  if (!existing) return fail('Question introuvable', 404)

  await db.question.delete({ where: { id } })
  return ok({ ok: true, deleted: id })
})
