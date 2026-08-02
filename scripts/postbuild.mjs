// Finalisation du build « standalone » de Next.js.
//
// Next produit un serveur autonome dans .next/standalone, mais n'y recopie ni
// les fichiers statiques ni le dossier public : il faut le faire soi-même.
// Ce script remplace les commandes `cp -r`, indisponibles sous Windows, et
// vérifie au passage que le moteur Prisma a bien été embarqué.

import { cp, access, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const standalone = path.join(root, '.next', 'standalone')

async function exists(target) {
  try {
    await access(target, constants.F_OK)
    return true
  } catch {
    return false
  }
}

/**
 * @param {boolean} required Une source absente interrompt la finalisation.
 *   Sans les fichiers statiques, le serveur démarre mais sert des pages sans
 *   feuille de style ni JavaScript : mieux vaut échouer bruyamment que
 *   déployer un bundle silencieusement cassé.
 */
async function copy(from, to, label, required = false) {
  if (!(await exists(from))) {
    const message = `${label} introuvable (${path.relative(root, from)})`
    if (required) throw new Error(`${message} — le build précédent a-t-il échoué ?`)
    console.warn(`⚠️  ${message}, copie ignorée`)
    return
  }
  await cp(from, to, { recursive: true })
  console.log(`✓ ${label} copié vers ${path.relative(root, to)}`)
}

async function main() {
  if (!(await exists(standalone))) {
    console.error(
      "❌ .next/standalone est absent. Vérifiez que next.config.ts contient bien output: 'standalone'."
    )
    process.exit(1)
  }

  await copy(
    path.join(root, '.next', 'static'),
    path.join(standalone, '.next', 'static'),
    'Fichiers statiques',
    true
  )
  await copy(path.join(root, 'public'), path.join(standalone, 'public'), 'Dossier public')

  // Le schéma est nécessaire pour exécuter `prisma db push` au démarrage.
  await copy(path.join(root, 'prisma'), path.join(standalone, 'prisma'), 'Schéma Prisma', true)

  // Le client Prisma généré embarque un moteur natif ; sans lui, le serveur
  // démarre puis échoue à la première requête — donc après le déploiement,
  // quand c'est le plus coûteux à diagnostiquer.
  const clientDir = path.join(standalone, 'node_modules', '.prisma', 'client')
  if (!(await exists(clientDir))) {
    throw new Error(
      'Client Prisma absent du bundle standalone — « prisma generate » a-t-il été exécuté avant le build ?'
    )
  }
  const files = await readdir(clientDir)
  const engine = files.find(f => f.includes('query_engine') || f.includes('libquery'))
  if (!engine) {
    throw new Error('Aucun moteur de requête Prisma dans le bundle : le serveur échouerait à la première requête')
  }
  console.log(`✓ Moteur Prisma embarqué (${engine})`)

  console.log('\n✅ Build finalisé.')
}

main().catch(e => {
  console.error('❌ Échec de la finalisation du build :', e)
  process.exit(1)
})
