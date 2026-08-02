'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { AppShell } from '@/components/app-shell'
import { AuthScreen } from '@/components/screens/auth-screen'
import { LobbyScreen } from '@/components/screens/lobby-screen'
import { GameScreen } from '@/components/screens/game-screen'
import { ProfileScreen } from '@/components/screens/profile-screen'
import { LeaderboardScreen } from '@/components/screens/leaderboard-screen'
import { HistoryScreen } from '@/components/screens/history-screen'
import { NotificationsScreen } from '@/components/screens/notifications-screen'
import { AchievementsScreen } from '@/components/screens/achievements-screen'
import { AdminScreen } from '@/components/screens/admin-screen'
import { Trophy } from 'lucide-react'

const SCREENS = {
  lobby: LobbyScreen,
  game: GameScreen,
  profile: ProfileScreen,
  leaderboard: LeaderboardScreen,
  history: HistoryScreen,
  notifications: NotificationsScreen,
  achievements: AchievementsScreen,
  admin: AdminScreen,
} as const

export default function Home() {
  const token = useApp(s => s.token)
  const user = useApp(s => s.user)
  const view = useApp(s => s.view)
  const [hydrated, setHydrated] = useState(false)

  // La session est restaurée depuis le stockage local après le premier rendu.
  // Sans cette attente, le serveur rendrait l'écran de connexion et le client
  // le salon : React signalerait une divergence d'hydratation.
  useEffect(() => setHydrated(true), [])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Trophy className="h-10 w-10 animate-pulse text-primary" />
        <span className="sr-only">Chargement…</span>
      </div>
    )
  }

  if (!token || !user) return <AuthScreen />

  // `view` peut valoir 'auth' juste après une déconnexion : on retombe sur le salon.
  const Screen = SCREENS[view as keyof typeof SCREENS] ?? LobbyScreen

  return (
    <AppShell>
      <Screen />
    </AppShell>
  )
}
