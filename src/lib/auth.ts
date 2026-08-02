import { createHash, randomBytes } from 'crypto'

// Simple password hashing (PBKDF2-like). For production, use bcrypt.
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(salt + password).digest('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const computed = createHash('sha256').update(salt + password).digest('hex')
  return computed === hash
}

// Minimal JWT implementation (HS256). For production, use a library like jose.
const SECRET = process.env.JWT_SECRET || 'qvgdm-secret-change-me-in-production'

function base64url(input: string | Buffer) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return b.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

export function signToken(payload: Record<string, any>, expiresInSec = 60 * 60 * 24 * 7): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const iat = Math.floor(Date.now() / 1000)
  const body = { ...payload, iat, exp: iat + expiresInSec }
  const headerB64 = base64url(JSON.stringify(header))
  const bodyB64 = base64url(JSON.stringify(body))
  const data = `${headerB64}.${bodyB64}`
  const sig = createHash('sha256').update(data + SECRET).digest('hex')
  return `${data}.${sig}`
}

export function verifyToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [headerB64, bodyB64, sig] = parts
    const data = `${headerB64}.${bodyB64}`
    const expected = createHash('sha256').update(data + SECRET).digest('hex')
    if (sig !== expected) return null
    const body = JSON.parse(base64urlDecode(bodyB64).toString())
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null
    return body
  } catch {
    return null
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export function getUserFromRequest(req: Request): { userId: string; role: string } | null {
  const token = getTokenFromRequest(req)
  if (!token) return null
  const body = verifyToken(token)
  if (!body || !body.sub) return null
  return { userId: body.sub as string, role: (body.role as string) || 'USER' }
}
