// Cursus académique : les six paliers de difficulté et le système de diplômes.
//
// Module en JavaScript pur, comme `password.mjs` : il est importé par le code
// applicatif TypeScript, par le peuplement de la base (`scripts/seed.mjs`) et
// par les scripts de vérification. Une définition unique évite que le barème
// affiché au joueur diverge de celui appliqué par le serveur.

/**
 * Les six paliers, du plus accessible au plus exigeant.
 *
 * - `code`      valeur stockée en base (`Question.academicLevel`, `Diploma.degree`)
 * - `questions` nombre de questions de l'examen
 * - `passRate`  pourcentage de bonnes réponses exigé pour décrocher le diplôme
 * - `timer`     secondes de réflexion par question — décroissant : à niveau
 *               égal de connaissance, l'exigence porte aussi sur l'aisance
 * - `share`     part de la banque affectée à ce palier (voir `data/levels.mjs`)
 */
export const DEGREES = [
  {
    code: 'CEP',
    name: 'Certificat d’études primaires',
    short: 'CEP',
    holder: 'Titulaire du CEP',
    school: 'École primaire',
    icon: 'Pencil',
    color: '#22c55e',
    questions: 10,
    passRate: 60,
    timer: 25,
    share: 0.24,
  },
  {
    code: 'BEPC',
    name: 'Brevet d’études du premier cycle',
    short: 'BEPC',
    holder: 'Breveté',
    school: 'Collège',
    icon: 'BookOpen',
    color: '#14b8a6',
    questions: 12,
    passRate: 60,
    timer: 22,
    share: 0.23,
  },
  {
    code: 'BAC',
    name: 'Baccalauréat',
    short: 'Bac',
    holder: 'Bachelier',
    school: 'Lycée',
    icon: 'GraduationCap',
    color: '#3b82f6',
    questions: 15,
    passRate: 65,
    timer: 20,
    share: 0.2,
  },
  {
    code: 'LICENCE',
    name: 'Licence',
    short: 'Licence',
    holder: 'Licencié',
    school: 'Université — 1er cycle',
    icon: 'Scroll',
    color: '#8b5cf6',
    questions: 15,
    passRate: 70,
    timer: 18,
    share: 0.15,
  },
  {
    code: 'MASTER',
    name: 'Master',
    short: 'Master',
    holder: 'Titulaire d’un master',
    school: 'Université — 2e cycle',
    icon: 'Award',
    color: '#f59e0b',
    questions: 18,
    passRate: 75,
    timer: 16,
    share: 0.11,
  },
  {
    code: 'DOCTORAT',
    name: 'Doctorat',
    short: 'Doctorat',
    holder: 'Docteur',
    school: 'École doctorale',
    icon: 'Crown',
    color: '#ef4444',
    questions: 20,
    passRate: 80,
    timer: 15,
    share: 0.07,
  },
]

export const DEGREE_CODES = DEGREES.map(d => d.code)

/** Palier appliqué à une question dont le niveau n'a pas encore été calculé. */
export const DEFAULT_LEVEL = 'BAC'

export function getDegree(code) {
  return DEGREES.find(d => d.code === code) || null
}

/** Rang du palier (0 = CEP), ou -1 si le code est inconnu. */
export function degreeIndex(code) {
  return DEGREE_CODES.indexOf(code)
}

/** Palier suivant, ou null si le doctorat est atteint. */
export function nextDegree(code) {
  const i = degreeIndex(code)
  if (i < 0 || i >= DEGREES.length - 1) return null
  return DEGREES[i + 1]
}

/**
 * Mentions, dans la tradition des jurys français. Le seuil d'obtention varie
 * d'un diplôme à l'autre : la mention, elle, se calcule toujours sur le
 * pourcentage de bonnes réponses.
 */
export const MENTIONS = [
  { code: 'EXCELLENT', label: 'Félicitations du jury', min: 98 },
  { code: 'TRES_BIEN', label: 'Mention Très bien', min: 90 },
  { code: 'BIEN', label: 'Mention Bien', min: 80 },
  { code: 'ASSEZ_BIEN', label: 'Mention Assez bien', min: 70 },
  { code: 'PASSABLE', label: 'Mention Passable', min: 0 },
]

export function mentionFor(percent) {
  return MENTIONS.find(m => percent >= m.min) || MENTIONS[MENTIONS.length - 1]
}

/**
 * Le titre affiché à côté du pseudo, dérivé du plus haut diplôme obtenu.
 * Un joueur qui n'a encore rien passé est « Candidat libre » — la formule
 * consacrée pour qui se présente sans être inscrit dans un établissement.
 */
export function holderTitle(degreeCode) {
  const degree = getDegree(degreeCode)
  return degree ? degree.holder : 'Candidat libre'
}

/**
 * XP accordée par un diplôme. La progression est franchement croissante :
 * décrocher le doctorat doit rester l'événement d'un parcours, pas une
 * formalité de plus.
 */
export function xpForDegree(code) {
  const i = degreeIndex(code)
  if (i < 0) return 0
  return 300 + i * 350
}

// ---------------------------------------------------------------------------
// Estimation de la difficulté d'une question
// ---------------------------------------------------------------------------

const DIFFICULTY_BASE = { EASY: 0, MEDIUM: 1000, HARD: 2000 }

/**
 * Complexité lexicale d'une question, sur 0 à 999.
 *
 * Aucun de ces signaux n'est décisif isolément ; leur somme sépare
 * convenablement « Combien font 7 × 8 ? » d'un énoncé sur la renormalisation en
 * théorie quantique des champs. Ils ne franchissent jamais la frontière entre
 * deux difficultés rédigées à la main : le score reste borné à 999.
 */
function lexicalComplexity(question) {
  const text = question.text || ''
  const words = text.split(/\s+/).filter(Boolean)
  const propositions = [
    question.propositionA,
    question.propositionB,
    question.propositionC,
    question.propositionD,
  ].filter(Boolean)

  const longWords = words.filter(w => w.length >= 10).length
  const longest = words.reduce((max, w) => Math.max(max, w.length), 0)
  const avgProposition = propositions.length
    ? propositions.reduce((sum, p) => sum + String(p).length, 0) / propositions.length
    : 0
  // Symboles, exposants, indices et unités composées signalent un énoncé
  // technique plutôt qu'une question de culture générale.
  const technical = (text.match(/[₀-₉⁰-⁹×÷±≈∑∫√πλμΩ°%/^]/g) || []).length

  const score =
    Math.min(text.length, 160) * 2.4 + // 0 – 384
    Math.min(longWords, 6) * 40 + //      0 – 240
    Math.min(longest, 20) * 8 + //        0 – 160
    Math.min(avgProposition, 40) * 3 + // 0 – 120
    Math.min(technical, 12) * 7 //        0 –  84

  return Math.min(999, Math.round(score))
}

/**
 * Score de difficulté d'une question : la difficulté rédigée à la main domine,
 * la complexité lexicale départage à l'intérieur d'un même niveau.
 */
export function difficultyScore(question) {
  const base = DIFFICULTY_BASE[question.difficulty] ?? DIFFICULTY_BASE.MEDIUM
  return base + lexicalComplexity(question)
}

/**
 * Palier d'une question prise isolément — le cas d'une question créée depuis
 * l'administration. Moins fin que le classement d'ensemble de
 * `data/levels.mjs`, qui situe chaque question par rapport aux autres, mais
 * cohérent avec lui : les deux reposent sur le même score.
 */
export function levelForSingleQuestion(question) {
  const score = difficultyScore(question)
  if (score < DIFFICULTY_BASE.MEDIUM) return score < 500 ? 'CEP' : 'BEPC'
  if (score < DIFFICULTY_BASE.HARD) return score < 1500 ? 'BAC' : 'LICENCE'
  return score < 2500 ? 'MASTER' : 'DOCTORAT'
}
