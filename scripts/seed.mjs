// Peuplement de la base de données.
//
// Écrit en JavaScript pur pour être exécutable tel quel en production (Render),
// sans compilation TypeScript ni runtime supplémentaire.
//
//   node scripts/seed.mjs            peuple ce qui manque (idempotent)
//   node scripts/seed.mjs --demo     ajoute aussi les joueurs de démonstration
//
// Variables d'environnement reconnues :
//   ADMIN_EMAIL / ADMIN_PASSWORD  identifiants du compte administrateur
//   SEED_DEMO_USERS=true          équivalent de --demo

import { PrismaClient } from '@prisma/client'
import { CATEGORIES, toQuestion, getAllQuestions } from '../data/index.mjs'
import { assignAcademicLevels } from '../data/levels.mjs'
import { hashPassword } from '../src/lib/password.mjs'

const db = new PrismaClient()

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@qvgdm.fr'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const WITH_DEMO =
  process.argv.includes('--demo') || process.env.SEED_DEMO_USERS === 'true'

const DEMO_PLAYERS = [
  { email: 'player@demo.fr', pseudo: 'Player1', country: 'France' },
  { email: 'alice@demo.fr', pseudo: 'Alice', country: 'France' },
  { email: 'bob@demo.be', pseudo: 'Bob', country: 'Belgique' },
  { email: 'chloe@demo.ch', pseudo: 'Chloé', country: 'Suisse' },
  { email: 'david@demo.ca', pseudo: 'David', country: 'Canada' },
  { email: 'emma@demo.fr', pseudo: 'Emma', country: 'France' },
  { email: 'fatou@demo.sn', pseudo: 'Fatou', country: 'Sénégal' },
  { email: 'giulia@demo.it', pseudo: 'Giulia', country: 'Italie' },
  { email: 'hiroshi@demo.jp', pseudo: 'Hiroshi', country: 'Japon' },
  { email: 'ines@demo.ma', pseudo: 'Inès', country: 'Maroc' },
  { email: 'juan@demo.mx', pseudo: 'Juan', country: 'Mexique' },
  { email: 'karim@demo.dz', pseudo: 'Karim', country: 'Algérie' },
  { email: 'lina@demo.tn', pseudo: 'Lina', country: 'Tunisie' },
  { email: 'marc@demo.fr', pseudo: 'Marc', country: 'France' },
  { email: 'nadia@demo.ci', pseudo: 'Nadia', country: "Côte d'Ivoire" },
]

// Générateur pseudo-aléatoire déterministe : les statistiques de démonstration
// restent identiques d'un déploiement à l'autre.
function makeRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return (s >>> 8) / 0x1000000
  }
}

async function seedCategories() {
  const byName = new Map()
  for (const cat of CATEGORIES) {
    const record = await db.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description, icon: cat.icon, color: cat.color },
      create: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
      },
    })
    byName.set(cat.name, record)
  }
  return byName
}

async function seedQuestions(categoriesByName, levels) {
  const existing = new Set(
    (await db.question.findMany({ select: { text: true } })).map(q => q.text)
  )

  const toCreate = []
  for (const cat of CATEGORIES) {
    const category = categoriesByName.get(cat.name)
    for (const tuple of cat.questions) {
      const q = toQuestion(tuple, cat.name)
      if (existing.has(q.text)) continue
      existing.add(q.text) // garde-fou si la banque contenait un doublon
      toCreate.push({
        text: q.text,
        propositionA: q.propositionA,
        propositionB: q.propositionB,
        propositionC: q.propositionC,
        propositionD: q.propositionD,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        academicLevel: levels.get(q.text) || 'BAC',
        categoryId: category.id,
      })
    }
  }

  // PostgreSQL plafonne à 65535 le nombre de paramètres d'une requête, et
  // chaque question en compte neuf : on insère par lots.
  const BATCH = 200
  let created = 0
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const batch = toCreate.slice(i, i + BATCH)
    const res = await db.question.createMany({ data: batch })
    created += res.count
  }
  return created
}

/**
 * Affecte leur palier aux questions déjà en base.
 *
 * Ne s'exécute qu'une fois : dès qu'au moins deux paliers coexistent, la
 * colonne a été calculée — ou ajustée à la main depuis l'administration — et
 * l'écraser reviendrait à défaire ce travail à chaque redémarrage du service.
 */
async function backfillAcademicLevels(levels) {
  const distinct = await db.question.findMany({
    distinct: ['academicLevel'],
    select: { academicLevel: true },
  })
  if (distinct.length > 1) return { skipped: true, updated: 0 }

  // Un seul appel par palier plutôt qu'un par question : six requêtes au lieu
  // de mille.
  const byLevel = new Map()
  for (const [text, level] of levels) {
    if (!byLevel.has(level)) byLevel.set(level, [])
    byLevel.get(level).push(text)
  }

  let updated = 0
  for (const [level, texts] of byLevel) {
    const BATCH = 300
    for (let i = 0; i < texts.length; i += BATCH) {
      const res = await db.question.updateMany({
        where: { text: { in: texts.slice(i, i + BATCH) } },
        data: { academicLevel: level },
      })
      updated += res.count
    }
  }
  return { skipped: false, updated }
}

async function seedAdmin() {
  const existing = await db.user.findUnique({ where: { email: ADMIN_EMAIL } })
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await db.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } })
    }
    return false
  }
  await db.user.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      pseudo: 'Admin',
      fullName: 'Administrateur',
      country: 'France',
      role: 'ADMIN',
    },
  })
  return true
}

async function seedDemoPlayers() {
  const random = makeRandom(20240202)
  let created = 0
  for (const player of DEMO_PLAYERS) {
    const existing = await db.user.findUnique({ where: { email: player.email } })
    if (existing) continue
    const gamesPlayed = Math.floor(random() * 45) + 5
    const wins = Math.floor(random() * gamesPlayed)
    const draws = Math.floor(random() * 3)
    const losses = Math.max(0, gamesPlayed - wins - draws)
    const xp = wins * 150 + losses * 50 + Math.floor(random() * 400)
    await db.user.create({
      data: {
        email: player.email,
        passwordHash: hashPassword('demo123'),
        pseudo: player.pseudo,
        country: player.country,
        role: 'USER',
        gamesPlayed,
        wins,
        losses,
        draws,
        totalScore: wins * 1200 + losses * 600 + Math.floor(random() * 500),
        bestStreak: Math.floor(random() * 6),
        xp,
        level: Math.max(1, Math.floor(xp / 500) + 1),
      },
    })
    created++
  }
  return created
}

async function main() {
  console.log('🌱 Peuplement de la base…')

  const categories = await seedCategories()
  console.log(`   ✓ ${categories.size} catégories`)

  // Le palier académique se calcule sur la banque entière : chaque question est
  // située par rapport aux autres, pas jugée isolément.
  const levels = assignAcademicLevels(getAllQuestions())

  const questionsCreated = await seedQuestions(categories, levels)
  const questionsTotal = await db.question.count()
  console.log(`   ✓ ${questionsCreated} questions ajoutées (${questionsTotal} au total)`)

  const backfill = await backfillAcademicLevels(levels)
  console.log(
    backfill.skipped
      ? '   ✓ paliers académiques déjà attribués'
      : `   ✓ ${backfill.updated} questions réparties du CEP au doctorat`
  )

  const adminCreated = await seedAdmin()
  console.log(`   ✓ compte administrateur ${adminCreated ? 'créé' : 'déjà présent'} (${ADMIN_EMAIL})`)

  if (WITH_DEMO) {
    const demoCreated = await seedDemoPlayers()
    console.log(`   ✓ ${demoCreated} joueurs de démonstration ajoutés`)
  }

  console.log('\n✅ Peuplement terminé.')
  if (adminCreated) {
    // Le mot de passe n'est jamais journalisé : cette sortie finit dans les
    // journaux de la plateforme d'hébergement, qui les conserve et les expose
    // à toute personne ayant accès au tableau de bord.
    const provided = !!process.env.ADMIN_PASSWORD
    console.log(`   Administrateur : ${ADMIN_EMAIL}`)
    console.log(
      provided
        ? '   Mot de passe : celui fourni via ADMIN_PASSWORD'
        : '   Mot de passe : admin123 — valeur par défaut, à changer sans tarder'
    )
  }
  if (WITH_DEMO) {
    console.log('   Joueur de démonstration : player@demo.fr / demo123')
  }
}

main()
  .catch(e => {
    console.error('❌ Échec du peuplement :', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
