// Générateurs des catégories sociales et techniques : sport, technologie,
// politique, environnement, intelligence artificielle, culture générale.
//
// Mêmes principes que les autres modules : des tables de faits écrites une fois,
// des gabarits qui les recombinent.

import { a, de, fr, pick, shuffled, year as yearOf } from './kit.mjs'

function othersFrom(rng, table, index, answer) {
  return shuffled(rng, table).map(r => r[index]).filter(v => v !== answer).slice(0, 6)
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

// ---------------------------------------------------------------------------
// Sport
// ---------------------------------------------------------------------------

/** Disciplines : nom, joueurs par équipe, aire de jeu, matériel. */
const SPORTS = [
  ['le football', 11, 'un terrain en gazon', 'un ballon rond'],
  ['le rugby à XV', 15, 'un terrain en gazon', 'un ballon ovale'],
  ['le basket-ball', 5, 'un parquet', 'un ballon orange'],
  ['le handball', 7, 'un parquet', 'un ballon à saisir d’une main'],
  ['le volley-ball', 6, 'un terrain séparé par un filet', 'un ballon léger'],
  ['le water-polo', 7, 'un bassin', 'un ballon flottant'],
  ['le hockey sur glace', 6, 'une patinoire', 'un palet'],
  ['le baseball', 9, 'un losange de terre battue', 'une batte et une balle'],
  ['le cricket', 11, 'un terrain ovale', 'une batte plate'],
  ['le tennis en simple', 1, 'un court', 'une raquette'],
  ['le badminton en simple', 1, 'un court', 'un volant'],
  ['le tennis de table en simple', 1, 'une table', 'une raquette et une balle creuse'],
  ['le futsal', 5, 'un parquet', 'un ballon à rebond réduit'],
  ['le rugby à XIII', 13, 'un terrain en gazon', 'un ballon ovale'],
  ['le beach-volley', 2, 'un terrain de sable', 'un ballon léger'],
  ['le hockey sur gazon', 11, 'un terrain synthétique', 'une crosse recourbée'],
  ['le netball', 7, 'un terrain sans planche d’appui', 'un ballon et des cerceaux'],
  ['le football américain', 11, 'un terrain balisé en yards', 'un ballon ovale et un casque'],
  ['le curling', 4, 'une piste de glace', 'des pierres de granit'],
  ['l’aviron en quatre de couple', 4, 'un plan d’eau', 'des avirons et un bateau'],
  ['le squash', 1, 'un court fermé', 'une raquette et une balle en caoutchouc'],
  ['l’escrime', 1, 'une piste', 'un fleuret, une épée ou un sabre'],
  ['le judo', 1, 'un tatami', 'un judogi'],
  ['la boxe anglaise', 1, 'un ring', 'des gants'],
]

/** Épreuves d'athlétisme : nom, catégorie, particularité. */
const ATHLETICS = [
  ['le 100 mètres', 'les courses de sprint', 'un départ en starting-blocks'],
  ['le 400 mètres', 'les courses de sprint prolongé', 'un tour de piste complet'],
  ['le 1 500 mètres', 'les courses de demi-fond', 'trois tours et trois quarts'],
  ['le marathon', 'les courses de fond', 'une distance de 42,195 km'],
  ['le 110 mètres haies', 'les courses avec obstacles', 'dix haies à franchir'],
  ['le 3 000 mètres steeple', 'les courses avec obstacles', 'une rivière à franchir'],
  ['le saut en hauteur', 'les sauts', 'un franchissement dos à la barre'],
  ['le saut à la perche', 'les sauts', 'l’usage d’une perche flexible'],
  ['le saut en longueur', 'les sauts', 'une planche d’appel'],
  ['le triple saut', 'les sauts', 'une succession de trois bonds'],
  ['le lancer du poids', 'les lancers', 'une aire circulaire'],
  ['le lancer du disque', 'les lancers', 'une rotation avant le lâcher'],
  ['le lancer du javelot', 'les lancers', 'une course d’élan rectiligne'],
  ['le lancer du marteau', 'les lancers', 'un engin muni d’un câble'],
  ['le décathlon', 'les épreuves combinées', 'dix disciplines sur deux jours'],
  ['l’heptathlon', 'les épreuves combinées', 'sept disciplines sur deux jours'],
]

/** Jeux olympiques d'été : année, ville hôte, pays. */
const OLYMPICS = [
  [1896, 'Athènes', 'la Grèce'],
  [1900, 'Paris', 'la France'],
  [1924, 'Paris', 'la France'],
  [1936, 'Berlin', 'l’Allemagne'],
  [1948, 'Londres', 'le Royaume-Uni'],
  [1960, 'Rome', 'l’Italie'],
  [1964, 'Tokyo', 'le Japon'],
  [1972, 'Munich', 'l’Allemagne'],
  [1976, 'Montréal', 'le Canada'],
  [1980, 'Moscou', 'la Russie'],
  [1984, 'Los Angeles', 'les États-Unis'],
  [1988, 'Séoul', 'la Corée du Sud'],
  [1992, 'Barcelone', 'l’Espagne'],
  [1996, 'Atlanta', 'les États-Unis'],
  [2000, 'Sydney', 'l’Australie'],
  [2004, 'Athènes', 'la Grèce'],
  [2008, 'Pékin', 'la Chine'],
  [2012, 'Londres', 'le Royaume-Uni'],
  [2016, 'Rio de Janeiro', 'le Brésil'],
  [2020, 'Tokyo', 'le Japon'],
  [2024, 'Paris', 'la France'],
]

export const SPORT_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [sport, players] = pick(rng, SPORTS.filter(s => s[1] > 1))
      return {
        text: `Combien de joueurs compte une équipe ${de(sport)} sur le terrain ?`,
        answer: fr(players),
        distractors: othersFrom(rng, SPORTS, 1, players).map(p => fr(p)),
        explanation: `${cap(sport)} se joue à ${fr(players)} par équipe`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [sport, , , gear] = pick(rng, SPORTS)
      return {
        text: `Quel matériel caractérise ${sport} ?`,
        answer: cap(gear),
        distractors: othersFrom(rng, SPORTS, 3, gear).map(cap),
        explanation: `${cap(sport)} se pratique avec ${gear}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [sport, , surface] = pick(rng, SPORTS)
      return {
        text: `Sur quelle aire de jeu se pratique ${sport} ?`,
        answer: cap(surface),
        distractors: othersFrom(rng, SPORTS, 2, surface).map(cap),
        explanation: `${cap(sport)} se joue sur ${surface}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [year, city] = pick(rng, OLYMPICS)
      return {
        text: `Quelle ville a accueilli les Jeux olympiques d’été de ${yearOf(year)} ?`,
        answer: city,
        distractors: othersFrom(rng, OLYMPICS, 1, city),
        explanation: `Les Jeux de ${yearOf(year)} se sont tenus à ${city}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [year, city, country] = pick(rng, OLYMPICS)
      return {
        text: `Dans quel pays se sont déroulés les Jeux olympiques d’été de ${yearOf(year)} ?`,
        answer: country,
        distractors: othersFrom(rng, OLYMPICS, 2, country),
        explanation: `${city}, ${country}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const city = pick(rng, ['Paris', 'Athènes', 'Londres', 'Tokyo', 'Los Angeles'])
      const editions = OLYMPICS.filter(o => o[1] === city)
      if (editions.length < 2) return null
      const [year] = pick(rng, editions)
      return {
        text: `${city} a accueilli plusieurs olympiades. En quelle année parmi celles-ci ?`,
        answer: yearOf(year),
        distractors: shuffled(rng, OLYMPICS)
          .filter(o => o[1] !== city)
          .slice(0, 6)
          .map(o => yearOf(o[0])),
        explanation: `${city} : ${editions.map(e => yearOf(e[0])).join(', ')}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [event, category] = pick(rng, ATHLETICS)
      return {
        text: `À quelle catégorie d’épreuves appartient ${event} ?`,
        answer: cap(category),
        distractors: othersFrom(rng, ATHLETICS, 1, category).map(cap),
        explanation: `${cap(event)} relève ${de(category)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [event, , trait] = pick(rng, ATHLETICS)
      return {
        text: `Qu’est-ce qui caractérise ${event} ?`,
        answer: cap(trait),
        distractors: othersFrom(rng, ATHLETICS, 2, trait).map(cap),
        explanation: `${cap(event)} : ${trait}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [event, , trait] = pick(rng, ATHLETICS)
      return {
        text: `Quelle épreuve d’athlétisme se distingue par ceci : ${trait} ?`,
        answer: cap(event),
        distractors: othersFrom(rng, ATHLETICS, 0, event).map(cap),
        explanation: `${cap(event)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [sport, players, surface] = pick(rng, SPORTS)
      return {
        text: `Quel sport se pratique sur ${surface} à ${fr(players)} par équipe ?`,
        answer: cap(sport),
        distractors: othersFrom(rng, SPORTS, 0, sport).map(cap),
        explanation: `${cap(sport)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const category = pick(rng, ['les courses de sprint', 'les sauts', 'les lancers', 'les épreuves combinées', 'les courses avec obstacles'])
      const inCat = ATHLETICS.filter(e => e[1] === category)
      const others = ATHLETICS.filter(e => e[1] !== category)
      if (inCat.length < 2 || others.length < 4) return null
      const [event] = pick(rng, inCat)
      return {
        text: `Parmi ces épreuves, laquelle relève ${de(category)} ?`,
        answer: cap(event),
        distractors: shuffled(rng, others).slice(0, 6).map(e => cap(e[0])),
        explanation: `${cap(event)} appartient ${a(category)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const a1 = pick(rng, OLYMPICS)
      const b1 = pick(rng, OLYMPICS)
      if (a1[0] === b1[0]) return null
      const gap = Math.abs(a1[0] - b1[0])
      return {
        text: `Combien d’années séparent les Jeux de ${a1[1]} (${yearOf(a1[0])}) de ceux de ${b1[1]} (${yearOf(b1[0])}) ?`,
        answer: `${fr(gap)} ans`,
        distractors: [`${fr(gap + 4)} ans`, `${fr(Math.abs(gap - 4))} ans`, `${fr(gap + 8)} ans`, `${fr(gap + 12)} ans`],
        explanation: `${yearOf(b1[0])} − ${yearOf(a1[0])} = ${fr(gap)} ans`,
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Technologie
// ---------------------------------------------------------------------------

/** Inventions : nom, inventeur, année, domaine. */
const INVENTIONS = [
  ['l’imprimerie à caractères mobiles', 'Gutenberg', 1450, 'l’édition'],
  ['la machine à vapeur perfectionnée', 'James Watt', 1769, 'l’industrie'],
  ['le paratonnerre', 'Benjamin Franklin', 1752, 'l’électricité'],
  ['la pile électrique', 'Alessandro Volta', 1800, 'l’électricité'],
  ['la photographie', 'Nicéphore Niépce', 1826, 'l’image'],
  ['le télégraphe électrique', 'Samuel Morse', 1837, 'les télécommunications'],
  ['le téléphone', 'Alexander Graham Bell', 1876, 'les télécommunications'],
  ['le phonographe', 'Thomas Edison', 1877, 'le son'],
  ['la lampe à incandescence', 'Thomas Edison', 1879, 'l’éclairage'],
  ['le cinématographe', 'les frères Lumière', 1895, 'l’image'],
  ['la radio', 'Guglielmo Marconi', 1895, 'les télécommunications'],
  ['l’avion motorisé', 'les frères Wright', 1903, 'les transports'],
  ['la télévision électronique', 'Vladimir Zworykin', 1929, 'l’image'],
  ['le transistor', 'Bardeen, Brattain et Shockley', 1947, 'l’électronique'],
  ['le circuit intégré', 'Jack Kilby', 1958, 'l’électronique'],
  ['le laser', 'Theodore Maiman', 1960, 'l’optique'],
  ['la souris d’ordinateur', 'Douglas Engelbart', 1964, 'l’informatique'],
  ['le microprocesseur', 'Intel', 1971, 'l’informatique'],
  ['le Web', 'Tim Berners-Lee', 1989, 'l’informatique'],
]

export const TECHNOLOGIE_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [invention, , , field] = pick(rng, INVENTIONS)
      return {
        text: `À quel domaine se rattache ${invention} ?`,
        answer: cap(field),
        distractors: othersFrom(rng, INVENTIONS, 3, field).map(cap),
        explanation: `${cap(invention)} relève ${de(field)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [invention, inventor] = pick(rng, INVENTIONS)
      return {
        text: `À qui doit-on ${invention} ?`,
        answer: inventor,
        distractors: othersFrom(rng, INVENTIONS, 1, inventor),
        explanation: `${cap(invention)} est attribuée à ${inventor}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [invention, , yr] = pick(rng, INVENTIONS)
      return {
        text: `De quelle année date ${invention} ?`,
        answer: yearOf(yr),
        distractors: [yearOf(yr + 5), yearOf(yr - 5), yearOf(yr + 15), yearOf(yr - 15), yearOf(yr + 30)],
        explanation: `${cap(invention)} : ${yearOf(yr)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [invention, inventor, yr] = pick(rng, INVENTIONS)
      return {
        text: `Quelle invention ${inventor} a-t-il apportée en ${yearOf(yr)} ?`,
        answer: cap(invention),
        distractors: othersFrom(rng, INVENTIONS, 0, invention).map(cap),
        explanation: `${inventor}, ${yearOf(yr)} : ${invention}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const a = pick(rng, INVENTIONS)
      const b = pick(rng, INVENTIONS)
      if (a[0] === b[0] || a[2] === b[2]) return null
      const older = a[2] < b[2] ? a : b
      return {
        text: `Laquelle de ces deux inventions est la plus ancienne : ${a[0]} ou ${b[0]} ?`,
        answer: cap(older[0]),
        distractors: [
          cap(older[0] === a[0] ? b[0] : a[0]),
          'Elles datent de la même année',
          'Impossible à déterminer',
          'Aucune des deux n’est datée',
        ],
        explanation: `${cap(a[0])} : ${yearOf(a[2])} ; ${cap(b[0])} : ${yearOf(b[2])}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [invention, inventor, yr, field] = pick(rng, INVENTIONS)
      return {
        text: `Quelle avancée ${de(field)}, due à ${inventor}, remonte à ${yearOf(yr)} ?`,
        answer: cap(invention),
        distractors: othersFrom(rng, INVENTIONS, 0, invention).map(cap),
        explanation: `${cap(invention)} — ${inventor}, ${yearOf(yr)}`,
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Politique
// ---------------------------------------------------------------------------

/** Penseurs politiques : nom, œuvre, notion défendue. */
const THINKERS = [
  ['Montesquieu', 'De l’esprit des lois', 'la séparation des pouvoirs'],
  ['Jean-Jacques Rousseau', 'Du contrat social', 'la souveraineté populaire'],
  ['Thomas Hobbes', 'Le Léviathan', 'l’État garant de la paix civile'],
  ['John Locke', 'Traité du gouvernement civil', 'les droits naturels et la tolérance'],
  ['Karl Marx', 'Le Capital', 'la lutte des classes'],
  ['Alexis de Tocqueville', 'De la démocratie en Amérique', 'l’égalité des conditions'],
  ['Max Weber', 'Le savant et le politique', 'le monopole de la violence légitime'],
  ['Hannah Arendt', 'Les Origines du totalitarisme', 'la nature du régime totalitaire'],
  ['John Rawls', 'Théorie de la justice', 'la justice comme équité'],
  ['Nicolas Machiavel', 'Le Prince', 'l’autonomie du politique'],
  ['Platon', 'La République', 'le gouvernement des philosophes'],
  ['Aristote', 'Les Politiques', 'la classification des régimes'],
  ['Jean Bodin', 'Les Six Livres de la République', 'la souveraineté indivisible'],
  ['Emmanuel Kant', 'Vers la paix perpétuelle', 'la fédération d’États libres'],
  ['John Stuart Mill', 'De la liberté', 'la limite du pouvoir sur l’individu'],
  ['Antonio Gramsci', 'Cahiers de prison', 'l’hégémonie culturelle'],
  ['Michel Foucault', 'Surveiller et punir', 'le pouvoir disciplinaire'],
  ['Pierre Bourdieu', 'La Distinction', 'la reproduction des rapports de domination'],
  ['Jürgen Habermas', 'L’Espace public', 'la délibération rationnelle'],
  ['Amartya Sen', 'Repenser l’inégalité', 'l’approche par les capabilités'],
]

/** Régimes politiques : nom, principe, exemple de mécanisme. */
const REGIMES = [
  ['la monarchie absolue', 'un pouvoir concentré et héréditaire', 'l’absence de contrôle du souverain'],
  ['la monarchie constitutionnelle', 'un souverain encadré par une constitution', 'le règne sans gouvernement direct'],
  ['la république parlementaire', 'un exécutif responsable devant le parlement', 'la motion de censure'],
  ['le régime présidentiel', 'une séparation stricte des pouvoirs', 'l’absence de dissolution'],
  ['le régime semi-présidentiel', 'un président élu et un gouvernement responsable', 'la cohabitation'],
  ['la démocratie directe', 'des décisions prises par les citoyens eux-mêmes', 'le référendum d’initiative populaire'],
  ['le régime autoritaire', 'un pluralisme politique restreint', 'la limitation des libertés publiques'],
  ['le totalitarisme', 'l’emprise du pouvoir sur toute la société', 'le parti unique et l’idéologie officielle'],
  ['la fédération', 'un partage constitutionnel des compétences', 'l’autonomie des États fédérés'],
  ['l’État unitaire', 'une source unique du pouvoir normatif', 'la décentralisation par délégation'],
]

/** Modes de scrutin : nom, principe, effet observé. */
const VOTING = [
  ['le scrutin majoritaire à un tour', 'le candidat en tête l’emporte', 'la prime aux grands partis'],
  ['le scrutin majoritaire à deux tours', 'un second tour départage les mieux placés', 'les alliances d’entre-deux-tours'],
  ['la représentation proportionnelle', 'les sièges suivent les voix', 'la représentation des petites formations'],
  ['le scrutin de liste bloquée', 'l’ordre des candidats est fixé par le parti', 'le renforcement des appareils'],
  ['le vote préférentiel', 'l’électeur ordonne les candidats', 'la réduction du vote utile'],
  ['le jugement majoritaire', 'chaque candidat reçoit une mention', 'la limitation du vote stratégique'],
]

/** Organisations internationales : sigle, nom, siège, mission. */
const ORGANISATIONS = [
  ['l’ONU', 'l’Organisation des Nations unies', 'New York', 'le maintien de la paix'],
  ['l’OMS', 'l’Organisation mondiale de la santé', 'Genève', 'la santé publique mondiale'],
  ['l’UNESCO', 'l’Organisation pour l’éducation, la science et la culture', 'Paris', 'l’éducation et le patrimoine'],
  ['l’OMC', 'l’Organisation mondiale du commerce', 'Genève', 'les règles du commerce international'],
  ['le FMI', 'le Fonds monétaire international', 'Washington', 'la stabilité monétaire'],
  ['l’OIT', 'l’Organisation internationale du travail', 'Genève', 'les normes du travail'],
  ['l’UA', 'l’Union africaine', 'Addis-Abeba', 'l’intégration du continent africain'],
  ['l’OTAN', 'l’Organisation du traité de l’Atlantique nord', 'Bruxelles', 'la défense collective'],
]

export const POLITIQUE_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [sigle, name] = pick(rng, ORGANISATIONS)
      return {
        text: `Que désigne le sigle « ${sigle.replace(/^l’|^le /, '')} » ?`,
        answer: cap(name),
        distractors: othersFrom(rng, ORGANISATIONS, 1, name).map(cap),
        explanation: `${sigle} : ${name}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [sigle, , , mission] = pick(rng, ORGANISATIONS)
      return {
        text: `Quelle est la mission principale ${de(sigle)} ?`,
        answer: cap(mission),
        distractors: othersFrom(rng, ORGANISATIONS, 3, mission).map(cap),
        explanation: `${sigle} a pour mission ${mission}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [sigle, , seat] = pick(rng, ORGANISATIONS)
      return {
        text: `Où se trouve le siège ${de(sigle)} ?`,
        answer: seat,
        distractors: othersFrom(rng, ORGANISATIONS, 2, seat),
        explanation: `${sigle} siège à ${seat}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [thinker, work] = pick(rng, THINKERS)
      return {
        text: `Qui a écrit « ${work} » ?`,
        answer: thinker,
        distractors: othersFrom(rng, THINKERS, 0, thinker),
        explanation: `« ${work} » est de ${thinker}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [thinker, , notion] = pick(rng, THINKERS)
      return {
        text: `Quelle notion associe-t-on d’abord à ${thinker} ?`,
        answer: cap(notion),
        distractors: othersFrom(rng, THINKERS, 2, notion).map(cap),
        explanation: `${thinker} est associé ${a(notion)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [thinker, work, notion] = pick(rng, THINKERS)
      return {
        text: `Quel penseur, auteur de « ${work} », a formulé ${notion} ?`,
        answer: thinker,
        distractors: othersFrom(rng, THINKERS, 0, thinker),
        explanation: `${thinker}, « ${work} »`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [regime, principle] = pick(rng, REGIMES)
      return {
        text: `Sur quel principe repose ${regime} ?`,
        answer: cap(principle),
        distractors: othersFrom(rng, REGIMES, 1, principle).map(cap),
        explanation: `${cap(regime)} : ${principle}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [regime, , mechanism] = pick(rng, REGIMES)
      return {
        text: `Quel mécanisme caractérise ${regime} ?`,
        answer: cap(mechanism),
        distractors: othersFrom(rng, REGIMES, 2, mechanism).map(cap),
        explanation: `${cap(regime)} se reconnaît à ${mechanism}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [vote, principle] = pick(rng, VOTING)
      return {
        text: `En quoi consiste ${vote} ?`,
        answer: cap(principle),
        distractors: othersFrom(rng, VOTING, 1, principle).map(cap),
        explanation: `${cap(vote)} : ${principle}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [vote, , effect] = pick(rng, VOTING)
      return {
        text: `Quel effet politique produit ${vote} ?`,
        answer: cap(effect),
        distractors: othersFrom(rng, VOTING, 2, effect).map(cap),
        explanation: `${cap(vote)} entraîne ${effect}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [regime, principle, mechanism] = pick(rng, REGIMES)
      return {
        text: `Quel régime repose sur ${principle} et se reconnaît à ${mechanism} ?`,
        answer: cap(regime),
        distractors: othersFrom(rng, REGIMES, 0, regime).map(cap),
        explanation: `${cap(regime)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [vote, principle, effect] = pick(rng, VOTING)
      return {
        text: `Quel mode de scrutin, fondé sur ce principe — ${principle} —, produit ${effect} ?`,
        answer: cap(vote),
        distractors: othersFrom(rng, VOTING, 0, vote).map(cap),
        explanation: `${cap(vote)}`,
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Environnement
// ---------------------------------------------------------------------------

/** Accords et protocoles : nom, année, objet. */
const AGREEMENTS = [
  ['le protocole de Montréal', 1987, 'la protection de la couche d’ozone'],
  ['le sommet de Rio', 1992, 'la convention sur la diversité biologique'],
  ['le protocole de Kyoto', 1997, 'la réduction des gaz à effet de serre'],
  ['l’accord de Paris', 2015, 'la limitation du réchauffement sous 2 °C'],
  ['la convention de Ramsar', 1971, 'la protection des zones humides'],
  ['la convention CITES', 1973, 'le commerce des espèces menacées'],
  ['la convention de Bâle', 1989, 'les mouvements de déchets dangereux'],
  ['la conférence de Stockholm', 1972, 'la première conférence de l’ONU sur l’environnement'],
  ['le rapport Brundtland', 1987, 'la définition du développement durable'],
  ['la convention de Vienne', 1985, 'le cadre de la protection de la couche d’ozone'],
  ['la convention de Stockholm', 2001, 'l’élimination des polluants organiques persistants'],
  ['le protocole de Nagoya', 2010, 'le partage des avantages des ressources génétiques'],
  ['la convention de Minamata', 2013, 'la réduction des émissions de mercure'],
  ['la convention de Bonn', 1979, 'la protection des espèces migratrices'],
]

/** Écosystèmes : nom, caractéristique, menace principale. */
const ECOSYSTEMS = [
  ['la forêt tropicale humide', 'la plus grande biodiversité terrestre', 'la déforestation'],
  ['la mangrove', 'des arbres tolérant l’eau salée', 'l’urbanisation littorale'],
  ['le récif corallien', 'une symbiose entre corail et algues', 'le blanchissement dû au réchauffement'],
  ['la savane', 'une strate herbacée dominante', 'la conversion agricole'],
  ['la toundra', 'un sol gelé en profondeur', 'le dégel du permafrost'],
  ['la tourbière', 'un stock de carbone considérable', 'le drainage'],
  ['la forêt boréale', 'des conifères sur de vastes étendues', 'les incendies'],
  ['la prairie tempérée', 'des sols profonds et fertiles', 'la mise en culture'],
  ['le désert chaud', 'des précipitations inférieures à 250 mm par an', 'la surexploitation des nappes'],
  ['la forêt méditerranéenne', 'une végétation adaptée à la sécheresse estivale', 'les incendies'],
  ['l’estuaire', 'la rencontre des eaux douces et salées', 'la pollution des bassins versants'],
  ['la banquise', 'de la glace de mer saisonnière', 'la fonte accélérée'],
  ['le lac d’altitude', 'une eau froide et pauvre en nutriments', 'les dépôts atmosphériques'],
  ['la forêt tempérée caducifoliée', 'des arbres perdant leurs feuilles en hiver', 'la fragmentation'],
  ['la zone abyssale', 'l’absence totale de lumière', 'l’exploitation minière des fonds marins'],
  ['la steppe', 'un climat continental sec', 'la désertification'],
]

/** Gaz à effet de serre : nom, origine principale, pouvoir de réchauffement sur 100 ans. */
const GREENHOUSE_GASES = [
  ['le dioxyde de carbone', 'la combustion des énergies fossiles', 1],
  ['le méthane', 'l’élevage et les rizières', 28],
  ['le protoxyde d’azote', 'les engrais azotés', 265],
  ['les hydrofluorocarbures', 'la réfrigération', 1400],
  ['l’hexafluorure de soufre', 'l’appareillage électrique', 23500],
]

/** Énergies : nom, caractère renouvelable, principe. */
const ENERGIES = [
  ['l’énergie solaire photovoltaïque', 'renouvelable', 'la conversion directe de la lumière en électricité'],
  ['l’énergie éolienne', 'renouvelable', 'la conversion de l’énergie cinétique du vent'],
  ['l’hydroélectricité', 'renouvelable', 'la chute d’eau entraînant une turbine'],
  ['la géothermie', 'renouvelable', 'l’exploitation de la chaleur du sous-sol'],
  ['la biomasse', 'renouvelable', 'la combustion de matière organique'],
  ['l’énergie marémotrice', 'renouvelable', 'l’exploitation du marnage des marées'],
  ['le charbon', 'non renouvelable', 'la combustion d’une roche sédimentaire carbonée'],
  ['le pétrole', 'non renouvelable', 'la combustion d’hydrocarbures liquides'],
  ['le gaz naturel', 'non renouvelable', 'la combustion de méthane fossile'],
  ['le nucléaire de fission', 'non renouvelable', 'la fission de noyaux lourds'],
]

export const ENVIRONNEMENT_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [eco, trait] = pick(rng, ECOSYSTEMS)
      return {
        text: `Qu’est-ce qui caractérise ${eco} ?`,
        answer: cap(trait),
        distractors: othersFrom(rng, ECOSYSTEMS, 1, trait).map(cap),
        explanation: `${cap(eco)} se distingue par ${trait}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [eco, , threat] = pick(rng, ECOSYSTEMS)
      return {
        text: `Quelle est la principale menace pesant sur ${eco} ?`,
        answer: cap(threat),
        distractors: othersFrom(rng, ECOSYSTEMS, 2, threat).map(cap),
        explanation: `${cap(eco)} est surtout menacée par ${threat}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [accord, , object] = pick(rng, AGREEMENTS)
      return {
        text: `Quel est l’objet ${de(accord)} ?`,
        answer: cap(object),
        distractors: othersFrom(rng, AGREEMENTS, 2, object).map(cap),
        explanation: `${cap(accord)} porte sur ${object}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [accord, yr] = pick(rng, AGREEMENTS)
      return {
        text: `De quelle année date ${accord} ?`,
        answer: yearOf(yr),
        distractors: othersFrom(rng, AGREEMENTS, 1, yr).map(y => yearOf(y)),
        explanation: `${cap(accord)} : ${yearOf(yr)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [accord, yr, object] = pick(rng, AGREEMENTS)
      return {
        text: `Quel texte international de ${yearOf(yr)} porte sur ${object} ?`,
        answer: cap(accord),
        distractors: othersFrom(rng, AGREEMENTS, 0, accord).map(cap),
        explanation: `${cap(accord)}, ${yearOf(yr)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [eco, trait, threat] = pick(rng, ECOSYSTEMS)
      return {
        text: `Quel écosystème, caractérisé par ${trait}, est menacé par ${threat} ?`,
        answer: cap(eco),
        distractors: othersFrom(rng, ECOSYSTEMS, 0, eco).map(cap),
        explanation: `${cap(eco)} : ${trait}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [energy, renewable] = pick(rng, ENERGIES)
      return {
        text: `${cap(energy)} est-elle une énergie renouvelable ?`,
        answer: renewable === 'renouvelable' ? 'Oui, elle est renouvelable' : 'Non, elle ne l’est pas',
        distractors: [
          renewable === 'renouvelable' ? 'Non, elle ne l’est pas' : 'Oui, elle est renouvelable',
          'Seulement en hiver',
          'Uniquement en mer',
          'Cela dépend du pays',
        ],
        explanation: `${cap(energy)} est ${renewable}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [energy, , principle] = pick(rng, ENERGIES)
      return {
        text: `Sur quel principe repose ${energy} ?`,
        answer: cap(principle),
        distractors: othersFrom(rng, ENERGIES, 2, principle).map(cap),
        explanation: `${cap(energy)} : ${principle}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [gas, origin] = pick(rng, GREENHOUSE_GASES)
      return {
        text: `Quelle est la principale origine des émissions ${de(gas)} ?`,
        answer: cap(origin),
        distractors: othersFrom(rng, GREENHOUSE_GASES, 1, origin).map(cap),
        explanation: `${cap(gas)} provient surtout ${de(origin)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [gas, , power] = pick(rng, GREENHOUSE_GASES)
      return {
        text: `Quel est le pouvoir de réchauffement global ${de(gas)} sur cent ans, le CO₂ valant 1 ?`,
        answer: fr(power),
        distractors: othersFrom(rng, GREENHOUSE_GASES, 2, power).map(p => fr(p)),
        explanation: `${cap(gas)} : PRG de ${fr(power)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const a = pick(rng, GREENHOUSE_GASES)
      const b = pick(rng, GREENHOUSE_GASES)
      if (a[0] === b[0] || a[2] === b[2]) return null
      const stronger = a[2] > b[2] ? a : b
      return {
        text: `Lequel de ces deux gaz a le pouvoir de réchauffement le plus élevé : ${a[0]} ou ${b[0]} ?`,
        answer: cap(stronger[0]),
        distractors: [
          cap(stronger[0] === a[0] ? b[0] : a[0]),
          'Ils ont le même pouvoir',
          'Impossible à déterminer',
          'Aucun des deux n’est un gaz à effet de serre',
        ],
        explanation: `PRG : ${fr(a[2])} contre ${fr(b[2])}`,
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Intelligence artificielle
// ---------------------------------------------------------------------------

/** Notions : nom, définition, famille. */
const AI_CONCEPTS = [
  ['l’apprentissage supervisé', 'apprendre à partir d’exemples étiquetés', 'les paradigmes d’apprentissage'],
  ['l’apprentissage non supervisé', 'découvrir une structure sans étiquettes', 'les paradigmes d’apprentissage'],
  ['l’apprentissage par renforcement', 'apprendre par essais et récompenses', 'les paradigmes d’apprentissage'],
  ['le perceptron', 'le neurone artificiel élémentaire', 'les architectures'],
  ['le réseau convolutif', 'une architecture adaptée aux images', 'les architectures'],
  ['le réseau récurrent', 'une architecture traitant des séquences', 'les architectures'],
  ['le Transformer', 'une architecture fondée sur l’attention', 'les architectures'],
  ['la descente de gradient', 'l’ajustement des poids dans le sens opposé au gradient', 'l’optimisation'],
  ['la régularisation', 'la pénalisation de la complexité du modèle', 'l’optimisation'],
  ['le dropout', 'la désactivation aléatoire de neurones à l’entraînement', 'l’optimisation'],
  ['la validation croisée', 'l’évaluation par découpages successifs des données', 'l’évaluation'],
  ['la matrice de confusion', 'le tableau croisant prédictions et vérités', 'l’évaluation'],
  ['le rappel', 'la part des cas positifs effectivement détectés', 'l’évaluation'],
  ['la précision', 'la part de prédictions positives qui sont justes', 'l’évaluation'],
  ['le score F1', 'la moyenne harmonique de la précision et du rappel', 'l’évaluation'],
  ['la courbe ROC', 'le tracé du taux de vrais positifs contre les faux positifs', 'l’évaluation'],
  ['le surapprentissage', 'un modèle collant au bruit des données d’entraînement', 'les difficultés d’apprentissage'],
  ['le sous-apprentissage', 'un modèle trop simple pour capter la structure', 'les difficultés d’apprentissage'],
  ['le déséquilibre de classes', 'une catégorie très minoritaire dans les données', 'les difficultés d’apprentissage'],
  ['la fuite de données', 'une information du test présente à l’entraînement', 'les difficultés d’apprentissage'],
  ['le biais algorithmique', 'la reproduction d’inégalités présentes dans les données', 'les difficultés d’apprentissage'],
  ['l’auto-encodeur', 'un réseau apprenant à reconstruire son entrée', 'les architectures'],
  ['le réseau antagoniste génératif', 'deux réseaux en compétition, générateur et discriminateur', 'les architectures'],
  ['le modèle de diffusion', 'une génération par débruitage progressif', 'les architectures'],
  ['la mémoire à long terme (LSTM)', 'une cellule récurrente à portes', 'les architectures'],
  ['le mécanisme d’attention', 'la pondération dynamique des éléments d’une séquence', 'les architectures'],
  ['le taux d’apprentissage', 'l’amplitude du pas de mise à jour des poids', 'l’optimisation'],
  ['l’élan (momentum)', 'l’inertie donnée aux mises à jour successives', 'l’optimisation'],
  ['la normalisation par lots', 'la stabilisation des activations sur chaque mini-lot', 'l’optimisation'],
  ['l’arrêt précoce', 'l’interruption de l’entraînement avant la dégradation', 'l’optimisation'],
  ['l’augmentation de données', 'la création d’exemples par transformation des données existantes', 'l’optimisation'],
  ['l’apprentissage par transfert', 'la réutilisation d’un modèle pré-entraîné', 'les paradigmes d’apprentissage'],
  ['l’apprentissage auto-supervisé', 'la création d’étiquettes à partir des données elles-mêmes', 'les paradigmes d’apprentissage'],
  ['l’apprentissage fédéré', 'un entraînement réparti sans centraliser les données', 'les paradigmes d’apprentissage'],
  ['l’apprentissage actif', 'la sélection des exemples les plus informatifs à étiqueter', 'les paradigmes d’apprentissage'],
]

/** Jalons : événement, année. */
const AI_MILESTONES = [
  ['la conférence de Dartmouth, acte de naissance du domaine', 1956],
  ['la victoire de Deep Blue sur Kasparov aux échecs', 1997],
  ['la percée des réseaux profonds au concours ImageNet', 2012],
  ['la victoire d’AlphaGo sur Lee Sedol au jeu de go', 2016],
  ['la publication de l’architecture Transformer', 2017],
  ['la formulation du test de Turing', 1950],
  ['la création du perceptron par Rosenblatt', 1958],
  ['le premier hiver de l’intelligence artificielle', 1974],
  ['la popularisation de la rétropropagation', 1986],
  ['la reconnaissance de chiffres manuscrits par LeNet', 1998],
  ['la percée d’AlphaFold sur le repliement des protéines', 2021],
]

/** Domaines d'application : nom, tâche type. */
const AI_APPLICATIONS = [
  ['la vision par ordinateur', 'reconnaître le contenu d’une image'],
  ['le traitement automatique du langage', 'analyser et produire du texte'],
  ['la reconnaissance vocale', 'transcrire la parole en texte'],
  ['la synthèse vocale', 'produire une voix à partir d’un texte'],
  ['la traduction automatique', 'convertir un texte d’une langue à une autre'],
  ['les systèmes de recommandation', 'proposer des contenus adaptés à un profil'],
  ['la détection d’anomalies', 'repérer les observations atypiques'],
  ['la robotique autonome', 'commander un robot dans un environnement incertain'],
  ['la prévision de séries temporelles', 'anticiper l’évolution d’une grandeur dans le temps'],
  ['la génération d’images', 'produire une image à partir d’une description'],
]

export const IA_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [concept, , family] = pick(rng, AI_CONCEPTS)
      return {
        text: `À quelle famille de notions se rattache ${concept} ?`,
        answer: cap(family),
        distractors: othersFrom(rng, AI_CONCEPTS, 2, family).map(cap),
        explanation: `${cap(concept)} relève ${de(family)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [concept, definition] = pick(rng, AI_CONCEPTS)
      return {
        text: `Que désigne ${concept} ?`,
        answer: cap(definition),
        distractors: othersFrom(rng, AI_CONCEPTS, 1, definition).map(cap),
        explanation: `${cap(concept)} : ${definition}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [concept, definition] = pick(rng, AI_CONCEPTS)
      return {
        text: `Quelle notion consiste à ${definition} ?`,
        answer: cap(concept),
        distractors: othersFrom(rng, AI_CONCEPTS, 0, concept).map(cap),
        explanation: `${cap(concept)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [milestone, yr] = pick(rng, AI_MILESTONES)
      return {
        text: `En quelle année situe-t-on ${milestone} ?`,
        answer: yearOf(yr),
        distractors: [yearOf(yr + 2), yearOf(yr - 2), yearOf(yr + 6), yearOf(yr - 6), yearOf(yr + 12)],
        explanation: `${cap(milestone)} : ${yearOf(yr)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const family = pick(rng, ['les architectures', 'l’optimisation', 'l’évaluation', 'les paradigmes d’apprentissage'])
      const inFamily = AI_CONCEPTS.filter(c => c[2] === family)
      const others = AI_CONCEPTS.filter(c => c[2] !== family)
      if (inFamily.length < 2 || others.length < 3) return null
      const [concept] = pick(rng, inFamily)
      return {
        text: `Parmi ces notions, laquelle relève ${de(family)} ?`,
        answer: cap(concept),
        distractors: shuffled(rng, others).slice(0, 6).map(c => cap(c[0])),
        explanation: `${cap(concept)} appartient ${a(family)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const x = pick(rng, AI_MILESTONES)
      const y = pick(rng, AI_MILESTONES)
      if (x[0] === y[0] || x[1] === y[1]) return null
      const earlier = x[1] < y[1] ? x : y
      return {
        text: `Lequel de ces jalons est le plus ancien : ${x[0]} ou ${y[0]} ?`,
        answer: cap(earlier[0]),
        distractors: [
          cap(earlier[0] === x[0] ? y[0] : x[0]),
          'Ils sont contemporains',
          'Impossible à déterminer',
          'Aucun des deux n’est daté',
        ],
        explanation: `${yearOf(x[1])} et ${yearOf(y[1])}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [application, task] = pick(rng, AI_APPLICATIONS)
      return {
        text: `À quoi sert ${application} ?`,
        answer: cap(task),
        distractors: othersFrom(rng, AI_APPLICATIONS, 1, task).map(cap),
        explanation: `${cap(application)} permet de ${task}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [application, task] = pick(rng, AI_APPLICATIONS)
      return {
        text: `Quel domaine de l’intelligence artificielle permet de ${task} ?`,
        answer: cap(application),
        distractors: othersFrom(rng, AI_APPLICATIONS, 0, application).map(cap),
        explanation: `${cap(application)}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [milestone, yr] = pick(rng, AI_MILESTONES)
      return {
        text: `Quel jalon de l’intelligence artificielle remonte à ${yearOf(yr)} ?`,
        answer: cap(milestone),
        distractors: othersFrom(rng, AI_MILESTONES, 0, milestone).map(cap),
        explanation: `${cap(milestone)} : ${yearOf(yr)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [concept, definition, family] = pick(rng, AI_CONCEPTS)
      return {
        text: `Quelle notion ${de(family)} se définit ainsi : ${definition} ?`,
        answer: cap(concept),
        distractors: othersFrom(rng, AI_CONCEPTS, 0, concept).map(cap),
        explanation: `${cap(concept)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [concept, definition] = pick(rng, AI_CONCEPTS)
      return {
        text: `En apprentissage automatique, que recouvre exactement ${concept} ?`,
        answer: cap(definition),
        distractors: othersFrom(rng, AI_CONCEPTS, 1, definition).map(cap),
        explanation: `${cap(concept)} : ${definition}`,
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Culture générale
// ---------------------------------------------------------------------------

/** Divinités et mythologies : nom, panthéon, attribution. */
const MYTHS = [
  ['Zeus', 'la mythologie grecque', 'le roi des dieux et la foudre'],
  ['Poséidon', 'la mythologie grecque', 'les mers et les séismes'],
  ['Athéna', 'la mythologie grecque', 'la sagesse et la guerre stratégique'],
  ['Apollon', 'la mythologie grecque', 'la lumière, les arts et la divination'],
  ['Jupiter', 'la mythologie romaine', 'le roi des dieux'],
  ['Mars', 'la mythologie romaine', 'la guerre'],
  ['Vénus', 'la mythologie romaine', 'l’amour et la beauté'],
  ['Odin', 'la mythologie nordique', 'la sagesse et la magie'],
  ['Thor', 'la mythologie nordique', 'le tonnerre'],
  ['Râ', 'la mythologie égyptienne', 'le soleil'],
  ['Osiris', 'la mythologie égyptienne', 'l’au-delà et la résurrection'],
  ['Anubis', 'la mythologie égyptienne', 'l’embaumement et les morts'],
]

/** Unités du système international : grandeur, unité, symbole. */
const UNITS = [
  ['la longueur', 'le mètre', 'm'],
  ['la masse', 'le kilogramme', 'kg'],
  ['le temps', 'la seconde', 's'],
  ['l’intensité électrique', 'l’ampère', 'A'],
  ['la température', 'le kelvin', 'K'],
  ['la quantité de matière', 'la mole', 'mol'],
  ['l’intensité lumineuse', 'la candela', 'cd'],
  ['la force', 'le newton', 'N'],
  ['l’énergie', 'le joule', 'J'],
  ['la puissance', 'le watt', 'W'],
  ['la pression', 'le pascal', 'Pa'],
  ['la fréquence', 'le hertz', 'Hz'],
  ['la tension électrique', 'le volt', 'V'],
  ['la résistance électrique', 'l’ohm', 'Ω'],
  ['la charge électrique', 'le coulomb', 'C'],
  ['le volume', 'le mètre cube', 'm³'],
  ['la superficie', 'le mètre carré', 'm²'],
  ['la vitesse', 'le mètre par seconde', 'm/s'],
  ['l’angle plan', 'le radian', 'rad'],
  ['la radioactivité', 'le becquerel', 'Bq'],
]

/** Les sept merveilles du monde antique : nom, lieu. */
const WONDERS = [
  ['la grande pyramide de Gizeh', 'l’Égypte'],
  ['les jardins suspendus de Babylone', 'la Mésopotamie'],
  ['la statue de Zeus à Olympie', 'la Grèce'],
  ['le temple d’Artémis à Éphèse', 'l’Anatolie'],
  ['le mausolée d’Halicarnasse', 'l’Anatolie'],
  ['le colosse de Rhodes', 'la Grèce'],
  ['le phare d’Alexandrie', 'l’Égypte'],
]

/** Langues : nom, famille, aire principale. */
const LANGUAGES = [
  ['le français', 'les langues romanes', 'l’Europe et l’Afrique francophone'],
  ['l’espagnol', 'les langues romanes', 'l’Amérique latine'],
  ['l’italien', 'les langues romanes', 'la péninsule italienne'],
  ['le portugais', 'les langues romanes', 'le Brésil et le Portugal'],
  ['le roumain', 'les langues romanes', 'les Balkans'],
  ['l’anglais', 'les langues germaniques', 'les îles Britanniques et l’Amérique du Nord'],
  ['l’allemand', 'les langues germaniques', 'l’Europe centrale'],
  ['le néerlandais', 'les langues germaniques', 'les Pays-Bas et la Flandre'],
  ['le suédois', 'les langues germaniques', 'la Scandinavie'],
  ['le russe', 'les langues slaves', 'l’Eurasie septentrionale'],
  ['le polonais', 'les langues slaves', 'l’Europe centrale'],
  ['l’arabe', 'les langues sémitiques', 'le Proche-Orient et l’Afrique du Nord'],
  ['l’hébreu', 'les langues sémitiques', 'le Levant'],
  ['le mandarin', 'les langues sino-tibétaines', 'la Chine'],
  ['le japonais', 'les langues japoniques', 'l’archipel japonais'],
  ['le swahili', 'les langues bantoues', 'l’Afrique de l’Est'],
  ['le wolof', 'les langues nigéro-congolaises', 'le Sénégal'],
  ['le hindi', 'les langues indo-aryennes', 'le nord de l’Inde'],
]

export const CULTURE_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [quantity, unit] = pick(rng, UNITS)
      return {
        text: `Quelle est l’unité de mesure ${de(quantity)} dans le système international ?`,
        answer: cap(unit),
        distractors: othersFrom(rng, UNITS, 1, unit).map(cap),
        explanation: `${cap(quantity)} se mesure en ${unit.replace(/^le |^la |^l’/, '')}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [, unit, symbol] = pick(rng, UNITS)
      return {
        text: `Quel est le symbole ${de(unit)} ?`,
        answer: symbol,
        distractors: othersFrom(rng, UNITS, 2, symbol),
        explanation: `${cap(unit)} a pour symbole ${symbol}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [god, pantheon] = pick(rng, MYTHS)
      return {
        text: `À quelle mythologie appartient ${god} ?`,
        answer: cap(pantheon),
        distractors: othersFrom(rng, MYTHS, 1, pantheon).map(cap),
        explanation: `${god} appartient à ${pantheon}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [god, , domain] = pick(rng, MYTHS)
      return {
        text: `De quoi ${god} est-il la divinité ?`,
        answer: cap(domain),
        distractors: othersFrom(rng, MYTHS, 2, domain).map(cap),
        explanation: `${god} préside ${a(domain)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [god, pantheon, domain] = pick(rng, MYTHS)
      return {
        text: `Quelle divinité de ${pantheon} préside ${a(domain)} ?`,
        answer: god,
        distractors: othersFrom(rng, MYTHS, 0, god),
        explanation: `${god}, dans ${pantheon}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [quantity, unit, symbol] = pick(rng, UNITS)
      return {
        text: `Quelle grandeur physique s’exprime en ${unit.replace(/^le |^la |^l’/, '')} (symbole ${symbol}) ?`,
        answer: cap(quantity),
        distractors: othersFrom(rng, UNITS, 0, quantity).map(cap),
        explanation: `${cap(unit)} mesure ${quantity}`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [language, family] = pick(rng, LANGUAGES)
      return {
        text: `À quelle famille linguistique appartient ${language} ?`,
        answer: cap(family),
        distractors: othersFrom(rng, LANGUAGES, 1, family).map(cap),
        explanation: `${cap(language)} fait partie ${de(family)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [language, , area] = pick(rng, LANGUAGES)
      return {
        text: `Quelle est l’aire principale ${de(language)} ?`,
        answer: cap(area),
        distractors: othersFrom(rng, LANGUAGES, 2, area).map(cap),
        explanation: `${cap(language)} est parlé dans ${area}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [wonder, place] = pick(rng, WONDERS)
      return {
        text: `Où se dressait ${wonder}, l’une des sept merveilles du monde antique ?`,
        answer: cap(place),
        distractors: othersFrom(rng, WONDERS, 1, place).map(cap),
        explanation: `${cap(wonder)} se trouvait dans ${place}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const family = pick(rng, ['les langues romanes', 'les langues germaniques', 'les langues slaves', 'les langues sémitiques'])
      const inFamily = LANGUAGES.filter(l => l[1] === family)
      const others = LANGUAGES.filter(l => l[1] !== family)
      if (inFamily.length < 2 || others.length < 4) return null
      const [language] = pick(rng, inFamily)
      return {
        text: `Parmi ces langues, laquelle appartient ${a(family)} ?`,
        answer: cap(language),
        distractors: shuffled(rng, others).slice(0, 6).map(l => cap(l[0])),
        explanation: `${cap(language)} relève ${de(family)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [language, family, area] = pick(rng, LANGUAGES)
      return {
        text: `Quelle langue ${de(family).replace(/^des /, '')}, parlée dans ${area}, correspond à cette description ?`,
        answer: cap(language),
        distractors: othersFrom(rng, LANGUAGES, 0, language).map(cap),
        explanation: `${cap(language)} — ${family}, ${area}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [wonder, place] = pick(rng, WONDERS)
      return {
        text: `Quelle merveille du monde antique s’élevait dans ${place} ?`,
        answer: cap(wonder),
        distractors: othersFrom(rng, WONDERS, 0, wonder).map(cap),
        explanation: `${cap(wonder)}, dans ${place}`,
      }
    },
  },
]
