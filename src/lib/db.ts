import { PrismaClient } from '@prisma/client'
import { resolveDatabaseUrl } from './database-url.mjs'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// La chaîne de connexion est résolue ici plutôt que laissée à Prisma, qui lirait
// `DATABASE_URL` sans savoir qu'elle peut être périmée. `database-url.mjs`
// écarte une URL SQLite héritée et bascule sur une variable de repli — voir le
// commentaire de ce module pour le cas d'usage.
const { url } = resolveDatabaseUrl()

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Journaliser chaque requête en production noierait les logs et ralentirait
    // les réponses : on ne conserve que les erreurs et les avertissements.
    log: ['error', 'warn'],
    // `undefined` laisse Prisma reprendre son comportement par défaut : le
    // serveur n'a pas à démarrer différemment quand la variable est absente,
    // c'est `prepare-db` qui refuse le démarrage en amont, avec un message.
    ...(url ? { datasourceUrl: url } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
