// Générateur de questions de physique.
//
// Conversions d'unités et applications directes des lois fondamentales. Les
// valeurs sont choisies pour tomber juste : une réponse à sept décimales serait
// injouable en vingt secondes.

import { fr, intBetween, numericDistractors, pick } from './kit.mjs'

const CATEGORY = 'Physique'

/** Accélération de la pesanteur retenue pour les énoncés. */
const G = 9.81

export const TEMPLATES = [
  // ----------------------------------------------------------------- CEP ---
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const km = intBetween(rng, 2, 400)
      const answer = km * 1000
      return {
        text: `Combien de mètres représentent ${km} kilomètres ?`,
        answer: fr(answer),
        distractors: [fr(km * 100), fr(km * 10), ...numericDistractors(rng, answer)],
        explanation: `1 km = 1000 m, donc ${km} × 1000 = ${fr(answer)} m`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const kg = intBetween(rng, 2, 250)
      const answer = kg * 1000
      return {
        text: `Combien de grammes pèsent ${kg} kilogrammes ?`,
        answer: fr(answer),
        distractors: [fr(kg * 100), fr(kg / 1000), ...numericDistractors(rng, answer)],
        explanation: `1 kg = 1000 g, donc ${kg} × 1000 = ${fr(answer)} g`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const celsius = intBetween(rng, -40, 120)
      const answer = celsius + 273.15
      return {
        text: `À combien de kelvins correspond une température de ${celsius} °C ?`,
        answer: `${fr(answer, 2)} K`,
        distractors: [
          `${fr(celsius - 273.15, 2)} K`,
          `${fr(celsius, 2)} K`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} K`),
        ],
        explanation: `${celsius} + 273,15 = ${fr(answer, 2)} K`,
      }
    },
  },

  // ---------------------------------------------------------------- BEPC ---
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const kmh = intBetween(rng, 18, 360)
      const answer = kmh / 3.6
      return {
        text: `À combien de mètres par seconde correspond une vitesse de ${kmh} km/h ?`,
        answer: `${fr(answer, 2)} m/s`,
        distractors: [
          `${fr(kmh * 3.6, 2)} m/s`,
          `${fr(kmh / 3, 2)} m/s`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} m/s`),
        ],
        explanation: `${kmh} ÷ 3,6 = ${fr(answer, 2)} m/s`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const distance = intBetween(rng, 20, 900)
      const duration = intBetween(rng, 2, 30)
      const answer = distance / duration
      return {
        text: `Un mobile parcourt ${distance} m en ${duration} s. Quelle est sa vitesse moyenne ?`,
        answer: `${fr(answer, 2)} m/s`,
        distractors: [
          `${fr(distance * duration, 2)} m/s`,
          `${fr(duration / distance, 4)} m/s`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} m/s`),
        ],
        explanation: `v = d/t = ${distance} ÷ ${duration} = ${fr(answer, 2)} m/s`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const mass = intBetween(rng, 2, 120)
      const answer = mass * G
      return {
        text: `Quel est le poids d’un objet de ${mass} kg sur Terre, avec g = 9,81 N/kg ?`,
        answer: `${fr(answer, 2)} N`,
        distractors: [
          `${fr(mass, 2)} N`,
          `${fr(mass / G, 2)} N`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} N`),
        ],
        explanation: `P = m × g = ${mass} × 9,81 = ${fr(answer, 2)} N`,
      }
    },
  },

  // ----------------------------------------------------------------- BAC ---
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const r = intBetween(rng, 4, 200)
      const i = pick(rng, [0.1, 0.2, 0.5, 1, 1.5, 2, 3, 5])
      const answer = r * i
      return {
        text: `Quelle tension apparaît aux bornes d’une résistance de ${r} Ω traversée par un courant de ${fr(i)} A ?`,
        answer: `${fr(answer, 2)} V`,
        distractors: [
          `${fr(r / i, 2)} V`,
          `${fr(r + i, 2)} V`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} V`),
        ],
        explanation: `U = R × I = ${r} × ${fr(i)} = ${fr(answer, 2)} V`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const u = intBetween(rng, 5, 400)
      const i = pick(rng, [0.5, 1, 2, 3, 5, 10])
      const answer = u * i
      return {
        text: `Quelle puissance consomme un appareil sous ${u} V parcouru par ${fr(i)} A ?`,
        answer: `${fr(answer, 1)} W`,
        distractors: [
          `${fr(u / i, 1)} W`,
          `${fr(u + i, 1)} W`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} W`),
        ],
        explanation: `P = U × I = ${u} × ${fr(i)} = ${fr(answer, 1)} W`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const mass = intBetween(rng, 2, 80)
      const height = intBetween(rng, 2, 60)
      const answer = mass * G * height
      return {
        text: `Quelle est l’énergie potentielle de pesanteur d’un corps de ${mass} kg situé à ${height} m de hauteur ?`,
        answer: `${fr(answer, 1)} J`,
        distractors: [
          `${fr(mass * height, 1)} J`,
          `${fr(0.5 * mass * height * height, 1)} J`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} J`),
        ],
        explanation: `Ep = m·g·h = ${mass} × 9,81 × ${height} = ${fr(answer, 1)} J`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const mass = intBetween(rng, 2, 60)
      const accel = intBetween(rng, 2, 25)
      const answer = mass * accel
      return {
        text: `Quelle force faut-il appliquer à une masse de ${mass} kg pour lui communiquer une accélération de ${accel} m/s² ?`,
        answer: `${fr(answer)} N`,
        distractors: [
          `${fr(mass + accel)} N`,
          `${fr(mass / accel, 2)} N`,
          ...numericDistractors(rng, answer).map(v => `${v} N`),
        ],
        explanation: `F = m × a = ${mass} × ${accel} = ${fr(answer)} N`,
      }
    },
  },

  // ------------------------------------------------------------- LICENCE ---
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const mass = intBetween(rng, 2, 50)
      const speed = intBetween(rng, 2, 40)
      const answer = 0.5 * mass * speed * speed
      return {
        text: `Quelle est l’énergie cinétique d’un corps de ${mass} kg lancé à ${speed} m/s ?`,
        answer: `${fr(answer, 1)} J`,
        distractors: [
          `${fr(mass * speed, 1)} J`,
          `${fr(mass * speed * speed, 1)} J`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} J`),
        ],
        explanation: `Ec = ½mv² = 0,5 × ${mass} × ${speed}² = ${fr(answer, 1)} J`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const freq = pick(rng, [50, 100, 200, 400, 500, 800, 1000, 2000])
      const answer = 1 / freq
      return {
        text: `Quelle est la période d’un signal de fréquence ${fr(freq)} Hz ?`,
        answer: `${fr(answer * 1000, 3)} ms`,
        distractors: [
          `${fr(freq / 1000, 3)} ms`,
          `${fr(answer, 3)} ms`,
          ...numericDistractors(rng, answer * 1000, { decimals: 3 }).map(v => `${v} ms`),
        ],
        explanation: `T = 1/f = 1 ÷ ${fr(freq)} = ${fr(answer * 1000, 3)} ms`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const mass = intBetween(rng, 100, 9000)
      const volume = intBetween(rng, 2, 40)
      const answer = mass / volume
      return {
        text: `Quelle est la masse volumique d’un corps de ${fr(mass)} g occupant ${volume} cm³ ?`,
        answer: `${fr(answer, 2)} g/cm³`,
        distractors: [
          `${fr(volume / mass, 4)} g/cm³`,
          `${fr(mass * volume, 2)} g/cm³`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} g/cm³`),
        ],
        explanation: `ρ = m/V = ${fr(mass)} ÷ ${volume} = ${fr(answer, 2)} g/cm³`,
      }
    },
  },

  // -------------------------------------------------------------- MASTER ---
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const freqMhz = intBetween(rng, 20, 3000)
      // λ = c/f, avec c = 3×10⁸ m/s
      const answer = 3e8 / (freqMhz * 1e6)
      return {
        text: `Quelle est la longueur d’onde d’une onde électromagnétique de ${fr(freqMhz)} MHz dans le vide ?`,
        answer: `${fr(answer, 3)} m`,
        distractors: [
          `${fr(freqMhz / 300, 3)} m`,
          `${fr(answer * 10, 3)} m`,
          ...numericDistractors(rng, answer, { decimals: 3 }).map(v => `${v} m`),
        ],
        explanation: `λ = c/f = 3×10⁸ ÷ ${fr(freqMhz * 1e6)} = ${fr(answer, 3)} m`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const height = intBetween(rng, 3, 900)
      // Chute libre sans vitesse initiale : v = √(2gh)
      const answer = Math.sqrt(2 * G * height)
      return {
        text: `Quelle vitesse atteint un corps lâché sans vitesse initiale après une chute de ${height} m, en négligeant les frottements ?`,
        answer: `${fr(answer, 2)} m/s`,
        distractors: [
          `${fr(G * height, 2)} m/s`,
          `${fr(Math.sqrt(G * height), 2)} m/s`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} m/s`),
        ],
        explanation: `v = √(2gh) = √(2 × 9,81 × ${height}) = ${fr(answer, 2)} m/s`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const length = intBetween(rng, 10, 600) / 100
      // Pendule simple : T = 2π√(L/g)
      const answer = 2 * Math.PI * Math.sqrt(length / G)
      return {
        text: `Quelle est la période d’un pendule simple de ${fr(length)} m de longueur ?`,
        answer: `${fr(answer, 2)} s`,
        distractors: [
          `${fr(Math.sqrt(length / G), 2)} s`,
          `${fr(2 * Math.PI * length, 2)} s`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} s`),
        ],
        explanation: `T = 2π√(L/g) = 2π√(${fr(length)}/9,81) = ${fr(answer, 2)} s`,
      }
    },
  },

  // ------------------------------------------------------------ DOCTORAT ---
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const massKg = intBetween(rng, 1, 400) / 10
      // E = mc², avec c = 3×10⁸ m/s
      const joules = massKg * 9e16
      return {
        text: `Quelle énergie libérerait la conversion intégrale de ${fr(massKg)} kg de matière, selon E = mc² ?`,
        answer: `${fr(joules / 1e15, 3)} × 10¹⁵ J`,
        distractors: [
          `${fr(massKg * 3e8 / 1e15, 6)} × 10¹⁵ J`,
          `${fr(joules / 1e12, 3)} × 10¹⁵ J`,
          `${fr(joules / 1e18, 3)} × 10¹⁵ J`,
          `${fr(joules / 1e15 + 1, 3)} × 10¹⁵ J`,
        ],
        explanation: `E = ${fr(massKg)} × (3×10⁸)² = ${fr(joules / 1e15, 3)} × 10¹⁵ J`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const beta = intBetween(rng, 10, 99) / 100
      // Facteur de Lorentz γ = 1/√(1 − v²/c²)
      const answer = 1 / Math.sqrt(1 - beta * beta)
      return {
        text: `Quel est le facteur de Lorentz pour un mobile allant à ${fr(beta * 100)} % de la vitesse de la lumière ?`,
        answer: fr(answer, 3),
        distractors: [
          fr(Math.sqrt(1 - beta * beta), 3),
          fr(1 + beta, 3),
          ...numericDistractors(rng, answer, { decimals: 3 }),
        ],
        explanation: `γ = 1/√(1 − ${fr(beta)}²) = ${fr(answer, 3)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const solarMasses = intBetween(rng, 1, 300)
      // Rayon de Schwarzschild : environ 2,95 km par masse solaire.
      const answer = 2.95 * solarMasses
      return {
        text: `Quel est le rayon de Schwarzschild d’un trou noir de ${solarMasses} masse${solarMasses > 1 ? 's' : ''} solaire${solarMasses > 1 ? 's' : ''} ?`,
        answer: `${fr(answer, 2)} km`,
        distractors: [
          `${fr(solarMasses, 2)} km`,
          `${fr(answer * 10, 2)} km`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} km`),
        ],
        explanation: `R = 2GM/c² ≈ 2,95 km par masse solaire, soit ${fr(answer, 2)} km`,
      }
    },
  },
]

export const CATEGORY_NAME = CATEGORY
