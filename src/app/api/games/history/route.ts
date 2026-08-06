import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getBotProfile } from '@/lib/bot'
import { getDegree } from '@/lib/academic.mjs'
import { guarded, requireAuth, ok } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Adversaire d'affichage pour les parties sans second compte. */
function virtualOpponent(mode: string, botProfile: string | null, examLevel: string | null) {
  if (mode === 'EXAM') {
    const degree = getDegree(examLevel)
    return {
      id: `jury:${examLevel}`,
      pseudo: degree ? `Jury — ${degree.name}` : 'Jury',
      avatarUrl: null,
      country: degree?.school ?? 'Examen',
      level: 0,
    }
  }
  const profile = getBotProfile(botProfile)
  return {
    id: `bot:${profile.code}`,
    pseudo: `Ordinateur — ${profile.name}`,
    avatarUrl: null,
    country: 'Machine',
    level: profile.level,
  }
}

// GET /api/games/history?outcome=WIN|LOSS|DRAW&limit=…
export const GET = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const url = new URL(req.url)
  const outcomeFilter = url.searchParams.get('outcome')
  const requested = parseInt(url.searchParams.get('limit') || '100', 10)
  const take = Math.min(Math.max(Number.isFinite(requested) ? requested : 100, 1), 200)

  const games = await db.game.findMany({
    where: { OR: [{ playerAId: auth.userId }, { playerBId: auth.userId }] },
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      playerA: { select: { id: true, pseudo: true, avatarUrl: true, country: true, level: true } },
      playerB: { select: { id: true, pseudo: true, avatarUrl: true, country: true, level: true } },
    },
  })

  const mapped = games.map(g => {
    const isPlayerA = g.playerAId === auth.userId
    // `playerB` est nul en solo et en examen : l'adversaire est alors décrit
    // par le mode de jeu, pas par un compte.
    const opponent =
      (isPlayerA ? g.playerB : g.playerA) ??
      virtualOpponent(g.mode, g.botProfile, g.examLevel)
    // En examen le candidat traite toutes les questions ; en duel et en solo,
    // chaque camp en traite la moitié.
    const myQuestions =
      g.mode === 'EXAM' ? g.totalQuestions : Math.round(g.totalQuestions / 2)

    let outcome: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW'
    if (g.mode === 'EXAM') {
      outcome = g.passed ? 'WIN' : 'LOSS'
    } else if (g.winnerId === auth.userId) {
      outcome = 'WIN'
    } else if (g.winnerId) {
      outcome = 'LOSS'
    } else if (g.mode === 'SOLO') {
      // L'ordinateur n'a pas d'identifiant : sa victoire se lit aux scores.
      if (g.scoreB > g.scoreA) outcome = 'LOSS'
      else if (g.scoreA > g.scoreB) outcome = 'WIN'
    }

    return {
      id: g.id,
      date: g.createdAt,
      finishedAt: g.finishedAt,
      status: g.status,
      mode: g.mode,
      botProfile: g.botProfile,
      examLevel: g.examLevel,
      passed: g.passed,
      mention: g.mention,
      outcome,
      forfeit: g.forfeit,
      categoryFilter: g.categoryFilter,
      totalQuestions: g.totalQuestions,
      myQuestions,
      myScore: isPlayerA ? g.scoreA : g.scoreB,
      oppScore: isPlayerA ? g.scoreB : g.scoreA,
      myCorrect: isPlayerA ? g.correctA : g.correctB,
      oppCorrect: isPlayerA ? g.correctB : g.correctA,
      myAvgTime: isPlayerA ? g.avgTimeA : g.avgTimeB,
      oppAvgTime: isPlayerA ? g.avgTimeB : g.avgTimeA,
      opponent,
    }
  })

  const games2 = outcomeFilter ? mapped.filter(g => g.outcome === outcomeFilter) : mapped

  // Le taux de victoire ne porte que sur les parties disputées contre un
  // adversaire. Un examen ajourné n'est pas une défaite : le compter comme
  // telle ferait chuter le taux de victoire d'un joueur qui révise.
  const matches = mapped.filter(g => g.mode !== 'EXAM')
  const exams = mapped.filter(g => g.mode === 'EXAM')

  const wins = matches.filter(g => g.outcome === 'WIN').length
  const losses = matches.filter(g => g.outcome === 'LOSS').length
  const draws = matches.filter(g => g.outcome === 'DRAW').length

  // La justesse, elle, a du sens sur tout l'historique : une question est une
  // question, qu'elle vienne d'un duel ou d'une épreuve.
  const totalCorrect = mapped.reduce((s, g) => s + g.myCorrect, 0)
  const totalAnswered = mapped.reduce((s, g) => s + g.myQuestions, 0)
  const timed = mapped.filter(g => g.myAvgTime > 0)

  return ok({
    games: games2,
    stats: {
      total: mapped.length,
      matches: matches.length,
      duels: matches.filter(g => g.mode === 'DUEL').length,
      solo: matches.filter(g => g.mode === 'SOLO').length,
      wins,
      losses,
      draws,
      winRate: matches.length ? Math.round((wins / matches.length) * 100) : 0,
      exams: {
        taken: exams.length,
        passed: exams.filter(g => g.passed).length,
      },
      accuracy: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
      avgTime: timed.length
        ? Math.round(timed.reduce((s, g) => s + g.myAvgTime, 0) / timed.length)
        : 0,
      bestScore: mapped.reduce((max, g) => Math.max(max, g.myScore), 0),
    },
  })
})
