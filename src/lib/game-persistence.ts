import { db } from './db'
import { DEGREE_CODES, degreeIndex, getDegree, xpForDegree } from './academic.mjs'

// Persistance d'une partie terminée.
//
// Auparavant, chaque client appelait POST /api/games à la fin d'une partie.
// Deux clients recevant l'événement de fin, la partie était enregistrée deux
// fois — et sans en-tête d'autorisation, l'appel échouait en 401, si bien
// qu'aucune partie n'était réellement sauvegardée. La source de vérité est
// désormais le serveur : le moteur temps réel appelle cette fonction une seule
// fois, à la clôture de la session.

export interface PersistQuestion {
  index: number
  questionId: string
  text: string
  propositions: { A: string; B: string; C: string; D: string }
  correct: 'A' | 'B' | 'C' | 'D'
  chosen: 'A' | 'B' | 'C' | 'D' | null
  answeredBy: 'A' | 'B'
  correctA: boolean | null
  correctB: boolean | null
  explanation?: string | null
  responseTime?: number
}

export interface PersistPayload {
  mode: 'DUEL' | 'SOLO' | 'EXAM'
  /** Profil de l'ordinateur affronté, en solo. */
  botProfile: string | null
  /** Diplôme visé, en examen. */
  examLevel: string | null
  passed: boolean | null
  mention: string | null
  /** Pourcentage de bonnes réponses du joueur A — sert de note d'examen. */
  percent: number
  /**
   * Camp vainqueur. Désigné par le côté et non par un identifiant : en solo,
   * l'ordinateur gagne sans avoir de compte, et sa victoire doit malgré tout
   * compter comme une défaite pour le joueur.
   */
  outcome: 'A' | 'B' | 'DRAW'
  playerAId: string
  /** Nul en solo et en examen. */
  playerBId: string | null
  categoryFilter: string | null
  questions: PersistQuestion[]
  totalQuestions: number
  scoreA: number
  scoreB: number
  correctA: number
  correctB: number
  avgTimeA: number
  avgTimeB: number
  streakA: number
  streakB: number
  winnerId: string | null
  forfeit: boolean
  startedAt: Date
}

const ACHIEVEMENTS = [
  { code: 'FIRST_GAME', name: 'Première partie', description: 'Jouer sa première partie' },
  { code: 'FIRST_WIN', name: 'Première victoire', description: 'Remporter sa première partie' },
  { code: 'FIVE_WINS', name: 'Cinq victoires', description: 'Remporter 5 parties' },
  { code: 'TEN_WINS', name: 'Dix victoires', description: 'Remporter 10 parties' },
  { code: 'TWENTY_FIVE_WINS', name: 'Vingt-cinq victoires', description: 'Remporter 25 parties' },
  { code: 'LEVEL_5', name: 'Niveau 5', description: 'Atteindre le niveau 5' },
  { code: 'LEVEL_10', name: 'Niveau 10', description: 'Atteindre le niveau 10' },
  { code: 'LEVEL_20', name: 'Niveau 20', description: 'Atteindre le niveau 20' },
  { code: 'PERFECT_GAME', name: 'Sans faute', description: 'Répondre correctement à toutes ses questions' },
  { code: 'STREAK_5', name: 'Série de 5', description: 'Enchaîner 5 bonnes réponses' },
  { code: 'SPEEDSTER', name: 'Éclair', description: 'Terminer une partie avec moins de 5 s de moyenne' },
  { code: 'CENTURION', name: 'Centurion', description: 'Jouer 100 parties' },
  { code: 'FIRST_DIPLOMA', name: 'Premier diplôme', description: 'Décrocher son premier diplôme' },
  { code: 'BACHELIER', name: 'Bachelier', description: 'Obtenir le baccalauréat' },
  { code: 'DOCTEUR', name: 'Docteur', description: 'Obtenir le doctorat' },
  { code: 'CURSUS_COMPLET', name: 'Cursus complet', description: 'Obtenir les six diplômes' },
  { code: 'MAJOR_DE_PROMO', name: 'Major de promotion', description: 'Décrocher les félicitations du jury' },
  { code: 'MACHINE_SLAYER', name: 'Plus fort que la machine', description: 'Battre l’ordinateur en mode Champion' },
] as const

export const ALL_ACHIEVEMENTS = ACHIEVEMENTS

export function xpForLevel(level: number): number {
  return level * 500
}

export function levelForXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 500) + 1)
}

/**
 * Part de la victoire en solo dans la progression.
 *
 * Le classement se joue au `totalScore`, et l'ordinateur est disponible à
 * volonté : y verser les points d'une partie solo reviendrait à offrir le
 * sommet du classement à qui enchaîne les duels contre le profil Novice. Le
 * solo alimente donc l'expérience — la progression personnelle — mais pas le
 * classement. L'XP y est également minorée : le risque n'est pas le même que
 * face à un adversaire humain.
 */
const SOLO_XP_RATIO = 0.6

/** Enregistre la partie et met à jour les joueurs concernés. Résiste aux erreurs. */
export async function persistFinishedGame(payload: PersistPayload) {
  const {
    mode, botProfile, examLevel, passed, mention, percent, outcome,
    playerAId, playerBId, categoryFilter, questions, totalQuestions,
    scoreA, scoreB, correctA, correctB, avgTimeA, avgTimeB,
    streakA, streakB, forfeit, startedAt,
  } = payload

  // Seul un compte réel peut figurer comme vainqueur : en solo, la victoire de
  // l'ordinateur se lit dans `outcome`, pas dans cette colonne.
  const winnerId =
    outcome === 'A' ? playerAId : outcome === 'B' ? playerBId : null

  const game = await db.game.create({
    data: {
      playerAId,
      playerBId,
      mode,
      botProfile,
      examLevel,
      passed,
      mention,
      status: 'FINISHED',
      categoryFilter,
      questionsData: JSON.stringify(questions),
      totalQuestions,
      currentTurn: questions.length,
      scoreA, scoreB, correctA, correctB, avgTimeA, avgTimeB,
      winnerId,
      forfeit,
      startedAt,
      finishedAt: new Date(),
    },
  })

  await updateQuestionStats(questions)

  if (mode === 'EXAM') {
    await settleExam({
      userId: playerAId,
      degree: examLevel,
      passed: !!passed,
      mention,
      percent,
      score: scoreA,
      correct: correctA,
      total: questions.length,
      avgTime: avgTimeA,
      streak: streakA,
      forfeit,
    })
    return game
  }

  // En solo, seul le joueur humain est mis à jour : l'ordinateur n'a pas de
  // compte à faire progresser.
  const sides = [
    {
      userId: playerAId,
      side: 'A' as const,
      score: scoreA,
      correct: correctA,
      answered: questions.filter(q => q.answeredBy === 'A').length,
      avgTime: avgTimeA,
      streak: streakA,
      opponentScore: scoreB,
    },
    ...(playerBId
      ? [
          {
            userId: playerBId,
            side: 'B' as const,
            score: scoreB,
            correct: correctB,
            answered: questions.filter(q => q.answeredBy === 'B').length,
            avgTime: avgTimeB,
            streak: streakB,
            opponentScore: scoreA,
          },
        ]
      : []),
  ]

  for (const side of sides) {
    const won = outcome === side.side
    const drew = outcome === 'DRAW'
    const lost = !won && !drew

    const user = await db.user.findUnique({ where: { id: side.userId } })
    if (!user) continue

    const rawXp = (won ? 150 : drew ? 80 : 50) + side.correct * 10
    const gainedXp = mode === 'SOLO' ? Math.round(rawXp * SOLO_XP_RATIO) : rawXp
    const newXp = user.xp + gainedXp
    const newLevel = levelForXp(newXp)
    const newWins = user.wins + (won ? 1 : 0)
    const newGamesPlayed = user.gamesPlayed + 1

    await db.user.update({
      where: { id: side.userId },
      data: {
        gamesPlayed: newGamesPlayed,
        wins: newWins,
        losses: user.losses + (lost ? 1 : 0),
        draws: user.draws + (drew ? 1 : 0),
        totalScore: user.totalScore + (mode === 'SOLO' ? 0 : side.score),
        soloGames: user.soloGames + (mode === 'SOLO' ? 1 : 0),
        bestStreak: Math.max(user.bestStreak, side.streak),
        xp: newXp,
        level: newLevel,
      },
    })

    const opponent = mode === 'SOLO' ? 'l’ordinateur' : 'votre adversaire'
    await db.notification.create({
      data: {
        userId: side.userId,
        type: won ? 'GAME_WON' : drew ? 'GAME_DRAW' : 'GAME_LOST',
        title: won ? 'Victoire !' : drew ? 'Match nul' : 'Défaite',
        body:
          `Score final ${side.score} — ${side.opponentScore}` +
          `${forfeit ? ' (abandon)' : ''} face à ${opponent}. +${gainedXp} XP` +
          `${mode === 'SOLO' ? ' (partie solo : non comptée au classement)' : ''}.`,
      },
    })

    await grantAchievements({
      userId: side.userId,
      wins: newWins,
      level: newLevel,
      gamesPlayed: newGamesPlayed,
      perfect: side.answered > 0 && side.correct === side.answered && !forfeit,
      streak: side.streak,
      avgTime: side.avgTime,
      beatChampion: mode === 'SOLO' && won && botProfile === 'CHAMPION',
    })
  }

  return game
}

interface ExamSettlement {
  userId: string
  degree: string | null
  passed: boolean
  mention: string | null
  percent: number
  score: number
  correct: number
  total: number
  avgTime: number
  streak: number
  forfeit: boolean
}

/**
 * Conclut un examen : diplôme, mention, expérience et notification.
 *
 * Repasser un examen déjà réussi ne retire jamais rien — la mention n'est
 * remplacée que si la nouvelle est meilleure. Sans cette règle, un docteur
 * curieux de rejouer son CEP risquerait de dégrader son propre palmarès.
 */
async function settleExam(input: ExamSettlement) {
  const degree = getDegree(input.degree)
  if (!degree) return

  const user = await db.user.findUnique({ where: { id: input.userId } })
  if (!user) return

  const existing = await db.diploma.findUnique({
    where: { userId_degree: { userId: input.userId, degree: degree.code } },
  })

  if (input.passed) {
    const better = !existing || input.percent > existing.percent
    await db.diploma.upsert({
      where: { userId_degree: { userId: input.userId, degree: degree.code } },
      create: {
        userId: input.userId,
        degree: degree.code,
        mention: input.mention || 'PASSABLE',
        percent: input.percent,
        correct: input.correct,
        total: input.total,
        score: input.score,
        attempts: 1,
      },
      update: {
        attempts: { increment: 1 },
        ...(better
          ? {
              mention: input.mention || 'PASSABLE',
              percent: input.percent,
              correct: input.correct,
              total: input.total,
              score: input.score,
            }
          : {}),
      },
    })
  } else if (existing) {
    await db.diploma.update({
      where: { id: existing.id },
      data: { attempts: { increment: 1 } },
    })
  }

  // L'expérience n'est accordée qu'à la première obtention : les tentatives
  // suivantes visent la mention, pas le cumul de points.
  const firstTime = input.passed && !existing
  const gainedXp = firstTime
    ? xpForDegree(degree.code)
    : Math.round(input.correct * 10 * (input.passed ? 0.5 : 0.3))

  const diplomas = await db.diploma.findMany({
    where: { userId: input.userId },
    select: { degree: true, mention: true },
  })
  const highest = diplomas
    .map(d => d.degree)
    .reduce<string | null>(
      (best, code) => (degreeIndex(code) > degreeIndex(best) ? code : best),
      null
    )

  const newXp = user.xp + gainedXp
  await db.user.update({
    where: { id: input.userId },
    data: {
      xp: newXp,
      level: levelForXp(newXp),
      highestDegree: highest,
      examsPassed: diplomas.length,
      bestStreak: Math.max(user.bestStreak, input.streak),
    },
  })

  // Un diplômé qui repasse son examen ne risque rien : le lui dire évite de
  // laisser croire qu'un mauvais résultat lui retire son titre.
  const alreadyHeld = !!existing
  const title = input.passed
    ? firstTime
      ? `${degree.name} obtenu !`
      : `${degree.name} : examen repassé`
    : alreadyHeld
      ? `${degree.name} : diplôme conservé`
      : `${degree.name} : ajourné`

  let body
  if (input.passed && firstTime) {
    body = `${input.correct}/${input.total} — ${input.percent} %. ${
      input.mention ? mentionLabel(input.mention) : ''
    } +${gainedXp} XP.`
  } else if (input.passed && existing) {
    body = `${input.correct}/${input.total} — ${input.percent} %. ${
      input.percent > existing.percent
        ? `Nouvelle mention : ${mentionLabel(input.mention || 'PASSABLE')}`
        : `Votre meilleure mention reste ${mentionLabel(existing.mention)}`
    }`
  } else if (alreadyHeld) {
    body = `${input.correct}/${input.total} — ${input.percent} %, sous les ${degree.passRate} % exigés. Votre diplôme reste acquis.`
  } else {
    body = `${input.correct}/${input.total} — ${input.percent} %, il en fallait ${degree.passRate} %. Vous pouvez repasser l’examen quand vous voulez.`
  }

  await db.notification.create({
    data: {
      userId: input.userId,
      type: input.passed && firstTime ? 'ACHIEVEMENT' : 'INFO',
      title,
      body,
    },
  })

  await grantAchievements({
    userId: input.userId,
    wins: user.wins,
    level: levelForXp(newXp),
    gamesPlayed: user.gamesPlayed,
    perfect: false,
    streak: input.streak,
    avgTime: input.avgTime,
    diplomas: diplomas.map(d => d.degree),
    excellentMention: diplomas.some(d => d.mention === 'EXCELLENT'),
  })
}

function mentionLabel(code: string) {
  switch (code) {
    case 'EXCELLENT':
      return 'Félicitations du jury !'
    case 'TRES_BIEN':
      return 'Mention Très bien.'
    case 'BIEN':
      return 'Mention Bien.'
    case 'ASSEZ_BIEN':
      return 'Mention Assez bien.'
    default:
      return 'Mention Passable.'
  }
}

/** Met à jour les compteurs de réussite de chaque question jouée. */
async function updateQuestionStats(questions: PersistQuestion[]) {
  for (const q of questions) {
    if (!q.questionId) continue
    const answered = q.chosen !== null || q.correctA !== null || q.correctB !== null
    if (!answered) continue
    const wasCorrect = q.chosen === q.correct
    try {
      await db.question.update({
        where: { id: q.questionId },
        data: {
          timesAnswered: { increment: 1 },
          timesCorrect: { increment: wasCorrect ? 1 : 0 },
        },
      })
    } catch {
      // La question a pu être supprimée par un administrateur entre-temps.
    }
  }
}

interface AchievementContext {
  userId: string
  wins: number
  level: number
  gamesPlayed: number
  perfect: boolean
  streak: number
  avgTime: number
  /** Diplômes détenus, après règlement de l'examen. */
  diplomas?: string[]
  excellentMention?: boolean
  beatChampion?: boolean
}

async function grantAchievements(ctx: AchievementContext) {
  const existing = await db.achievement.findMany({
    where: { userId: ctx.userId },
    select: { code: true },
  })
  const have = new Set(existing.map(a => a.code))

  const conditions: Record<string, boolean> = {
    FIRST_GAME: true,
    FIRST_WIN: ctx.wins >= 1,
    FIVE_WINS: ctx.wins >= 5,
    TEN_WINS: ctx.wins >= 10,
    TWENTY_FIVE_WINS: ctx.wins >= 25,
    LEVEL_5: ctx.level >= 5,
    LEVEL_10: ctx.level >= 10,
    LEVEL_20: ctx.level >= 20,
    PERFECT_GAME: ctx.perfect,
    STREAK_5: ctx.streak >= 5,
    SPEEDSTER: ctx.avgTime > 0 && ctx.avgTime < 5000,
    CENTURION: ctx.gamesPlayed >= 100,
    FIRST_DIPLOMA: !!ctx.diplomas?.length,
    BACHELIER: !!ctx.diplomas?.includes('BAC'),
    DOCTEUR: !!ctx.diplomas?.includes('DOCTORAT'),
    CURSUS_COMPLET: (ctx.diplomas?.length ?? 0) >= DEGREE_CODES.length,
    MAJOR_DE_PROMO: !!ctx.excellentMention,
    MACHINE_SLAYER: !!ctx.beatChampion,
  }

  const toCreate = ACHIEVEMENTS.filter(a => conditions[a.code] && !have.has(a.code))
  if (!toCreate.length) return

  try {
    await db.achievement.createMany({
      data: toCreate.map(a => ({
        userId: ctx.userId,
        code: a.code,
        name: a.name,
        description: a.description,
      })),
    })
  } catch {
    // Contrainte d'unicité (userId, code) : le succès a déjà été accordé par
    // une partie terminée en parallèle. Rien à faire.
    return
  }

  await db.notification.createMany({
    data: toCreate.map(a => ({
      userId: ctx.userId,
      type: 'ACHIEVEMENT',
      title: 'Succès débloqué',
      body: `${a.name} — ${a.description}`,
    })),
  })
}
