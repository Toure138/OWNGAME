import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { guarded, requireAuth, ok, fail, notFound } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/games?id=… — détail d'une partie terminée, réservé à ses joueurs.
export const GET = guarded(async (req: NextRequest) => {
  const auth = requireAuth(req)
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return fail('Paramètre « id » requis', 400)

  const game = await db.game.findUnique({
    where: { id },
    include: {
      playerA: { select: { id: true, pseudo: true, avatarUrl: true, country: true, level: true } },
      playerB: { select: { id: true, pseudo: true, avatarUrl: true, country: true, level: true } },
    },
  })
  if (!game) return notFound('Partie introuvable')
  if (game.playerAId !== auth.userId && game.playerBId !== auth.userId && auth.role !== 'ADMIN') {
    return fail('Accès refusé', 403)
  }

  let questions: unknown = []
  try {
    questions = JSON.parse(game.questionsData)
  } catch {
    questions = []
  }

  return ok({ game: { ...game, questionsData: undefined, questions } })
})

// POST /api/games est volontairement absent.
//
// Les parties sont enregistrées par le serveur lui-même, à la clôture de la
// session temps réel (`lib/game-persistence.ts`). Laisser un client déclarer
// son propre score reviendrait à lui permettre d'inventer ses statistiques ;
// par ailleurs, les deux joueurs recevant l'événement de fin, l'ancienne
// implémentation créait deux enregistrements pour une même partie.
export const POST = guarded(async () =>
  fail(
    'Les parties sont enregistrées automatiquement par le serveur à la fin du match',
    405
  )
)
