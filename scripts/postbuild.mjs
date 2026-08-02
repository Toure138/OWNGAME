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

async function copyIfPresent(from, to, label) {
  if (!(await exists(from))) {
    console.warn(`⚠️  ${label} introuvable (${path.relative(root, from)}), copie ignorée`)
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

  await copyIfPresent(
    path.join(root, '.next', 'static'),
    path.join(standalone, '.next', 'static'),
    'Fichiers statiques'
  )
  await copyIfPresent(path.join(root, 'public'), path.join(standalone, 'public'), 'Dossier public')

  // Le schéma est nécessaire pour exécuter `prisma db push` au démarrage.
  await copyIfPresent(
    path.join(root, 'prisma'),
    path.join(standalone, 'prisma'),
    'Schéma Prisma'
  )

  // Le client Prisma généré embarque un moteur natif ; sans lui, le serveur
  // démarre puis échoue à la première requête.
  const clientDir = path.join(standalone, 'node_modules', '.prisma', 'client')
  if (await exists(clientDir)) {
    const files = await readdir(clientDir)
    const engine = files.find(f => f.includes('query_engine') || f.includes('libquery'))
    console.log(
      engine
        ? `✓ Moteur Prisma embarqué (${engine})`
        : '⚠️  Aucun moteur de requête Prisma détecté dans le bundle standalone'
    )
  } else {
    console.warn('⚠️  Client Prisma absent du bundle standalone')
  }

  console.log('\n✅ Build finalisé.')
}

main().catch(e => {
  console.error('❌ Échec de la finalisation du build :', e)
  process.exit(1)
})
