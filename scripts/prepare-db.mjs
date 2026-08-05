// Préparation de la base au démarrage du service.
//
// Exécuté avant le serveur en production (voir `start` dans render.yaml) :
//   1. attend que le serveur PostgreSQL accepte les connexions ;
//   2. applique le schéma (création des tables au premier lancement) ;
//   3. peuple la banque de questions si elle est incomplète.
//
// Les trois étapes sont idempotentes : sur une base déjà remplie, ce script ne
// touche à rien. Les données des joueurs vivent dans le serveur PostgreSQL, pas
// dans le système de fichiers de l'instance : elles survivent aux redémarrages.

import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function run(command, args, label) {
  console.log(`→ ${label}`)
  execFileSync(command, args, { cwd: root, stdio: 'inherit', env: process.env })
}

/**
 * Exécute la CLI Prisma avec le binaire Node courant plutôt que via `npx`.
 * `npx` n'est pas directement exécutable sous Windows (c'est un .cmd) et
 * imposerait de passer par un shell, avec les problèmes d'échappement associés.
 */
function runPrisma(args, label) {
  const cli = path.join(root, 'node_modules', 'prisma', 'build', 'index.js')
  if (existsSync(cli)) {
    run(process.execPath, [cli, ...args], label)
    return
  }
  // Repli : Prisma n'a pas été installé localement (installation partielle).
  console.warn('  CLI Prisma introuvable dans node_modules, tentative via npx')
  run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', 'prisma', ...args], label)
}

/** Masque le mot de passe : cette ligne finit dans les journaux de la plateforme. */
function safeUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.password) parsed.password = '***'
    return parsed.toString()
  } catch {
    return '(URL illisible)'
  }
}

/**
 * Attend que PostgreSQL accepte les connexions.
 *
 * Base et service applicatif démarrent souvent en parallèle (docker compose,
 * redéploiement Render) : sans cette attente, `prisma db push` échouerait sur
 * un simple ECONNREFUSED de quelques secondes et le serveur ne démarrerait pas.
 */
async function waitForDatabase({ attempts = 20, delayMs = 3000 } = {}) {
  const probe = new PrismaClient({ log: [] })
  try {
    for (let i = 1; i <= attempts; i++) {
      try {
        await probe.$queryRaw`SELECT 1`
        console.log('  connexion établie')
        return
      } catch (e) {
        if (i === attempts) {
          throw new Error(
            `PostgreSQL injoignable après ${attempts} tentatives : ${e?.message || e}`
          )
        }
        console.log(`  tentative ${i}/${attempts} — nouvel essai dans ${delayMs / 1000} s`)
        await new Promise(r => setTimeout(r, delayMs))
      }
    }
  } finally {
    await probe.$disconnect().catch(() => {})
  }
}

async function main() {
  // Contexte journalisé d'entrée : en cas d'échec au démarrage, la plateforme
  // ne montre qu'une erreur 502 et ces quelques lignes sont le seul indice
  // disponible pour comprendre ce qui a manqué.
  console.log('── Préparation de la base ──────────────────────')
  console.log(`  environnement : ${process.env.NODE_ENV || 'non défini'}`)
  console.log(`  répertoire    : ${process.cwd()}`)
  console.log(`  port          : ${process.env.PORT || 'non défini'}`)

  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('❌ DATABASE_URL n’est pas définie.')
    process.exit(1)
  }
  if (url.startsWith('file:')) {
    // Vestige de l'ancienne base SQLite : Prisma refuserait cette URL, mais
    // avec un message qui n'indique pas quoi corriger.
    console.error('❌ DATABASE_URL pointe vers un fichier SQLite (file:…).')
    console.error('   Le projet utilise désormais PostgreSQL. Exemple de valeur :')
    console.error('   postgresql://qvgdm:qvgdm@localhost:5432/qvgdm?schema=public')
    process.exit(1)
  }
  console.log(`  base          : ${safeUrl(url)}`)

  console.log('→ Attente du serveur PostgreSQL')
  await waitForDatabase()

  // `--accept-data-loss` ne concerne que les colonnes retirées du schéma ; les
  // lignes déjà présentes ne sont pas touchées.
  runPrisma(['db', 'push', '--accept-data-loss', '--skip-generate'], 'Application du schéma')

  // Le peuplement est idempotent : il n'insère que ce qui manque.
  const withDemo = process.env.SEED_DEMO_USERS === 'true'
  run('node', ['scripts/seed.mjs', ...(withDemo ? ['--demo'] : [])], 'Peuplement de la base')

  console.log('✅ Base prête.')
}

main().catch(e => {
  // Le serveur n'est pas lancé si cette étape échoue : sans message explicite,
  // le service reste injoignable sans que rien n'en explique la raison.
  console.error('\n════════════════════════════════════════════════')
  console.error('❌ PRÉPARATION DE LA BASE IMPOSSIBLE')
  console.error('   Le serveur ne sera pas démarré.')
  console.error('════════════════════════════════════════════════')
  console.error(e?.stack || e?.message || e)
  process.exit(1)
})
