// Placement déterministe de la bonne réponse parmi les quatre propositions.
//
// Extrait de `index.mjs` pour être partagé avec les générateurs sans créer de
// dépendance circulaire : `index.mjs` importe les générateurs, qui ont eux
// aussi besoin de placer leurs réponses.
//
// Les questions sont rédigées — ou produites — avec la bonne réponse toujours
// à la même place. Une permutation dérivée de l'énoncé rétablit une
// répartition A/B/C/D équilibrée, et reste identique d'un peuplement à l'autre :
// l'énoncé étant la clé d'unicité en base, un tirage aléatoire ferait diverger
// les propositions à chaque exécution.

/** Hachage stable (FNV-1a 32 bits) d'une chaîne, utilisé comme graine. */
export function hash32(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * Ordre dans lequel disposer quatre propositions, dérivé de l'énoncé.
 *
 * Mélange de Fisher-Yates piloté par un générateur congruentiel linéaire. On
 * consomme les bits de poids fort : ceux de poids faible d'un LCG ont une
 * période très courte et produiraient une répartition A/B/C/D déséquilibrée.
 */
export function permuteFor(text) {
  const order = [0, 1, 2, 3]
  let seed = hash32(text)
  for (let i = order.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const j = (seed >>> 16) % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}
