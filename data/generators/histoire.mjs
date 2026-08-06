// Générateur de questions d'histoire.
//
// Table d'événements datés, table de figures historiques : chaque ligne alimente
// plusieurs questions — la date, le siècle, l'antériorité par rapport à un autre
// événement. Comme en géographie, la réponse est recopiée depuis la table et non
// calculée ; la justesse des questions vaut celle de ces tables, écrites une
// seule fois et donc relisables.

import { de, fr, pick, shuffled, year as yearOf } from './kit.mjs'

const CATEGORY = 'Histoire'

/** Événements : intitulé, année, aire géographique. */
const EVENTS = [
  ['la chute de l’Empire romain d’Occident', 476, 'Europe'],
  ['le couronnement de Charlemagne', 800, 'Europe'],
  ['la bataille de Hastings', 1066, 'Europe'],
  ['la prise de Constantinople par les Ottomans', 1453, 'Europe'],
  ['l’arrivée de Christophe Colomb en Amérique', 1492, 'Amérique'],
  ['la signature de l’édit de Nantes', 1598, 'Europe'],
  ['la révocation de l’édit de Nantes', 1685, 'Europe'],
  ['la déclaration d’indépendance des États-Unis', 1776, 'Amérique'],
  ['la prise de la Bastille', 1789, 'Europe'],
  ['le sacre de Napoléon Ier', 1804, 'Europe'],
  ['la bataille de Waterloo', 1815, 'Europe'],
  ['l’abolition définitive de l’esclavage en France', 1848, 'Europe'],
  ['la Commune de Paris', 1871, 'Europe'],
  ['le début de la Première Guerre mondiale', 1914, 'Europe'],
  ['l’armistice de la Première Guerre mondiale', 1918, 'Europe'],
  ['la révolution russe d’Octobre', 1917, 'Europe'],
  ['la signature du traité de Versailles', 1919, 'Europe'],
  ['le krach boursier de Wall Street', 1929, 'Amérique'],
  ['le début de la Seconde Guerre mondiale', 1939, 'Europe'],
  ['le débarquement de Normandie', 1944, 'Europe'],
  ['la capitulation allemande', 1945, 'Europe'],
  ['la création de l’Organisation des Nations unies', 1945, 'Amérique'],
  ['l’indépendance de l’Inde', 1947, 'Asie'],
  ['la proclamation de la République populaire de Chine', 1949, 'Asie'],
  ['la signature du traité de Rome', 1957, 'Europe'],
  ['l’indépendance de nombreux États africains', 1960, 'Afrique'],
  ['la fin de la guerre d’Algérie', 1962, 'Afrique'],
  ['le premier pas d’un homme sur la Lune', 1969, 'Amérique'],
  ['la chute du mur de Berlin', 1989, 'Europe'],
  ['la fin de l’apartheid en Afrique du Sud', 1991, 'Afrique'],
  ['la dissolution de l’Union soviétique', 1991, 'Europe'],
  ['la signature du traité de Maastricht', 1992, 'Europe'],
  ['les attentats du 11 septembre', 2001, 'Amérique'],
]

/** Figures : nom, fonction, siècle d'activité, fait marquant. */
const FIGURES = [
  ['Jules César', 'général et homme d’État romain', 'Iᵉʳ siècle av. J.-C.', 'la conquête de la Gaule'],
  ['Vercingétorix', 'chef gaulois', 'Iᵉʳ siècle av. J.-C.', 'la résistance à Alésia'],
  ['Cléopâtre VII', 'reine d’Égypte', 'Iᵉʳ siècle av. J.-C.', 'le dernier règne ptolémaïque'],
  ['Charlemagne', 'empereur d’Occident', 'IXᵉ siècle', 'la renaissance carolingienne'],
  ['Guillaume le Conquérant', 'duc de Normandie puis roi d’Angleterre', 'XIᵉ siècle', 'la conquête de l’Angleterre'],
  ['Jeanne d’Arc', 'figure militaire française', 'XVᵉ siècle', 'la levée du siège d’Orléans'],
  ['Christophe Colomb', 'navigateur génois', 'XVᵉ siècle', 'la traversée de l’Atlantique en 1492'],
  ['Gutenberg', 'imprimeur allemand', 'XVᵉ siècle', 'l’imprimerie à caractères mobiles'],
  ['Martin Luther', 'théologien allemand', 'XVIᵉ siècle', 'le déclenchement de la Réforme'],
  ['Henri IV', 'roi de France', 'XVIᵉ siècle', 'l’édit de Nantes'],
  ['Louis XIV', 'roi de France', 'XVIIᵉ siècle', 'la construction de Versailles'],
  ['Voltaire', 'philosophe français', 'XVIIIᵉ siècle', 'le combat pour la tolérance'],
  ['George Washington', 'premier président des États-Unis', 'XVIIIᵉ siècle', 'la guerre d’indépendance américaine'],
  ['Napoléon Bonaparte', 'empereur des Français', 'XIXᵉ siècle', 'le Code civil'],
  ['Abraham Lincoln', 'président des États-Unis', 'XIXᵉ siècle', 'l’abolition de l’esclavage'],
  ['Otto von Bismarck', 'chancelier allemand', 'XIXᵉ siècle', 'l’unification allemande'],
  ['Winston Churchill', 'Premier ministre britannique', 'XXᵉ siècle', 'la conduite de la guerre contre l’Axe'],
  ['Charles de Gaulle', 'général et président français', 'XXᵉ siècle', 'l’appel du 18 juin'],
  ['Mohandas Gandhi', 'dirigeant indépendantiste indien', 'XXᵉ siècle', 'la résistance non violente'],
  ['Nelson Mandela', 'président sud-africain', 'XXᵉ siècle', 'la fin de l’apartheid'],
  ['Simone Veil', 'femme politique française', 'XXᵉ siècle', 'la loi dépénalisant l’avortement'],
]

/** Civilisations : nom, période, région, apport majeur. */
const CIVILISATIONS = [
  ['les Sumériens', 'IVᵉ millénaire av. J.-C.', 'la Mésopotamie', 'l’écriture cunéiforme'],
  ['l’Égypte antique', 'IIIᵉ millénaire av. J.-C.', 'la vallée du Nil', 'les pyramides'],
  ['la Grèce classique', 'Vᵉ siècle av. J.-C.', 'la mer Égée', 'la démocratie athénienne'],
  ['l’Empire romain', 'Iᵉʳ siècle', 'la Méditerranée', 'le droit romain'],
  ['l’Empire byzantin', 'VIᵉ siècle', 'l’Anatolie', 'la codification justinienne'],
  ['l’Empire du Mali', 'XIVᵉ siècle', 'l’Afrique de l’Ouest', 'le rayonnement de Tombouctou'],
  ['les Incas', 'XVᵉ siècle', 'les Andes', 'le réseau routier andin'],
  ['les Aztèques', 'XVᵉ siècle', 'le Mexique central', 'la cité de Tenochtitlan'],
  ['les Mayas', 'VIIIᵉ siècle', 'l’Amérique centrale', 'le calendrier et l’écriture glyphique'],
  ['l’Empire ottoman', 'XVIᵉ siècle', 'l’Anatolie', 'l’administration des provinces'],
]

const century = year => Math.ceil(year / 100)
const romanCentury = year => {
  const romans = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
  return `${romans[century(year)]}ᵉ siècle`
}

function othersFrom(rng, table, index, answer) {
  return shuffled(rng, table).map(r => r[index]).filter(v => v !== answer).slice(0, 6)
}

export const TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [event, year] = pick(rng, EVENTS.filter(e => e[1] >= 1789))
      return {
        text: `En quelle année a eu lieu ${event} ?`,
        answer: yearOf(year),
        distractors: [yearOf(year + 1), yearOf(year - 1), yearOf(year + 10), yearOf(year - 10), yearOf(year + 5)],
        explanation: `${event.charAt(0).toUpperCase()}${event.slice(1)} : ${yearOf(year)}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [name, role] = pick(rng, FIGURES)
      return {
        text: `Qui était ${name} ?`,
        answer: role.charAt(0).toUpperCase() + role.slice(1),
        distractors: othersFrom(rng, FIGURES, 1, role).map(r => r.charAt(0).toUpperCase() + r.slice(1)),
        explanation: `${name} était ${role}`,
      }
    },
  },

  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [event, year] = pick(rng, EVENTS)
      return {
        text: `À quel siècle se rattache ${event} ?`,
        answer: romanCentury(year),
        distractors: [
          romanCentury(year + 100),
          romanCentury(year - 100),
          romanCentury(year + 200),
          romanCentury(year - 200),
        ],
        explanation: `${yearOf(year)} appartient au ${romanCentury(year)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [name, , , deed] = pick(rng, FIGURES)
      return {
        text: `Pour quel fait ${name} est-il resté célèbre ?`,
        answer: deed.charAt(0).toUpperCase() + deed.slice(1),
        distractors: othersFrom(rng, FIGURES, 3, deed).map(d => d.charAt(0).toUpperCase() + d.slice(1)),
        explanation: `${name} est associé à ${deed}`,
      }
    },
  },

  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [event, year] = pick(rng, EVENTS)
      return {
        text: `En quelle année se situe ${event} ?`,
        answer: yearOf(year),
        distractors: othersFrom(rng, EVENTS, 1, year).map(y => yearOf(y)),
        explanation: `${event.charAt(0).toUpperCase()}${event.slice(1)} : ${yearOf(year)}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [civ, , region] = pick(rng, CIVILISATIONS)
      return {
        text: `Dans quelle région s’est développé ${civ} ?`,
        answer: region,
        distractors: othersFrom(rng, CIVILISATIONS, 2, region),
        explanation: `${civ.charAt(0).toUpperCase()}${civ.slice(1)} occupait ${region}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [name, , siecle] = pick(rng, FIGURES)
      return {
        text: `À quelle époque a vécu ${name} ?`,
        answer: siecle,
        distractors: othersFrom(rng, FIGURES, 2, siecle),
        explanation: `${name} a été actif au ${siecle}`,
      }
    },
  },

  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const a = pick(rng, EVENTS)
      const b = pick(rng, EVENTS)
      if (a[0] === b[0] || a[1] === b[1]) return null
      const earlier = a[1] < b[1] ? a : b
      return {
        text: `Lequel de ces deux événements est le plus ancien : ${a[0]} ou ${b[0]} ?`,
        answer: earlier[0].charAt(0).toUpperCase() + earlier[0].slice(1),
        distractors: [
          (earlier[0] === a[0] ? b[0] : a[0]).replace(/^./, c => c.toUpperCase()),
          'Les deux la même année',
          'Impossible à déterminer',
          'Aucun des deux n’est daté',
        ],
        explanation: `${a[0]} : ${yearOf(a[1])} ; ${b[0]} : ${yearOf(b[1])}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [civ, periode, , apport] = pick(rng, CIVILISATIONS)
      return {
        text: `Quel apport majeur attribue-t-on à ${civ} ?`,
        answer: apport.charAt(0).toUpperCase() + apport.slice(1),
        distractors: othersFrom(rng, CIVILISATIONS, 3, apport).map(a => a.charAt(0).toUpperCase() + a.slice(1)),
        explanation: `${civ.charAt(0).toUpperCase()}${civ.slice(1)}, au ${periode.replace(/^au /, '')}, est associé à ${apport}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [event, year, region] = pick(rng, EVENTS)
      return {
        text: `Sur quel continent s’est déroulé ${event} ?`,
        answer: region,
        distractors: ['Europe', 'Asie', 'Afrique', 'Amérique', 'Océanie'].filter(r => r !== region),
        explanation: `${event.charAt(0).toUpperCase()}${event.slice(1)}, en ${yearOf(year)}, s’est déroulé en ${region}`,
      }
    },
  },

  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const year = pick(rng, EVENTS)[1]
      const sameYear = EVENTS.filter(e => e[1] === year)
      const [event] = pick(rng, sameYear)
      const others = EVENTS.filter(e => Math.abs(e[1] - year) <= 40 && e[1] !== year)
      if (others.length < 3) return null
      return {
        text: `Lequel de ces événements est survenu en ${yearOf(year)} ?`,
        answer: event.charAt(0).toUpperCase() + event.slice(1),
        distractors: shuffled(rng, others).slice(0, 6).map(e => e[0].replace(/^./, c => c.toUpperCase())),
        explanation: `${event.charAt(0).toUpperCase()}${event.slice(1)} date bien de ${yearOf(year)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [name, role, siecle, deed] = pick(rng, FIGURES)
      return {
        text: `Quelle figure du ${siecle}, ${role}, est associée à ${deed} ?`,
        answer: name,
        distractors: othersFrom(rng, FIGURES, 0, name),
        explanation: `${name}, ${role}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [civ, periode] = pick(rng, CIVILISATIONS)
      return {
        text: `À quelle période situe-t-on l’apogée ${de(civ)} ?`,
        answer: periode,
        distractors: othersFrom(rng, CIVILISATIONS, 1, periode),
        explanation: `${civ.charAt(0).toUpperCase()}${civ.slice(1)} : ${periode}`,
      }
    },
  },

  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const sorted = [...EVENTS].sort((a, b) => a[1] - b[1])
      const i = 1 + Math.floor(rng() * (sorted.length - 2))
      const [event, year] = sorted[i]
      const before = sorted[i - 1]
      const after = sorted[i + 1]
      return {
        text: `Quel événement s’intercale chronologiquement entre ${before[0]} et ${after[0]} ?`,
        answer: event.charAt(0).toUpperCase() + event.slice(1),
        distractors: shuffled(rng, EVENTS)
          .filter(e => e[1] < before[1] || e[1] > after[1])
          .slice(0, 6)
          .map(e => e[0].replace(/^./, c => c.toUpperCase())),
        explanation: `${yearOf(before[1])} → ${yearOf(year)} → ${yearOf(after[1])}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const a = pick(rng, EVENTS)
      const b = pick(rng, EVENTS)
      const gap = Math.abs(a[1] - b[1])
      if (a[0] === b[0] || gap === 0) return null
      return {
        text: `Combien d’années séparent ${a[0]} et ${b[0]} ?`,
        answer: `${fr(gap)} ans`,
        distractors: [
          `${fr(gap + 10)} ans`,
          `${fr(Math.abs(gap - 10))} ans`,
          `${fr(gap + 25)} ans`,
          `${fr(gap + 50)} ans`,
          `${fr(Math.abs(gap - 5))} ans`,
        ],
        explanation: `${yearOf(a[1])} et ${yearOf(b[1])} : ${fr(gap)} ans d’écart`,
      }
    },
  },
]

export const CATEGORY_NAME = CATEGORY
