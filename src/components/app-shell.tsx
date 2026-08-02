'use client'

import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, Home, User, History, Bell, Crown, LogOut, Gamepad2, Shield, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { InvitationModal } from '@/components/game/invitation-modal'

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useApp(s => s.user)!
  const token = useApp(s => s.token)!
  const view = useApp(s => s.view)
  const setView = useApp(s => s.setView)
  const logout = useApp(s => s.logout)
  const unreadCount = useApp(s => s.unreadCount())
  const onlinePlayers = useApp(s => s.onlinePlayers)
  const connected = useApp(s => s.connected)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Initialize realtime connection
  useRealtime()

  const navItems: Array<{ id: any; label: string; icon: React.ReactNode; adminOnly?: boolean }> = [
    { id: 'lobby', label: 'Salon', icon: <Home className="w-5 h-5" /> },
    { id: 'leaderboard', label: 'Classement', icon: <Crown className="w-5 h-5" /> },
    { id: 'history', label: 'Historique', icon: <History className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'profile', label: 'Profil', icon: <User className="w-5 h-5" /> },
    ...(user.role === 'ADMIN' ? [{ id: 'admin', label: 'Admin', icon: <Shield className="w-5 h-5" />, adminOnly: true }] : []),
  ]

  const handleNav = (id: any) => {
    setView(id)
    setMobileOpen(false)
  }

  async function handleLogout() {
    // Notify the server that we're leaving
    try {
      await fetch('/api/realtime/leave', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    } catch {}
    logout()
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50/50 to-orange-50/30">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <button onClick={() => handleNav('lobby')} className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-orange-900 leading-none">20 Millions</p>
                  <p className="text-[10px] text-orange-600 leading-none mt-0.5">Quiz multijoueur</p>
                </div>
              </button>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Button
                  key={item.id}
                  variant={view === item.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNav(item.id)}
                  className={view === item.id ? 'bg-orange-600 hover:bg-orange-700' : ''}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{unreadCount}</span>
                  )}
                </Button>
              ))}
            </nav>

            {/* Right: connection + user */}
            <div className="flex items-center gap-2">
              <Badge variant={connected ? 'default' : 'secondary'} className="hidden sm:flex gap-1 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                {connected ? 'En ligne' : 'Hors ligne'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNav('profile')}
                className="gap-2"
              >
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-orange-200 text-orange-800 text-xs font-bold">{user.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline font-medium">{user.pseudo}</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-600">
                <LogOut className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile nav */}
          {mobileOpen && (
            <div className="md:hidden border-t border-orange-100 py-2 space-y-1">
              {navItems.map(item => (
                <Button
                  key={item.id}
                  variant={view === item.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleNav(item.id)}
                  className={`w-full justify-start ${view === item.id ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">{unreadCount}</span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-4 sm:py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-orange-100 bg-white/50 backdrop-blur">
        <div className="container mx-auto px-4 max-w-7xl py-3 text-center text-xs text-muted-foreground">
          <p>🏆 Qui veut gagner 20 millions ? — Plateforme de quiz multijoueur temps réel</p>
        </div>
      </footer>

      {/* Invitation modal (rendered globally) */}
      <InvitationModal />
    </div>
  )
}
