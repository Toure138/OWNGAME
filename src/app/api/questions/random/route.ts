import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET /api/questions/random?categoryId=...&limit=20
// Returns `limit` random questions. If categoryId is omitted, mix all categories.
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('categoryId') || undefined
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 50)

  // SQLite doesn't support Prisma's native random ordering, so we fetch a pool and shuffle.
  const pool = await db.question.findMany({
    where: categoryId ? { categoryId } : undefined,
    take: 200,
    include: { category: true },
  })
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const picked = pool.slice(0, limit)
  return NextResponse.json({
    questions: picked.map(q => ({
      id: q.id,
      text: q.text,
      propositionA: q.propositionA,
      propositionB: q.propositionB,
      propositionC: q.propositionC,
      propositionD: q.propositionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      categoryId: q.categoryId,
      categoryName: q.category.name,
      difficulty: q.difficulty,
    })),
  })
}
