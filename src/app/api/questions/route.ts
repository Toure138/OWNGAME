import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET /api/questions?categoryId=...&limit=...
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('categoryId') || undefined
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)
  const questions = await db.question.findMany({
    where: categoryId ? { categoryId } : undefined,
    take: Math.min(limit, 200),
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ questions })
}
