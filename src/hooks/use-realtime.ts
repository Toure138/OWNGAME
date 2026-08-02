'use client'

import { useEffect, useRef } from 'react'
import { useApp } from '@/lib/store'

// HTTP polling-based realtime client.
// Polls /api/realtime/poll every 1.5s to receive events.
// Sends actions via POST to /api/realtime/* endpoints.

const POLL_INTERVAL = 1500 // ms

export function useRealtime() {
  const token = useApp(s => s.token)
  const user = useApp(s => s.user)
  const setOnlinePlayers = useApp(s => s.setOnlinePlayers)
  const setConnected = useApp(s => s.setConnected)
  const addNotification = useApp(s => s.addNotification)
  const addInvitation = useApp(s => s.addInvitation)
  const removeInvitation = useApp(s => s.removeInvitation)
  const setView = useApp(s => s.setView)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!token || !user) return
    if (initializedRef.current) return
    initializedRef.current = true

    let stopped = false
    let pollTimer: ReturnType<typeof setTimeout> | null = null

    const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' })

    async function join() {
      try {
        await fetch('/api/realtime/join', {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ pseudo: user.pseudo, avatarUrl: user.avatarUrl, country: user.country, level: user.level }),
        })
        setConnected(true)
      } catch (e) {
        console.error('[realtime] join failed', e)
      }
    }

    async function poll() {
      if (stopped) return
      try {
        const res = await fetch('/api/realtime/poll', { method: 'POST', headers: headers() })
        if (!res.ok) return
        const data = await res.json()
        const events = data.events || []
        for (const evt of events) {
          handleEvent(evt.type, evt.data)
        }
      } catch (e) {
        // ignore
      } finally {
        if (!stopped) {
          pollTimer = setTimeout(poll, POLL_INTERVAL)
        }
      }
    }

    function handleEvent(type: string, data: any) {
      switch (type) {
        case 'presence:update':
          setOnlinePlayers((data || []).filter((p: any) => p.userId !== user.id))
          break
        case 'invite:received':
          addInvitation(data)
          addNotification({
            id: Math.random().toString(36).slice(2),
            type: 'INVITE',
            title: 'Invitation reçue',
            body: `${data.fromPseudo} vous invite à jouer`,
            read: false,
            createdAt: new Date().toISOString(),
          })
          break
        case 'invite:declined':
          removeInvitation(data.invitationId)
          break
        case 'game:prepare':
          // The inviter receives this when their invite is accepted.
          // Emit to the event bus so the LobbyScreen can show the GamePrepareModal.
          eventBus.emit('game:prepare', data)
          break
        case 'game:started':
          eventBus.emit(type, data)
          setView('game')
          break
        case 'game:question':
        case 'game:question-result':
        case 'game:finished':
        case 'game:chat:message':
          // These are handled by the GameScreen via the event bus
          eventBus.emit(type, data)
          break
        case 'notification':
          addNotification({
            id: Math.random().toString(36).slice(2),
            type: data.type,
            title: data.title,
            body: data.body,
            read: false,
            createdAt: new Date(data.createdAt || Date.now()).toISOString(),
          })
          break
      }
    }

    join().then(() => poll())

    // Cleanup on unmount or logout
    return () => {
      stopped = true
      if (pollTimer) clearTimeout(pollTimer)
      // Don't leave on unmount - the user is still logged in
    }
  }, [token, user])

  return { ready: true }
}

// Simple event bus for game events (so GameScreen can listen)
// Buffers events so listeners that mount after an event is emitted can still receive it.
type Listener = (data: any) => void
class EventBus {
  private listeners = new Map<string, Set<Listener>>()
  private buffer = new Map<string, any>()

  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(fn)
    // If there's a buffered event, deliver it immediately
    if (this.buffer.has(event)) {
      setTimeout(() => fn(this.buffer.get(event)), 0)
    }
    return () => this.off(event, fn)
  }
  off(event: string, fn: Listener) {
    this.listeners.get(event)?.delete(fn)
  }
  emit(event: string, data: any) {
    // Buffer the latest event for late subscribers
    if (event === 'game:started' || event === 'game:question' || event === 'game:question-result' || event === 'game:finished') {
      this.buffer.set(event, data)
    }
    this.listeners.get(event)?.forEach(fn => fn(data))
  }
  clearBuffer(event?: string) {
    if (event) {
      this.buffer.delete(event)
    } else {
      this.buffer.clear()
    }
  }
}
export const eventBus = new EventBus()

// Helper functions for sending realtime actions
export async function sendInvite(token: string, toUserId: string, categoryFilter: string | null) {
  const res = await fetch('/api/realtime/invite', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ toUserId, categoryFilter }),
  })
  return res.json()
}

export async function respondInvite(token: string, invitationId: string, accept: boolean) {
  const res = await fetch('/api/realtime/invite-respond', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ invitationId, accept }),
  })
  return res.json()
}

export async function startGame(token: string, opponentId: string, categoryFilter: string | null, questions: any[]) {
  const res = await fetch('/api/realtime/game-start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ opponentId, categoryFilter, questions }),
  })
  return res.json()
}

export async function answerQuestion(token: string, gameId: string, choice: 'A' | 'B' | 'C' | 'D' | null, responseTime: number) {
  const res = await fetch('/api/realtime/game-answer', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, choice, responseTime }),
  })
  return res.json()
}

export async function sendChat(token: string, gameId: string, content: string) {
  const res = await fetch('/api/realtime/game-chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, content }),
  })
  return res.json()
}

export async function leaveGame(token: string, gameId: string) {
  const res = await fetch('/api/realtime/game-leave', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId }),
  })
  return res.json()
}
