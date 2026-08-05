// Affectation d'un niveau académique à chaque question de la banque.
//
// La banque a été rédigée avec trois difficultés seulement (facile / moyen /
// difficile), et très inégalement réparties : 473 faciles, 443 moyennes, 84
// difficiles. Le cursus en compte six, du CEP au doctorat. Deux écueils à
// éviter :
//
//   • découper mécaniquement chaque difficulté en deux donnerait 42 questions
//     par palier pour le master et le doctorat — trop peu pour un examen de
//     vingt questions rejouable ;
//   • tirer au sort le palier à l'intérieur d'une difficulté produirait un
//     classement instable d'un peuplement à l'autre.
//
// On classe donc les mille questions sur l'échelle continue de
// `difficultyScore` — la difficulté rédactionnelle domine, la complexité
// lexicale départage — puis on découpe ce classement selon les parts déclarées
// dans `DEGREES` (24 % au CEP … 7 % au doctorat). Le résultat est une pyramide,
// strictement déterministe, et modifiable question par question depuis
// l'administration.

import { DEGREES, DEFAULT_LEVEL, difficultyScore } from '../src/lib/academic.mjs'

/** Hachage stable (FNV-1a 32 bits) — départage les scores rigoureusement égaux. */
function hash32(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * Nombre de questions affecté à chaque palier pour un effectif donné. Le reste
 * des arrondis échoit au palier le plus bas, celui qui absorbe le mieux une
 * question de trop.
 */
export function levelQuotas(total) {
  const quotas = DEGREES.map(d => ({ code: d.code, count: Math.floor(total * d.share) }))
  const assigned = quotas.reduce((sum, q) => sum + q.count, 0)
  if (quotas.length) quotas[0].count += total - assigned
  return quotas
}

/**
 * Classe une collection de questions et renvoie une correspondance
 * « énoncé → code du palier ».
 *
 * @param questions objets possédant au moins `text` et `difficulty`
 */
export function assignAcademicLevels(questions) {
  const ranked = questions
    .map(q => ({ text: q.text, score: difficultyScore(q), tie: hash32(q.text || '') }))
    .sort((a, b) => a.score - b.score || a.tie - b.tie)

  const quotas = levelQuotas(ranked.length)
  const levels = new Map()

  let cursor = 0
  for (const quota of quotas) {
    for (let i = 0; i < quota.count && cursor < ranked.length; i++, cursor++) {
      levels.set(ranked[cursor].text, quota.code)
    }
  }
  // Garde-fou : si les arrondis laissaient une question orpheline, elle rejoint
  // le dernier palier plutôt que de rester sans niveau.
  while (cursor < ranked.length) {
    levels.set(ranked[cursor].text, DEGREES[DEGREES.length - 1].code)
    cursor++
  }

  return levels
}

export { DEFAULT_LEVEL }
