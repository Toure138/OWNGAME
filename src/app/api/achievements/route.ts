import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { guarded, requireAuth, ok } from '@/lib/api'
import { ALL_ACHIEVEMENTS } from '@/lib/game-persistence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/achievements — succès du joueur, verrouillés comme débloqués.
export const GET = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const unlocked = await db.achievement.findMany({
    where: { userId: auth.userId },
    orderBy: { unlockedAt: 'desc' },
  })
  const byCode = new Map(unlocked.map(a => [a.code, a]))

  const achievements = ALL_ACHIEVEMENTS.map(a => ({
    code: a.code,
    name: a.name,
    description: a.description,
    unlocked: byCode.has(a.code),
    unlockedAt: byCode.get(a.code)?.unlockedAt ?? null,
  }))

  return ok({
    achievements,
    unlockedCount: unlocked.length,
    totalCount: ALL_ACHIEVEMENTS.length,
  })
})
