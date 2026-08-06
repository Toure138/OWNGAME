// Générateurs des sciences du vivant et de la Terre : biologie, santé,
// sciences de la Terre.
//
// Comme ailleurs, les faits sont écrits une fois dans des tables et recombinés.
// Quelques valeurs restent calculées — masses planétaires, durées de
// révolution — et sont alors justes par construction.

import { a, de, fr, numericDistractors, pick, shuffled } from './kit.mjs'

function othersFrom(rng, table, index, answer) {
  return shuffled(rng, table).map(r => r[index]).filter(v => v !== answer).slice(0, 6)
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

// ---------------------------------------------------------------------------
// Biologie
// ---------------------------------------------------------------------------

/** Organes : nom, appareil, fonction principale. */
const ORGANS = [
  ['le cœur', 'l’appareil circulatoire', 'propulser le sang dans l’organisme'],
  ['les poumons', 'l’appareil respiratoire', 'assurer les échanges gazeux'],
  ['le foie', 'l’appareil digestif', 'filtrer le sang et produire la bile'],
  ['l’estomac', 'l’appareil digestif', 'commencer la digestion des protéines'],
  ['l’intestin grêle', 'l’appareil digestif', 'absorber les nutriments'],
  ['les reins', 'l’appareil urinaire', 'filtrer le sang et former l’urine'],
  ['le pancréas', 'le système endocrinien', 'sécréter l’insuline et des enzymes digestives'],
  ['la thyroïde', 'le système endocrinien', 'réguler le métabolisme'],
  ['le cerveau', 'le système nerveux', 'traiter l’information et commander l’organisme'],
  ['la moelle épinière', 'le système nerveux', 'transmettre l’influx entre cerveau et corps'],
  ['la rate', 'le système immunitaire', 'filtrer le sang et recycler les globules rouges'],
  ['la peau', 'le système tégumentaire', 'protéger l’organisme et réguler la température'],
  ['la vessie', 'l’appareil urinaire', 'stocker l’urine'],
  ['la moelle osseuse', 'le système hématopoïétique', 'produire les cellules sanguines'],
]

/** Organites : nom, rôle. */
const ORGANELLES = [
  ['la mitochondrie', 'produire l’ATP par respiration cellulaire'],
  ['le ribosome', 'assembler les protéines'],
  ['le noyau', 'contenir l’ADN et diriger la cellule'],
  ['le lysosome', 'digérer les déchets cellulaires'],
  ['l’appareil de Golgi', 'trier et adresser les protéines'],
  ['le réticulum endoplasmique', 'synthétiser protéines et lipides'],
  ['le chloroplaste', 'réaliser la photosynthèse'],
  ['la membrane plasmique', 'délimiter la cellule et contrôler les échanges'],
  ['le cytosquelette', 'soutenir la cellule et permettre ses mouvements'],
  ['la vacuole', 'stocker eau et substances dans la cellule végétale'],
]

/** Classes animales : nom, caractère distinctif, exemple. */
const ANIMAL_CLASSES = [
  ['les mammifères', 'l’allaitement des petits', 'le dauphin'],
  ['les oiseaux', 'le corps couvert de plumes', 'l’aigle'],
  ['les reptiles', 'la peau couverte d’écailles', 'le crocodile'],
  ['les amphibiens', 'une vie partagée entre eau et terre', 'la grenouille'],
  ['les poissons', 'la respiration par branchies', 'le thon'],
  ['les insectes', 'trois paires de pattes', 'la fourmi'],
  ['les arachnides', 'quatre paires de pattes', 'l’araignée'],
  ['les mollusques', 'un corps mou souvent protégé d’une coquille', 'l’escargot'],
  ['les crustacés', 'une carapace et des appendices articulés', 'le crabe'],
]

export const BIOLOGIE_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [organ, , role] = pick(rng, ORGANS)
      return {
        text: `Quelle est la fonction principale ${de(organ)} ?`,
        answer: cap(role),
        distractors: othersFrom(rng, ORGANS, 2, role).map(cap),
        explanation: `${cap(organ)} sert à ${role}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [organ, system] = pick(rng, ORGANS)
      return {
        text: `À quel appareil ou système appartient ${organ} ?`,
        answer: cap(system),
        distractors: othersFrom(rng, ORGANS, 1, system).map(cap),
        explanation: `${cap(organ)} fait partie ${de(system)}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [group, , example] = pick(rng, ANIMAL_CLASSES)
      return {
        text: `À quel groupe animal appartient ${example} ?`,
        answer: cap(group),
        distractors: othersFrom(rng, ANIMAL_CLASSES, 0, group).map(cap),
        explanation: `${cap(example)} appartient ${a(group)}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [group, trait] = pick(rng, ANIMAL_CLASSES)
      return {
        text: `Quel caractère distingue ${group} ?`,
        answer: cap(trait),
        distractors: othersFrom(rng, ANIMAL_CLASSES, 1, trait).map(cap),
        explanation: `${cap(group)} se reconnaissent à ${trait}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [organelle, role] = pick(rng, ORGANELLES)
      return {
        text: `Quel est le rôle ${de(organelle)} dans la cellule ?`,
        answer: cap(role),
        distractors: othersFrom(rng, ORGANELLES, 1, role).map(cap),
        explanation: `${cap(organelle)} sert à ${role}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [organelle, role] = pick(rng, ORGANELLES)
      return {
        text: `Quel organite cellulaire a pour fonction de ${role} ?`,
        answer: cap(organelle),
        distractors: othersFrom(rng, ORGANELLES, 0, organelle).map(cap),
        explanation: `${cap(organelle)} : ${role}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [organ, system, role] = pick(rng, ORGANS)
      return {
        text: `Quel organe ${de(system)} assure cette fonction : ${role} ?`,
        answer: cap(organ),
        distractors: othersFrom(rng, ORGANS, 0, organ).map(cap),
        explanation: `${cap(organ)}, dans ${system}`,
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Santé
// ---------------------------------------------------------------------------

/** Vitamines : nom, rôle, carence, source. */
const VITAMINS = [
  ['la vitamine A', 'la vision et la peau', 'la cécité nocturne', 'la carotte'],
  ['la vitamine B1', 'le métabolisme des glucides', 'le béribéri', 'les céréales complètes'],
  ['la vitamine B12', 'la formation des globules rouges', 'l’anémie', 'les produits animaux'],
  ['la vitamine C', 'la synthèse du collagène', 'le scorbut', 'les agrumes'],
  ['la vitamine D', 'la fixation du calcium', 'le rachitisme', 'l’exposition au soleil'],
  ['la vitamine E', 'la protection antioxydante', 'des troubles neurologiques', 'les huiles végétales'],
  ['la vitamine K', 'la coagulation sanguine', 'des saignements prolongés', 'les légumes verts'],
]

/** Agents infectieux : nom, type, maladie, mode de transmission. */
const PATHOGENS = [
  ['le bacille de Koch', 'une bactérie', 'la tuberculose', 'les gouttelettes respiratoires'],
  ['le VIH', 'un virus', 'le sida', 'le sang et les rapports sexuels'],
  ['le plasmodium', 'un parasite', 'le paludisme', 'la piqûre de moustique'],
  ['le vibrion cholérique', 'une bactérie', 'le choléra', 'l’eau contaminée'],
  ['le virus de la grippe', 'un virus', 'la grippe', 'les gouttelettes respiratoires'],
  ['le tréponème pâle', 'une bactérie', 'la syphilis', 'les rapports sexuels'],
  ['le virus de la rage', 'un virus', 'la rage', 'la morsure animale'],
  ['la salmonelle', 'une bactérie', 'la salmonellose', 'les aliments contaminés'],
  ['le bacille tétanique', 'une bactérie', 'le tétanos', 'une plaie souillée'],
]

export const SANTE_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [vitamin, , , source] = pick(rng, VITAMINS)
      return {
        text: `Quel aliment ou quelle source apporte principalement ${vitamin} ?`,
        answer: cap(source),
        distractors: othersFrom(rng, VITAMINS, 3, source).map(cap),
        explanation: `${cap(vitamin)} se trouve notamment dans ${source}`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [vitamin, role] = pick(rng, VITAMINS)
      return {
        text: `À quoi sert ${vitamin} dans l’organisme ?`,
        answer: cap(role),
        distractors: othersFrom(rng, VITAMINS, 1, role).map(cap),
        explanation: `${cap(vitamin)} intervient dans ${role}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [pathogen, , disease] = pick(rng, PATHOGENS)
      return {
        text: `Quelle maladie ${pathogen} provoque-t-il ?`,
        answer: cap(disease),
        distractors: othersFrom(rng, PATHOGENS, 2, disease).map(cap),
        explanation: `${cap(pathogen)} est responsable ${de(disease)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [vitamin, , deficiency] = pick(rng, VITAMINS)
      return {
        text: `Quelle pathologie résulte d’une carence en ${vitamin.replace('la ', '')} ?`,
        answer: cap(deficiency),
        distractors: othersFrom(rng, VITAMINS, 2, deficiency).map(cap),
        explanation: `Un déficit en ${vitamin.replace('la ', '')} provoque ${deficiency}`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [pathogen, type] = pick(rng, PATHOGENS)
      return {
        text: `De quelle nature est ${pathogen} ?`,
        answer: cap(type),
        distractors: ['Une bactérie', 'Un virus', 'Un parasite', 'Un champignon', 'Un prion']
          .filter(t => t.toLowerCase() !== type.toLowerCase()),
        explanation: `${cap(pathogen)} est ${type}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [pathogen, , disease, transmission] = pick(rng, PATHOGENS)
      return {
        text: `Par quel mode se transmet principalement ${disease} ?`,
        answer: cap(transmission),
        distractors: othersFrom(rng, PATHOGENS, 3, transmission).map(cap),
        explanation: `${cap(disease)}, due à ${pathogen}, se transmet par ${transmission}`,
      }
    },
  },
]

// ---------------------------------------------------------------------------
// Sciences de la Terre
// ---------------------------------------------------------------------------

/** Planètes : nom, rang, période de révolution en jours terrestres, type. */
const PLANETS = [
  ['Mercure', 1, 88, 'une planète tellurique'],
  ['Vénus', 2, 225, 'une planète tellurique'],
  ['la Terre', 3, 365, 'une planète tellurique'],
  ['Mars', 4, 687, 'une planète tellurique'],
  ['Jupiter', 5, 4333, 'une géante gazeuse'],
  ['Saturne', 6, 10759, 'une géante gazeuse'],
  ['Uranus', 7, 30687, 'une géante de glaces'],
  ['Neptune', 8, 60190, 'une géante de glaces'],
]

/** Minéraux : nom, dureté sur l'échelle de Mohs. */
const MINERALS = [
  ['le talc', 1], ['le gypse', 2], ['la calcite', 3], ['la fluorine', 4],
  ['l’apatite', 5], ['l’orthose', 6], ['le quartz', 7], ['la topaze', 8],
  ['le corindon', 9], ['le diamant', 10],
]

/** Ères et périodes : nom, début approximatif en millions d'années, événement. */
const ERAS = [
  ['le Cambrien', 541, 'l’explosion de la diversité animale'],
  ['l’Ordovicien', 485, 'la première grande extinction'],
  ['le Dévonien', 419, 'la conquête des continents par les plantes'],
  ['le Carbonifère', 359, 'les grandes forêts à l’origine du charbon'],
  ['le Permien', 299, 'la plus grande extinction de masse'],
  ['le Trias', 252, 'l’apparition des premiers dinosaures'],
  ['le Jurassique', 201, 'l’apogée des dinosaures'],
  ['le Crétacé', 145, 'l’extinction des dinosaures non aviens'],
  ['le Paléogène', 66, 'la diversification des mammifères'],
  ['le Quaternaire', 2.6, 'les grandes glaciations'],
]

export const TERRE_TEMPLATES = [
  {
    level: 'CEP',
    difficulty: 'EASY',
    build(rng) {
      const [planet, rank] = pick(rng, PLANETS)
      return {
        text: `Quel rang occupe ${planet} en partant du Soleil ?`,
        answer: `${rank}ᵉ`,
        distractors: othersFrom(rng, PLANETS, 1, rank).map(r => `${r}ᵉ`),
        explanation: `${planet} est la ${rank}ᵉ planète du Système solaire`,
      }
    },
  },
  {
    level: 'BEPC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [planet, , , type] = pick(rng, PLANETS)
      return {
        text: `De quel type est ${planet} ?`,
        answer: cap(type),
        distractors: ['Une planète tellurique', 'Une géante gazeuse', 'Une géante de glaces', 'Une planète naine']
          .filter(t => t.toLowerCase() !== type.toLowerCase()),
        explanation: `${planet} est ${type}`,
      }
    },
  },
  {
    level: 'BAC',
    difficulty: 'MEDIUM',
    build(rng) {
      const [mineral, hardness] = pick(rng, MINERALS)
      return {
        text: `Quelle est la dureté ${de(mineral)} sur l’échelle de Mohs ?`,
        answer: fr(hardness),
        distractors: othersFrom(rng, MINERALS, 1, hardness).map(h => fr(h)),
        explanation: `${cap(mineral)} : dureté ${fr(hardness)}`,
      }
    },
  },
  {
    level: 'LICENCE',
    difficulty: 'HARD',
    build(rng) {
      const [planet, , period] = pick(rng, PLANETS)
      return {
        text: `Combien de jours terrestres dure la révolution ${planet === 'la Terre' ? 'de la Terre' : 'de ' + planet} autour du Soleil ?`,
        answer: `${fr(period)} jours`,
        distractors: [
          ...othersFrom(rng, PLANETS, 2, period).map(p => `${fr(p)} jours`),
          ...numericDistractors(rng, period).map(v => `${v} jours`),
        ],
        explanation: `Environ ${fr(period)} jours`,
      }
    },
  },
  {
    level: 'MASTER',
    difficulty: 'HARD',
    build(rng) {
      const [era, , event] = pick(rng, ERAS)
      return {
        text: `Quel événement marque ${era} ?`,
        answer: cap(event),
        distractors: othersFrom(rng, ERAS, 2, event).map(cap),
        explanation: `${cap(era)} est associé à ${event}`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const [era, start] = pick(rng, ERAS)
      return {
        text: `Il y a environ combien de millions d’années a débuté ${era} ?`,
        answer: `${fr(start)} Ma`,
        distractors: othersFrom(rng, ERAS, 1, start).map(v => `${fr(v)} Ma`),
        explanation: `${cap(era)} commence il y a environ ${fr(start)} millions d’années`,
      }
    },
  },
  {
    level: 'DOCTORAT',
    difficulty: 'HARD',
    build(rng) {
      const a = pick(rng, ERAS)
      const b = pick(rng, ERAS)
      if (a[0] === b[0] || a[1] === b[1]) return null
      const older = a[1] > b[1] ? a : b
      return {
        text: `Laquelle de ces deux périodes géologiques est la plus ancienne : ${a[0]} ou ${b[0]} ?`,
        answer: cap(older[0]),
        distractors: [
          cap(older[0] === a[0] ? b[0] : a[0]),
          'Elles sont contemporaines',
          'Impossible à déterminer',
          'Aucune des deux n’est datée',
        ],
        explanation: `${cap(a[0])} : ${fr(a[1])} Ma ; ${cap(b[0])} : ${fr(b[1])} Ma`,
      }
    },
  },
]
