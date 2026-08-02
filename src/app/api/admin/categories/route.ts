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

// GET /api/admin/categories
export async function GET(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const cats = await db.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { questions: true } } } })
  return NextResponse.json({ categories: cats })
}

// POST /api/admin/categories
export async function POST(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const body = await req.json()
  const { name, description, icon, color } = body
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  const c = await db.category.create({ data: { name, description: description || null, icon: icon || null, color: color || null } })
  return NextResponse.json({ category: c })
}

// PATCH /api/admin/categories?id=...
export async function PATCH(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  const body = await req.json()
  const allowed: any = {}
  for (const k of ['name', 'description', 'icon', 'color']) {
    if (body[k] !== undefined) allowed[k] = body[k]
  }
  const c = await db.category.update({ where: { id }, data: allowed })
  return NextResponse.json({ category: c })
}

// DELETE /api/admin/categories?id=...
export async function DELETE(req: NextRequest) {
  const guard = requireAdmin(req)
  if ('error' in guard) return guard.error
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  // Check if category has questions
  const count = await db.question.count({ where: { categoryId: id } })
  if (count > 0) {
    return NextResponse.json({ error: `Impossible: ${count} questions associées` }, { status: 400 })
  }
  await db.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
