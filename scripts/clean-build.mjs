// Nettoyage des artefacts de build avant reconstruction.
//
// Symptôme évité : le serveur répond normalement aux requêtes GET, mais toutes
// les requêtes POST reçoivent un 404. L'application semble déployée — la page
// s'affiche, la sonde de santé passe au vert — et pourtant plus rien ne
// fonctionne : connexion, entrée au salon, réponse à une question.
//
// La cause est un dossier `.next` hérité d'une construction antérieure. Les
// manifestes de routes y sont réécrits, les fragments serveur non : Next sert
// alors des chemins tirés d'un inventaire périmé, où les gestionnaires POST des
// routes ajoutées depuis n'existent pas. Reproduit en local en enchaînant
// `next build` puis `next dev`, et corrigé en supprimant `.next`.
//
// Ce n'est pas une hypothèse de laboratoire sur un hébergement : Render restaure
// un cache de construction entre deux déploiements (« Downloading cache… »),
// dossier `.next` compris. Le nettoyage doit donc faire partie du build lui-même
// plutôt que dépendre d'un « Clear build cache » que personne ne pense à cocher.
//
// `.next/cache` est épargné : il ne contient aucun manifeste, seulement le cache
// de compilation qui accélère les reconstructions. Le supprimer allongerait
// chaque déploiement sans rien corriger.

import { readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const target = path.join(root, '.next')

/** Conservé : cache de compilation, sans effet sur le routage. */
const KEEP = new Set(['cache'])

async function main() {
  let entries
  try {
    entries = await readdir(target)
  } catch {
    // Première construction : rien à nettoyer.
    return
  }

  const removed = []
  for (const entry of entries) {
    if (KEEP.has(entry)) continue
    await rm(path.join(target, entry), { recursive: true, force: true })
    removed.push(entry)
  }

  if (removed.length) {
    console.log(`✓ Artefacts de build précédents supprimés (${removed.length} entrées, cache conservé)`)
  }
}

main().catch(e => {
  // Un nettoyage impossible ne doit pas bloquer la construction : au pire, on
  // retombe sur le comportement d'avant.
  console.warn(`⚠️  Nettoyage de .next impossible : ${e?.message || e}`)
})
