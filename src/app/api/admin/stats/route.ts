import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'

// GET /api/admin/stats
export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth || auth.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  const totalPlayers = await db.user.count()
  const totalGames = await db.game.count()
  const totalQuestions = await db.question.count()
  const totalCategories = await db.category.count()

  // Win rate (overall)
  const aggWins = await db.user.aggregate({ _sum: { wins: true } })
  const aggGames = await db.user.aggregate({ _sum: { gamesPlayed: true } })
  const winRate = aggGames._sum.gamesPlayed ? Math.round((aggWins._sum.wins / aggGames._sum.gamesPlayed) * 100) : 0

  // Top categories (most questions answered)
  const questions = await db.question.findMany({ select: { categoryId: true, timesAnswered: true, timesCorrect: true, category: { select: { name: true } } } })
  const byCat = new Map<string, { name: string; answered: number; correct: number }>()
  for (const q of questions) {
    const cur = byCat.get(q.categoryId) || { name: q.category.name, answered: 0, correct: 0 }
    cur.answered += q.timesAnswered
    cur.correct += q.timesCorrect
    byCat.set(q.categoryId, cur)
  }
  const topCategories = Array.from(byCat.entries())
    .map(([id, v]) => ({ id, ...v, successRate: v.answered ? Math.round((v.correct / v.answered) * 100) : 0 }))
    .sort((a, b) => b.answered - a.answered)
    .slice(0, 10)

  // Hardest / easiest questions
  const sortedBySuccess = questions
    .filter(q => q.timesAnswered > 0)
    .map(q => ({ ...q, successRate: q.timesAnswered ? (q.timesCorrect / q.timesAnswered) * 100 : 0 }))
  const hardest = sortedBySuccess.sort((a, b) => a.successRate - b.successRate).slice(0, 5)
  const easiest = sortedBySuccess.sort((a, b) => b.successRate - a.successRate).slice(0, 5)

  return NextResponse.json({
    totalPlayers,
    totalGames,
    totalQuestions,
    totalCategories,
    winRate,
    topCategories,
    hardest,
    easiest,
  })
}
