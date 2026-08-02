// Hachage des mots de passe.
//
// Ce module est volontairement en JavaScript pur : il est importé aussi bien par
// le code applicatif TypeScript (`src/lib/auth.ts`) que par le script de seed
// exécuté avec Node en production. Une implémentation unique évite toute dérive
// entre les comptes créés par le seed et ceux créés par l'API.
//
// Format courant : `s2$<selHex>$<empreinteHex>` (scrypt)
// Format hérité   : `<selHex>:<sha256Hex>` — encore vérifié pour ne pas invalider
// les comptes créés avant la migration, mais jamais produit.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEY_LENGTH = 64

export function hashPassword(password) {
  const salt = randomBytes(16)
  const derived = scryptSync(String(password), salt, KEY_LENGTH)
  return `s2$${salt.toString('hex')}$${derived.toString('hex')}`
}

export function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored) return false

  if (stored.startsWith('s2$')) {
    const [, saltHex, hashHex] = stored.split('$')
    if (!saltHex || !hashHex) return false
    let expected
    try {
      expected = Buffer.from(hashHex, 'hex')
    } catch {
      return false
    }
    if (expected.length !== KEY_LENGTH) return false
    const derived = scryptSync(String(password), Buffer.from(saltHex, 'hex'), KEY_LENGTH)
    return timingSafeEqual(derived, expected)
  }

  // Format hérité : sha256(sel + mot de passe)
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const computed = createHash('sha256').update(salt + String(password)).digest('hex')
  if (computed.length !== hash.length) return false
  return timingSafeEqual(Buffer.from(computed), Buffer.from(hash))
}

/** Indique qu'un mot de passe stocké gagnerait à être re-haché au prochain login. */
export function needsRehash(stored) {
  return typeof stored === 'string' && !stored.startsWith('s2$')
}
