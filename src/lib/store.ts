'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type View =
  | 'auth'
  | 'lobby'
  | 'game'
  | 'profile'
  | 'leaderboard'
  | 'history'
  | 'notifications'
  | 'achievements'
  | 'admin'

export interface User {
  id: string
  email: string
  phone?: string | null
  pseudo: string
  fullName?: string | null
  country: string
  avatarUrl?: string | null
  role: 'USER' | 'ADMIN'
  banned?: boolean
  level: number
  xp: number
  gamesPlayed: number
  wins: number
  losses: number
  draws?: number
  totalScore: number
  bestStreak?: number
  rank?: number
  nationalRank?: number
  createdAt?: string
}

export interface OnlinePlayer {
  userId: string
  pseudo: string
  avatarUrl: string | null
  country: string
  level: number
  status: 'AVAILABLE' | 'IN_GAME'
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface InvitationItem {
  id: string
  fromUserId: string
  fromPseudo: string
  fromAvatarUrl: string | null
  fromLevel?: number
  toUserId: string
  categoryFilter: string | null
  createdAt: number
}

export interface PendingInvite {
  invitationId: string
  toUserId: string
  toPseudo: string
  sentAt: number
}

interface AppState {
  // Authentification
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  updateUser: (patch: Partial<User>) => void

  // Navigation
  view: View
  setView: (v: View) => void

  // Temps réel
  onlinePlayers: OnlinePlayer[]
  setOnlinePlayers: (list: OnlinePlayer[]) => void
  connected: boolean
  setConnected: (b: boolean) => void

  // Notifications
  notifications: NotificationItem[]
  unreadCount: number
  setNotifications: (n: NotificationItem[], unread?: number) => void
  addNotification: (n: NotificationItem) => void
  markAllRead: () => void
  markRead: (id: string) => void

  // Invitations
  invitations: InvitationItem[]
  addInvitation: (i: InvitationItem) => void
  removeInvitation: (id: string) => void
  pendingInvite: PendingInvite | null
  setPendingInvite: (p: PendingInvite | null) => void

  // Préférences de partie
  categoryFilter: string | null
  setCategoryFilter: (c: string | null) => void
  soundEnabled: boolean
  toggleSound: () => void
}

const initialTransient = {
  onlinePlayers: [] as OnlinePlayer[],
  notifications: [] as NotificationItem[],
  unreadCount: 0,
  invitations: [] as InvitationItem[],
  pendingInvite: null as PendingInvite | null,
  connected: false,
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user, view: 'lobby' }),
      logout: () => set({ token: null, user: null, view: 'auth', ...initialTransient }),
      updateUser: patch => {
        const current = get().user
        if (!current) return
        set({ user: { ...current, ...patch } })
      },

      view: 'auth',
      setView: v => set({ view: v }),

      onlinePlayers: [],
      setOnlinePlayers: list => set({ onlinePlayers: list }),
      connected: false,
      setConnected: b => set({ connected: b }),

      notifications: [],
      unreadCount: 0,
      setNotifications: (n, unread) =>
        set({ notifications: n, unreadCount: unread ?? n.filter(x => !x.read).length }),
      addNotification: n =>
        set(state => ({
          notifications: [n, ...state.notifications].slice(0, 60),
          unreadCount: state.unreadCount + (n.read ? 0 : 1),
        })),
      markAllRead: () =>
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        })),
      markRead: id =>
        set(state => {
          const target = state.notifications.find(n => n.id === id)
          if (!target || target.read) return state
          return {
            notifications: state.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
            unreadCount: Math.max(0, state.unreadCount - 1),
          }
        }),

      invitations: [],
      addInvitation: i =>
        set(state =>
          state.invitations.some(x => x.id === i.id)
            ? state
            : { invitations: [i, ...state.invitations] }
        ),
      removeInvitation: id =>
        set(state => ({ invitations: state.invitations.filter(i => i.id !== id) })),
      pendingInvite: null,
      setPendingInvite: p => set({ pendingInvite: p }),

      categoryFilter: null,
      setCategoryFilter: c => set({ categoryFilter: c }),
      soundEnabled: true,
      toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled })),
    }),
    {
      name: 'qvgdm-store',
      version: 2,
      // Seuls l'identité et les préférences sont conservées : l'état temps réel
      // (présence, invitations) doit toujours repartir du serveur.
      partialize: s => ({
        token: s.token,
        user: s.user,
        view: s.view === 'game' ? 'lobby' : s.view,
        categoryFilter: s.categoryFilter,
        soundEnabled: s.soundEnabled,
      }),
    }
  )
)
