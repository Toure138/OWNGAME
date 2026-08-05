import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { DEGREE_CODES, levelForSingleQuestion } from '@/lib/academic.mjs'
import { guarded, requireAdmin, parseBody, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const questionSchema = z.object({
  text: z.string().trim().min(8).max(500),
  propositionA: z.string().trim().min(1).max(200),
  propositionB: z.string().trim().min(1).max(200),
  propositionC: z.string().trim().min(1).max(200),
  propositionD: z.string().trim().min(1).max(200),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().trim().max(500).nullable().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  academicLevel: z.enum(DEGREE_CODES as [string, ...string[]]).optional(),
})

const schema = z.object({
  categoryId: z.string().min(1),
  questions: z.array(questionSchema).min(1, 'au moins une question').max(500),
})

// POST /api/admin/import — import en masse de questions dans une catégorie.
//
// Les lignes invalides ou déjà présentes sont ignorées et rapportées, plutôt
// que de faire échouer tout le lot : un import de 200 questions ne doit pas
// être perdu à cause d'un doublon.
export const POST = guarded(async (req: NextRequest) => {
  requireAdmin(req)
  const { categoryId, questions } = await parseBody(req, schema)

  const category = await db.category.findUnique({ where: { id: categoryId } })
  if (!category) return fail('Catégorie introuvable', 400)

  const existingTexts = new Set(
    (await db.question.findMany({ select: { text: true } })).map(q => q.text)
  )

  const accepted: typeof questions = []
  const rejected: Array<{ index: number; text: string; reason: string }> = []

  questions.forEach((q, index) => {
    const props = [q.propositionA, q.propositionB, q.propositionC, q.propositionD]
    if (new Set(props.map(p => p.toLowerCase())).size !== 4) {
      rejected.push({ index, text: q.text, reason: 'propositions dupliquées' })
      return
    }
    if (existingTexts.has(q.text)) {
      rejected.push({ index, text: q.text, reason: 'énoncé déjà présent' })
      return
    }
    existingTexts.add(q.text)
    accepted.push(q)
  })

  let imported = 0
  const BATCH = 200
  for (let i = 0; i < accepted.length; i += BATCH) {
    const res = await db.question.createMany({
      data: accepted.slice(i, i + BATCH).map(q => ({
        text: q.text,
        propositionA: q.propositionA,
        propositionB: q.propositionB,
        propositionC: q.propositionC,
        propositionD: q.propositionD,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || null,
        difficulty: q.difficulty || 'MEDIUM',
        // Un import sans palier déclaré est réparti automatiquement : sans
        // niveau, ces questions ne seraient tirées par aucun examen.
        academicLevel: q.academicLevel || levelForSingleQuestion(q),
        categoryId,
      })),
    })
    imported += res.count
  }

  return ok({
    imported,
    submitted: questions.length,
    rejected: rejected.length,
    details: rejected.slice(0, 20),
  })
})
