import { createHmac, timingSafeEqual } from 'crypto'

export { hashPassword, verifyPassword, needsRehash } from './password.mjs'

// ---------------------------------------------------------------------------
// Jetons
// ---------------------------------------------------------------------------
// Implémentation minimale d'un JWT HS256. La signature est un vrai HMAC-SHA256 :
// une simple empreinte `sha256(données + secret)` serait vulnérable aux attaques
// par extension de longueur.

const SECRET = process.env.JWT_SECRET || 'qvgdm-secret-de-developpement-a-changer'

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn(
    "[auth] JWT_SECRET absent : un secret de développement est utilisé. " +
      "Définissez JWT_SECRET dans les variables d'environnement."
  )
}

export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

function base64url(input: string | Buffer): string {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b.toString('base64url')
}

function base64urlDecode(input: string): Buffer {
  return Buffer.from(input, 'base64url')
}

function sign(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('base64url')
}

export interface TokenPayload {
  sub: string
  role: string
  iat: number
  exp: number
  [key: string]: unknown
}

export function signToken(
  payload: Record<string, unknown>,
  expiresInSec = TOKEN_TTL_SECONDS
): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const iat = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat, exp: iat + expiresInSec }
  const data = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(body))}`
  return `${data}.${sign(data)}`
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, bodyB64, signature] = parts
    const expected = sign(`${headerB64}.${bodyB64}`)
    // Comparaison à temps constant ; timingSafeEqual exige des longueurs égales.
    if (signature.length !== expected.length) return null
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null

    const body = JSON.parse(base64urlDecode(bodyB64).toString()) as TokenPayload
    if (!body.sub) return null
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null
    return body
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Extraction depuis la requête
// ---------------------------------------------------------------------------

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return null
}

export interface AuthContext {
  userId: string
  role: string
}

export function getUserFromRequest(req: Request): AuthContext | null {
  const token = getTokenFromRequest(req)
  if (!token) return null
  const body = verifyToken(token)
  if (!body) return null
  return { userId: body.sub, role: body.role || 'USER' }
}

export function isAdmin(auth: AuthContext | null): boolean {
  return auth?.role === 'ADMIN'
}
