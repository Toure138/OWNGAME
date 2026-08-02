import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { guarded, requireAdmin, parseBody, ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createSchema = z.object({
  name: z.string().trim().min(2, '2 caractères minimum').max(60),
  description: z.string().trim().max(200).nullable().optional(),
  icon: z.string().trim().max(40).nullable().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'couleur hexadécimale attendue, ex. #ef4444')
    .nullable()
    .optional(),
})

const updateSchema = createSchema.partial()

// GET /api/admin/categories
export const GET = guarded(async (req: NextRequest) => {
  requireAdmin(req)
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { questions: true } } },
  })
  return ok({
    categories: categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      color: c.color,
      createdAt: c.createdAt,
      questionCount: c._count.questions,
    })),
  })
})

// POST /api/admin/categories
export const POST = guarded(async (req: NextRequest) => {
  requireAdmin(req)
  const body = await parseBody(req, createSchema)

  const existing = await db.category.findUnique({ where: { name: body.name } })
  if (existing) return fail('Une catégorie porte déjà ce nom', 409)

  const category = await db.category.create({
    data: {
      name: body.name,
      description: body.description || null,
      icon: body.icon || null,
      color: body.color || null,
    },
  })
  return ok({ category }, { status: 201 })
})

// PATCH /api/admin/categories?id=…
export const PATCH = guarded(async (req: NextRequest) => {
  requireAdmin(req)
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return fail('Paramètre « id » requis', 400)

  const body = await parseBody(req, updateSchema)
  if (!Object.keys(body).length) return fail('Aucune modification fournie', 400)

  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) return fail('Catégorie introuvable', 404)

  if (body.name && body.name !== existing.name) {
    const duplicate = await db.category.findUnique({ where: { name: body.name } })
    if (duplicate) return fail('Une catégorie porte déjà ce nom', 409)
  }

  const category = await db.category.update({ where: { id }, data: body })
  return ok({ category })
})

// DELETE /api/admin/categories?id=…&force=true
export const DELETE = guarded(async (req: NextRequest) => {
  requireAdmin(req)
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const force = url.searchParams.get('force') === 'true'
  if (!id) return fail('Paramètre « id » requis', 400)

  const existing = await db.category.findUnique({ where: { id } })
  if (!existing) return fail('Catégorie introuvable', 404)

  const count = await db.question.count({ where: { categoryId: id } })
  if (count > 0 && !force) {
    return fail(
      `Cette catégorie contient ${count} question(s). Ajoutez « force=true » pour la supprimer avec ses questions.`,
      409,
      { questionCount: count }
    )
  }

  // Les questions sont supprimées en cascade (onDelete: Cascade au schéma).
  await db.category.delete({ where: { id } })
  return ok({ ok: true, deleted: id, deletedQuestions: count })
})
