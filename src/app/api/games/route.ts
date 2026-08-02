import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/games  -> create a finished game record (called by client when game finishes)
export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const body = await req.json()
  const {
    playerAId, playerBId, categoryFilter, questionsData,
    scoreA, scoreB, correctA, correctB, avgTimeA, avgTimeB, winnerId,
  } = body as any
  if (!playerAId || !playerBId) return NextResponse.json({ error: 'Joueurs manquants' }, { status: 400 })

  const game = await db.game.create({
    data: {
      playerAId, playerBId, categoryFilter: categoryFilter || null,
      questionsData: JSON.stringify(questionsData || []),
      status: 'FINISHED',
      scoreA: scoreA || 0, scoreB: scoreB || 0,
      correctA: correctA || 0, correctB: correctB || 0,
      avgTimeA: avgTimeA || 0, avgTimeB: avgTimeB || 0,
      winnerId: winnerId || null,
      startedAt: new Date(Date.now() - 60 * 1000),
      finishedAt: new Date(),
    },
  })

  // Update stats for both players
  for (const [pid, won, lost, score, correct] of [
    [playerAId, winnerId === playerAId, winnerId && winnerId !== playerAId, scoreA, correctA],
    [playerBId, winnerId === playerBId, winnerId && winnerId !== playerBId, scoreB, correctB],
  ] as any[]) {
    const u = await db.user.findUnique({ where: { id: pid } })
    if (!u) continue
    const newWins = u.wins + (won ? 1 : 0)
    const newLosses = u.losses + (lost ? 1 : 0)
    const newXp = u.xp + (won ? 150 : 50) + (correct || 0) * 10
    const newLevel = Math.max(1, Math.floor(newXp / 500) + 1)
    await db.user.update({
      where: { id: pid },
      data: {
        gamesPlayed: { increment: 1 },
        wins: newWins,
        losses: newLosses,
        totalScore: { increment: score || 0 },
        xp: newXp,
        level: newLevel,
      },
    })

    // Create notifications
    await db.notification.create({
      data: {
        userId: pid,
        type: won ? 'GAME_WON' : (lost ? 'GAME_LOST' : 'GAME_DRAW'),
        title: won ? 'Victoire !' : (lost ? 'Défaite' : 'Match nul'),
        body: `Score final: ${pid === playerAId ? scoreA : scoreB} - ${pid === playerAId ? scoreB : scoreA}`,
      },
    })

    // Achievement checks
    await grantAchievements(pid, newWins, newLevel)
  }

  return NextResponse.json({ game })
}

async function grantAchievements(userId: string, wins: number, level: number) {
  const existing = await db.achievement.findMany({ where: { userId } })
  const have = new Set(existing.map(a => a.code))
  const toCreate: any[] = []
  const check = (code: string, name: string, desc: string, cond: boolean) => {
    if (cond && !have.has(code)) toCreate.push({ userId, code, name, description: desc })
  }
  check('FIRST_GAME', 'Première partie', 'Vous avez joué votre première partie', true)
  check('FIRST_WIN', 'Première victoire', 'Vous avez remporté votre première partie', wins >= 1)
  check('FIVE_WINS', 'Cinq victoires', 'Vous avez gagné 5 parties', wins >= 5)
  check('TEN_WINS', 'Dix victoires', 'Vous avez gagné 10 parties', wins >= 10)
  check('LEVEL_5', 'Niveau 5', 'Vous avez atteint le niveau 5', level >= 5)
  check('LEVEL_10', 'Niveau 10', 'Vous avez atteint le niveau 10', level >= 10)
  if (toCreate.length) {
    await db.achievement.createMany({ data: toCreate, skipDuplicates: true })
    for (const a of toCreate) {
      await db.notification.create({
        data: {
          userId,
          type: 'ACHIEVEMENT',
          title: 'Succès débloqué',
          body: `${a.name} — ${a.description}`,
        },
      })
    }
  }
}
