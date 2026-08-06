// Générateur de questions d'informatique.
//
// Conversions de bases, arithmétique binaire, tailles de données, complexité,
// adressage réseau : autant de domaines où la réponse se calcule, donc se
// vérifie.

import { fr, intBetween, numericDistractors, pick } from './kit.mjs'

const CATEGORY = 'Informatique'

/** Nombre d'adresses utilisables dans un sous-réseau IPv4 : 2^(32−n) − 2. */
function usableHosts(prefix) {
  return Math.pow(2, 32 - prefix) - 2
}

export const TEMPLATES = [
  // ----------------------------------------------------------------- CEP ---
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const n = intBetween(rng, 3, 12)
      const answer = Math.pow(2, n)
      return {
        text: `Que vaut 2 puissance ${n} ?`,
        answer: fr(answer),
        distractors: [fr(2 * n), fr(Math.pow(2, n + 1)), ...numericDistractors(rng, answer)],
        explanation: `2^${n} = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const ko = intBetween(rng, 2, 200)
      const answer = ko * 1024
      return {
        text: `Combien d’octets contient un fichier de ${ko} Kio ?`,
        answer: fr(answer),
        distractors: [fr(ko * 1000), fr(ko * 8), ...numericDistractors(rng, answer)],
        explanation: `1 Kio = 1024 octets, donc ${ko} × 1024 = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const octets = intBetween(rng, 3, 400)
      const answer = octets * 8
      return {
        text: `Combien de bits représentent ${octets} octets ?`,
        answer: fr(answer),
        distractors: [fr(octets / 8 || 1), fr(octets * 1024), ...numericDistractors(rng, answer)],
        explanation: `1 octet = 8 bits, donc ${octets} × 8 = ${fr(answer)}`,
      }
    },
  },

  // ---------------------------------------------------------------- BEPC ---
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const n = intBetween(rng, 5, 255)
      const answer = n.toString(2)
      return {
        text: `Quelle est l’écriture binaire du nombre décimal ${n} ?`,
        answer: answer,
        distractors: [
          (n + 1).toString(2),
          (n - 1).toString(2),
          n.toString(8),
          n.toString(16).toUpperCase(),
        ],
        explanation: `${n} s’écrit ${answer} en base 2`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const n = intBetween(rng, 9, 250)
      const binary = n.toString(2)
      return {
        text: `Quel nombre décimal correspond au binaire ${binary} ?`,
        answer: fr(n),
        distractors: [fr(parseInt(binary, 8)), ...numericDistractors(rng, n)],
        explanation: `${binary}₂ = ${fr(n)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const n = intBetween(rng, 20, 4000)
      const hex = n.toString(16).toUpperCase()
      return {
        text: `Quelle est l’écriture hexadécimale du nombre ${n} ?`,
        answer: hex,
        distractors: [
          (n + 1).toString(16).toUpperCase(),
          (n - 1).toString(16).toUpperCase(),
          n.toString(2),
          (n * 2).toString(16).toUpperCase(),
        ],
        explanation: `${n} s’écrit ${hex} en base 16`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const mo = intBetween(rng, 2, 900)
      const answer = mo * 1024
      return {
        text: `Combien de Kio représentent ${mo} Mio ?`,
        answer: fr(answer),
        distractors: [fr(mo * 1000), fr(mo * 1024 * 1024), ...numericDistractors(rng, answer)],
        explanation: `1 Mio = 1024 Kio, donc ${mo} × 1024 = ${fr(answer)}`,
      }
    },
  },

  // ----------------------------------------------------------------- BAC ---
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const a = intBetween(rng, 5, 255)
      const b = intBetween(rng, 5, 255)
      const answer = a & b
      return {
        text: `Que vaut ${a} ET ${b} (opération bit à bit) ?`,
        answer: fr(answer),
        distractors: [fr(a | b), fr(a ^ b), ...numericDistractors(rng, answer)],
        explanation: `${a.toString(2)} ET ${b.toString(2)} = ${answer.toString(2)}, soit ${fr(answer)}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const a = intBetween(rng, 5, 255)
      const b = intBetween(rng, 5, 255)
      const answer = a ^ b
      return {
        text: `Que vaut ${a} OU EXCLUSIF ${b} (opération bit à bit) ?`,
        answer: fr(answer),
        distractors: [fr(a & b), fr(a | b), ...numericDistractors(rng, answer)],
        explanation: `${a.toString(2)} XOR ${b.toString(2)} = ${answer.toString(2)}, soit ${fr(answer)}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const n = intBetween(rng, 4, 24)
      const answer = Math.pow(2, n)
      return {
        text: `Combien de valeurs distinctes peut coder un mot de ${n} bits ?`,
        answer: fr(answer),
        distractors: [fr(2 * n), fr(answer - 1), ...numericDistractors(rng, answer)],
        explanation: `2^${n} = ${fr(answer)} combinaisons`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const go = intBetween(rng, 2, 64)
      const debit = pick(rng, [10, 20, 50, 100, 200])
      // Débit en Mbit/s, taille en Go : conversion en bits puis division.
      const seconds = Math.round((go * 8 * 1000) / debit)
      return {
        text: `Combien de secondes faut-il pour transférer ${go} Go à ${debit} Mbit/s ?`,
        answer: fr(seconds),
        distractors: [fr(Math.round((go * 1000) / debit)), ...numericDistractors(rng, seconds)],
        explanation: `${go} Go = ${fr(go * 8 * 1000)} Mbit ; ÷ ${debit} = ${fr(seconds)} s`,
      }
    },
  },

  // ------------------------------------------------------------- LICENCE ---
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const prefix = intBetween(rng, 8, 30)
      const answer = usableHosts(prefix)
      return {
        text: `Combien d’adresses utilisables contient un sous-réseau IPv4 en /${prefix} ?`,
        answer: fr(answer),
        distractors: [
          fr(answer + 2),
          fr(Math.pow(2, 32 - prefix)),
          ...numericDistractors(rng, answer),
        ],
        explanation: `2^(32 − ${prefix}) − 2 = ${fr(answer)} (adresses de réseau et de diffusion exclues)`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const n = Math.pow(2, intBetween(rng, 4, 26))
      const answer = Math.log2(n)
      return {
        text: `Combien de comparaisons au maximum une recherche dichotomique effectue-t-elle dans un tableau trié de ${fr(n)} éléments ?`,
        answer: fr(answer),
        distractors: [fr(n / 2), fr(n), ...numericDistractors(rng, answer)],
        explanation: `log₂(${fr(n)}) = ${fr(answer)} : chaque comparaison divise l’intervalle par deux`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const n = intBetween(rng, 20, 4000)
      const answer = (n * (n - 1)) / 2
      return {
        text: `Combien de comparaisons effectue un tri par sélection sur ${fr(n)} éléments ?`,
        answer: fr(answer),
        distractors: [
          fr(n * n),
          fr(n * Math.round(Math.log2(n))),
          ...numericDistractors(rng, answer),
        ],
        explanation: `n(n−1)/2 = ${fr(n)} × ${fr(n - 1)} ÷ 2 = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const bits = intBetween(rng, 4, 52)
      const answer = Math.pow(2, bits - 1) - 1
      return {
        text: `Quel est le plus grand entier signé représentable sur ${bits} bits en complément à deux ?`,
        answer: fr(answer),
        distractors: [
          fr(Math.pow(2, bits) - 1),
          fr(Math.pow(2, bits - 1)),
          ...numericDistractors(rng, answer),
        ],
        explanation: `2^(${bits}−1) − 1 = ${fr(answer)} ; un bit sert au signe`,
      }
    },
  },

  // -------------------------------------------------------------- MASTER ---
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const n = intBetween(rng, 8, 4096)
      const answer = Math.round(n * Math.log2(n))
      return {
        text: `Combien d’opérations élémentaires un tri fusion effectue-t-il sur ${fr(n)} éléments, selon sa complexité n log₂ n ?`,
        answer: fr(answer),
        distractors: [fr(n * n), fr(n), ...numericDistractors(rng, answer)],
        explanation: `${fr(n)} × log₂(${fr(n)}) ≈ ${fr(answer)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const depth = intBetween(rng, 3, 45)
      const answer = Math.pow(2, depth + 1) - 1
      return {
        text: `Combien de nœuds au maximum contient un arbre binaire de hauteur ${depth} ?`,
        answer: fr(answer),
        distractors: [
          fr(Math.pow(2, depth)),
          fr(2 * depth + 1),
          ...numericDistractors(rng, answer),
        ],
        explanation: `2^(${depth}+1) − 1 = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const k = intBetween(rng, 3, 60)
      const answer = Math.pow(2, k)
      return {
        text: `Une fonction de hachage produit des empreintes de ${k} bits. Combien de valeurs distinctes peut-elle prendre ?`,
        answer: fr(answer),
        distractors: [fr(2 * k), fr(answer / 2), ...numericDistractors(rng, answer)],
        explanation: `2^${k} = ${fr(answer)} empreintes possibles`,
      }
    },
  },

  // ------------------------------------------------------------ DOCTORAT ---
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const bits = intBetween(rng, 8, 256) * 2
      const answer = bits / 2
      return {
        text: `Face au paradoxe des anniversaires, quelle sécurité effective offre une empreinte de ${bits} bits contre les collisions ?`,
        answer: `${fr(answer)} bits`,
        distractors: [
          `${fr(bits)} bits`,
          `${fr(bits * 2)} bits`,
          `${fr(bits - 1)} bits`,
          `${fr(answer + 8)} bits`,
        ],
        explanation: `Une collision apparaît après environ 2^(n/2) essais, soit une sécurité de ${fr(answer)} bits`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const n = intBetween(rng, 3, 30)
      const answer = Math.pow(2, n)
      return {
        text: `Combien de sous-ensembles possède un ensemble de ${n} éléments ?`,
        answer: fr(answer),
        distractors: [fr(n * n), fr(answer - 1), ...numericDistractors(rng, answer)],
        explanation: `Chaque élément est pris ou non : 2^${n} = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const processors = intBetween(rng, 2, 512)
      const parallel = intBetween(rng, 40, 99)
      const p = parallel / 100
      // Loi d'Amdahl : accélération = 1 / ((1 − p) + p/n)
      const answer = 1 / (1 - p + p / processors)
      return {
        text: `Selon la loi d’Amdahl, quelle accélération maximale obtient-on avec ${processors} processeurs si ${parallel} % du programme est parallélisable ?`,
        answer: `× ${fr(answer, 2)}`,
        distractors: [
          `× ${fr(processors, 2)}`,
          `× ${fr(processors * p, 2)}`,
          `× ${fr(1 / (1 - p), 2)}`,
          `× ${fr(answer + 1, 2)}`,
        ],
        explanation: `1 / ((1 − ${fr(p)}) + ${fr(p)}/${processors}) = ${fr(answer, 2)}`,
      }
    },
  },
]

export const CATEGORY_NAME = CATEGORY
