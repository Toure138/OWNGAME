import { db } from '@/lib/db'
import { realtime } from '@/lib/realtime'
import { ok, fail } from '@/lib/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/health — sonde utilisée par Render pour vérifier que le service
// répond ET que la base est accessible.
export async function GET() {
  const startedAt = Date.now()
  try {
    const [questions, categories, users] = await Promise.all([
      db.question.count(),
      db.category.count(),
      db.user.count(),
    ])
    return ok({
      status: 'ok',
      uptime: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
      database: { connected: true, questions, categories, users },
      realtime: realtime.snapshot(),
      version: process.env.npm_package_version || '1.0.0',
    })
  } catch (e) {
    console.error('[health] base injoignable', e)
    return fail('Base de données injoignable', 503, { status: 'degraded' })
  }
}
