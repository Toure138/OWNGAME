import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { realtime } from '@/lib/realtime'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/realtime/game-chat
export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req)
  if (!auth) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const body = await req.json()
  realtime.sendChat(auth.userId, body.gameId, body.content)
  return NextResponse.json({ ok: true })
}
