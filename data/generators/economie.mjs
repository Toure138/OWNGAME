// Générateur de questions d'économie.
//
// Pourcentages, intérêts, actualisation : les calculs financiers se prêtent au
// même traitement que la physique, avec un piège récurrent à exploiter — deux
// variations successives ne s'additionnent pas.

import { fr, intBetween, numericDistractors, pick } from './kit.mjs'

const CATEGORY = 'Économie'

export const TEMPLATES = [
  // ----------------------------------------------------------------- CEP ---
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const price = intBetween(rng, 4, 120) * 5
      const rate = pick(rng, [10, 20, 25, 50])
      const answer = (price * rate) / 100
      return {
        text: `Quelle remise obtient-on avec ${rate} % de réduction sur un article à ${fr(price)} € ?`,
        answer: `${fr(answer, 2)} €`,
        distractors: [
          `${fr(price - answer, 2)} €`,
          `${fr(rate, 2)} €`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} €`),
        ],
        explanation: `${fr(price)} × ${rate} ÷ 100 = ${fr(answer, 2)} €`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const unit = intBetween(rng, 2, 50)
      const quantity = intBetween(rng, 3, 40)
      const answer = unit * quantity
      return {
        text: `Combien coûtent ${quantity} articles à ${unit} € pièce ?`,
        answer: `${fr(answer)} €`,
        distractors: [
          `${fr(unit + quantity)} €`,
          ...numericDistractors(rng, answer).map(v => `${v} €`),
        ],
        explanation: `${quantity} × ${unit} = ${fr(answer)} €`,
      }
    },
  },

  // ---------------------------------------------------------------- BEPC ---
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const ht = intBetween(rng, 10, 400) * 5
      const rate = pick(rng, [5.5, 10, 20])
      const answer = ht * (1 + rate / 100)
      return {
        text: `Quel est le prix TTC d’un article à ${fr(ht)} € hors taxes, avec une TVA de ${fr(rate)} % ?`,
        answer: `${fr(answer, 2)} €`,
        distractors: [
          `${fr(ht * rate / 100, 2)} €`,
          `${fr(ht, 2)} €`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} €`),
        ],
        explanation: `${fr(ht)} × ${fr(1 + rate / 100)} = ${fr(answer, 2)} €`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const before = intBetween(rng, 20, 500) * 2
      const after = before + intBetween(rng, 5, 200)
      const answer = ((after - before) / before) * 100
      return {
        text: `Un prix passe de ${fr(before)} € à ${fr(after)} €. Quelle est la hausse en pourcentage ?`,
        answer: `${fr(answer, 2)} %`,
        distractors: [
          `${fr(after - before, 2)} %`,
          `${fr(((after - before) / after) * 100, 2)} %`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} %`),
        ],
        explanation: `(${fr(after)} − ${fr(before)}) ÷ ${fr(before)} × 100 = ${fr(answer, 2)} %`,
      }
    },
  },

  // ----------------------------------------------------------------- BAC ---
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const capital = intBetween(rng, 10, 200) * 100
      const rate = pick(rng, [1, 2, 2.5, 3, 4, 5])
      const years = intBetween(rng, 2, 10)
      const answer = (capital * rate * years) / 100
      return {
        text: `Quels intérêts simples rapporte un capital de ${fr(capital)} € placé ${years} ans à ${fr(rate)} % ?`,
        answer: `${fr(answer, 2)} €`,
        distractors: [
          `${fr(capital * rate / 100, 2)} €`,
          `${fr(capital + answer, 2)} €`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} €`),
        ],
        explanation: `${fr(capital)} × ${fr(rate)} % × ${years} = ${fr(answer, 2)} €`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'HARD',
    build(rng) {
      const up = pick(rng, [10, 20, 25, 30, 50])
      const down = pick(rng, [10, 20, 25, 30, 50])
      // Piège classique : les variations successives ne s'additionnent pas.
      const answer = ((1 + up / 100) * (1 - down / 100) - 1) * 100
      return {
        text: `Un prix augmente de ${up} % puis baisse de ${down} %. Quelle est la variation globale ?`,
        answer: `${fr(answer, 2)} %`,
        distractors: [
          `${fr(up - down, 2)} %`,
          `${fr(down - up, 2)} %`,
          `0 %`,
          `${fr(answer + 1, 2)} %`,
        ],
        explanation: `(1 + ${fr(up / 100)}) × (1 − ${fr(down / 100)}) − 1 = ${fr(answer, 2)} %`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const ttc = intBetween(rng, 12, 600) * 2
      const rate = 20
      const answer = ttc / (1 + rate / 100)
      return {
        text: `Quel est le prix hors taxes d’un article vendu ${fr(ttc)} € TTC, avec une TVA à ${rate} % ?`,
        answer: `${fr(answer, 2)} €`,
        distractors: [
          `${fr(ttc * 0.8, 2)} €`,
          `${fr(ttc - rate, 2)} €`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} €`),
        ],
        explanation: `${fr(ttc)} ÷ 1,2 = ${fr(answer, 2)} € — retirer 20 % ne revient pas à diviser par 1,2`,
      }
    },
  },

  // ------------------------------------------------------------- LICENCE ---
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const capital = intBetween(rng, 10, 100) * 100
      const rate = pick(rng, [2, 3, 4, 5, 6, 8])
      const years = intBetween(rng, 3, 20)
      const answer = capital * Math.pow(1 + rate / 100, years)
      return {
        text: `Que devient un capital de ${fr(capital)} € placé ${years} ans à ${rate} % avec intérêts composés ?`,
        answer: `${fr(answer, 2)} €`,
        distractors: [
          `${fr(capital * (1 + (rate * years) / 100), 2)} €`,
          `${fr(capital, 2)} €`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} €`),
        ],
        explanation: `${fr(capital)} × (1 + ${fr(rate / 100)})^${years} = ${fr(answer, 2)} €`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const rate = pick(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12])
      // Règle des 72 : durée approximative de doublement.
      const answer = 72 / rate
      return {
        text: `Selon la règle des 72, en combien d’années un capital double-t-il à ${rate} % par an ?`,
        answer: `${fr(answer, 1)} ans`,
        distractors: [
          `${fr(100 / rate, 1)} ans`,
          `${fr(rate, 1)} ans`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} ans`),
        ],
        explanation: `72 ÷ ${rate} = ${fr(answer, 1)} ans`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const nominal = pick(rng, [2, 3, 4, 5, 6, 8, 10])
      const inflation = pick(rng, [1, 2, 3, 4, 5])
      const answer = nominal - inflation
      return {
        text: `Quel est le taux d’intérêt réel approché pour un taux nominal de ${nominal} % et une inflation de ${inflation} % ?`,
        answer: `${fr(answer)} %`,
        distractors: [
          `${fr(nominal + inflation)} %`,
          `${fr(nominal)} %`,
          ...numericDistractors(rng, answer).map(v => `${v} %`),
        ],
        explanation: `Approximation de Fisher : ${nominal} − ${inflation} = ${fr(answer)} %`,
      }
    },
  },

  // -------------------------------------------------------------- MASTER ---
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const flow = intBetween(rng, 10, 100) * 100
      const rate = pick(rng, [2, 3, 4, 5, 6, 8, 10])
      const years = intBetween(rng, 1, 10)
      const answer = flow / Math.pow(1 + rate / 100, years)
      return {
        text: `Quelle est la valeur actuelle de ${fr(flow)} € perçus dans ${years} an${years > 1 ? 's' : ''}, au taux d’actualisation de ${rate} % ?`,
        answer: `${fr(answer, 2)} €`,
        distractors: [
          `${fr(flow * Math.pow(1 + rate / 100, years), 2)} €`,
          `${fr(flow, 2)} €`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} €`),
        ],
        explanation: `${fr(flow)} ÷ (1 + ${fr(rate / 100)})^${years} = ${fr(answer, 2)} €`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const coupon = intBetween(rng, 10, 80)
      const rate = pick(rng, [2, 4, 5, 8, 10])
      // Rente perpétuelle : valeur = coupon / taux
      const answer = coupon / (rate / 100)
      return {
        text: `Quelle est la valeur d’une rente perpétuelle versant ${coupon} € par an, au taux de ${rate} % ?`,
        answer: `${fr(answer, 2)} €`,
        distractors: [
          `${fr(coupon * rate, 2)} €`,
          `${fr(coupon, 2)} €`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} €`),
        ],
        explanation: `${coupon} ÷ ${fr(rate / 100)} = ${fr(answer, 2)} €`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const reserve = pick(rng, [1, 2, 4, 5, 10, 20, 25])
      const answer = 100 / reserve
      return {
        text: `Quel est le multiplicateur monétaire pour un taux de réserves obligatoires de ${reserve} % ?`,
        answer: fr(answer),
        distractors: [fr(reserve), fr(answer / 2), ...numericDistractors(rng, answer)],
        explanation: `1 ÷ ${fr(reserve / 100)} = ${fr(answer)}`,
      }
    },
  },

  // ------------------------------------------------------------ DOCTORAT ---
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const start = intBetween(rng, 10, 60) * 100
      const factor = pick(rng, [2, 3, 4, 5, 8])
      const end = start * factor
      const years = pick(rng, [2, 3, 4, 5, 10])
      // Taux de croissance annuel moyen : (fin/début)^(1/n) − 1
      const answer = (Math.pow(end / start, 1 / years) - 1) * 100
      return {
        text: `Un indicateur passe de ${fr(start)} à ${fr(end)} en ${years} ans. Quel est son taux de croissance annuel moyen ?`,
        answer: `${fr(answer, 2)} %`,
        distractors: [
          `${fr(((end - start) / start / years) * 100, 2)} %`,
          `${fr(((end - start) / start) * 100, 2)} %`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} %`),
        ],
        explanation: `(${fr(end)}/${fr(start)})^(1/${years}) − 1 = ${fr(answer, 2)} %`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const dq = pick(rng, [2, 4, 5, 8, 10, 15, 20])
      const dp = pick(rng, [2, 4, 5, 10, 20, 25])
      const answer = dq / dp
      return {
        text: `Une hausse de prix de ${dp} % fait reculer la demande de ${dq} %. Quelle est l’élasticité-prix, en valeur absolue ?`,
        answer: fr(answer, 2),
        distractors: [
          fr(dp / dq, 2),
          fr(dq * dp, 2),
          ...numericDistractors(rng, answer, { decimals: 2 }),
        ],
        explanation: `|${dq} % ÷ ${dp} %| = ${fr(answer, 2)} — la demande est ${answer > 1 ? 'élastique' : 'inélastique'}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const riskFree = pick(rng, [1, 2, 3])
      const beta = pick(rng, [0.5, 0.8, 1, 1.2, 1.5, 2])
      const premium = pick(rng, [4, 5, 6, 7])
      // MEDAF : rendement attendu = taux sans risque + β × prime de marché
      const answer = riskFree + beta * premium
      return {
        text: `Selon le MEDAF, quel rendement exiger d’un actif de bêta ${fr(beta)}, avec un taux sans risque de ${riskFree} % et une prime de marché de ${premium} % ?`,
        answer: `${fr(answer, 2)} %`,
        distractors: [
          `${fr(riskFree + premium, 2)} %`,
          `${fr(beta * premium, 2)} %`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} %`),
        ],
        explanation: `${riskFree} + ${fr(beta)} × ${premium} = ${fr(answer, 2)} %`,
      }
    },
  },
]

export const CATEGORY_NAME = CATEGORY
