// Générateur de questions de télécommunications.
//
// Débits, décibels, capacité de canal, bilan de liaison : le domaine se prête
// bien au calcul, à condition de choisir des valeurs qui tombent rond.

import { fr, intBetween, numericDistractors, pick } from './kit.mjs'

const CATEGORY = 'Télécommunications'

export const TEMPLATES = [
  // ----------------------------------------------------------------- CEP ---
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const mbps = intBetween(rng, 2, 900)
      const answer = mbps * 1000
      return {
        text: `Combien de kilobits par seconde représentent ${mbps} Mbit/s ?`,
        answer: fr(answer),
        distractors: [fr(mbps * 8), fr(mbps / 1000), ...numericDistractors(rng, answer)],
        explanation: `1 Mbit/s = 1000 kbit/s, donc ${mbps} × 1000 = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const mo = intBetween(rng, 2, 500)
      const answer = mo * 8
      return {
        text: `Combien de mégabits représentent ${mo} mégaoctets ?`,
        answer: fr(answer),
        distractors: [fr(mo / 8), fr(mo * 1024), ...numericDistractors(rng, answer)],
        explanation: `1 octet = 8 bits, donc ${mo} × 8 = ${fr(answer)} Mbit`,
      }
    },
  },

  // ---------------------------------------------------------------- BEPC ---
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const mo = intBetween(rng, 10, 4000)
      const mbps = pick(rng, [1, 2, 4, 5, 8, 10, 20, 25, 50, 100, 200])
      const answer = (mo * 8) / mbps
      return {
        text: `Combien de secondes faut-il pour télécharger ${mo} Mo à ${mbps} Mbit/s ?`,
        answer: `${fr(answer, 1)} s`,
        distractors: [
          `${fr(mo / mbps, 1)} s`,
          `${fr(mo * mbps, 1)} s`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} s`),
        ],
        explanation: `${mo} Mo = ${fr(mo * 8)} Mbit ; ÷ ${mbps} = ${fr(answer, 1)} s`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const ghz = intBetween(rng, 5, 600) / 10
      const answer = ghz * 1000
      return {
        text: `À combien de mégahertz correspond une fréquence de ${fr(ghz)} GHz ?`,
        answer: `${fr(answer)} MHz`,
        distractors: [
          `${fr(ghz * 100)} MHz`,
          `${fr(ghz)} MHz`,
          ...numericDistractors(rng, answer).map(v => `${v} MHz`),
        ],
        explanation: `1 GHz = 1000 MHz, donc ${fr(ghz)} × 1000 = ${fr(answer)} MHz`,
      }
    },
  },

  // ----------------------------------------------------------------- BAC ---
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const ratio = Math.pow(10, intBetween(rng, 1, 12))
      const answer = 10 * Math.log10(ratio)
      return {
        text: `Quel gain en décibels correspond à une amplification en puissance d’un facteur ${fr(ratio)} ?`,
        answer: `${fr(answer)} dB`,
        distractors: [
          `${fr(20 * Math.log10(ratio))} dB`,
          `${fr(ratio)} dB`,
          ...numericDistractors(rng, answer).map(v => `${v} dB`),
        ],
        explanation: `10 × log₁₀(${fr(ratio)}) = ${fr(answer)} dB`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const db = intBetween(rng, 1, 24) * 10
      const answer = Math.pow(10, db / 10)
      return {
        text: `À quel rapport de puissance correspond un gain de ${db} dB ?`,
        answer: fr(answer),
        distractors: [fr(db * 10), fr(Math.pow(10, db / 20)), ...numericDistractors(rng, answer)],
        explanation: `10^(${db}/10) = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const hours = intBetween(rng, 1, 72)
      const mbps = intBetween(rng, 1, 200)
      // Débit × durée, converti en gigaoctets.
      const answer = (mbps * hours * 3600) / 8 / 1000
      return {
        text: `Quel volume de données transfère une liaison à ${mbps} Mbit/s utilisée pendant ${hours} heure${hours > 1 ? 's' : ''} ?`,
        answer: `${fr(answer, 2)} Go`,
        distractors: [
          `${fr(mbps * hours, 2)} Go`,
          `${fr(answer * 8, 2)} Go`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} Go`),
        ],
        explanation: `${mbps} × ${hours} × 3600 ÷ 8 ÷ 1000 = ${fr(answer, 2)} Go`,
      }
    },
  },

  // ------------------------------------------------------------- LICENCE ---
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const bandwidth = intBetween(rng, 1, 60)
      const snrRatio = Math.pow(2, intBetween(rng, 1, 12)) - 1
      // Shannon : C = B log₂(1 + S/N), choisi pour donner un entier.
      const answer = bandwidth * Math.log2(1 + snrRatio)
      return {
        text: `Quelle est la capacité d’un canal de ${bandwidth} MHz avec un rapport signal sur bruit de ${snrRatio} ?`,
        answer: `${fr(answer)} Mbit/s`,
        distractors: [
          `${fr(bandwidth * snrRatio)} Mbit/s`,
          `${fr(bandwidth)} Mbit/s`,
          ...numericDistractors(rng, answer).map(v => `${v} Mbit/s`),
        ],
        explanation: `C = B log₂(1 + S/N) = ${bandwidth} × log₂(${snrRatio + 1}) = ${fr(answer)} Mbit/s`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const bandwidth = intBetween(rng, 1, 40)
      const states = Math.pow(2, intBetween(rng, 1, 10))
      // Nyquist : débit maximal = 2 B log₂(M)
      const answer = 2 * bandwidth * Math.log2(states)
      return {
        text: `Selon Nyquist, quel débit maximal permet un canal de ${bandwidth} MHz avec une modulation à ${states} états ?`,
        answer: `${fr(answer)} Mbit/s`,
        distractors: [
          `${fr(bandwidth * Math.log2(states))} Mbit/s`,
          `${fr(2 * bandwidth * states)} Mbit/s`,
          ...numericDistractors(rng, answer).map(v => `${v} Mbit/s`),
        ],
        explanation: `2 × ${bandwidth} × log₂(${states}) = ${fr(answer)} Mbit/s`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const states = Math.pow(2, intBetween(rng, 2, 16))
      const answer = Math.log2(states)
      return {
        text: `Combien de bits transporte chaque symbole d’une modulation à ${states} états ?`,
        answer: fr(answer),
        distractors: [fr(states / 2), fr(states), ...numericDistractors(rng, answer)],
        explanation: `log₂(${states}) = ${fr(answer)} bits par symbole`,
      }
    },
  },

  // -------------------------------------------------------------- MASTER ---
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const km = intBetween(rng, 1, 80)
      const mhz = intBetween(rng, 300, 6000)
      // Affaiblissement en espace libre : 32,44 + 20log10(d_km) + 20log10(f_MHz)
      const answer = 32.44 + 20 * Math.log10(km) + 20 * Math.log10(mhz)
      return {
        text: `Quel est l’affaiblissement en espace libre sur ${km} km à ${fr(mhz)} MHz ?`,
        answer: `${fr(answer, 1)} dB`,
        distractors: [
          `${fr(answer - 32.44, 1)} dB`,
          `${fr(20 * Math.log10(km * mhz), 1)} dB`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} dB`),
        ],
        explanation: `32,44 + 20log₁₀(${km}) + 20log₁₀(${fr(mhz)}) = ${fr(answer, 1)} dB`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const km = intBetween(rng, 5, 400)
      const lossPerKm = intBetween(rng, 15, 45) / 100
      const answer = km * lossPerKm
      return {
        text: `Quelle atténuation subit un signal optique sur ${km} km de fibre à ${fr(lossPerKm)} dB/km ?`,
        answer: `${fr(answer, 1)} dB`,
        distractors: [
          `${fr(km / lossPerKm, 1)} dB`,
          `${fr(km, 1)} dB`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} dB`),
        ],
        explanation: `${km} × ${fr(lossPerKm)} = ${fr(answer, 1)} dB`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const km = intBetween(rng, 50, 40000)
      // Propagation à 300 000 km/s, aller simple.
      const answer = (km / 300000) * 1000
      return {
        text: `Quel délai de propagation introduit une liaison radio de ${fr(km)} km ?`,
        answer: `${fr(answer, 3)} ms`,
        distractors: [
          `${fr(answer * 2, 3)} ms`,
          `${fr(km / 300, 3)} ms`,
          ...numericDistractors(rng, answer, { decimals: 3 }).map(v => `${v} ms`),
        ],
        explanation: `${fr(km)} ÷ 300 000 km/s = ${fr(answer, 3)} ms`,
      }
    },
  },

  // ------------------------------------------------------------ DOCTORAT ---
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const antennas = intBetween(rng, 2, 256)
      const answer = 10 * Math.log10(antennas)
      return {
        text: `Quel gain de réseau apporte la formation de faisceau avec ${antennas} antennes en émission cohérente ?`,
        answer: `${fr(answer, 1)} dB`,
        distractors: [
          `${fr(antennas, 1)} dB`,
          `${fr(20 * Math.log10(antennas), 1)} dB`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} dB`),
        ],
        explanation: `10 log₁₀(${antennas}) = ${fr(answer, 1)} dB`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const tx = pick(rng, [2, 4, 8])
      const rx = pick(rng, [2, 4, 8])
      const answer = Math.min(tx, rx)
      return {
        text: `Combien de flux spatiaux au maximum un système MIMO ${tx}×${rx} peut-il transporter ?`,
        answer: fr(answer),
        distractors: [fr(tx * rx), fr(tx + rx), fr(Math.max(tx, rx)), fr(answer + 1)],
        explanation: `Le nombre de flux est borné par min(${tx}, ${rx}) = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const bandwidthMhz = intBetween(rng, 1, 400)
      // Bruit thermique : −174 dBm/Hz + 10log10(B en Hz)
      const answer = -174 + 10 * Math.log10(bandwidthMhz * 1e6)
      return {
        text: `Quel est le plancher de bruit thermique d’un récepteur sur une bande de ${bandwidthMhz} MHz à température ambiante ?`,
        answer: `${fr(answer, 1)} dBm`,
        distractors: [
          `${fr(-174, 1)} dBm`,
          `${fr(answer + 30, 1)} dBm`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} dBm`),
        ],
        explanation: `−174 + 10log₁₀(${fr(bandwidthMhz * 1e6)}) = ${fr(answer, 1)} dBm`,
      }
    },
  },
]

export const CATEGORY_NAME = CATEGORY
