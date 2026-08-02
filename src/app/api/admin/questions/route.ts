import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

function requireAdmin(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth) return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  if (auth.role !== 'ADMIN') return { error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  return { auth }
}

// GET /api/admin/questions
export async function GET(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('categoryId') || undefined
  const q = url.searchParams.get('q') || ''
  const questions = await db.question.findMany({
    where: {
      AND: [
        categoryId ? { categoryId } : {},
        q ? { text: { contains: q } } : {},
      ],
    },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ questions })
}

// POST /api/admin/questions (create)
export async function POST(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const body = await req.json()
  const { text, propositionA, propositionB, propositionC, propositionD, correctAnswer, explanation, difficulty, categoryId } = body
  if (!text || !propositionA || !propositionB || !propositionC || !propositionD || !correctAnswer || !categoryId) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }
  const q = await db.question.create({
    data: {
      text, propositionA, propositionB, propositionC, propositionD,
      correctAnswer, explanation: explanation || null,
      difficulty: difficulty || 'MEDIUM', categoryId,
    },
  })
  return NextResponse.json({ question: q })
}

// PATCH /api/admin/questions?id=...
export async function PATCH(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  const body = await req.json()
  const allowed: any = {}
  for (const k of ['text', 'propositionA', 'propositionB', 'propositionC', 'propositionD', 'correctAnswer', 'explanation', 'difficulty', 'categoryId']) {
    if (body[k] !== undefined) allowed[k] = body[k]
  }
  const q = await db.question.update({ where: { id }, data: allowed })
  return NextResponse.json({ question: q })
}

// DELETE /api/admin/questions?id=...
export async function DELETE(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  await db.question.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
