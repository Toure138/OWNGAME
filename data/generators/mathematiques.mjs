// Générateur de questions de mathématiques.
//
// Chaque gabarit tire ses paramètres puis calcule la réponse : aucune valeur
// n'est recopiée, donc aucune ne peut être fausse. Les gabarits sont rangés par
// palier du cursus, du calcul posé au primaire à l'arithmétique modulaire au
// doctorat.

import { fr, intBetween, numericDistractors, pick, sup } from './kit.mjs'

/** Terme ax^n écrit lisiblement : « 4x » plutôt que « 4x^1 ». */
const term = (coef, exp) => (exp === 0 ? `${coef}` : exp === 1 ? `${coef}x` : `${coef}x${sup(exp)}`)

const CATEGORY = 'Mathématiques'

// --- petites fonctions arithmétiques, utilisées par plusieurs gabarits ------

function gcd(a, b) {
  while (b) [a, b] = [b, a % b]
  return a
}
const lcm = (a, b) => (a * b) / gcd(a, b)

function factorial(n) {
  let r = 1
  for (let i = 2; i <= n; i++) r *= i
  return r
}

const binomial = (n, k) => factorial(n) / (factorial(k) * factorial(n - k))

/** Indicatrice d'Euler : nombre d'entiers premiers avec n, inférieurs à n. */
function totient(n) {
  let result = n
  let x = n
  for (let p = 2; p * p <= x; p++) {
    if (x % p === 0) {
      while (x % p === 0) x /= p
      result -= result / p
    }
  }
  if (x > 1) result -= result / x
  return result
}

/** Exponentiation modulaire, en évitant tout dépassement d'entier. */
function powMod(base, exp, mod) {
  let result = 1
  let b = base % mod
  let e = exp
  while (e > 0) {
    if (e & 1) result = (result * b) % mod
    b = (b * b) % mod
    e >>= 1
  }
  return result
}

const TRIPLES = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17],
  [12, 16, 20], [7, 24, 25], [20, 21, 29], [10, 24, 26], [18, 24, 30],
]

// ---------------------------------------------------------------------------
// Gabarits
// ---------------------------------------------------------------------------

export const TEMPLATES = [
  // ----------------------------------------------------------------- CEP ---
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const a = intBetween(rng, 12, 39)
      const b = intBetween(rng, 3, 19)
      const answer = a * b
      return {
        text: `Combien font ${a} × ${b} ?`,
        answer: fr(answer),
        distractors: numericDistractors(rng, answer),
        explanation: `${a} × ${b} = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const a = intBetween(rng, 120, 980)
      const b = intBetween(rng, 15, 119)
      const answer = a + b
      return {
        text: `Combien font ${a} + ${b} ?`,
        answer: fr(answer),
        distractors: numericDistractors(rng, answer),
        explanation: `${a} + ${b} = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const b = intBetween(rng, 25, 240)
      const a = b + intBetween(rng, 30, 700)
      const answer = a - b
      return {
        text: `Combien font ${a} − ${b} ?`,
        answer: fr(answer),
        distractors: numericDistractors(rng, answer),
        explanation: `${a} − ${b} = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const divisor = intBetween(rng, 3, 15)
      const quotient = intBetween(rng, 4, 40)
      const dividend = divisor * quotient
      return {
        text: `Combien font ${dividend} ÷ ${divisor} ?`,
        answer: fr(quotient),
        distractors: numericDistractors(rng, quotient),
        explanation: `${divisor} × ${fr(quotient)} = ${fr(dividend)}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const hours = intBetween(rng, 2, 48)
      const answer = hours * 60
      return {
        text: `Combien de minutes y a-t-il dans ${hours} heures ?`,
        answer: fr(answer),
        distractors: numericDistractors(rng, answer),
        explanation: `${hours} × 60 = ${fr(answer)} minutes`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const length = intBetween(rng, 6, 60)
      const width = intBetween(rng, 3, length - 1)
      const answer = 2 * (length + width)
      return {
        text: `Quel est le périmètre d’un rectangle de ${length} cm sur ${width} cm ?`,
        answer: `${fr(answer)} cm`,
        distractors: [
          `${fr(length * width)} cm`,
          ...numericDistractors(rng, answer).map(v => `${v} cm`),
        ],
        explanation: `2 × (${length} + ${width}) = ${fr(answer)} cm`,
      }
    },
  },

  // ---------------------------------------------------------------- BEPC ---
  {
    level: 'BEPC',
    difficulty: 'EASY',
    build(rng) {
      const a = intBetween(rng, 13, 45)
      const answer = a * a
      return {
        text: `Que vaut ${a}² ?`,
        answer: fr(answer),
        distractors: numericDistractors(rng, answer),
        explanation: `${a} × ${a} = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const root = intBetween(rng, 13, 40)
      const square = root * root
      return {
        text: `Quelle est la racine carrée de ${square} ?`,
        answer: fr(root),
        distractors: numericDistractors(rng, root),
        explanation: `${root} × ${root} = ${fr(square)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const g = intBetween(rng, 3, 18)
      const a = g * intBetween(rng, 2, 12)
      const b = g * intBetween(rng, 2, 12)
      if (a === b) return null
      const answer = gcd(a, b)
      return {
        text: `Quel est le PGCD de ${a} et ${b} ?`,
        answer: fr(answer),
        distractors: [fr(lcm(a, b)), ...numericDistractors(rng, answer)],
        explanation: `Le plus grand diviseur commun de ${a} et ${b} est ${fr(answer)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const a = intBetween(rng, 4, 24)
      const b = intBetween(rng, 4, 24)
      if (a === b) return null
      const answer = lcm(a, b)
      return {
        text: `Quel est le PPCM de ${a} et ${b} ?`,
        answer: fr(answer),
        distractors: [fr(gcd(a, b)), fr(a * b), ...numericDistractors(rng, answer)],
        explanation: `Le plus petit multiple commun de ${a} et ${b} est ${fr(answer)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const percent = pick(rng, [5, 10, 15, 20, 25, 30, 40, 60, 75, 80])
      const base = intBetween(rng, 4, 60) * 20
      const answer = (base * percent) / 100
      return {
        text: `Combien font ${percent} % de ${fr(base)} ?`,
        answer: fr(answer),
        distractors: numericDistractors(rng, answer),
        explanation: `${fr(base)} × ${percent} ÷ 100 = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const g = intBetween(rng, 2, 12)
      const p = intBetween(rng, 2, 11)
      let q = intBetween(rng, 2, 13)
      if (q === p) q += 1
      if (gcd(p, q) !== 1) return null
      const num = g * p
      const den = g * q
      return {
        text: `Sous quelle forme irréductible s’écrit la fraction ${num}/${den} ?`,
        answer: `${p}/${q}`,
        distractors: [`${q}/${p}`, `${num}/${den}`, `${p + 1}/${q}`, `${p}/${q + 1}`],
        explanation: `On divise les deux termes par ${g}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const base = intBetween(rng, 6, 40)
      const height = intBetween(rng, 4, 30)
      const answer = (base * height) / 2
      return {
        text: `Quelle est l’aire d’un triangle de base ${base} cm et de hauteur ${height} cm ?`,
        answer: `${fr(answer)} cm²`,
        distractors: [
          `${fr(base * height)} cm²`,
          ...numericDistractors(rng, answer).map(v => `${v} cm²`),
        ],
        explanation: `(${base} × ${height}) ÷ 2 = ${fr(answer)} cm²`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [a, b, c] = pick(rng, TRIPLES)
      return {
        text: `Dans un triangle rectangle dont les côtés de l’angle droit mesurent ${a} cm et ${b} cm, combien mesure l’hypoténuse ?`,
        answer: `${fr(c)} cm`,
        distractors: [
          `${fr(a + b)} cm`,
          `${fr(a * b)} cm`,
          ...numericDistractors(rng, c).map(v => `${v} cm`),
        ],
        explanation: `${a}² + ${b}² = ${a * a + b * b} = ${c}², donc l’hypoténuse vaut ${c} cm`,
      }
    },
  },

  // ----------------------------------------------------------------- BAC ---
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const a = intBetween(rng, 2, 12)
      const x = intBetween(rng, 2, 25)
      const b = intBetween(rng, -30, 30)
      const c = a * x + b
      const sign = b < 0 ? `− ${Math.abs(b)}` : `+ ${b}`
      return {
        text: `Quelle est la solution de l’équation ${a}x ${sign} = ${c} ?`,
        answer: `x = ${fr(x)}`,
        distractors: numericDistractors(rng, x).map(v => `x = ${v}`),
        explanation: `${a}x = ${c} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${a * x}, donc x = ${fr(x)}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const r = intBetween(rng, 2, 25)
      const answer = Math.round(3.14 * r * r * 100) / 100
      return {
        text: `Quelle est l’aire d’un disque de rayon ${r} cm, avec π ≈ 3,14 ?`,
        answer: `${fr(answer)} cm²`,
        distractors: [
          `${fr(Math.round(2 * 3.14 * r * 100) / 100)} cm²`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} cm²`),
        ],
        explanation: `π r² = 3,14 × ${r}² = ${fr(answer)} cm²`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const l = intBetween(rng, 3, 20)
      const w = intBetween(rng, 2, 18)
      const h = intBetween(rng, 2, 16)
      const answer = l * w * h
      return {
        text: `Quel est le volume d’un pavé droit de ${l} cm × ${w} cm × ${h} cm ?`,
        answer: `${fr(answer)} cm³`,
        distractors: [
          `${fr(2 * (l * w + l * h + w * h))} cm³`,
          ...numericDistractors(rng, answer).map(v => `${v} cm³`),
        ],
        explanation: `${l} × ${w} × ${h} = ${fr(answer)} cm³`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const first = intBetween(rng, 1, 20)
      const step = intBetween(rng, 2, 12)
      const n = intBetween(rng, 8, 40)
      const answer = first + (n - 1) * step
      return {
        text: `Une suite arithmétique commence à ${first} et augmente de ${step} à chaque terme. Que vaut son ${n}ᵉ terme ?`,
        answer: fr(answer),
        distractors: [fr(first + n * step), ...numericDistractors(rng, answer)],
        explanation: `u${n} = ${first} + (${n} − 1) × ${step} = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const faces = pick(rng, [6, 8, 10, 12, 20])
      const threshold = intBetween(rng, 2, faces - 1)
      const favourable = faces - threshold + 1
      const g = gcd(favourable, faces)
      return {
        text: `On lance un dé à ${faces} faces équilibré. Quelle est la probabilité d’obtenir au moins ${threshold} ?`,
        answer: `${favourable / g}/${faces / g}`,
        distractors: [
          `${(threshold - 1) / gcd(threshold - 1 || 1, faces)}/${faces / gcd(threshold - 1 || 1, faces)}`,
          `1/${faces}`,
          `${threshold}/${faces}`,
          `${favourable}/${faces + 1}`,
        ],
        explanation: `${favourable} faces conviennent sur ${faces}, soit ${favourable / g}/${faces / g}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'HARD',
    build(rng) {
      const x = intBetween(rng, 1, 12)
      const y = intBetween(rng, 1, 12)
      const s = x + y
      const d = 2 * x + 3 * y
      return {
        text: `Résolvez le système : x + y = ${s} et 2x + 3y = ${d}. Que vaut y ?`,
        answer: `y = ${fr(y)}`,
        distractors: [`y = ${fr(x)}`, ...numericDistractors(rng, y).map(v => `y = ${v}`)],
        explanation: `En soustrayant deux fois la première équation : y = ${d} − 2 × ${s} = ${fr(y)}`,
      }
    },
  },

  // ------------------------------------------------------------- LICENCE ---
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const n = intBetween(rng, 2, 9)
      const value = Math.pow(10, n)
      return {
        text: `Que vaut log₁₀(${fr(value)}) ?`,
        answer: fr(n),
        distractors: numericDistractors(rng, n),
        explanation: `10^${n} = ${fr(value)}, donc le logarithme décimal vaut ${n}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const n = intBetween(rng, 3, 16)
      const value = Math.pow(2, n)
      return {
        text: `Que vaut log₂(${fr(value)}) ?`,
        answer: fr(n),
        distractors: numericDistractors(rng, n),
        explanation: `2^${n} = ${fr(value)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const a = intBetween(rng, 2, 9)
      const n = intBetween(rng, 2, 6)
      const b = intBetween(rng, 2, 15)
      return {
        text: `Quelle est la dérivée de f(x) = ${term(a, n)} + ${b}x ?`,
        answer: `${term(a * n, n - 1)} + ${b}`,
        distractors: [
          `${term(a * n, n)} + ${b}`,
          `${term(a, n - 1)} + ${b}`,
          `${term(a * n, n - 1)}`,
          `${term(a + n, n - 1)} + ${b}`,
        ],
        explanation: `La dérivée de ax^n est n·a·x^(n−1) ; celle de ${b}x est ${b}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const first = intBetween(rng, 2, 12)
      const ratio = pick(rng, [2, 3, 5])
      const n = intBetween(rng, 4, 9)
      const answer = first * Math.pow(ratio, n - 1)
      return {
        text: `Une suite géométrique de premier terme ${first} a pour raison ${ratio}. Que vaut son ${n}ᵉ terme ?`,
        answer: fr(answer),
        distractors: [fr(first * Math.pow(ratio, n)), ...numericDistractors(rng, answer)],
        explanation: `u${n} = ${first} × ${ratio}^${n - 1} = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const n = intBetween(rng, 5, 12)
      const k = intBetween(rng, 2, Math.min(4, n - 1))
      const answer = binomial(n, k)
      return {
        text: `Combien de combinaisons de ${k} éléments peut-on former parmi ${n} ?`,
        answer: fr(answer),
        distractors: [
          fr(factorial(n) / factorial(n - k)),
          fr(n * k),
          ...numericDistractors(rng, answer),
        ],
        explanation: `C(${n},${k}) = ${n}! / (${k}! × ${n - k}!) = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const a = intBetween(rng, 1, 9)
      const b = intBetween(rng, 1, 9)
      const c = intBetween(rng, 1, 9)
      const d = intBetween(rng, 1, 9)
      const answer = a * d - b * c
      return {
        text: `Quel est le déterminant de la matrice [[${a}, ${b}], [${c}, ${d}]] ?`,
        answer: fr(answer),
        distractors: [fr(a * d + b * c), fr(a + d), ...numericDistractors(rng, answer)],
        explanation: `ad − bc = ${a}×${d} − ${b}×${c} = ${fr(answer)}`,
      }
    },
  },

  // -------------------------------------------------------------- MASTER ---
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const a = intBetween(rng, 1, 6)
      const n = intBetween(rng, 1, 4)
      const upper = intBetween(rng, 2, 5)
      const answer = (a * Math.pow(upper, n + 1)) / (n + 1)
      if (!Number.isInteger(answer)) return null
      return {
        text: `Que vaut l’intégrale de ${term(a, n)} entre 0 et ${upper} ?`,
        answer: fr(answer),
        distractors: [
          fr(a * Math.pow(upper, n)),
          fr(a * n * Math.pow(upper, n - 1)),
          ...numericDistractors(rng, answer),
        ],
        explanation: `La primitive est ${term(a, n + 1)}/${n + 1} ; en ${upper} elle vaut ${fr(answer)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [a, b, c] = pick(rng, TRIPLES)
      return {
        text: `Quel est le module du nombre complexe ${a} + ${b}i ?`,
        answer: fr(c),
        distractors: [fr(a + b), fr(a * b), ...numericDistractors(rng, c)],
        explanation: `√(${a}² + ${b}²) = √${a * a + b * b} = ${fr(c)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const a = intBetween(rng, 2, 9)
      const b = intBetween(rng, 2, 9)
      const p = intBetween(rng, 2, 5)
      const q = intBetween(rng, 2, 5)
      if (p === q) return null
      return {
        text: `Vers quelle limite tend (${term(a, p)} + 1) / (${term(b, q)} + 1) quand x tend vers l’infini ?`,
        answer: p > q ? 'L’infini' : '0',
        distractors: [
          p > q ? '0' : 'L’infini',
          `${a}/${b}`,
          `${b}/${a}`,
          '1',
        ],
        explanation:
          p > q
            ? `Le degré du numérateur (${p}) dépasse celui du dénominateur (${q})`
            : `Le degré du dénominateur (${q}) dépasse celui du numérateur (${p})`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const n = intBetween(rng, 4, 10)
      const k = intBetween(rng, 1, n - 1)
      const answer = binomial(n, k)
      const total = Math.pow(2, n)
      const g = gcd(answer, total)
      return {
        text: `On lance ${n} pièces équilibrées. Quelle est la probabilité d’obtenir exactement ${k} pile${k > 1 ? 's' : ''} ?`,
        answer: `${answer / g}/${total / g}`,
        distractors: [
          `${k}/${n}`,
          `1/${total}`,
          `${answer}/${total + 1}`,
          `${n}/${total}`,
        ],
        explanation: `C(${n},${k}) / 2^${n} = ${answer}/${total}`,
      }
    },
  },

  // ------------------------------------------------------------ DOCTORAT ---
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const l1 = intBetween(rng, 1, 9)
      const l2 = intBetween(rng, 1, 9)
      if (l1 === l2) return null
      // Matrice triangulaire : ses valeurs propres sont les termes diagonaux.
      const b = intBetween(rng, 1, 9)
      return {
        text: `Quelles sont les valeurs propres de la matrice [[${l1}, ${b}], [0, ${l2}]] ?`,
        answer: `${Math.min(l1, l2)} et ${Math.max(l1, l2)}`,
        distractors: [
          `${l1 + l2} et ${l1 * l2}`,
          `${b} et ${l1}`,
          `0 et ${l1 + l2}`,
          `${Math.min(l1, l2) + 1} et ${Math.max(l1, l2)}`,
        ],
        explanation: `La matrice est triangulaire : ses valeurs propres sont ses termes diagonaux, ${l1} et ${l2}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const n = pick(rng, [9, 15, 21, 25, 27, 33, 35, 49, 55, 77, 81, 121])
      const answer = totient(n)
      return {
        text: `Que vaut l’indicatrice d’Euler φ(${n}) ?`,
        answer: fr(answer),
        distractors: [fr(n - 1), fr(n), ...numericDistractors(rng, answer)],
        explanation: `φ(${n}) compte les entiers inférieurs à ${n} et premiers avec lui : ${fr(answer)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const base = intBetween(rng, 2, 12)
      const exp = intBetween(rng, 5, 40)
      const mod = pick(rng, [7, 11, 13, 17, 19, 23, 29, 31])
      const answer = powMod(base, exp, mod)
      return {
        text: `Que vaut ${base}^${exp} modulo ${mod} ?`,
        answer: fr(answer),
        distractors: [
          fr((base * exp) % mod),
          fr((base + exp) % mod),
          ...numericDistractors(rng, answer).filter(v => Number(v) >= 0 && Number(v) < mod),
          fr((answer + 1) % mod),
          fr((answer + 2) % mod),
        ],
        explanation: `Par exponentiation rapide, ${base}^${exp} ≡ ${fr(answer)} [${mod}]`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const n = intBetween(rng, 3, 7)
      const answer = factorial(n)
      return {
        text: `Quel est l’ordre du groupe symétrique S${n} ?`,
        answer: fr(answer),
        distractors: [fr(n * n), fr(Math.pow(2, n)), ...numericDistractors(rng, answer)],
        explanation: `S${n} compte ${n}! = ${fr(answer)} permutations`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const n = intBetween(rng, 3, 9)
      const answer = factorial(n)
      return {
        text: `Dans le développement de Taylor de eˣ en 0, quel est le dénominateur du terme de degré ${n} ?`,
        answer: fr(answer),
        distractors: [fr(n), fr(n * n), ...numericDistractors(rng, answer)],
        explanation: `Le terme de degré n vaut xⁿ/n!, soit ici x^${n}/${fr(answer)}`,
      }
    },
  },
]

export const CATEGORY_NAME = CATEGORY
