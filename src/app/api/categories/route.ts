import { db } from '@/lib/db'
import { route, ok } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/categories — catégories et nombre de questions disponibles.
// Le compte permet au salon de griser les catégories trop peu fournies.
export const GET = route(async () => {
  const cats = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { questions: true } } },
  })
  return ok({
    categories: cats.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      color: c.color,
      questionCount: c._count.questions,
    })),
  })
})
