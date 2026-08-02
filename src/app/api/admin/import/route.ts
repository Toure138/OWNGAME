import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

// POST /api/admin/import
// Body: { categoryId, questions: [{ text, propositionA, propositionB, propositionC, propositionD, correctAnswer, explanation?, difficulty? }] }
export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  const body = await req.json()
  const { categoryId, questions } = body as {
    categoryId: string
    questions: Array<{
      text: string
      propositionA: string
      propositionB: string
      propositionC: string
      propositionD: string
      correctAnswer: 'A' | 'B' | 'C' | 'D'
      explanation?: string
      difficulty?: string
    }>
  }
  if (!categoryId || !Array.isArray(questions) || !questions.length) {
    return NextResponse.json({ error: 'Format invalide' }, { status: 400 })
  }
  const created = await db.question.createMany({
    data: questions.map(q => ({
      text: q.text,
      propositionA: q.propositionA,
      propositionB: q.propositionB,
      propositionC: q.propositionC,
      propositionD: q.propositionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || null,
      difficulty: q.difficulty || 'MEDIUM',
      categoryId,
    })),
  })
  return NextResponse.json({ imported: created.count })
}
