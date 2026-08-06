// Production de la banque générée.
//
// Les gabarits de chaque catégorie sont regroupés par palier, puis tirés
// jusqu'à atteindre le quota du palier. Le tirage est déterministe : deux
// exécutions produisent exactement la même banque, ce qui est indispensable
// puisque l'énoncé sert de clé d'unicité en base.

import { createRng, makeQuestion } from './kit.mjs'
import { TEMPLATES as MATHEMATIQUES } from './mathematiques.mjs'
import { TEMPLATES as INFORMATIQUE } from './informatique.mjs'
import { TEMPLATES as PHYSIQUE } from './physique.mjs'
import { TEMPLATES as CHIMIE } from './chimie.mjs'
import { TEMPLATES as TELECOMS } from './telecoms.mjs'
import { TEMPLATES as ECONOMIE } from './economie.mjs'
import { TEMPLATES as GEOGRAPHIE } from './geographie.mjs'
import { TEMPLATES as HISTOIRE } from './histoire.mjs'
import {
  CINEMA_TEMPLATES,
  MUSIQUE_TEMPLATES,
  LITTERATURE_TEMPLATES,
} from './culture.mjs'
import {
  BIOLOGIE_TEMPLATES,
  SANTE_TEMPLATES,
  TERRE_TEMPLATES,
} from './sciences.mjs'
import {
  SPORT_TEMPLATES,
  TECHNOLOGIE_TEMPLATES,
  POLITIQUE_TEMPLATES,
  ENVIRONNEMENT_TEMPLATES,
  IA_TEMPLATES,
  CULTURE_TEMPLATES,
} from './societe.mjs'

/**
 * Répartition des questions générées entre les six paliers.
 *
 * Plus plate que la pyramide de `data/levels.mjs`, qui décrit une banque
 * rédigée à la main : ici chaque catégorie doit rester jouable à tous les
 * niveaux, y compris au doctorat où le manque de questions se voyait le plus.
 */
const LEVEL_SHARES = [
  ['CEP', 0.2],
  ['BEPC', 0.2],
  ['BAC', 0.2],
  ['LICENCE', 0.15],
  ['MASTER', 0.15],
  ['DOCTORAT', 0.1],
]

/**
 * Catalogue des générateurs.
 *
 * Seules les matières dont la réponse se calcule y figurent. Une question
 * d'histoire ou de cinéma ne se génère pas sans inventer des faits : ces
 * catégories restent rédigées à la main dans `data/questions/`.
 */
export const GENERATORS = [
  { category: 'Mathématiques', templates: MATHEMATIQUES },
  { category: 'Informatique', templates: INFORMATIQUE },
  { category: 'Physique', templates: PHYSIQUE },
  { category: 'Chimie', templates: CHIMIE },
  { category: 'Télécommunications', templates: TELECOMS },
  { category: 'Économie', templates: ECONOMIE },
  { category: 'Géographie', templates: GEOGRAPHIE },
  { category: 'Histoire', templates: HISTOIRE },
  { category: 'Cinéma', templates: CINEMA_TEMPLATES },
  { category: 'Musique', templates: MUSIQUE_TEMPLATES },
  { category: 'Littérature', templates: LITTERATURE_TEMPLATES },
  { category: 'Biologie', templates: BIOLOGIE_TEMPLATES },
  { category: 'Santé', templates: SANTE_TEMPLATES },
  { category: 'Sciences de la Terre', templates: TERRE_TEMPLATES },
  { category: 'Sport', templates: SPORT_TEMPLATES },
  { category: 'Technologie', templates: TECHNOLOGIE_TEMPLATES },
  { category: 'Politique', templates: POLITIQUE_TEMPLATES },
  { category: 'Environnement', templates: ENVIRONNEMENT_TEMPLATES },
  { category: 'Intelligence artificielle', templates: IA_TEMPLATES },
  { category: 'Culture générale', templates: CULTURE_TEMPLATES },
]

/**
 * Produit jusqu'à `target` questions pour une catégorie.
 *
 * Le nombre de tentatives est borné : certains gabarits refusent leurs propres
 * tirages (paramètres dégénérés, leurres confondus avec la réponse) et une
 * boucle sans garde-fou tournerait indéfiniment sur un palier dont l'espace de
 * combinaisons est épuisé.
 */
export function generateForCategory(category, templates, target, seed, reserved = new Set()) {
  const rng = createRng(seed)
  // Les énoncés déjà écrits à la main sont réservés : une question générée qui
  // les reprendrait ferait échouer l'insertion, l'énoncé étant unique en base.
  const seen = new Set(reserved)
  const out = []

  for (const [level, share] of LEVEL_SHARES) {
    const pool = templates.filter(t => t.level === level)
    if (!pool.length) continue

    const quota = Math.round(target * share)
    const maxAttempts = quota * 60
    let produced = 0

    for (let attempt = 0; attempt < maxAttempts && produced < quota; attempt++) {
      const template = pool[attempt % pool.length]
      const draft = template.build(rng)
      if (!draft) continue

      const key = draft.text.toLowerCase()
      if (seen.has(key)) continue

      const question = makeQuestion({
        ...draft,
        level: template.level,
        difficulty: template.difficulty,
        category,
      })
      if (!question) continue

      seen.add(key)
      out.push(question)
      produced++
    }
  }

  return out
}

/**
 * Toute la banque générée.
 *
 * @param target nombre de questions visé par catégorie
 */
export function getGeneratedQuestions(target = 1000, reservedTexts = []) {
  const reserved = new Set(reservedTexts.map(t => t.toLowerCase()))
  const all = []
  GENERATORS.forEach(({ category, templates }, index) => {
    // Une graine par catégorie : ajouter une catégorie ne doit pas décaler les
    // questions déjà produites pour les autres.
    all.push(
      ...generateForCategory(category, templates, target, 0x5eed + index * 7919, reserved)
    )
  })
  return all
}
