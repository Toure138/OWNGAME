import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'
import { getUserFromRequest, type AuthContext } from './auth'

// ---------------------------------------------------------------------------
// Réponses normalisées
// ---------------------------------------------------------------------------

export function ok<T extends object>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function fail(message: string, status = 400, extra?: object) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

export const unauthorized = () => fail('Non authentifié', 401)
export const forbidden = () => fail('Accès refusé', 403)
export const notFound = (what = 'Ressource introuvable') => fail(what, 404)

/**
 * Enveloppe une route : convertit toute exception non gérée en réponse 500
 * lisible plutôt qu'en page d'erreur HTML.
 */
export function route<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>
) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erreur serveur'
      console.error('[api]', message, e)
      return fail(
        process.env.NODE_ENV === 'production' ? 'Erreur serveur' : message,
        500
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Authentification
// ---------------------------------------------------------------------------

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function requireAuth(req: Request): AuthContext {
  const auth = getUserFromRequest(req)
  if (!auth) throw new HttpError(401, 'Non authentifié')
  return auth
}

export function requireAdmin(req: Request): AuthContext {
  const auth = requireAuth(req)
  if (auth.role !== 'ADMIN') throw new HttpError(403, 'Accès refusé')
  return auth
}

/**
 * Variante de `route` qui traduit les `HttpError` levées par `requireAuth` et
 * les erreurs de validation Zod en réponses HTTP appropriées.
 */
export function guarded<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>
) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args)
    } catch (e: unknown) {
      if (e instanceof HttpError) return fail(e.message, e.status)
      const message = e instanceof Error ? e.message : 'Erreur serveur'
      console.error('[api]', message, e)
      return fail(
        process.env.NODE_ENV === 'production' ? 'Erreur serveur' : message,
        500
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Validation du corps de requête
// ---------------------------------------------------------------------------

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new HttpError(400, 'Corps de requête JSON invalide')
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const first = result.error.issues[0]
    const path = first?.path?.join('.')
    throw new HttpError(
      400,
      path ? `Champ « ${path} » : ${first.message}` : first?.message || 'Requête invalide'
    )
  }
  return result.data
}

// ---------------------------------------------------------------------------
// Limitation de débit (en mémoire, par instance)
// ---------------------------------------------------------------------------
// Suffisant pour ce déploiement mono-instance : freine le bourrage
// d'identifiants sans dépendance externe.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = ((globalThis as { __rateBuckets?: Map<string, Bucket> })
  .__rateBuckets ??= new Map<string, Bucket>())

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'inconnu'
}

/**
 * Autorise `limit` appels par fenêtre de `windowMs` pour une clé donnée.
 * Lève une HttpError 429 au-delà.
 */
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  bucket.count++
  if (bucket.count > limit) {
    const seconds = Math.ceil((bucket.resetAt - now) / 1000)
    const delay =
      seconds >= 120 ? `${Math.ceil(seconds / 60)} minutes` : `${seconds} secondes`
    throw new HttpError(429, `Trop de tentatives, réessayez dans ${delay}`)
  }
}

/** Remet un compteur à zéro, après une action légitime aboutie. */
export function resetRateLimit(key: string): void {
  buckets.delete(key)
}

// Purge périodique pour éviter que la table ne grossisse indéfiniment.
if (!(globalThis as { __rateCleanup?: boolean }).__rateCleanup) {
  ;(globalThis as { __rateCleanup?: boolean }).__rateCleanup = true
  const timer = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }, 60_000)
  timer.unref?.()
}
