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
  level: number
  xp: number
  gamesPlayed: number
  wins: number
  losses: number
  totalScore: number
  rank?: number
  createdAt?: string
}

export interface OnlinePlayer {
  userId: string
  pseudo: string
  avatarUrl: string | null
  country: string
  level: number
  status: 'ONLINE' | 'IN_GAME' | 'AVAILABLE'
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
  toUserId: string
  categoryFilter: string | null
  createdAt: number
}

interface AppState {
  // Auth
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  updateUser: (patch: Partial<User>) => void

  // Navigation
  view: View
  setView: (v: View) => void

  // Real-time
  onlinePlayers: OnlinePlayer[]
  setOnlinePlayers: (list: OnlinePlayer[]) => void
  connected: boolean
  setConnected: (b: boolean) => void

  // Notifications
  notifications: NotificationItem[]
  setNotifications: (n: NotificationItem[]) => void
  addNotification: (n: NotificationItem) => void
  unreadCount: () => number

  // Invitations
  invitations: InvitationItem[]
  addInvitation: (i: InvitationItem) => void
  removeInvitation: (id: string) => void

  // Game category filter (for matchmaking)
  categoryFilter: string | null
  setCategoryFilter: (c: string | null) => void
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user, view: 'lobby' }),
      logout: () => set({ token: null, user: null, view: 'auth', onlinePlayers: [], notifications: [], invitations: [] }),
      updateUser: (patch) => set({ user: { ...(get().user as User), ...patch } }),

      view: 'auth',
      setView: (v) => set({ view: v }),

      onlinePlayers: [],
      setOnlinePlayers: (list) => set({ onlinePlayers: list }),
      connected: false,
      setConnected: (b) => set({ connected: b }),

      notifications: [],
      setNotifications: (n) => set({ notifications: n }),
      addNotification: (n) => set({ notifications: [n, ...get().notifications].slice(0, 50) }),
      unreadCount: () => get().notifications.filter(n => !n.read).length,

      invitations: [],
      addInvitation: (i) => {
        const list = get().invitations
        if (!list.find(x => x.id === i.id)) set({ invitations: [i, ...list] })
      },
      removeInvitation: (id) => set({ invitations: get().invitations.filter(i => i.id !== id) }),

      categoryFilter: null,
      setCategoryFilter: (c) => set({ categoryFilter: c }),
    }),
    {
      name: 'qvgdm-store',
      partialize: (s) => ({ token: s.token, user: s.user, view: s.view, categoryFilter: s.categoryFilter }),
    }
  )
)
