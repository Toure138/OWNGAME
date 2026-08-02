import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { guarded, requireAuth, ok } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/questions?categoryId=…&difficulty=…&limit=…&q=…
//
// Consultation de la banque. La bonne réponse n'est renvoyée qu'aux
// administrateurs : un joueur pourrait sinon récupérer tout le corrigé.
export const GET = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('categoryId') || undefined
  const difficulty = url.searchParams.get('difficulty')?.toUpperCase() || undefined
  const search = url.searchParams.get('q')?.trim() || ''
  const requested = parseInt(url.searchParams.get('limit') || '50', 10)
  const take = Math.min(Math.max(Number.isFinite(requested) ? requested : 50, 1), 200)

  const questions = await db.question.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? { difficulty } : {}),
      ...(search ? { text: { contains: search } } : {}),
    },
    include: { category: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: 'desc' },
    take,
  })

  const isAdmin = auth.role === 'ADMIN'
  return ok({
    questions: questions.map(q => ({
      id: q.id,
      text: q.text,
      propositionA: q.propositionA,
      propositionB: q.propositionB,
      propositionC: q.propositionC,
      propositionD: q.propositionD,
      difficulty: q.difficulty,
      category: q.category,
      timesAnswered: q.timesAnswered,
      timesCorrect: q.timesCorrect,
      ...(isAdmin ? { correctAnswer: q.correctAnswer, explanation: q.explanation } : {}),
    })),
    total: questions.length,
  })
})
