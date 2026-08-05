// Simulation d'un déploiement Render, en local.
//
//   npm run check:deploy
//
// Reproduit exactement ce que fait la plateforme :
//   1. n'utilise que les fichiers suivis par git — ce que Render clone ;
//   2. installe depuis zéro avec `npm ci`, sans réutiliser node_modules ;
//   3. positionne NODE_ENV=production, comme le fait render.yaml ;
//   4. exécute la commande de build déclarée dans render.yaml.
//
// Deux échecs de déploiement consécutifs ont eu pour cause des écarts que le
// build local ne pouvait pas révéler : un package-lock.json désynchronisé
// (invisible tant qu'on réutilise node_modules) puis l'omission des
// devDependencies par npm sous NODE_ENV=production. Ce script comble cet écart.

import { execFileSync, execSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const keep = process.argv.includes('--keep')

function step(label) {
  console.log(`\n\x1b[1m── ${label} ${'─'.repeat(Math.max(0, 56 - label.length))}\x1b[0m`)
}

function run(command, args, cwd, env) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  })
}

const workdir = mkdtempSync(path.join(tmpdir(), 'render-sim-'))
console.log(`\x1b[2mRépertoire de simulation : ${workdir}\x1b[0m`)

try {
  step('Copie des fichiers suivis par git')
  const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' })
    .split('\n')
    .map(f => f.trim())
    .filter(Boolean)
  if (!tracked.length) throw new Error('aucun fichier suivi : le dépôt git est-il initialisé ?')

  for (const file of tracked) {
    const from = path.join(root, file)
    if (!existsSync(from)) continue // fichier supprimé mais pas encore committé
    const to = path.join(workdir, file)
    mkdirSync(path.dirname(to), { recursive: true })
    cpSync(from, to)
  }
  console.log(`  ${tracked.length} fichiers copiés`)

  // Un package-lock.json absent ou non committé ferait échouer `npm ci` sur la
  // plateforme, sans qu'aucun build local ne s'en aperçoive.
  if (!existsSync(path.join(workdir, 'package-lock.json'))) {
    throw new Error(
      'package-lock.json est absent des fichiers suivis : `npm ci` échouera au déploiement'
    )
  }

  // La base n'est plus un fichier créé à la volée : la simulation a besoin d'un
  // serveur PostgreSQL joignable. On réutilise celui du poste de développement
  // (`docker compose up -d db`) — `db:prepare` est idempotent, il n'efface rien.
  const databaseUrl =
    process.env.DATABASE_URL || 'postgresql://qvgdm:qvgdm@localhost:5432/qvgdm?schema=public'
  if (databaseUrl.startsWith('file:')) {
    throw new Error(
      'DATABASE_URL pointe vers un fichier SQLite ; le projet utilise PostgreSQL (voir .env.example)'
    )
  }

  const env = {
    NODE_ENV: 'production',
    DATABASE_URL: databaseUrl,
    JWT_SECRET: 'simulation',
  }

  step('Installation propre (npm ci --include=dev)')
  run('npm', ['ci', '--include=dev', '--no-audit', '--no-fund'], workdir, env)

  step('Build de production')
  run('npm', ['run', 'build'], workdir, env)

  step('Préparation de la base')
  run('npm', ['run', 'db:prepare'], workdir, env)

  console.log('\n\x1b[32m\x1b[1m✅ Le déploiement Render devrait aboutir.\x1b[0m')
  console.log(
    '\x1b[2m   Pour vérifier aussi les points d\'entrée, démarrez le service et lancez :\x1b[0m'
  )
  console.log('\x1b[2m   node scripts/check-endpoints.mjs http://localhost:3000\x1b[0m')
} catch (e) {
  console.error(`\n\x1b[31m\x1b[1m❌ La simulation a échoué.\x1b[0m`)
  console.error(`   ${e.message}`)
  console.error(
    `\x1b[2m   Répertoire conservé pour inspection : ${workdir}\x1b[0m`
  )
  process.exitCode = 1
  process.exit()
} finally {
  if (!keep && process.exitCode !== 1) {
    rmSync(workdir, { recursive: true, force: true })
  }
}
