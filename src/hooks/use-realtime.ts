'use client'

import { useEffect, useRef } from 'react'
import { useApp } from '@/lib/store'
import { playSound } from '@/lib/sound'

// Client temps réel par interrogation périodique.
//
// Le hook est monté une seule fois, dans l'enveloppe applicative. Il maintient
// la présence dans le salon, distribue les événements de jeu via un bus, et se
// réinscrit automatiquement si le serveur a redémarré.

const POLL_INTERVAL = 1200
const MAX_BACKOFF = 10_000

// ---------------------------------------------------------------------------
// Bus d'événements
// ---------------------------------------------------------------------------
// Les écrans de jeu se montent parfois après l'arrivée du premier événement :
// les événements de partie sont donc mémorisés pour être rejoués aux abonnés
// tardifs.

type Listener = (data: unknown) => void

const BUFFERED = new Set([
  'game:started',
  'game:question',
  'game:question-result',
  'game:finished',
])

class EventBus {
  private listeners = new Map<string, Set<Listener>>()
  private buffer = new Map<string, unknown>()

  on(event: string, fn: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(fn)
    if (this.buffer.has(event)) {
      const data = this.buffer.get(event)
      // Différé d'un tick : l'abonné termine son rendu avant de recevoir.
      setTimeout(() => fn(data), 0)
    }
    return () => this.off(event, fn)
  }

  off(event: string, fn: Listener) {
    this.listeners.get(event)?.delete(fn)
  }

  emit(event: string, data: unknown) {
    if (BUFFERED.has(event)) this.buffer.set(event, data)
    this.listeners.get(event)?.forEach(fn => fn(data))
  }

  clearBuffer(event?: string) {
    if (event) this.buffer.delete(event)
    else this.buffer.clear()
  }
}

export const eventBus = new EventBus()

/** Vide la mémoire des événements de partie (retour au salon, nouvelle partie). */
export function clearGameBuffer() {
  eventBus.clearBuffer('game:started')
  eventBus.clearBuffer('game:question')
  eventBus.clearBuffer('game:question-result')
  eventBus.clearBuffer('game:finished')
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRealtime() {
  const token = useApp(s => s.token)
  const userId = useApp(s => s.user?.id)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!token || !userId) return
    if (startedRef.current) return
    startedRef.current = true

    let stopped = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let failures = 0

    const store = useApp.getState
    const headers = () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    })

    async function join(): Promise<boolean> {
      try {
        const res = await fetch('/api/realtime/join', { method: 'POST', headers: headers() })
        if (!res.ok) {
          store().setConnected(false)
          return false
        }
        const data = await res.json()
        store().setOnlinePlayers(data.players || [])
        store().setConnected(true)

        // Partie encore en cours côté serveur après un rechargement de page.
        // L'historique du chat voyage dans la charge utile de `game:started`
        // plutôt qu'en messages séparés : le tampon d'événements ne retient
        // qu'un exemplaire par type et perdrait tout sauf le dernier message.
        if (data.currentGame) {
          clearGameBuffer()
          eventBus.emit('game:started', data.currentGame)
          if (data.currentGame.question) {
            eventBus.emit('game:question', data.currentGame.question)
          }
          store().setView('game')
        } else if (store().view === 'game') {
          // Le serveur ne connaît aucune partie alors que l'écran de jeu est
          // affiché : la session a été perdue (redémarrage du service). Sans ce
          // retour au salon, le joueur resterait devant un plateau figé.
          clearGameBuffer()
          store().setView('lobby')
          eventBus.emit('game:lost', null)
        }
        return true
      } catch {
        store().setConnected(false)
        return false
      }
    }

    async function poll() {
      if (stopped) return
      try {
        const res = await fetch('/api/realtime/poll', { method: 'POST', headers: headers() })
        if (!res.ok) throw new Error(String(res.status))

        const data = await res.json()
        failures = 0
        store().setConnected(true)

        // Le serveur ne nous connaît plus (redémarrage, inactivité) : on se
        // réinscrit sans intervention de l'utilisateur.
        if (data.online === false) {
          await join()
        }

        for (const evt of data.events || []) {
          handleEvent(evt.type, evt.data)
        }
      } catch {
        failures++
        if (failures > 2) store().setConnected(false)
      } finally {
        if (!stopped) {
          // Ralentissement progressif quand le serveur ne répond plus, pour ne
          // pas marteler une instance en cours de redémarrage.
          const delay =
            failures > 0 ? Math.min(POLL_INTERVAL * 2 ** failures, MAX_BACKOFF) : POLL_INTERVAL
          timer = setTimeout(poll, delay)
        }
      }
    }

    function handleEvent(type: string, data: any) {
      const s = store()
      switch (type) {
        case 'presence:update':
          s.setOnlinePlayers((data || []).filter((p: any) => p.userId !== userId))
          break

        case 'invite:received':
          s.addInvitation(data)
          if (s.soundEnabled) playSound('invite')
          break

        case 'invite:declined':
          s.removeInvitation(data.invitationId)
          if (s.pendingInvite?.invitationId === data.invitationId) s.setPendingInvite(null)
          eventBus.emit('invite:declined', data)
          break

        case 'invite:cancelled':
        case 'invite:expired':
          s.removeInvitation(data.invitationId)
          if (s.pendingInvite?.invitationId === data.invitationId) s.setPendingInvite(null)
          eventBus.emit(type, data)
          break

        case 'game:prepare':
        case 'game:pending':
          eventBus.emit(type, data)
          break

        case 'game:started':
          clearGameBuffer()
          eventBus.emit('game:started', data)
          s.setPendingInvite(null)
          s.setView('game')
          if (s.soundEnabled) playSound('start')
          break

        case 'game:question':
        case 'game:question-result':
        case 'game:finished':
        case 'game:chat:message':
          eventBus.emit(type, data)
          break

        case 'profile:refresh':
          void refreshProfile()
          break
      }
    }

    async function refreshProfile() {
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const data = await res.json()
        if (data.user) store().updateUser(data.user)
      } catch {
        // Le rafraîchissement est opportuniste.
      }
    }

    void join().then(() => poll())

    // À la fermeture de l'onglet, aucun appel authentifié n'est possible :
    // `sendBeacon` ne transporte pas d'en-tête Authorization. C'est le nettoyage
    // périodique côté serveur (30 s sans interrogation) qui libère la place.
    return () => {
      stopped = true
      startedRef.current = false
      if (timer) clearTimeout(timer)
    }
  }, [token, userId])
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

async function send<T = any>(url: string, token: string, body?: unknown, method = 'POST'): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: data.error || 'Erreur réseau', ...data } as T
  return { ok: true, ...data } as T
}

export const sendInvite = (token: string, toUserId: string, categoryFilter: string | null) =>
  send('/api/realtime/invite', token, { toUserId, categoryFilter })

export const cancelInvite = (token: string, invitationId: string) =>
  send('/api/realtime/invite', token, { invitationId }, 'DELETE')

export const respondInvite = (token: string, invitationId: string, accept: boolean) =>
  send('/api/realtime/invite-respond', token, { invitationId, accept })

export const startGame = (token: string, opponentId: string, categoryFilter: string | null) =>
  send('/api/realtime/game-start', token, { opponentId, categoryFilter })

/** Duel contre l'ordinateur : ni invitation, ni adversaire à attendre. */
export const startSoloGame = (
  token: string,
  botProfile: string,
  categoryFilter: string | null
) => send('/api/realtime/solo-start', token, { botProfile, categoryFilter })

/** Présentation à un examen du parcours académique. */
export const startExam = (token: string, degree: string) =>
  send('/api/realtime/exam-start', token, { degree })

export const answerQuestion = (
  token: string,
  gameId: string,
  choice: 'A' | 'B' | 'C' | 'D' | null,
  responseTime: number
) => send('/api/realtime/game-answer', token, { gameId, choice, responseTime })

export const sendChat = (token: string, gameId: string, content: string) =>
  send('/api/realtime/game-chat', token, { gameId, content })

export const leaveGame = (token: string, gameId: string) =>
  send('/api/realtime/game-leave', token, { gameId })
