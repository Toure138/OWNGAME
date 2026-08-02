// Catalogue des catégories et agrégation de la banque de questions.
// Ce module est du JavaScript pur : il est consommé aussi bien par le seed
// exécuté en production sur Render que par les scripts de vérification.

import { MATHEMATIQUES, PHYSIQUE, CHIMIE, BIOLOGIE } from './questions/sciences.mjs'
import { SCIENCES_TERRE, INFORMATIQUE, INTELLIGENCE_ARTIFICIELLE, TELECOMMUNICATIONS } from './questions/tech.mjs'
import { HISTOIRE, GEOGRAPHIE, POLITIQUE, ECONOMIE } from './questions/societe.mjs'
import { CULTURE_GENERALE, SPORT, CINEMA, MUSIQUE } from './questions/culture.mjs'
import { LITTERATURE, TECHNOLOGIE, SANTE, ENVIRONNEMENT } from './questions/savoirs.mjs'

const DIFFICULTIES = { E: 'EASY', M: 'MEDIUM', H: 'HARD' }

/**
 * Métadonnées des catégories. `slug` sert d'identifiant stable côté seed,
 * `name` est la valeur unique stockée en base.
 */
export const CATEGORIES = [
  { slug: 'mathematiques', name: 'Mathématiques', icon: 'Calculator', color: '#ef4444', description: 'Algèbre, géométrie, analyse', questions: MATHEMATIQUES },
  { slug: 'physique', name: 'Physique', icon: 'Atom', color: '#f97316', description: 'Mécanique, électricité, optique', questions: PHYSIQUE },
  { slug: 'chimie', name: 'Chimie', icon: 'FlaskConical', color: '#eab308', description: 'Chimie organique et inorganique', questions: CHIMIE },
  { slug: 'biologie', name: 'Biologie', icon: 'Dna', color: '#22c55e', description: 'Cellules, génétique, évolution', questions: BIOLOGIE },
  { slug: 'sciences-terre', name: 'Sciences de la Terre', icon: 'Globe', color: '#14b8a6', description: 'Géologie, climat, océans', questions: SCIENCES_TERRE },
  { slug: 'informatique', name: 'Informatique', icon: 'Cpu', color: '#06b6d4', description: 'Programmation, algorithmes, réseaux', questions: INFORMATIQUE },
  { slug: 'ia', name: 'Intelligence artificielle', icon: 'BrainCircuit', color: '#3b82f6', description: 'Machine learning, deep learning, LLM', questions: INTELLIGENCE_ARTIFICIELLE },
  { slug: 'telecoms', name: 'Télécommunications', icon: 'Radio', color: '#8b5cf6', description: 'Réseaux mobiles, fibre, satellites', questions: TELECOMMUNICATIONS },
  { slug: 'histoire', name: 'Histoire', icon: 'Landmark', color: '#ec4899', description: 'Antiquité, Moyen Âge, époque moderne', questions: HISTOIRE },
  { slug: 'geographie', name: 'Géographie', icon: 'Map', color: '#f43f5e', description: 'Pays, capitales, reliefs', questions: GEOGRAPHIE },
  { slug: 'politique', name: 'Politique', icon: 'Scale', color: '#84cc16', description: 'Institutions, doctrines, relations internationales', questions: POLITIQUE },
  { slug: 'economie', name: 'Économie', icon: 'TrendingUp', color: '#f59e0b', description: 'Macroéconomie, finance, marchés', questions: ECONOMIE },
  { slug: 'culture-generale', name: 'Culture générale', icon: 'BookOpen', color: '#10b981', description: 'Savoirs transversaux', questions: CULTURE_GENERALE },
  { slug: 'sport', name: 'Sport', icon: 'Trophy', color: '#0891b2', description: 'Football, Jeux olympiques, records', questions: SPORT },
  { slug: 'cinema', name: 'Cinéma', icon: 'Clapperboard', color: '#7c3aed', description: 'Films, réalisateurs, récompenses', questions: CINEMA },
  { slug: 'musique', name: 'Musique', icon: 'Music', color: '#db2777', description: 'Genres, artistes, instruments', questions: MUSIQUE },
  { slug: 'litterature', name: 'Littérature', icon: 'BookMarked', color: '#92400e', description: 'Romans, auteurs, courants', questions: LITTERATURE },
  { slug: 'technologie', name: 'Technologie', icon: 'Rocket', color: '#0284c7', description: 'Innovations, espace, industrie', questions: TECHNOLOGIE },
  { slug: 'sante', name: 'Santé', icon: 'HeartPulse', color: '#dc2626', description: 'Médecine, nutrition, prévention', questions: SANTE },
  { slug: 'environnement', name: 'Environnement', icon: 'Leaf', color: '#16a34a', description: 'Climat, biodiversité, énergies', questions: ENVIRONNEMENT },
]

const LETTERS = ['A', 'B', 'C', 'D']

/** Hachage stable (FNV-1a 32 bits) d'une chaîne, utilisé comme graine de permutation. */
function hash32(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * Les questions sont rédigées avec la bonne réponse souvent en position B.
 * On applique une permutation déterministe des quatre propositions, dérivée de
 * l'énoncé : la répartition A/B/C/D devient équilibrée, et le résultat reste
 * identique d'un seed à l'autre (idempotence du peuplement de la base).
 */
function permuteFor(text) {
  const order = [0, 1, 2, 3]
  let seed = hash32(text)
  // Mélange de Fisher-Yates piloté par un générateur congruentiel linéaire.
  // On consomme les bits de poids fort : ceux de poids faible d'un LCG ont une
  // période très courte et produiraient une répartition A/B/C/D déséquilibrée.
  for (let i = order.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const j = (seed >>> 16) % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/**
 * Convertit un tuple compact en objet exploitable par Prisma.
 * Tuple : [énoncé, A, B, C, D, bonneRéponse, difficulté, explication?]
 */
export function toQuestion(tuple, categoryName) {
  const [text, a, b, c, d, correct, difficulty, explanation] = tuple
  const source = [a, b, c, d]
  const correctIndex = LETTERS.indexOf(correct)
  const order = permuteFor(text)
  const shuffled = order.map(i => source[i])
  return {
    text,
    propositionA: shuffled[0],
    propositionB: shuffled[1],
    propositionC: shuffled[2],
    propositionD: shuffled[3],
    correctAnswer: LETTERS[order.indexOf(correctIndex)],
    difficulty: DIFFICULTIES[difficulty] || 'MEDIUM',
    explanation: explanation || null,
    categoryName,
  }
}

/** Retourne toutes les questions de la banque, aplaties. */
export function getAllQuestions() {
  const all = []
  for (const cat of CATEGORIES) {
    for (const tuple of cat.questions) {
      all.push(toQuestion(tuple, cat.name))
    }
  }
  return all
}

/** Statistiques de la banque, utilisées par les scripts de vérification. */
export function bankStats() {
  const perCategory = CATEGORIES.map(c => ({ name: c.name, count: c.questions.length }))
  return {
    categories: CATEGORIES.length,
    total: perCategory.reduce((sum, c) => sum + c.count, 0),
    perCategory,
  }
}
