// Préparation de la base au démarrage du service.
//
// Exécuté avant le serveur en production (voir `start` dans render.yaml) :
//   1. crée le fichier SQLite et applique le schéma s'il n'existe pas encore ;
//   2. peuple la banque de questions si la base est vide.
//
// Sur Render sans disque persistant, le système de fichiers est réinitialisé à
// chaque déploiement : ce script garantit qu'une instance fraîchement démarrée
// est immédiatement jouable. Avec un disque monté, il ne fait rien après le
// premier lancement — les deux étapes sont idempotentes.

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('❌ DATABASE_URL n’est pas définie.')
    process.exit(1)
  }

  // Le répertoire cible doit exister avant que SQLite n'y crée son fichier.
  if (url.startsWith('file:')) {
    const filePath = url.slice('file:'.length)
    const absolute = path.isAbsolute(filePath) ? filePath : path.join(root, 'prisma', filePath)
    mkdirSync(path.dirname(absolute), { recursive: true })
    console.log(`  base SQLite : ${absolute}`)
  }

  runPrisma(['db', 'push', '--accept-data-loss', '--skip-generate'], 'Application du schéma')

  // Le peuplement est idempotent : il n'insère que ce qui manque.
  const withDemo = process.env.SEED_DEMO_USERS === 'true'
  run('node', ['scripts/seed.mjs', ...(withDemo ? ['--demo'] : [])], 'Peuplement de la base')

  console.log('✅ Base prête.')
}

main().catch(e => {
  console.error('❌ Préparation de la base impossible :', e.message)
  process.exit(1)
})
