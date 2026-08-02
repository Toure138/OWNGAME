'use client'

import { useApp } from '@/lib/store'
import { AppShell } from '@/components/app-shell'
import { AuthScreen } from '@/components/screens/auth-screen'
import { LobbyScreen } from '@/components/screens/lobby-screen'
import { GameScreen } from '@/components/screens/game-screen'
import { ProfileScreen } from '@/components/screens/profile-screen'
import { LeaderboardScreen } from '@/components/screens/leaderboard-screen'
import { HistoryScreen } from '@/components/screens/history-screen'
import { NotificationsScreen } from '@/components/screens/notifications-screen'
import { AdminScreen } from '@/components/screens/admin-screen'

export default function Home() {
  const token = useApp(s => s.token)
  const user = useApp(s => s.user)
  const view = useApp(s => s.view)

  if (!token || !user) {
    return <AuthScreen />
  }

  return (
    <AppShell>
      {view === 'lobby' && <LobbyScreen />}
      {view === 'game' && <GameScreen />}
      {view === 'profile' && <ProfileScreen />}
      {view === 'leaderboard' && <LeaderboardScreen />}
      {view === 'history' && <HistoryScreen />}
      {view === 'notifications' && <NotificationsScreen />}
      {view === 'admin' && <AdminScreen />}
    </AppShell>
  )
}
