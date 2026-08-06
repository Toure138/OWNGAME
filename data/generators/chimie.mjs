// Générateur de questions de chimie.
//
// Les masses molaires sont recalculées à partir d'une table de masses atomiques,
// jamais recopiées : ajouter une molécule à la table suffit, et aucune valeur ne
// peut être en désaccord avec une autre.

import { de, fr, intBetween, numericDistractors, pick, sup } from './kit.mjs'

const CATEGORY = 'Chimie'

/** Masses atomiques usuelles, en g/mol. */
const ATOMS = {
  H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, Si: 28,
  P: 31, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56, Cu: 63.5, Zn: 65, Ag: 108,
}

/** Molécules décrites par leur composition, la masse molaire en découle. */
const MOLECULES = [
  { formula: 'H₂O', name: 'l’eau', atoms: { H: 2, O: 1 } },
  { formula: 'CO₂', name: 'le dioxyde de carbone', atoms: { C: 1, O: 2 } },
  { formula: 'NaCl', name: 'le chlorure de sodium', atoms: { Na: 1, Cl: 1 } },
  { formula: 'CH₄', name: 'le méthane', atoms: { C: 1, H: 4 } },
  { formula: 'NH₃', name: 'l’ammoniac', atoms: { N: 1, H: 3 } },
  { formula: 'C₆H₁₂O₆', name: 'le glucose', atoms: { C: 6, H: 12, O: 6 } },
  { formula: 'H₂SO₄', name: 'l’acide sulfurique', atoms: { H: 2, S: 1, O: 4 } },
  { formula: 'CaCO₃', name: 'le carbonate de calcium', atoms: { Ca: 1, C: 1, O: 3 } },
  { formula: 'HCl', name: 'le chlorure d’hydrogène', atoms: { H: 1, Cl: 1 } },
  { formula: 'C₂H₅OH', name: 'l’éthanol', atoms: { C: 2, H: 6, O: 1 } },
  { formula: 'NaOH', name: 'l’hydroxyde de sodium', atoms: { Na: 1, O: 1, H: 1 } },
  { formula: 'HNO₃', name: 'l’acide nitrique', atoms: { H: 1, N: 1, O: 3 } },
  { formula: 'CaO', name: 'l’oxyde de calcium', atoms: { Ca: 1, O: 1 } },
  { formula: 'Fe₂O₃', name: 'l’oxyde de fer(III)', atoms: { Fe: 2, O: 3 } },
  { formula: 'C₃H₈', name: 'le propane', atoms: { C: 3, H: 8 } },
  { formula: 'O₂', name: 'le dioxygène', atoms: { O: 2 } },
  { formula: 'N₂', name: 'le diazote', atoms: { N: 2 } },
  { formula: 'SO₂', name: 'le dioxyde de soufre', atoms: { S: 1, O: 2 } },
  { formula: 'SO₃', name: 'le trioxyde de soufre', atoms: { S: 1, O: 3 } },
  { formula: 'CO', name: 'le monoxyde de carbone', atoms: { C: 1, O: 1 } },
  { formula: 'NO', name: 'le monoxyde d’azote', atoms: { N: 1, O: 1 } },
  { formula: 'NO₂', name: 'le dioxyde d’azote', atoms: { N: 1, O: 2 } },
  { formula: 'N₂O', name: 'le protoxyde d’azote', atoms: { N: 2, O: 1 } },
  { formula: 'H₂O₂', name: 'le peroxyde d’hydrogène', atoms: { H: 2, O: 2 } },
  { formula: 'H₂S', name: 'le sulfure d’hydrogène', atoms: { H: 2, S: 1 } },
  { formula: 'H₃PO₄', name: 'l’acide phosphorique', atoms: { H: 3, P: 1, O: 4 } },
  { formula: 'KCl', name: 'le chlorure de potassium', atoms: { K: 1, Cl: 1 } },
  { formula: 'KOH', name: 'l’hydroxyde de potassium', atoms: { K: 1, O: 1, H: 1 } },
  { formula: 'K₂O', name: 'l’oxyde de potassium', atoms: { K: 2, O: 1 } },
  { formula: 'Na₂O', name: 'l’oxyde de sodium', atoms: { Na: 2, O: 1 } },
  { formula: 'Na₂CO₃', name: 'le carbonate de sodium', atoms: { Na: 2, C: 1, O: 3 } },
  { formula: 'NaHCO₃', name: 'l’hydrogénocarbonate de sodium', atoms: { Na: 1, H: 1, C: 1, O: 3 } },
  { formula: 'MgO', name: 'l’oxyde de magnésium', atoms: { Mg: 1, O: 1 } },
  { formula: 'MgCl₂', name: 'le chlorure de magnésium', atoms: { Mg: 1, Cl: 2 } },
  { formula: 'Mg(OH)₂', name: 'l’hydroxyde de magnésium', atoms: { Mg: 1, O: 2, H: 2 } },
  { formula: 'CaCl₂', name: 'le chlorure de calcium', atoms: { Ca: 1, Cl: 2 } },
  { formula: 'Ca(OH)₂', name: 'l’hydroxyde de calcium', atoms: { Ca: 1, O: 2, H: 2 } },
  { formula: 'Al₂O₃', name: 'l’alumine', atoms: { Al: 2, O: 3 } },
  { formula: 'SiO₂', name: 'la silice', atoms: { Si: 1, O: 2 } },
  { formula: 'CuO', name: 'l’oxyde de cuivre(II)', atoms: { Cu: 1, O: 1 } },
  { formula: 'CuSO₄', name: 'le sulfate de cuivre(II)', atoms: { Cu: 1, S: 1, O: 4 } },
  { formula: 'ZnO', name: 'l’oxyde de zinc', atoms: { Zn: 1, O: 1 } },
  { formula: 'ZnCl₂', name: 'le chlorure de zinc', atoms: { Zn: 1, Cl: 2 } },
  { formula: 'FeO', name: 'l’oxyde de fer(II)', atoms: { Fe: 1, O: 1 } },
  { formula: 'FeCl₃', name: 'le chlorure de fer(III)', atoms: { Fe: 1, Cl: 3 } },
  { formula: 'AgCl', name: 'le chlorure d’argent', atoms: { Ag: 1, Cl: 1 } },
  { formula: 'AgNO₃', name: 'le nitrate d’argent', atoms: { Ag: 1, N: 1, O: 3 } },
  { formula: 'NH₄Cl', name: 'le chlorure d’ammonium', atoms: { N: 1, H: 4, Cl: 1 } },
  { formula: 'CH₃OH', name: 'le méthanol', atoms: { C: 1, H: 4, O: 1 } },
  { formula: 'CH₃COOH', name: 'l’acide acétique', atoms: { C: 2, H: 4, O: 2 } },
  { formula: 'C₂H₆', name: 'l’éthane', atoms: { C: 2, H: 6 } },
  { formula: 'C₂H₄', name: 'l’éthylène', atoms: { C: 2, H: 4 } },
  { formula: 'C₂H₂', name: 'l’acétylène', atoms: { C: 2, H: 2 } },
  { formula: 'C₄H₁₀', name: 'le butane', atoms: { C: 4, H: 10 } },
  { formula: 'C₆H₆', name: 'le benzène', atoms: { C: 6, H: 6 } },
  { formula: 'CCl₄', name: 'le tétrachlorométhane', atoms: { C: 1, Cl: 4 } },
  { formula: 'CS₂', name: 'le disulfure de carbone', atoms: { C: 1, S: 2 } },
  { formula: 'PCl₃', name: 'le trichlorure de phosphore', atoms: { P: 1, Cl: 3 } },
]

const molarMass = m =>
  Object.entries(m.atoms).reduce((sum, [el, n]) => sum + ATOMS[el] * n, 0)

const atomCount = m => Object.values(m.atoms).reduce((a, b) => a + b, 0)

export const TEMPLATES = [
  // ----------------------------------------------------------------- CEP ---
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const m = pick(rng, MOLECULES)
      const answer = atomCount(m)
      return {
        text: `Combien d’atomes compte une molécule de ${m.formula} ?`,
        answer: fr(answer),
        distractors: [
          fr(Object.keys(m.atoms).length),
          fr(answer + 1),
          fr(answer - 1),
          fr(answer * 2),
        ],
        explanation: `${m.formula} contient ${fr(answer)} atomes au total`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const m = pick(rng, MOLECULES.filter(x => Object.keys(x.atoms).length > 1))
      const elements = Object.keys(m.atoms)
      const answer = elements.length
      return {
        text: `Combien d’éléments chimiques différents composent ${m.formula} ?`,
        answer: fr(answer),
        distractors: [fr(atomCount(m)), fr(answer + 1), fr(answer + 2), fr(answer + 3)],
        explanation: `${m.formula} est formé de ${elements.join(', ')}`,
      }
    },
  },

  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const m = pick(rng, MOLECULES)
      return {
        text: `Quelle est la formule chimique ${de(m.name)} ?`,
        answer: m.formula,
        distractors: MOLECULES.filter(x => x.formula !== m.formula)
          .slice(0, 40)
          .map(x => x.formula),
        explanation: `${m.name.charAt(0).toUpperCase()}${m.name.slice(1)} s’écrit ${m.formula}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const m = pick(rng, MOLECULES.filter(x => x.atoms.O))
      const answer = m.atoms.O
      return {
        text: `Combien d’atomes d’oxygène compte une molécule de ${m.formula} ?`,
        answer: fr(answer),
        distractors: [fr(atomCount(m)), fr(answer + 1), fr(answer + 2), fr(answer + 3)],
        explanation: `${m.formula} contient ${fr(answer)} atome${answer > 1 ? 's' : ''} d’oxygène`,
      }
    },
  },

  // ---------------------------------------------------------------- BEPC ---
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const a = pick(rng, MOLECULES)
      const b = pick(rng, MOLECULES)
      if (a.formula === b.formula || molarMass(a) === molarMass(b)) return null
      const heavier = molarMass(a) > molarMass(b) ? a : b
      return {
        text: `Laquelle de ces deux molécules est la plus lourde : ${a.formula} ou ${b.formula} ?`,
        answer: heavier.formula,
        distractors: [
          heavier.formula === a.formula ? b.formula : a.formula,
          'Elles ont la même masse',
          'Impossible à déterminer',
          'Ni l’une ni l’autre',
        ],
        explanation: `M(${a.formula}) = ${fr(molarMass(a))} g/mol et M(${b.formula}) = ${fr(molarMass(b))} g/mol`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const m = pick(rng, MOLECULES)
      const answer = molarMass(m)
      return {
        text: `Quelle est la masse molaire de ${m.formula} ?`,
        answer: `${fr(answer)} g/mol`,
        distractors: [
          `${fr(atomCount(m))} g/mol`,
          `${fr(answer * 2)} g/mol`,
          ...numericDistractors(rng, answer).map(v => `${v} g/mol`),
        ],
        explanation: `En sommant les masses atomiques : ${fr(answer)} g/mol`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const el = pick(rng, ['H', 'C', 'N', 'O', 'Na', 'Mg', 'S', 'K', 'Ca', 'Fe'])
      const answer = ATOMS[el]
      return {
        text: `Quelle est la masse molaire atomique de l’élément ${el} ?`,
        answer: `${fr(answer)} g/mol`,
        distractors: [
          `${fr(answer * 2)} g/mol`,
          `${fr(answer + 2)} g/mol`,
          `${fr(answer - 2)} g/mol`,
          `${fr(answer + 8)} g/mol`,
        ],
        explanation: `La masse molaire de ${el} vaut ${fr(answer)} g/mol`,
      }
    },
  },

  // ----------------------------------------------------------------- BAC ---
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const m = pick(rng, MOLECULES)
      const M = molarMass(m)
      const moles = pick(rng, [0.5, 1, 2, 2.5, 3, 4, 5, 10])
      const answer = moles * M
      return {
        text: `Quelle masse représente ${fr(moles)} mol de ${m.formula} ?`,
        answer: `${fr(answer, 1)} g`,
        distractors: [
          `${fr(M / moles, 1)} g`,
          `${fr(M, 1)} g`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} g`),
        ],
        explanation: `m = n × M = ${fr(moles)} × ${fr(M)} = ${fr(answer, 1)} g`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const m = pick(rng, MOLECULES)
      const M = molarMass(m)
      const mass = M * pick(rng, [1, 2, 3, 4, 5])
      const answer = mass / M
      return {
        text: `Combien de moles contient un échantillon de ${fr(mass)} g de ${m.formula} ?`,
        answer: `${fr(answer)} mol`,
        distractors: [
          `${fr(mass * M)} mol`,
          `${fr(M / mass, 3)} mol`,
          ...numericDistractors(rng, answer).map(v => `${v} mol`),
        ],
        explanation: `n = m/M = ${fr(mass)} ÷ ${fr(M)} = ${fr(answer)} mol`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const moles = pick(rng, [0.1, 0.2, 0.25, 0.5, 1, 2])
      const litres = pick(rng, [0.1, 0.25, 0.5, 1, 2, 4, 5])
      const answer = moles / litres
      return {
        text: `Quelle est la concentration d’une solution contenant ${fr(moles)} mol de soluté dans ${fr(litres)} L ?`,
        answer: `${fr(answer, 3)} mol/L`,
        distractors: [
          `${fr(moles * litres, 3)} mol/L`,
          `${fr(litres / moles, 3)} mol/L`,
          ...numericDistractors(rng, answer, { decimals: 3 }).map(v => `${v} mol/L`),
        ],
        explanation: `C = n/V = ${fr(moles)} ÷ ${fr(litres)} = ${fr(answer, 3)} mol/L`,
      }
    },
  },

  // ------------------------------------------------------------- LICENCE ---
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const exponent = intBetween(rng, 1, 12)
      const answer = exponent
      return {
        text: `Quel est le pH d’une solution dont la concentration en ions H⁺ vaut 10${sup('-' + exponent)} mol/L ?`,
        answer: fr(answer),
        distractors: [fr(14 - exponent), fr(-exponent), ...numericDistractors(rng, answer)],
        explanation: `pH = −log[H⁺] = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'MEDIUM',
    build(rng) {
      const ph = intBetween(rng, 1, 13)
      const answer = 14 - ph
      return {
        text: `Quel est le pOH d’une solution aqueuse de pH ${ph} à 25 °C ?`,
        answer: fr(answer),
        distractors: [fr(ph), fr(7 - ph), ...numericDistractors(rng, answer)],
        explanation: `pH + pOH = 14, donc pOH = 14 − ${ph} = ${fr(answer)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const c1 = intBetween(rng, 1, 40) / 4
      const v1 = intBetween(rng, 5, 50) * 5
      const v2 = v1 * pick(rng, [2, 4, 5, 10])
      const answer = (c1 * v1) / v2
      return {
        text: `On dilue ${v1} mL d’une solution à ${fr(c1)} mol/L jusqu’à ${fr(v2)} mL. Quelle est la concentration finale ?`,
        answer: `${fr(answer, 3)} mol/L`,
        distractors: [
          `${fr(c1 * v2 / v1, 3)} mol/L`,
          `${fr(c1, 3)} mol/L`,
          ...numericDistractors(rng, answer, { decimals: 3 }).map(v => `${v} mol/L`),
        ],
        explanation: `C₁V₁ = C₂V₂ donc C₂ = ${fr(c1)} × ${v1} ÷ ${fr(v2)} = ${fr(answer, 3)} mol/L`,
      }
    },
  },

  // -------------------------------------------------------------- MASTER ---
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const m = pick(rng, MOLECULES.filter(x => x.atoms.O))
      const M = molarMass(m)
      const oxygen = (ATOMS.O * m.atoms.O * 100) / M
      return {
        text: `Quel pourcentage massique d’oxygène contient ${m.formula} ?`,
        answer: `${fr(oxygen, 1)} %`,
        distractors: [
          `${fr(100 - oxygen, 1)} %`,
          `${fr((m.atoms.O * 100) / atomCount(m), 1)} %`,
          ...numericDistractors(rng, oxygen, { decimals: 1 }).map(v => `${v} %`),
        ],
        explanation: `${ATOMS.O} × ${m.atoms.O} ÷ ${fr(M)} = ${fr(oxygen, 1)} %`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const moles = pick(rng, [0.5, 1, 2, 3, 5])
      const answer = moles * 22.4
      return {
        text: `Quel volume occupe ${fr(moles)} mol de gaz parfait dans les conditions normales de température et de pression ?`,
        answer: `${fr(answer, 1)} L`,
        distractors: [
          `${fr(moles * 24, 1)} L`,
          `${fr(22.4 / moles, 1)} L`,
          ...numericDistractors(rng, answer, { decimals: 1 }).map(v => `${v} L`),
        ],
        explanation: `Le volume molaire vaut 22,4 L/mol : ${fr(moles)} × 22,4 = ${fr(answer, 1)} L`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const moles = pick(rng, [0.5, 1, 2, 3])
      const answer = moles * 6.02
      return {
        text: `Combien d’entités élémentaires contient ${fr(moles)} mol de matière ?`,
        answer: `${fr(answer, 2)} × 10²³`,
        distractors: [
          `${fr(6.02 / moles, 2)} × 10²³`,
          `${fr(moles, 2)} × 10²³`,
          `${fr(answer * 10, 2)} × 10²³`,
          `${fr(answer / 2, 2)} × 10²³`,
        ],
        explanation: `${fr(moles)} × 6,02 × 10²³ = ${fr(answer, 2)} × 10²³ entités`,
      }
    },
  },

  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const m = pick(rng, MOLECULES.filter(x => x.atoms.C))
      const M = molarMass(m)
      const carbon = (ATOMS.C * m.atoms.C * 100) / M
      return {
        text: `Quel pourcentage massique de carbone contient ${m.formula} ?`,
        answer: `${fr(carbon, 1)} %`,
        distractors: [
          `${fr(100 - carbon, 1)} %`,
          `${fr((m.atoms.C * 100) / atomCount(m), 1)} %`,
          ...numericDistractors(rng, carbon, { decimals: 1 }).map(v => `${v} %`),
        ],
        explanation: `${ATOMS.C} × ${m.atoms.C} ÷ ${fr(M)} = ${fr(carbon, 1)} %`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const m = pick(rng, MOLECULES)
      const M = molarMass(m)
      const grams = intBetween(rng, 2, 60) * 5
      const answer = (grams / M) * 22.4
      return {
        text: `Quel volume occuperaient ${fr(grams)} g de ${m.formula} à l’état gazeux, dans les conditions normales ?`,
        answer: `${fr(answer, 2)} L`,
        distractors: [
          `${fr(grams * 22.4, 2)} L`,
          `${fr(grams / M, 2)} L`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} L`),
        ],
        explanation: `n = ${fr(grams)}/${fr(M)} mol, puis × 22,4 L/mol = ${fr(answer, 2)} L`,
      }
    },
  },

  // ------------------------------------------------------------ DOCTORAT ---
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const pka = intBetween(rng, 20, 110) / 10
      const ratio = Math.pow(10, intBetween(rng, -3, 3))
      const answer = pka + Math.log10(ratio)
      return {
        text: `Selon Henderson-Hasselbalch, quel est le pH d’un tampon de pKa ${fr(pka)} dont le rapport base/acide vaut ${fr(ratio)} ?`,
        answer: fr(answer, 2),
        distractors: [
          fr(pka - Math.log10(ratio), 2),
          fr(pka, 2),
          ...numericDistractors(rng, answer, { decimals: 2 }),
        ],
        explanation: `pH = pKa + log([base]/[acide]) = ${fr(pka)} + ${fr(Math.log10(ratio))} = ${fr(answer, 2)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const halfLives = intBetween(rng, 1, 20)
      const answer = 100 / Math.pow(2, halfLives)
      return {
        text: `Quelle proportion d’un échantillon radioactif subsiste après ${halfLives} période${halfLives > 1 ? 's' : ''} de demi-vie ?`,
        answer: `${fr(answer, 3)} %`,
        distractors: [
          `${fr(100 / (2 * halfLives), 3)} %`,
          `${fr(100 - halfLives * 50, 3)} %`,
          ...numericDistractors(rng, answer, { decimals: 3 }).map(v => `${v} %`),
        ],
        explanation: `Il reste 1/2^${halfLives} de l’échantillon, soit ${fr(answer, 3)} %`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const n = intBetween(rng, 1, 40)
      const t = intBetween(rng, 200, 800)
      // PV = nRT, avec R = 8,314 J/(mol·K), pression en Pa pour V = 1 m³
      const answer = (n * 8.314 * t) / 1000
      return {
        text: `Quelle pression exerce ${n} mol de gaz parfait occupant 1 m³ à ${t} K ?`,
        answer: `${fr(answer, 2)} kPa`,
        distractors: [
          `${fr(n * t / 1000, 2)} kPa`,
          `${fr(answer * 10, 2)} kPa`,
          ...numericDistractors(rng, answer, { decimals: 2 }).map(v => `${v} kPa`),
        ],
        explanation: `P = nRT/V = ${n} × 8,314 × ${t} = ${fr(answer * 1000)} Pa, soit ${fr(answer, 2)} kPa`,
      }
    },
  },
]

export const CATEGORY_NAME = CATEGORY
