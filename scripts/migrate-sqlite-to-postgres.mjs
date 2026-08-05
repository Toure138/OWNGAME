// Reprise des données de l'ancienne base SQLite dans PostgreSQL.
//
//   node scripts/migrate-sqlite-to-postgres.mjs [chemin/vers/base.db]
//
// Sans argument, le script lit `db/custom.db`. La destination est la base
// désignée par DATABASE_URL — le schéma doit y avoir été appliqué au préalable
// (`npm run db:prepare`).
//
// Le script n'écrase rien : les lignes déjà présentes côté PostgreSQL sont
// conservées telles quelles. Il peut donc être relancé sans dommage, et ne sert
// qu'une fois — après quoi l'ancien fichier .db peut être archivé.
//
// Deux difficultés justifient la longueur du script :
//
//  1. Les types. Prisma ne stocke pas les mêmes valeurs dans les deux moteurs :
//     un DATETIME est un entier (millisecondes depuis 1970) côté SQLite, et un
//     BOOLEAN y vaut 0 ou 1.
//
//  2. Les identifiants. `db:prepare` a déjà peuplé PostgreSQL avec des
//     catégories et un compte administrateur portant d'autres `id` que ceux de
//     l'ancienne base. Insérer les questions avec leur `categoryId` d'origine
//     violerait la clé étrangère. On construit donc une table de correspondance
//     — par nom pour les catégories, par courriel pour les comptes — et on
//     réécrit les références au passage.

import { DatabaseSync } from 'node:sqlite'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.resolve(root, process.argv[2] || path.join('db', 'custom.db'))

const BATCH = 200

function convertRow(row, columnTypes) {
  const out = {}
  for (const [key, value] of Object.entries(row)) {
    const type = columnTypes.get(key)
    if (value === null || value === undefined) {
      out[key] = null
    } else if (type === 'DATETIME') {
      out[key] = new Date(Number(value))
    } else if (type === 'BOOLEAN') {
      out[key] = Boolean(value)
    } else if (typeof value === 'bigint') {
      // node:sqlite renvoie un BigInt dès qu'une colonne INTEGER dépasse la
      // plage sûre ; Prisma attend un Number sur les champs Int.
      out[key] = Number(value)
    } else {
      out[key] = value
    }
  }
  return out
}

/** Lit une table de l'ancienne base, types convertis. */
function readTable(sqlite, table) {
  const exists = sqlite
    .prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table)
  if (!exists) return null

  const columnTypes = new Map(
    sqlite
      .prepare(`PRAGMA table_info("${table}")`)
      .all()
      .map(c => [c.name, String(c.type).toUpperCase()])
  )
  return sqlite.prepare(`SELECT * FROM "${table}"`).all().map(r => convertRow(r, columnTypes))
}

async function insertMany(model, rows) {
  let inserted = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const res = await model.createMany({ data: rows.slice(i, i + BATCH), skipDuplicates: true })
    inserted += res.count
  }
  return inserted
}

function report(label, rows, inserted, dropped = 0) {
  const parts = [`${inserted} reprise(s)`]
  const skipped = rows.length - inserted - dropped
  if (skipped > 0) parts.push(`${skipped} déjà présente(s)`)
  if (dropped > 0) parts.push(`${dropped} écartée(s) (référence manquante)`)
  console.log(`  ${label.padEnd(14)} ${parts.join(', ')}`)
}

/**
 * Reprend une table et renvoie la correspondance « ancien id → nouvel id ».
 * @param key Champ unique permettant de reconnaître une ligne déjà présente
 *   côté PostgreSQL (nom de catégorie, courriel de compte).
 */
async function migrateWithIdentityMap(model, rows, key) {
  const existing = await model.findMany({ select: { id: true, [key]: true } })
  const byKey = new Map(existing.map(r => [r[key], r.id]))

  const toCreate = rows.filter(r => !byKey.has(r[key]))
  const inserted = await insertMany(model, toCreate)

  // Relecture : les identifiants réellement retenus font foi, y compris pour
  // les lignes qu'un conflit aurait fait écarter.
  const after = await model.findMany({ select: { id: true, [key]: true } })
  const finalByKey = new Map(after.map(r => [r[key], r.id]))

  const idMap = new Map()
  for (const row of rows) {
    const newId = finalByKey.get(row[key])
    if (newId) idMap.set(row.id, newId)
  }
  return { idMap, inserted }
}

async function main() {
  if (!existsSync(source)) {
    console.error(`❌ Base SQLite introuvable : ${source}`)
    console.error('   Indiquez son chemin en argument, ou ignorez cette étape si')
    console.error('   vous partez d’une base vierge.')
    process.exit(1)
  }
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL n’est pas définie : destination inconnue.')
    process.exit(1)
  }
  if (process.env.DATABASE_URL.startsWith('file:')) {
    console.error('❌ DATABASE_URL désigne encore un fichier SQLite.')
    console.error('   Renseignez la chaîne de connexion PostgreSQL avant de migrer.')
    process.exit(1)
  }

  console.log('── Reprise des données ─────────────────────────')
  console.log(`  source : ${source}`)

  const sqlite = new DatabaseSync(source, { readOnly: true })
  const db = new PrismaClient()

  try {
    // 1. Catégories — reconnues par leur nom.
    const categories = readTable(sqlite, 'Category') || []
    const { idMap: categoryIds, inserted: categoriesInserted } = await migrateWithIdentityMap(
      db.category,
      categories,
      'name'
    )
    report('Catégories', categories, categoriesInserted)

    // 2. Comptes — reconnus par leur courriel.
    const users = readTable(sqlite, 'User') || []
    const { idMap: userIds, inserted: usersInserted } = await migrateWithIdentityMap(
      db.user,
      users,
      'email'
    )
    report('Comptes', users, usersInserted)

    // 3. Questions — leur catégorie est réécrite ; l'énoncé est unique, donc
    //    une question déjà semée est simplement ignorée.
    const questions = readTable(sqlite, 'Question') || []
    const questionsUsable = []
    let questionsDropped = 0
    for (const q of questions) {
      const categoryId = categoryIds.get(q.categoryId)
      if (!categoryId) {
        questionsDropped++
        continue
      }
      questionsUsable.push({ ...q, categoryId })
    }
    report('Questions', questions, await insertMany(db.question, questionsUsable), questionsDropped)

    // 4. Parties, notifications et succès — rattachés à leurs comptes.
    const remaps = [
      { label: 'Parties', table: 'Game', model: db.game, fields: ['playerAId', 'playerBId'] },
      {
        label: 'Notifications',
        table: 'Notification',
        model: db.notification,
        fields: ['userId'],
      },
      { label: 'Succès', table: 'Achievement', model: db.achievement, fields: ['userId'] },
    ]

    for (const { label, table, model, fields } of remaps) {
      const rows = readTable(sqlite, table)
      if (!rows) {
        console.log(`  ${label.padEnd(14)} table absente de l’ancienne base`)
        continue
      }
      const usable = []
      let dropped = 0
      for (const row of rows) {
        const remapped = { ...row }
        let ok = true
        for (const field of fields) {
          const mapped = userIds.get(row[field])
          if (!mapped) {
            ok = false
            break
          }
          remapped[field] = mapped
        }
        // `winnerId` référence l'un des deux joueurs : il suit la même
        // correspondance, et retombe à null si le compte n'a pas été repris.
        if (ok && 'winnerId' in remapped && remapped.winnerId) {
          remapped.winnerId = userIds.get(remapped.winnerId) ?? null
        }
        if (ok) usable.push(remapped)
        else dropped++
      }
      report(label, rows, await insertMany(model, usable), dropped)
    }

    console.log('\n✅ Reprise terminée.')
  } finally {
    sqlite.close()
    await db.$disconnect()
  }
}

main().catch(e => {
  console.error('\n❌ Échec de la reprise des données :')
  console.error(e?.stack || e?.message || e)
  process.exit(1)
})
