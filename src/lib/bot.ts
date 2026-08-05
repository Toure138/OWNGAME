// Adversaire artificiel.
//
// Le salon est souvent vide — c'est la situation normale d'un jeu qui démarre,
// pas une anomalie. Un joueur seul doit pouvoir jouer immédiatement.
//
// Ce que l'ordinateur ne fait pas : consulter la bonne réponse. Un adversaire
// omniscient qu'on brident ensuite au hasard produit un jeu sans texture — il
// se trompe de façon uniforme, jamais sur ce qui est réellement difficile. Ici
// la probabilité de réussite dépend du profil ET du palier académique de la
// question, et le mauvais choix est tiré parmi les distracteurs comme le ferait
// un joueur hésitant. Le temps de réponse suit une loi normale tronquée : un
// adversaire qui répondrait toujours en 4,0 s se remarque en deux questions.

import { DEGREE_CODES } from './academic.mjs'

export type BotProfileCode = 'NOVICE' | 'AMATEUR' | 'EXPERT' | 'CHAMPION'
export type Choice = 'A' | 'B' | 'C' | 'D'

export interface BotProfile {
  code: BotProfileCode
  name: string
  /** Décrit le profil au joueur, avant de lancer la partie. */
  description: string
  /** Niveau affiché dans le salon et sur le plateau. */
  level: number
  /** Probabilité de bonne réponse sur une question de niveau CEP. */
  baseAccuracy: number
  /**
   * Perte de justesse par palier académique franchi. Un champion encaisse mieux
   * la montée en difficulté qu'un novice : c'est ce qui distingue vraiment les
   * profils sur un examen de doctorat.
   */
  accuracyDecay: number
  /** Temps de réponse moyen, en secondes, et son écart-type. */
  meanTime: number
  timeSpread: number
}

export const BOT_PROFILES: BotProfile[] = [
  {
    code: 'NOVICE',
    name: 'Novice',
    description: 'Hésitant et lent. Pour découvrir le jeu sans pression.',
    level: 2,
    baseAccuracy: 0.62,
    accuracyDecay: 0.075,
    meanTime: 11,
    timeSpread: 3.5,
  },
  {
    code: 'AMATEUR',
    name: 'Amateur',
    description: 'Solide sur les bases, en difficulté au-delà du bac.',
    level: 7,
    baseAccuracy: 0.76,
    accuracyDecay: 0.065,
    meanTime: 8.5,
    timeSpread: 3,
  },
  {
    code: 'EXPERT',
    name: 'Expert',
    description: 'Rapide et rarement pris en défaut. Il faudra être précis.',
    level: 15,
    baseAccuracy: 0.86,
    accuracyDecay: 0.05,
    meanTime: 6,
    timeSpread: 2.2,
  },
  {
    code: 'CHAMPION',
    name: 'Champion',
    description: 'Le sommet : très peu d’erreurs, y compris au doctorat.',
    level: 25,
    baseAccuracy: 0.93,
    accuracyDecay: 0.035,
    meanTime: 4.5,
    timeSpread: 1.6,
  },
]

export const DEFAULT_BOT: BotProfileCode = 'AMATEUR'

export function getBotProfile(code: string | null | undefined): BotProfile {
  return BOT_PROFILES.find(p => p.code === code) || BOT_PROFILES[1]
}

/** Identifiant interne de l'adversaire artificiel, jamais présent en base. */
export function botUserId(code: BotProfileCode) {
  return `bot:${code}`
}

export function isBotId(userId: string) {
  return userId.startsWith('bot:')
}

/** Loi normale centrée réduite (Box-Muller). */
function gaussian() {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export interface BotDecision {
  /** `null` si l'ordinateur laisse le temps s'écouler — cela lui arrive. */
  choice: Choice | null
  /** Délai avant de répondre, en millisecondes. */
  delayMs: number
  correct: boolean
}

/**
 * Décide de la réponse de l'ordinateur à une question.
 *
 * @param correct       lettre de la bonne réponse
 * @param academicLevel palier de la question (CEP … DOCTORAT)
 * @param timerSeconds  temps imparti
 */
export function decide(
  profile: BotProfile,
  correct: Choice,
  academicLevel: string | null | undefined,
  timerSeconds: number
): BotDecision {
  const levelIndex = Math.max(0, (DEGREE_CODES as string[]).indexOf(academicLevel || 'BAC'))
  const accuracy = Math.min(
    0.97,
    Math.max(0.18, profile.baseAccuracy - levelIndex * profile.accuracyDecay)
  )
  const isCorrect = Math.random() < accuracy

  // Le temps de réponse s'allonge avec la difficulté : même juste, l'ordinateur
  // « réfléchit » plus longtemps sur une question de master.
  const mean = profile.meanTime * (1 + levelIndex * 0.09) + (isCorrect ? 0 : 1.8)
  const raw = mean + gaussian() * profile.timeSpread
  // Jamais avant 1,2 s — une réponse instantanée serait perçue comme une
  // tricherie — ni au-delà du temps imparti.
  const seconds = Math.min(timerSeconds - 0.4, Math.max(1.2, raw))

  // Il arrive qu'aucune réponse ne vienne, mais seulement quand l'ordinateur se
  // trompait de toute façon : un blanc sur une question qu'il « savait » serait
  // incohérent.
  const givesUp = !isCorrect && Math.random() < 0.08

  const letters: Choice[] = ['A', 'B', 'C', 'D']
  const distractors = letters.filter(l => l !== correct)

  return {
    choice: givesUp ? null : isCorrect ? correct : distractors[Math.floor(Math.random() * 3)],
    delayMs: Math.round((givesUp ? timerSeconds + 0.5 : seconds) * 1000),
    correct: isCorrect && !givesUp,
  }
}
