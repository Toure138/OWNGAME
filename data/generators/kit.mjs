// Outillage commun aux générateurs de questions.
//
// Principe : la réponse n'est jamais écrite, elle est calculée. Une question
// produite ici est donc juste par construction — c'est ce qui permet d'en
// fabriquer des milliers sans multiplier les erreurs factuelles, là où une
// rédaction à la main plafonne à quelques centaines.
//
// Le tirage est déterministe : l'énoncé sert de clé d'unicité en base, une
// génération aléatoire ferait diverger la banque à chaque peuplement.

import { permuteFor } from '../permute.mjs'

const LETTERS = ['A', 'B', 'C', 'D']

/** Générateur congruentiel linéaire — reproductible d'une exécution à l'autre. */
export function createRng(seed) {
  let s = (seed >>> 0) || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    // Bits de poids fort : ceux de poids faible d'un LCG ont une période courte.
    return (s >>> 8) / 0x01000000
  }
}

export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)]
}

/** Mélange une copie de la liste, sans toucher à l'originale. */
export function shuffled(rng, list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// ---------------------------------------------------------------------------
// Mise en forme française
// ---------------------------------------------------------------------------

/**
 * Nombre à la française : virgule décimale, espace insécable fine pour les
 * milliers. Les décimales inutiles sont retirées — « 12,50 » se lit mal quand
 * la réponse attendue est 12,5.
 */
export function fr(value, decimals = null) {
  if (!Number.isFinite(value)) return String(value)
  let text
  if (decimals === null) {
    // Arrondi de sécurité : les flottants produisent 0,30000000000000004.
    text = String(Math.round(value * 1e6) / 1e6)
  } else {
    text = value.toFixed(decimals)
  }
  const [whole, frac] = text.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return frac ? `${grouped},${frac}` : grouped
}

const SUPERSCRIPTS = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' }

/** Exposant en chiffres supérieurs : « 10⁻¹⁰ » plutôt que « 10^-10 ». */
export function sup(value) {
  return String(value).split('').map(c => SUPERSCRIPTS[c] ?? c).join('')
}

/**
 * Article contracté devant un nom qui porte déjà le sien.
 *
 * Les tables de faits stockent « le Tchad », « les Pays-Bas », « l’Inde » :
 * concaténer naïvement donnerait « de le Tchad ». Une question mal accordée se
 * remarque immédiatement et discrédite tout le lot.
 */
export function de(name) {
  if (name.startsWith('les ')) return `des ${name.slice(4)}`
  if (name.startsWith('le ')) return `du ${name.slice(3)}`
  if (name.startsWith('la ')) return `de ${name}`
  if (name.startsWith('l’') || name.startsWith("l'")) return `de ${name}`
  return `de ${name}`
}

/** « en France », « au Tchad », « aux Pays-Bas » : préposition de lieu. */
export function dans(name) {
  if (name.startsWith('les ')) return `aux ${name.slice(4)}`
  if (name.startsWith('le ')) return `au ${name.slice(3)}`
  if (name.startsWith('la ')) return `en ${name.slice(3)}`
  if (name.startsWith('l’') || name.startsWith("l'")) return `en ${name.slice(2)}`
  return `à ${name}`
}

/** Accord du pluriel sur une unité simple. */
export function unit(value, singular, plural = null) {
  return `${fr(value)} ${Math.abs(value) >= 2 ? (plural ?? singular + 's') : singular}`
}

// ---------------------------------------------------------------------------
// Fabrication d'une question
// ---------------------------------------------------------------------------

/**
 * Assemble une question à partir de sa réponse et de ses leurres.
 *
 * Renvoie `null` si les leurres ne permettent pas de constituer quatre
 * propositions distinctes — appeler avec des leurres qui tombent sur la bonne
 * réponse est fréquent quand ils sont calculés, et mieux vaut abandonner la
 * question que de proposer deux fois la même valeur.
 */
export function makeQuestion({
  text,
  answer,
  distractors,
  explanation = null,
  level,
  difficulty = 'MEDIUM',
  category,
}) {
  const answerText = String(answer)
  const seen = new Set([answerText])
  const kept = []
  for (const d of distractors) {
    const value = String(d)
    if (seen.has(value)) continue
    seen.add(value)
    kept.push(value)
    if (kept.length === 3) break
  }
  if (kept.length < 3) return null

  const source = [answerText, ...kept]
  const order = permuteFor(text)
  const shuffledProps = order.map(i => source[i])

  return {
    text,
    propositionA: shuffledProps[0],
    propositionB: shuffledProps[1],
    propositionC: shuffledProps[2],
    propositionD: shuffledProps[3],
    // La bonne réponse occupait l'indice 0 avant permutation.
    correctAnswer: LETTERS[order.indexOf(0)],
    difficulty,
    explanation,
    academicLevel: level,
    categoryName: category,
    generated: true,
  }
}

/**
 * Leurres numériques proches de la bonne réponse.
 *
 * Un leurre trop lointain se repère sans calculer ; un leurre trop proche rend
 * la question illisible sur une valeur décimale. On décale donc d'un petit
 * pourcentage ou de quelques unités, selon l'ordre de grandeur.
 */
export function numericDistractors(rng, answer, { decimals = null, count = 6 } = {}) {
  const magnitude = Math.abs(answer)
  const step = magnitude >= 40 ? Math.max(1, Math.round(magnitude * 0.08)) : 1
  const offsets = [step, -step, 2 * step, -2 * step, 3 * step, -3 * step, 5 * step]
  const out = []
  for (const offset of shuffled(rng, offsets)) {
    const candidate = answer + offset
    // Une valeur négative là où la réponse est positive trahit le leurre.
    if (answer >= 0 && candidate < 0) continue
    out.push(decimals === null ? fr(candidate) : fr(candidate, decimals))
    if (out.length >= count) break
  }
  return out
}
