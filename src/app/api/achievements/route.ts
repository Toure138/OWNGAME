import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

// GET /api/achievements
export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const list = await db.achievement.findMany({
    where: { userId: auth.userId },
    orderBy: { unlockedAt: 'desc' },
  })
  // All possible achievements (for display of locked ones)
  const ALL = [
    { code: 'FIRST_GAME', name: 'Première partie', description: 'Vous avez joué votre première partie' },
    { code: 'FIRST_WIN', name: 'Première victoire', description: 'Vous avez remporté votre première partie' },
    { code: 'FIVE_WINS', name: 'Cinq victoires', description: 'Vous avez gagné 5 parties' },
    { code: 'TEN_WINS', name: 'Dix victoires', description: 'Vous avez gagné 10 parties' },
    { code: 'LEVEL_5', name: 'Niveau 5', description: 'Vous avez atteint le niveau 5' },
    { code: 'LEVEL_10', name: 'Niveau 10', description: 'Vous avez atteint le niveau 10' },
  ]
  const unlocked = new Set(list.map(a => a.code))
  return NextResponse.json({
    achievements: ALL.map(a => ({
      ...a,
      unlocked: unlocked.has(a.code),
      unlockedAt: list.find(x => x.code === a.code)?.unlockedAt || null,
    })),
  })
}
