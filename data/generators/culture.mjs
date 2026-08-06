// Générateurs des catégories culturelles : cinéma, musique, littérature.
//
// Trois tables de faits — films, compositeurs et œuvres, écrivains et romans —
// exploitées par les mêmes formes de questions : attribution directe, attribution
// inverse, datation, comparaison. Regroupées dans un seul module parce qu'elles
// partagent exactement cette structure.

import { a, de, fr, pick, shuffled, year as yearOf } from './kit.mjs'

function othersFrom(rng, table, index, answer) {
  return shuffled(rng, table).map(r => r[index]).filter(v => v !== answer).slice(0, 6)
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

// ---------------------------------------------------------------------------
// Cinéma
// ---------------------------------------------------------------------------

/** Films : titre, année, réalisateur, genre. */
const FILMS = [
  ['Le Parrain', 1972, 'Francis Ford Coppola', 'le film de gangsters'],
  ['Citizen Kane', 1941, 'Orson Welles', 'le drame'],
  ['Psychose', 1960, 'Alfred Hitchcock', 'le thriller'],
  ['Les Oiseaux', 1963, 'Alfred Hitchcock', 'le thriller'],
  ['2001, l’Odyssée de l’espace', 1968, 'Stanley Kubrick', 'la science-fiction'],
  ['Orange mécanique', 1971, 'Stanley Kubrick', 'la science-fiction'],
  ['Shining', 1980, 'Stanley Kubrick', 'l’horreur'],
  ['Les Dents de la mer', 1975, 'Steven Spielberg', 'le thriller'],
  ['E.T. l’extra-terrestre', 1982, 'Steven Spielberg', 'la science-fiction'],
  ['La Liste de Schindler', 1993, 'Steven Spielberg', 'le drame historique'],
  ['Jurassic Park', 1993, 'Steven Spielberg', 'la science-fiction'],
  ['Taxi Driver', 1976, 'Martin Scorsese', 'le drame'],
  ['Les Affranchis', 1990, 'Martin Scorsese', 'le film de gangsters'],
  ['Apocalypse Now', 1979, 'Francis Ford Coppola', 'le film de guerre'],
  ['Blade Runner', 1982, 'Ridley Scott', 'la science-fiction'],
  ['Alien', 1979, 'Ridley Scott', 'la science-fiction'],
  ['Gladiator', 2000, 'Ridley Scott', 'le péplum'],
  ['Pulp Fiction', 1994, 'Quentin Tarantino', 'le film de gangsters'],
  ['Kill Bill', 2003, 'Quentin Tarantino', 'le film d’action'],
  ['Matrix', 1999, 'les Wachowski', 'la science-fiction'],
  ['Titanic', 1997, 'James Cameron', 'le drame'],
  ['Terminator', 1984, 'James Cameron', 'la science-fiction'],
  ['Avatar', 2009, 'James Cameron', 'la science-fiction'],
  ['Le Seigneur des anneaux : la Communauté de l’anneau', 2001, 'Peter Jackson', 'la fantasy'],
  ['Inception', 2010, 'Christopher Nolan', 'la science-fiction'],
  ['Interstellar', 2014, 'Christopher Nolan', 'la science-fiction'],
  ['Le Fabuleux Destin d’Amélie Poulain', 2001, 'Jean-Pierre Jeunet', 'la comédie'],
  ['La Haine', 1995, 'Mathieu Kassovitz', 'le drame social'],
  ['Les Quatre Cents Coups', 1959, 'François Truffaut', 'le drame'],
  ['À bout de souffle', 1960, 'Jean-Luc Godard', 'le drame'],
  ['Les Tontons flingueurs', 1963, 'Georges Lautner', 'la comédie'],
  ['La Grande Vadrouille', 1966, 'Gérard Oury', 'la comédie'],
  ['Intouchables', 2011, 'Olivier Nakache et Éric Toledano', 'la comédie dramatique'],
  ['Le Voyage de Chihiro', 2001, 'Hayao Miyazaki', 'l’animation'],
  ['Mon voisin Totoro', 1988, 'Hayao Miyazaki', 'l’animation'],
  ['Parasite', 2019, 'Bong Joon-ho', 'le drame social'],
  ['Les Temps modernes', 1936, 'Charlie Chaplin', 'la comédie'],
  ['Le Dictateur', 1940, 'Charlie Chaplin', 'la satire'],
  ['Casablanca', 1942, 'Michael Curtiz', 'le drame'],
  ['Le Bon, la Brute et le Truand', 1966, 'Sergio Leone', 'le western'],
  ['Il était une fois dans l’Ouest', 1968, 'Sergio Leone', 'le western'],
  ['La Dolce Vita', 1960, 'Federico Fellini', 'le drame'],
  ['Les Sept Samouraïs', 1954, 'Akira Kurosawa', 'le film d’aventure'],
  ['Rashomon', 1950, 'Akira Kurosawa', 'le drame'],
  ['Metropolis', 1927, 'Fritz Lang', 'la science-fiction'],
]

export const CINEMA_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [title, , , genre] = pick(rng, FILMS)
      return {
        text: `À quel genre appartient le film « ${title} » ?`,
        answer: cap(genre),
        distractors: othersFrom(rng, FILMS, 3, genre).map(cap),
        explanation: `« ${title} » relève ${de(genre)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [title, , director] = pick(rng, FILMS)
      return {
        text: `Qui a réalisé « ${title} » ?`,
        answer: director,
        distractors: othersFrom(rng, FILMS, 2, director),
        explanation: `« ${title} » est signé ${director}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [title, year] = pick(rng, FILMS)
      return {
        text: `En quelle année est sorti « ${title} » ?`,
        answer: yearOf(year),
        distractors: [yearOf(year + 2), yearOf(year - 2), yearOf(year + 5), yearOf(year - 5), yearOf(year + 10)],
        explanation: `« ${title} » date de ${yearOf(year)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [title, , director] = pick(rng, FILMS)
      const sameDirector = FILMS.filter(f => f[2] === director && f[0] !== title)
      if (!sameDirector.length) return null
      const other = pick(rng, sameDirector)
      return {
        text: `Quel film partage son réalisateur avec « ${title} » ?`,
        answer: `« ${other[0]} »`,
        distractors: shuffled(rng, FILMS)
          .filter(f => f[2] !== director)
          .slice(0, 6)
          .map(f => `« ${f[0]} »`),
        explanation: `${director} a réalisé les deux`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [title, year, director] = pick(rng, FILMS)
      return {
        text: `Quel film ${de(director)}, sorti en ${yearOf(year)}, appartient à sa filmographie ?`,
        answer: `« ${title} »`,
        distractors: shuffled(rng, FILMS)
          .filter(f => f[2] !== director)
          .slice(0, 6)
          .map(f => `« ${f[0]} »`),
        explanation: `« ${title} » (${yearOf(year)}), réalisé par ${director}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const a = pick(rng, FILMS)
      const b = pick(rng, FILMS)
      if (a[0] === b[0] || a[1] === b[1]) return null
      const older = a[1] < b[1] ? a : b
      return {
        text: `Lequel de ces deux films est le plus ancien : « ${a[0]} » ou « ${b[0]} » ?`,
        answer: `« ${older[0]} »`,
        distractors: [
          `« ${older[0] === a[0] ? b[0] : a[0]} »`,
          'Ils datent de la même année',
          'Impossible à déterminer',
          'Aucun des deux n’est daté',
        ],
        explanation: `« ${a[0]} » : ${yearOf(a[1])} ; « ${b[0]} » : ${yearOf(b[1])}`,
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Musique
// ---------------------------------------------------------------------------

/** Compositeurs : nom, période, nationalité, œuvre emblématique. */
const COMPOSERS = [
  ['Jean-Sébastien Bach', 'la période baroque', 'allemand', 'les Variations Goldberg'],
  ['Antonio Vivaldi', 'la période baroque', 'italien', 'Les Quatre Saisons'],
  ['Georg Friedrich Haendel', 'la période baroque', 'allemand', 'le Messie'],
  ['Wolfgang Amadeus Mozart', 'la période classique', 'autrichien', 'La Flûte enchantée'],
  ['Joseph Haydn', 'la période classique', 'autrichien', 'La Création'],
  ['Ludwig van Beethoven', 'la charnière classique-romantique', 'allemand', 'la Neuvième Symphonie'],
  ['Frédéric Chopin', 'la période romantique', 'polonais', 'les Nocturnes'],
  ['Franz Schubert', 'la période romantique', 'autrichien', 'La Truite'],
  ['Franz Liszt', 'la période romantique', 'hongrois', 'les Rhapsodies hongroises'],
  ['Richard Wagner', 'la période romantique', 'allemand', 'la Tétralogie'],
  ['Giuseppe Verdi', 'la période romantique', 'italien', 'La Traviata'],
  ['Piotr Ilitch Tchaïkovski', 'la période romantique', 'russe', 'Le Lac des cygnes'],
  ['Johannes Brahms', 'la période romantique', 'allemand', 'le Requiem allemand'],
  ['Claude Debussy', 'la période impressionniste', 'français', 'Clair de lune'],
  ['Maurice Ravel', 'la période impressionniste', 'français', 'le Boléro'],
  ['Igor Stravinsky', 'la période moderne', 'russe', 'Le Sacre du printemps'],
  ['Georges Bizet', 'la période romantique', 'français', 'Carmen'],
  ['Camille Saint-Saëns', 'la période romantique', 'français', 'Le Carnaval des animaux'],
  ['Erik Satie', 'la période moderne', 'français', 'les Gymnopédies'],
  ['Antonín Dvořák', 'la période romantique', 'tchèque', 'la Symphonie du Nouveau Monde'],
  ['Gioachino Rossini', 'la période romantique', 'italien', 'Le Barbier de Séville'],
  ['Giacomo Puccini', 'la période romantique', 'italien', 'La Bohème'],
  ['Gustav Mahler', 'la période romantique', 'autrichien', 'le Chant de la Terre'],
  ['Sergueï Rachmaninov', 'la période romantique', 'russe', 'le Concerto pour piano nº 2'],
  ['Modeste Moussorgski', 'la période romantique', 'russe', 'les Tableaux d’une exposition'],
  ['Nikolaï Rimski-Korsakov', 'la période romantique', 'russe', 'Shéhérazade'],
  ['Edvard Grieg', 'la période romantique', 'norvégien', 'Peer Gynt'],
  ['Jean Sibelius', 'la période romantique', 'finlandais', 'Finlandia'],
  ['Hector Berlioz', 'la période romantique', 'français', 'la Symphonie fantastique'],
  ['Gabriel Fauré', 'la période romantique', 'français', 'le Requiem'],
  ['César Franck', 'la période romantique', 'belge', 'la Symphonie en ré mineur'],
  ['Béla Bartók', 'la période moderne', 'hongrois', 'le Mandarin merveilleux'],
  ['Serge Prokofiev', 'la période moderne', 'russe', 'Pierre et le Loup'],
  ['Dmitri Chostakovitch', 'la période moderne', 'russe', 'la Symphonie nº 5'],
  ['George Gershwin', 'la période moderne', 'américain', 'Rhapsody in Blue'],
  ['Olivier Messiaen', 'la période contemporaine', 'français', 'le Quatuor pour la fin du temps'],
  ['Pierre Boulez', 'la période contemporaine', 'français', 'le Marteau sans maître'],
  ['Philip Glass', 'la période contemporaine', 'américain', 'Einstein on the Beach'],
  ['Claudio Monteverdi', 'la période baroque', 'italien', 'l’Orfeo'],
  ['Henry Purcell', 'la période baroque', 'anglais', 'Didon et Énée'],
  ['Jean-Philippe Rameau', 'la période baroque', 'français', 'les Indes galantes'],
  ['Christoph Willibald Gluck', 'la période classique', 'allemand', 'Orphée et Eurydice'],
]

/** Termes musicaux : terme, signification, catégorie. */
const MUSIC_TERMS = [
  ['allegro', 'un tempo vif et enjoué', 'les indications de tempo'],
  ['andante', 'un tempo modéré, allant', 'les indications de tempo'],
  ['adagio', 'un tempo lent', 'les indications de tempo'],
  ['presto', 'un tempo très rapide', 'les indications de tempo'],
  ['largo', 'un tempo très lent et ample', 'les indications de tempo'],
  ['moderato', 'un tempo modéré', 'les indications de tempo'],
  ['pianissimo', 'une nuance très douce', 'les nuances'],
  ['mezzo forte', 'une nuance moyennement forte', 'les nuances'],
  ['fortissimo', 'une nuance très puissante', 'les nuances'],
  ['crescendo', 'une intensité qui augmente progressivement', 'les nuances'],
  ['diminuendo', 'une intensité qui décroît progressivement', 'les nuances'],
  ['legato', 'des notes liées sans interruption', 'les modes de jeu'],
  ['staccato', 'des notes détachées et brèves', 'les modes de jeu'],
  ['pizzicato', 'des cordes pincées au doigt', 'les modes de jeu'],
  ['tremolo', 'une répétition très rapide d’une note', 'les modes de jeu'],
  ['vibrato', 'une légère oscillation de la hauteur', 'les modes de jeu'],
  ['da capo', 'la reprise depuis le début', 'les indications de forme'],
  ['coda', 'la section conclusive d’un morceau', 'les indications de forme'],
  ['ostinato', 'un motif répété obstinément', 'les indications de forme'],
  ['cadence', 'une formule harmonique de conclusion', 'les indications de forme'],
]

/** Formes et genres : nom, définition. */
const MUSIC_FORMS = [
  ['la symphonie', 'une œuvre orchestrale en plusieurs mouvements'],
  ['le concerto', 'une œuvre opposant un soliste à l’orchestre'],
  ['la sonate', 'une œuvre pour un ou deux instruments en plusieurs mouvements'],
  ['la fugue', 'une pièce contrapuntique bâtie sur un sujet imité'],
  ['l’opéra', 'un drame entièrement chanté et mis en scène'],
  ['l’oratorio', 'une œuvre sacrée chantée sans mise en scène'],
  ['le requiem', 'une messe des morts mise en musique'],
  ['le quatuor à cordes', 'une formation de deux violons, alto et violoncelle'],
  ['le lied', 'une mélodie allemande pour voix et piano'],
  ['la suite', 'une succession de danses instrumentales'],
  ['le prélude', 'une pièce d’introduction, souvent libre'],
  ['la cantate', 'une œuvre vocale avec accompagnement instrumental'],
]

/** Instruments : nom, famille, mode de jeu. */
const INSTRUMENTS = [
  ['le violon', 'les cordes frottées', 'l’archet'],
  ['le violoncelle', 'les cordes frottées', 'l’archet'],
  ['la contrebasse', 'les cordes frottées', 'l’archet'],
  ['la harpe', 'les cordes pincées', 'les doigts'],
  ['la guitare', 'les cordes pincées', 'les doigts ou un médiator'],
  ['le piano', 'les cordes frappées', 'un clavier'],
  ['la flûte traversière', 'les bois', 'le souffle'],
  ['le hautbois', 'les bois', 'une anche double'],
  ['la clarinette', 'les bois', 'une anche simple'],
  ['le basson', 'les bois', 'une anche double'],
  ['le saxophone', 'les bois', 'une anche simple'],
  ['la trompette', 'les cuivres', 'des pistons'],
  ['le trombone', 'les cuivres', 'une coulisse'],
  ['le cor', 'les cuivres', 'des palettes'],
  ['le tuba', 'les cuivres', 'des pistons'],
  ['la timbale', 'les percussions', 'des mailloches'],
  ['le xylophone', 'les percussions', 'des mailloches'],
  ['l’orgue', 'les claviers', 'des claviers et un pédalier'],
]

export const MUSIQUE_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [name, family] = pick(rng, INSTRUMENTS)
      return {
        text: `À quelle famille d’instruments appartient ${name} ?`,
        answer: cap(family),
        distractors: othersFrom(rng, INSTRUMENTS, 1, family).map(cap),
        explanation: `${cap(name)} fait partie ${family.startsWith('les') ? 'des ' + family.slice(4) : 'de ' + family}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [name, , play] = pick(rng, INSTRUMENTS)
      return {
        text: `Comment produit-on le son ${de(name)} ?`,
        answer: `Avec ${play}`,
        distractors: othersFrom(rng, INSTRUMENTS, 2, play).map(p => `Avec ${p}`),
        explanation: `${cap(name)} se joue avec ${play}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [name, , , work] = pick(rng, COMPOSERS)
      return {
        text: `Qui a composé « ${work} » ?`,
        answer: name,
        distractors: othersFrom(rng, COMPOSERS, 0, name),
        explanation: `« ${work} » est de ${name}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [name, period] = pick(rng, COMPOSERS)
      return {
        text: `À quelle période musicale rattache-t-on ${name} ?`,
        answer: cap(period),
        distractors: othersFrom(rng, COMPOSERS, 1, period).map(cap),
        explanation: `${name} appartient à ${period}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [name, , nationality] = pick(rng, COMPOSERS)
      return {
        text: `De quelle nationalité était le compositeur ${name} ?`,
        answer: cap(nationality),
        distractors: othersFrom(rng, COMPOSERS, 2, nationality).map(cap),
        explanation: `${name} était ${nationality}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [name, period, nationality, work] = pick(rng, COMPOSERS)
      return {
        text: `Quel compositeur ${nationality} de ${period}, auteur de « ${work} », correspond à cette description ?`,
        answer: name,
        distractors: othersFrom(rng, COMPOSERS, 0, name),
        explanation: `${name} : ${nationality}, ${period}, « ${work} »`,
      }
    },
  },
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [term, meaning] = pick(rng, MUSIC_TERMS)
      return {
        text: `Que signifie l’indication « ${term} » sur une partition ?`,
        answer: cap(meaning),
        distractors: othersFrom(rng, MUSIC_TERMS, 1, meaning).map(cap),
        explanation: `« ${term} » : ${meaning}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [term, , family] = pick(rng, MUSIC_TERMS)
      return {
        text: `À quelle catégorie d’indications appartient « ${term} » ?`,
        answer: cap(family),
        distractors: othersFrom(rng, MUSIC_TERMS, 2, family).map(cap),
        explanation: `« ${term} » relève ${de(family)}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [form, definition] = pick(rng, MUSIC_FORMS)
      return {
        text: `Comment définit-on ${form} ?`,
        answer: cap(definition),
        distractors: othersFrom(rng, MUSIC_FORMS, 1, definition).map(cap),
        explanation: `${cap(form)} : ${definition}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [form, definition] = pick(rng, MUSIC_FORMS)
      return {
        text: `Quelle forme musicale se définit ainsi : ${definition} ?`,
        answer: cap(form),
        distractors: othersFrom(rng, MUSIC_FORMS, 0, form).map(cap),
        explanation: `${cap(form)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [term, meaning, family] = pick(rng, MUSIC_TERMS)
      return {
        text: `Quel terme ${de(family)} désigne ceci : ${meaning} ?`,
        answer: cap(term),
        distractors: othersFrom(rng, MUSIC_TERMS, 0, term).map(cap),
        explanation: `« ${term} » : ${meaning}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const period = pick(rng, ['la période baroque', 'la période classique', 'la période romantique', 'la période moderne', 'la période contemporaine'])
      const inPeriod = COMPOSERS.filter(c => c[1] === period)
      const others = COMPOSERS.filter(c => c[1] !== period)
      if (inPeriod.length < 2 || others.length < 4) return null
      const [name] = pick(rng, inPeriod)
      return {
        text: `Parmi ces compositeurs, lequel appartient à ${period} ?`,
        answer: name,
        distractors: shuffled(rng, others).slice(0, 6).map(c => c[0]),
        explanation: `${name} relève de ${period}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [name, , , work] = pick(rng, COMPOSERS)
      return {
        text: `Quelle œuvre emblématique doit-on à ${name} ?`,
        answer: `« ${work} »`,
        distractors: othersFrom(rng, COMPOSERS, 3, work).map(w => `« ${w} »`),
        explanation: `${name} a composé « ${work} »`,
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Littérature
// ---------------------------------------------------------------------------

/** Œuvres : titre, auteur, année, courant ou genre. */
const BOOKS = [
  ['Les Misérables', 'Victor Hugo', 1862, 'le roman social'],
  ['Notre-Dame de Paris', 'Victor Hugo', 1831, 'le roman historique'],
  ['Madame Bovary', 'Gustave Flaubert', 1857, 'le réalisme'],
  ['L’Éducation sentimentale', 'Gustave Flaubert', 1869, 'le réalisme'],
  ['Le Rouge et le Noir', 'Stendhal', 1830, 'le roman d’apprentissage'],
  ['Le Père Goriot', 'Honoré de Balzac', 1835, 'le réalisme'],
  ['Eugénie Grandet', 'Honoré de Balzac', 1833, 'le réalisme'],
  ['Germinal', 'Émile Zola', 1885, 'le naturalisme'],
  ['L’Assommoir', 'Émile Zola', 1877, 'le naturalisme'],
  ['Bel-Ami', 'Guy de Maupassant', 1885, 'le réalisme'],
  ['À la recherche du temps perdu', 'Marcel Proust', 1913, 'le roman moderne'],
  ['L’Étranger', 'Albert Camus', 1942, 'l’absurde'],
  ['La Peste', 'Albert Camus', 1947, 'l’absurde'],
  ['La Nausée', 'Jean-Paul Sartre', 1938, 'l’existentialisme'],
  ['Le Petit Prince', 'Antoine de Saint-Exupéry', 1943, 'le conte philosophique'],
  ['Voyage au bout de la nuit', 'Louis-Ferdinand Céline', 1932, 'le roman moderne'],
  ['Les Fleurs du mal', 'Charles Baudelaire', 1857, 'la poésie symboliste'],
  ['Une saison en enfer', 'Arthur Rimbaud', 1873, 'la poésie symboliste'],
  ['Candide', 'Voltaire', 1759, 'le conte philosophique'],
  ['Les Liaisons dangereuses', 'Choderlos de Laclos', 1782, 'le roman épistolaire'],
  ['Le Comte de Monte-Cristo', 'Alexandre Dumas', 1844, 'le roman d’aventures'],
  ['Les Trois Mousquetaires', 'Alexandre Dumas', 1844, 'le roman d’aventures'],
  ['Vingt Mille Lieues sous les mers', 'Jules Verne', 1870, 'le roman d’anticipation'],
  ['Le Tour du monde en quatre-vingts jours', 'Jules Verne', 1873, 'le roman d’aventures'],
  ['Don Quichotte', 'Miguel de Cervantès', 1605, 'le roman picaresque'],
  ['Hamlet', 'William Shakespeare', 1601, 'la tragédie'],
  ['Roméo et Juliette', 'William Shakespeare', 1597, 'la tragédie'],
  ['Guerre et Paix', 'Léon Tolstoï', 1869, 'le roman historique'],
  ['Anna Karénine', 'Léon Tolstoï', 1877, 'le roman réaliste'],
  ['Crime et Châtiment', 'Fiodor Dostoïevski', 1866, 'le roman psychologique'],
  ['Les Frères Karamazov', 'Fiodor Dostoïevski', 1880, 'le roman psychologique'],
  ['1984', 'George Orwell', 1949, 'la dystopie'],
  ['La Ferme des animaux', 'George Orwell', 1945, 'l’apologue politique'],
  ['Le Meilleur des mondes', 'Aldous Huxley', 1932, 'la dystopie'],
  ['Cent ans de solitude', 'Gabriel García Márquez', 1967, 'le réalisme magique'],
  ['L’Odyssée', 'Homère', -750, 'l’épopée'],
  ['L’Iliade', 'Homère', -800, 'l’épopée'],
  ['La Divine Comédie', 'Dante', 1321, 'la poésie allégorique'],
  ['Le Deuxième Sexe', 'Simone de Beauvoir', 1949, 'l’essai'],
  ['L’Enfant noir', 'Camara Laye', 1953, 'le roman autobiographique'],
  ['Une si longue lettre', 'Mariama Bâ', 1979, 'le roman épistolaire'],
  ['Le Vieil Homme et la Mer', 'Ernest Hemingway', 1952, 'le récit'],
]

export const LITTERATURE_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [title, author] = pick(rng, BOOKS.slice(0, 25))
      return {
        text: `Qui a écrit « ${title} » ?`,
        answer: author,
        distractors: othersFrom(rng, BOOKS, 1, author),
        explanation: `« ${title} » est de ${author}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [title, author] = pick(rng, BOOKS)
      return {
        text: `De quel auteur « ${title} » est-il l’œuvre ?`,
        answer: author,
        distractors: othersFrom(rng, BOOKS, 1, author),
        explanation: `« ${title} » a été écrit par ${author}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [title, author] = pick(rng, BOOKS)
      const same = BOOKS.filter(b => b[1] === author && b[0] !== title)
      if (!same.length) return null
      const other = pick(rng, same)
      return {
        text: `Quelle œuvre partage son auteur avec « ${title} » ?`,
        answer: `« ${other[0]} »`,
        distractors: shuffled(rng, BOOKS)
          .filter(b => b[1] !== author)
          .slice(0, 6)
          .map(b => `« ${b[0]} »`),
        explanation: `${author} a écrit les deux`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [title, , , genre] = pick(rng, BOOKS)
      return {
        text: `À quel courant ou genre rattache-t-on « ${title} » ?`,
        answer: cap(genre),
        distractors: othersFrom(rng, BOOKS, 3, genre).map(cap),
        explanation: `« ${title} » relève ${de(genre)}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [title, , year] = pick(rng, BOOKS.filter(b => b[2] > 1500))
      return {
        text: `En quelle année a paru « ${title} » ?`,
        answer: yearOf(year),
        distractors: [yearOf(year + 3), yearOf(year - 3), yearOf(year + 12), yearOf(year - 12), yearOf(year + 30)],
        explanation: `« ${title} » : ${yearOf(year)}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const a = pick(rng, BOOKS)
      const b = pick(rng, BOOKS)
      if (a[0] === b[0] || a[2] === b[2]) return null
      const older = a[2] < b[2] ? a : b
      return {
        text: `Laquelle de ces deux œuvres a paru la première : « ${a[0]} » ou « ${b[0]} » ?`,
        answer: `« ${older[0]} »`,
        distractors: [
          `« ${older[0] === a[0] ? b[0] : a[0]} »`,
          'Elles ont paru la même année',
          'Impossible à déterminer',
          'Aucune des deux n’est datée',
        ],
        explanation: `« ${a[0]} » : ${yearOf(a[2])} ; « ${b[0]} » : ${yearOf(b[2])}`,
      }
    },
  },
]
