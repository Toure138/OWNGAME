import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

// GET /api/categories
export async function GET() {
  const cats = await db.category.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ categories: cats })
}
