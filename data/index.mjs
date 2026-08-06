// Catalogue des catégories et agrégation de la banque de questions.
// Ce module est du JavaScript pur : il est consommé aussi bien par le seed
// exécuté en production sur Render que par les scripts de vérification.

import { MATHEMATIQUES, PHYSIQUE, CHIMIE, BIOLOGIE } from './questions/sciences.mjs'
import { SCIENCES_TERRE, INFORMATIQUE, INTELLIGENCE_ARTIFICIELLE, TELECOMMUNICATIONS } from './questions/tech.mjs'
import { HISTOIRE, GEOGRAPHIE, POLITIQUE, ECONOMIE } from './questions/societe.mjs'
import { CULTURE_GENERALE, SPORT, CINEMA, MUSIQUE } from './questions/culture.mjs'
import { LITTERATURE, TECHNOLOGIE, SANTE, ENVIRONNEMENT } from './questions/savoirs.mjs'
import { AVANCE } from './questions/avance.mjs'
import { PALIERS } from './questions/paliers.mjs'
import { permuteFor } from './permute.mjs'
import { getGeneratedQuestions } from './generators/index.mjs'

const DIFFICULTIES = { E: 'EASY', M: 'MEDIUM', H: 'HARD' }

/**
 * Métadonnées des catégories. `slug` sert d'identifiant stable côté seed,
 * `name` est la valeur unique stockée en base.
 */
const BASE_CATEGORIES = [
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

/**
 * Catégories complétées par la banque avancée.
 *
 * Les questions de `avance.mjs` rejoignent leur catégorie d'origine plutôt que
 * d'en former une nouvelle : un joueur qui filtre sur « Physique » doit y
 * trouver aussi bien la question de niveau primaire que celle de doctorat.
 */
export const CATEGORIES = BASE_CATEGORIES.map(category => {
  const extra = [...(AVANCE[category.slug] || []), ...(PALIERS[category.slug] || [])]
  return extra.length ? { ...category, questions: [...category.questions, ...extra] } : category
})

const LETTERS = ['A', 'B', 'C', 'D']

/**
 * Convertit un tuple compact en objet exploitable par Prisma.
 *
 * Tuple : [énoncé, A, B, C, D, bonneRéponse, difficulté, explication?, palier?]
 *
 * Le neuvième élément fixe le palier du cursus (CEP … DOCTORAT). Il est
 * facultatif : sans lui, `data/levels.mjs` situe la question par rapport aux
 * autres. Le renseigner est en revanche indispensable pour une question
 * réellement rédigée à un niveau donné — le classement automatique répartit par
 * percentiles et ne peut, par construction, pas faire grossir le sommet de la
 * pyramide.
 */
export function toQuestion(tuple, categoryName) {
  const [text, a, b, c, d, correct, difficulty, explanation, academicLevel] = tuple
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
    academicLevel: academicLevel || null,
    categoryName,
  }
}

/** Nombre de questions produites par catégorie pour les matières calculables. */
export const GENERATED_PER_CATEGORY = 1000

// La génération coûte quelques dizaines de millisecondes ; les scripts appellent
// `getAllQuestions` plusieurs fois de suite, on ne la refait pas à chaque appel.
let cache = null

/**
 * Toutes les questions de la banque, aplaties : celles rédigées à la main dans
 * `data/questions/`, puis celles produites par les générateurs.
 */
export function getAllQuestions() {
  if (cache) return cache
  const all = []
  for (const cat of CATEGORIES) {
    for (const tuple of cat.questions) {
      all.push(toQuestion(tuple, cat.name))
    }
  }
  // Les énoncés rédigés sont transmis au générateur, qui ne les reprendra pas :
  // l'énoncé est la clé d'unicité en base, un doublon ferait échouer le
  // peuplement.
  all.push(...getGeneratedQuestions(GENERATED_PER_CATEGORY, all.map(q => q.text)))
  cache = all
  return all
}

/** Statistiques de la banque, utilisées par les scripts de vérification. */
export function bankStats() {
  const counts = new Map(CATEGORIES.map(c => [c.name, 0]))
  let written = 0
  let generated = 0
  for (const q of getAllQuestions()) {
    counts.set(q.categoryName, (counts.get(q.categoryName) || 0) + 1)
    if (q.generated) generated++
    else written++
  }
  const perCategory = CATEGORIES.map(c => ({ name: c.name, count: counts.get(c.name) || 0 }))
  return {
    categories: CATEGORIES.length,
    total: written + generated,
    written,
    generated,
    perCategory,
  }
}
