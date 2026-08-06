'use client'

import { useEffect } from 'react'
import { useApp, type View } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Home,
  Crown,
  History,
  Bell,
  User as UserIcon,
  Shield,
  LogOut,
  Trophy,
  Medal,
  GraduationCap,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import { setSoundEnabled } from '@/lib/sound'
import { InvitationModal } from '@/components/game/invitation-modal'
import { cn } from '@/lib/utils'

interface NavItem {
  id: View
  label: string
  icon: React.ReactNode
  /** Présent dans la barre de navigation mobile. */
  mobile?: boolean
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useApp(s => s.user)!
  const token = useApp(s => s.token)!
  const view = useApp(s => s.view)
  const setView = useApp(s => s.setView)
  const logout = useApp(s => s.logout)
  const unreadCount = useApp(s => s.unreadCount)
  const connected = useApp(s => s.connected)
  const soundEnabled = useApp(s => s.soundEnabled)
  const toggleSound = useApp(s => s.toggleSound)

  useRealtime()

  // La préférence sonore est persistée dans le store ; le module audio doit
  // être resynchronisé au montage et à chaque changement.
  useEffect(() => {
    setSoundEnabled(soundEnabled)
  }, [soundEnabled])

  const navItems: NavItem[] = [
    { id: 'lobby', label: 'Salon', icon: <Home className="h-5 w-5" />, mobile: true },
    {
      id: 'academy',
      label: 'Parcours',
      icon: <GraduationCap className="h-5 w-5" />,
      mobile: true,
    },
    { id: 'leaderboard', label: 'Classement', icon: <Crown className="h-5 w-5" />, mobile: true },
    { id: 'history', label: 'Historique', icon: <History className="h-5 w-5" /> },
    { id: 'achievements', label: 'Succès', icon: <Medal className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" />, mobile: true },
    { id: 'profile', label: 'Profil', icon: <UserIcon className="h-5 w-5" />, mobile: true },
    ...(user.role === 'ADMIN'
      ? [{ id: 'admin' as View, label: 'Admin', icon: <Shield className="h-5 w-5" /> }]
      : []),
  ]

  async function handleLogout() {
    try {
      await fetch('/api/realtime/leave', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      // La déconnexion locale doit aboutir même si le serveur ne répond pas.
    }
    logout()
  }

  const mobileItems = navItems.filter(i => i.mobile)

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-screen flex-col">
        <header className="glass sticky top-0 z-40 border-b">
          <div className="container mx-auto max-w-7xl px-3 sm:px-4">
            <div className="flex h-14 items-center justify-between gap-2">
              <button
                onClick={() => setView('lobby')}
                className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-sm">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-bold leading-none">20 Millions</p>
                  <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                    Quiz multijoueur
                  </p>
                </div>
              </button>

              <nav className="hidden items-center gap-0.5 md:flex">
                {navItems.map(item => (
                  <Button
                    key={item.id}
                    variant={view === item.id ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setView(item.id)}
                    className={cn('relative gap-1.5', view === item.id && 'font-semibold')}
                  >
                    {item.icon}
                    <span className="hidden lg:inline">{item.label}</span>
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="ml-0.5 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold leading-none text-destructive-foreground">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                ))}
              </nav>

              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        'hidden h-8 gap-1.5 px-2.5 sm:flex',
                        connected
                          ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                          : 'border-destructive/40 text-destructive'
                      )}
                    >
                      {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                      <span className="text-xs">{connected ? 'En ligne' : 'Hors ligne'}</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {connected
                      ? 'Connecté au salon temps réel'
                      : 'Reconnexion automatique en cours…'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSound}
                      aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
                    >
                      {soundEnabled ? (
                        <Volume2 className="h-[1.15rem] w-[1.15rem]" />
                      ) : (
                        <VolumeX className="h-[1.15rem] w-[1.15rem]" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{soundEnabled ? 'Couper le son' : 'Activer le son'}</TooltipContent>
                </Tooltip>

                <ThemeToggle />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 px-1.5 sm:px-2">
                      <PlayerAvatar name={user.pseudo} src={user.avatarUrl} className="h-7 w-7" />
                      <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:inline">
                        {user.pseudo}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel className="font-normal">
                      <p className="truncate font-semibold">{user.pseudo}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          Niveau {user.level}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {user.totalScore.toLocaleString('fr-FR')} pts
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setView('profile')}>
                      <UserIcon className="mr-2 h-4 w-4" /> Mon profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setView('achievements')}>
                      <Medal className="mr-2 h-4 w-4" /> Mes succès
                    </DropdownMenuItem>
                    {user.role === 'ADMIN' && (
                      <DropdownMenuItem onClick={() => setView('admin')}>
                        <Shield className="mr-2 h-4 w-4" /> Administration
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* pb-20 sur mobile : réserve la place de la barre de navigation fixe. */}
        <main className="flex-1 pb-20 pt-4 sm:pt-6 md:pb-6">{children}</main>

        <footer className="hidden border-t py-3 md:block">
          <div className="container mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground">
            🏆 Qui veut gagner 20 millions ? — 7 300 questions, 20 catégories, du CEP au doctorat
          </div>
        </footer>

        {/* Navigation mobile : cibles tactiles larges, toujours accessibles. */}
        <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t md:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {mobileItems.map(item => {
              const active = view === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <span className="relative">
                    {item.icon}
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </span>
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        <InvitationModal />
      </div>
    </TooltipProvider>
  )
}
