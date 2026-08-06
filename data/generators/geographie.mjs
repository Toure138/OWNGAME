// Générateur de questions de géographie.
//
// Même méthode qu'en chimie, où les masses molaires se recalculent depuis une
// table d'atomes : les faits sont écrits une seule fois, dans des tables
// vérifiées, et les gabarits les recombinent. Un pays donne sa capitale, son
// continent, sa monnaie, son fleuve ; un sommet donne son altitude et sa chaîne.
//
// La différence avec les mathématiques est réelle et il faut la nommer : ici la
// réponse n'est pas calculée, elle est recopiée depuis la table. La justesse des
// questions produites vaut donc exactement celle de ces tables — mais chaque
// fait n'y est écrit qu'une fois, ce qui le rend relisable, et une correction
// s'y propage à toutes les questions qui en dépendent.

import { de, dans, fr, numericDistractors, pick, shuffled } from './kit.mjs'

const CATEGORY = 'Géographie'

/** Pays : capitale, continent, monnaie. */
const COUNTRIES = [
  ['la France', 'Paris', 'Europe', 'l’euro'],
  ['l’Allemagne', 'Berlin', 'Europe', 'l’euro'],
  ['l’Italie', 'Rome', 'Europe', 'l’euro'],
  ['l’Espagne', 'Madrid', 'Europe', 'l’euro'],
  ['le Portugal', 'Lisbonne', 'Europe', 'l’euro'],
  ['la Belgique', 'Bruxelles', 'Europe', 'l’euro'],
  ['les Pays-Bas', 'Amsterdam', 'Europe', 'l’euro'],
  ['l’Autriche', 'Vienne', 'Europe', 'l’euro'],
  ['la Grèce', 'Athènes', 'Europe', 'l’euro'],
  ['l’Irlande', 'Dublin', 'Europe', 'l’euro'],
  ['la Finlande', 'Helsinki', 'Europe', 'l’euro'],
  ['la Suisse', 'Berne', 'Europe', 'le franc suisse'],
  ['le Royaume-Uni', 'Londres', 'Europe', 'la livre sterling'],
  ['la Suède', 'Stockholm', 'Europe', 'la couronne suédoise'],
  ['la Norvège', 'Oslo', 'Europe', 'la couronne norvégienne'],
  ['le Danemark', 'Copenhague', 'Europe', 'la couronne danoise'],
  ['la Pologne', 'Varsovie', 'Europe', 'le zloty'],
  ['la Tchéquie', 'Prague', 'Europe', 'la couronne tchèque'],
  ['la Hongrie', 'Budapest', 'Europe', 'le forint'],
  ['la Roumanie', 'Bucarest', 'Europe', 'le leu'],
  ['la Bulgarie', 'Sofia', 'Europe', 'le lev'],
  ['la Croatie', 'Zagreb', 'Europe', 'l’euro'],
  ['la Serbie', 'Belgrade', 'Europe', 'le dinar serbe'],
  ['l’Ukraine', 'Kiev', 'Europe', 'la hryvnia'],
  ['la Russie', 'Moscou', 'Europe', 'le rouble'],
  ['l’Islande', 'Reykjavik', 'Europe', 'la couronne islandaise'],

  ['le Maroc', 'Rabat', 'Afrique', 'le dirham'],
  ['l’Algérie', 'Alger', 'Afrique', 'le dinar algérien'],
  ['la Tunisie', 'Tunis', 'Afrique', 'le dinar tunisien'],
  ['l’Égypte', 'Le Caire', 'Afrique', 'la livre égyptienne'],
  ['le Sénégal', 'Dakar', 'Afrique', 'le franc CFA'],
  ['la Côte d’Ivoire', 'Yamoussoukro', 'Afrique', 'le franc CFA'],
  ['le Mali', 'Bamako', 'Afrique', 'le franc CFA'],
  ['le Burkina Faso', 'Ouagadougou', 'Afrique', 'le franc CFA'],
  ['le Niger', 'Niamey', 'Afrique', 'le franc CFA'],
  ['le Bénin', 'Porto-Novo', 'Afrique', 'le franc CFA'],
  ['le Togo', 'Lomé', 'Afrique', 'le franc CFA'],
  ['la Guinée', 'Conakry', 'Afrique', 'le franc guinéen'],
  ['le Cameroun', 'Yaoundé', 'Afrique', 'le franc CFA'],
  ['le Gabon', 'Libreville', 'Afrique', 'le franc CFA'],
  ['le Tchad', 'N’Djaména', 'Afrique', 'le franc CFA'],
  ['le Nigeria', 'Abuja', 'Afrique', 'le naira'],
  ['le Ghana', 'Accra', 'Afrique', 'le cedi'],
  ['le Kenya', 'Nairobi', 'Afrique', 'le shilling kényan'],
  ['l’Éthiopie', 'Addis-Abeba', 'Afrique', 'le birr'],
  ['la Tanzanie', 'Dodoma', 'Afrique', 'le shilling tanzanien'],
  ['l’Afrique du Sud', 'Pretoria', 'Afrique', 'le rand'],
  ['Madagascar', 'Antananarivo', 'Afrique', 'l’ariary'],
  ['l’Angola', 'Luanda', 'Afrique', 'le kwanza'],
  ['le Congo', 'Brazzaville', 'Afrique', 'le franc CFA'],
  ['la Mauritanie', 'Nouakchott', 'Afrique', 'l’ouguiya'],

  ['la Chine', 'Pékin', 'Asie', 'le yuan'],
  ['le Japon', 'Tokyo', 'Asie', 'le yen'],
  ['l’Inde', 'New Delhi', 'Asie', 'la roupie indienne'],
  ['la Corée du Sud', 'Séoul', 'Asie', 'le won'],
  ['la Thaïlande', 'Bangkok', 'Asie', 'le baht'],
  ['le Vietnam', 'Hanoï', 'Asie', 'le dong'],
  ['l’Indonésie', 'Jakarta', 'Asie', 'la roupie indonésienne'],
  ['les Philippines', 'Manille', 'Asie', 'le peso philippin'],
  ['la Malaisie', 'Kuala Lumpur', 'Asie', 'le ringgit'],
  ['le Pakistan', 'Islamabad', 'Asie', 'la roupie pakistanaise'],
  ['le Bangladesh', 'Dacca', 'Asie', 'le taka'],
  ['l’Iran', 'Téhéran', 'Asie', 'le rial'],
  ['l’Irak', 'Bagdad', 'Asie', 'le dinar irakien'],
  ['l’Arabie saoudite', 'Riyad', 'Asie', 'le riyal'],
  ['la Turquie', 'Ankara', 'Asie', 'la livre turque'],
  ['Israël', 'Jérusalem', 'Asie', 'le shekel'],
  ['le Népal', 'Katmandou', 'Asie', 'la roupie népalaise'],
  ['le Sri Lanka', 'Colombo', 'Asie', 'la roupie srilankaise'],
  ['le Kazakhstan', 'Astana', 'Asie', 'le tenge'],
  ['l’Ouzbékistan', 'Tachkent', 'Asie', 'le som'],
  ['la Mongolie', 'Oulan-Bator', 'Asie', 'le tugrik'],

  ['les États-Unis', 'Washington', 'Amérique du Nord', 'le dollar américain'],
  ['le Canada', 'Ottawa', 'Amérique du Nord', 'le dollar canadien'],
  ['le Mexique', 'Mexico', 'Amérique du Nord', 'le peso mexicain'],
  ['Cuba', 'La Havane', 'Amérique du Nord', 'le peso cubain'],
  ['le Guatemala', 'Guatemala', 'Amérique du Nord', 'le quetzal'],
  ['le Costa Rica', 'San José', 'Amérique du Nord', 'le colón'],
  ['Haïti', 'Port-au-Prince', 'Amérique du Nord', 'la gourde'],
  ['le Panama', 'Panama', 'Amérique du Nord', 'le balboa'],

  ['le Brésil', 'Brasilia', 'Amérique du Sud', 'le réal'],
  ['l’Argentine', 'Buenos Aires', 'Amérique du Sud', 'le peso argentin'],
  ['le Chili', 'Santiago', 'Amérique du Sud', 'le peso chilien'],
  ['le Pérou', 'Lima', 'Amérique du Sud', 'le sol'],
  ['la Colombie', 'Bogota', 'Amérique du Sud', 'le peso colombien'],
  ['le Venezuela', 'Caracas', 'Amérique du Sud', 'le bolivar'],
  ['la Bolivie', 'Sucre', 'Amérique du Sud', 'le boliviano'],
  ['l’Uruguay', 'Montevideo', 'Amérique du Sud', 'le peso uruguayen'],
  ['le Paraguay', 'Asuncion', 'Amérique du Sud', 'le guarani'],
  ['l’Équateur', 'Quito', 'Amérique du Sud', 'le dollar américain'],

  ['l’Australie', 'Canberra', 'Océanie', 'le dollar australien'],
  ['la Nouvelle-Zélande', 'Wellington', 'Océanie', 'le dollar néo-zélandais'],
  ['les Fidji', 'Suva', 'Océanie', 'le dollar fidjien'],
  ['la Papouasie-Nouvelle-Guinée', 'Port Moresby', 'Océanie', 'le kina'],
]

/** Fleuves : nom, longueur approximative en km, continent, embouchure. */
const RIVERS = [
  ['le Nil', 6650, 'Afrique', 'la Méditerranée'],
  ['l’Amazone', 6400, 'Amérique du Sud', 'l’océan Atlantique'],
  ['le Yangzi Jiang', 6300, 'Asie', 'la mer de Chine orientale'],
  ['le Mississippi', 3770, 'Amérique du Nord', 'le golfe du Mexique'],
  ['le Congo', 4700, 'Afrique', 'l’océan Atlantique'],
  ['le Niger', 4200, 'Afrique', 'le golfe de Guinée'],
  ['la Volga', 3530, 'Europe', 'la mer Caspienne'],
  ['le Danube', 2850, 'Europe', 'la mer Noire'],
  ['le Gange', 2510, 'Asie', 'le golfe du Bengale'],
  ['le Rhin', 1230, 'Europe', 'la mer du Nord'],
  ['la Loire', 1006, 'Europe', 'l’océan Atlantique'],
  ['la Seine', 777, 'Europe', 'la Manche'],
  ['le Rhône', 812, 'Europe', 'la Méditerranée'],
  ['la Garonne', 647, 'Europe', 'l’océan Atlantique'],
  ['l’Indus', 3180, 'Asie', 'la mer d’Arabie'],
  ['le Mékong', 4350, 'Asie', 'la mer de Chine méridionale'],
  ['le Zambèze', 2570, 'Afrique', 'l’océan Indien'],
  ['l’Ob', 3650, 'Asie', 'l’océan Arctique'],
]

/** Sommets : nom, altitude en m, chaîne, pays. */
const PEAKS = [
  ['l’Everest', 8849, 'l’Himalaya', 'le Népal'],
  ['le K2', 8611, 'le Karakoram', 'le Pakistan'],
  ['le Kangchenjunga', 8586, 'l’Himalaya', 'le Népal'],
  ['l’Aconcagua', 6961, 'les Andes', 'l’Argentine'],
  ['le Denali', 6190, 'la chaîne d’Alaska', 'les États-Unis'],
  ['le Kilimandjaro', 5895, 'un massif volcanique isolé', 'la Tanzanie'],
  ['l’Elbrouz', 5642, 'le Caucase', 'la Russie'],
  ['le mont Blanc', 4808, 'les Alpes', 'la France'],
  ['le Cervin', 4478, 'les Alpes', 'la Suisse'],
  ['le mont Fuji', 3776, 'un massif volcanique isolé', 'le Japon'],
  ['le Teide', 3715, 'les Canaries', 'l’Espagne'],
  ['l’Etna', 3357, 'un massif volcanique isolé', 'l’Italie'],
  ['le pic du Midi d’Ossau', 2884, 'les Pyrénées', 'la France'],
  ['le Puy de Sancy', 1885, 'le Massif central', 'la France'],
]

const CONTINENTS = ['Europe', 'Afrique', 'Asie', 'Amérique du Nord', 'Amérique du Sud', 'Océanie']

/** Trois leurres pris dans la même colonne, jamais égaux à la réponse. */
function othersFrom(rng, table, index, answer) {
  return shuffled(rng, table)
    .map(row => row[index])
    .filter(v => v !== answer)
    .slice(0, 6)
}

export const TEMPLATES = [
  // ----------------------------------------------------------------- CEP ---
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [country, capital] = pick(rng, COUNTRIES.slice(0, 30))
      return {
        text: `Quelle est la capitale ${de(country)} ?`,
        answer: capital,
        distractors: othersFrom(rng, COUNTRIES, 1, capital),
        explanation: `${capital} est la capitale ${de(country)}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [country, , continent] = pick(rng, COUNTRIES)
      return {
        text: `Sur quel continent se trouve ${country} ?`,
        answer: continent,
        distractors: CONTINENTS.filter(c => c !== continent),
        explanation: `${country} se situe en ${continent}`,
      }
    },
  },

  // ---------------------------------------------------------------- BEPC ---
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [country, capital] = pick(rng, COUNTRIES)
      return {
        text: `De quel pays ${capital} est-elle la capitale ?`,
        answer: country,
        distractors: othersFrom(rng, COUNTRIES, 0, country),
        explanation: `${capital} est la capitale ${de(country)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [river, , continent] = pick(rng, RIVERS)
      return {
        text: `Sur quel continent coule ${river} ?`,
        answer: continent,
        distractors: CONTINENTS.filter(c => c !== continent),
        explanation: `${river} coule en ${continent}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [peak, , range] = pick(rng, PEAKS)
      return {
        text: `À quelle chaîne de montagnes appartient ${peak} ?`,
        answer: range,
        distractors: othersFrom(rng, PEAKS, 2, range),
        explanation: `${peak} culmine dans ${range}`,
      }
    },
  },

  // ----------------------------------------------------------------- BAC ---
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [country, , , currency] = pick(rng, COUNTRIES)
      return {
        text: `Quelle est la monnaie officielle ${de(country)} ?`,
        answer: currency,
        distractors: othersFrom(rng, COUNTRIES, 3, currency),
        explanation: `${country} utilise ${currency}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [peak, altitude] = pick(rng, PEAKS)
      return {
        text: `Quelle est l’altitude approximative ${de(peak)} ?`,
        answer: `${fr(altitude)} m`,
        distractors: [
          ...othersFrom(rng, PEAKS, 1, altitude).map(v => `${fr(v)} m`),
          ...numericDistractors(rng, altitude).map(v => `${v} m`),
        ],
        explanation: `${peak} culmine à ${fr(altitude)} mètres`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [river, , , mouth] = pick(rng, RIVERS)
      return {
        text: `Dans quelle mer ou quel océan ${river} se jette-t-il ?`,
        answer: mouth,
        distractors: othersFrom(rng, RIVERS, 3, mouth),
        explanation: `${river} débouche dans ${mouth}`,
      }
    },
  },

  // ------------------------------------------------------------- LICENCE ---
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [river, length] = pick(rng, RIVERS)
      return {
        text: `Quelle est la longueur approximative ${de(river)} ?`,
        answer: `${fr(length)} km`,
        distractors: [
          ...othersFrom(rng, RIVERS, 1, length).map(v => `${fr(v)} km`),
          ...numericDistractors(rng, length).map(v => `${v} km`),
        ],
        explanation: `Environ ${fr(length)} kilomètres`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const a = pick(rng, PEAKS)
      const b = pick(rng, PEAKS)
      if (a[0] === b[0] || a[1] === b[1]) return null
      const higher = a[1] > b[1] ? a : b
      return {
        text: `Lequel de ces deux sommets est le plus élevé : ${a[0]} ou ${b[0]} ?`,
        answer: higher[0],
        distractors: [
          higher[0] === a[0] ? b[0] : a[0],
          'Ils ont la même altitude',
          'Impossible à déterminer',
          'Ni l’un ni l’autre',
        ],
        explanation: `${a[0]} culmine à ${fr(a[1])} m et ${b[0]} à ${fr(b[1])} m`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [peak, , , country] = pick(rng, PEAKS)
      return {
        text: `Dans quel pays se trouve ${peak} ?`,
        answer: country,
        distractors: othersFrom(rng, PEAKS, 3, country),
        explanation: `${peak} se situe ${dans(country)}`,
      }
    },
  },

  // -------------------------------------------------------------- MASTER ---
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const continent = pick(rng, CONTINENTS)
      const inContinent = COUNTRIES.filter(c => c[2] === continent)
      if (inContinent.length < 4) return null
      const country = pick(rng, inContinent)
      const outside = COUNTRIES.filter(c => c[2] !== continent)
      return {
        text: `Parmi ces pays, lequel se trouve en ${continent} ?`,
        answer: country[0],
        distractors: shuffled(rng, outside).slice(0, 6).map(c => c[0]),
        explanation: `${country[0]} est le seul de cette liste situé en ${continent}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const currency = pick(rng, ['l’euro', 'le franc CFA', 'le dollar américain'])
      const users = COUNTRIES.filter(c => c[3] === currency)
      const others = COUNTRIES.filter(c => c[3] !== currency)
      if (users.length < 2) return null
      const country = pick(rng, users)
      return {
        text: `Parmi ces pays, lequel utilise ${currency} ?`,
        answer: country[0],
        distractors: shuffled(rng, others).slice(0, 6).map(c => c[0]),
        explanation: `${country[0]} a pour monnaie ${currency}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const a = pick(rng, RIVERS)
      const b = pick(rng, RIVERS)
      if (a[0] === b[0] || a[1] === b[1]) return null
      const longer = a[1] > b[1] ? a : b
      return {
        text: `Lequel de ces deux fleuves est le plus long : ${a[0]} ou ${b[0]} ?`,
        answer: longer[0],
        distractors: [
          longer[0] === a[0] ? b[0] : a[0],
          'Ils ont la même longueur',
          'Impossible à déterminer',
          'Aucun des deux n’est un fleuve',
        ],
        explanation: `${a[0]} mesure environ ${fr(a[1])} km et ${b[0]} environ ${fr(b[1])} km`,
      }
    },
  },

  // ------------------------------------------------------------ DOCTORAT ---
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const continent = pick(rng, CONTINENTS)
      const inContinent = COUNTRIES.filter(c => c[2] === continent)
      if (inContinent.length < 6) return null
      const [country, capital] = pick(rng, inContinent)
      return {
        text: `Quelle ville est la capitale ${de(country)} ?`,
        answer: capital,
        distractors: shuffled(rng, inContinent)
          .map(c => c[1])
          .filter(v => v !== capital)
          .slice(0, 6),
        explanation: `${capital} — les autres propositions sont des capitales du même continent`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [peak, altitude, range] = pick(rng, PEAKS)
      const rank = PEAKS.filter(p => p[1] > altitude).length + 1
      return {
        text: `Parmi les quatorze sommets de cette liste de référence, quel rang occupe ${peak} par l’altitude ?`,
        answer: `${rank}ᵉ`,
        distractors: [`${rank + 1}ᵉ`, `${rank + 2}ᵉ`, `${Math.max(1, rank - 1)}ᵉ`, `${rank + 4}ᵉ`],
        explanation: `${peak} (${fr(altitude)} m, ${range}) arrive en position ${rank}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [river, length, continent, mouth] = pick(rng, RIVERS)
      return {
        text: `Quel fleuve, long d’environ ${fr(length)} km, se jette dans ${mouth} ?`,
        answer: river,
        distractors: shuffled(rng, RIVERS)
          .filter(r => r[0] !== river)
          .slice(0, 6)
          .map(r => r[0]),
        explanation: `${river}, en ${continent}, mesure environ ${fr(length)} km`,
      }
    },
  },
]

export const CATEGORY_NAME = CATEGORY
