'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Bell, CheckCheck, Trophy, Swords, TrendingUp, Info, Medal, Trash2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const VISUALS: Record<string, { icon: React.ReactNode; tone: string }> = {
  GAME_WON: { icon: <Trophy className="h-5 w-5" />, tone: 'bg-amber-500/12 text-amber-600 dark:text-amber-400' },
  GAME_LOST: { icon: <Swords className="h-5 w-5" />, tone: 'bg-rose-500/12 text-rose-600 dark:text-rose-400' },
  GAME_DRAW: { icon: <Swords className="h-5 w-5" />, tone: 'bg-muted text-muted-foreground' },
  ACHIEVEMENT: { icon: <Medal className="h-5 w-5" />, tone: 'bg-violet-500/12 text-violet-600 dark:text-violet-400' },
  INVITE: { icon: <Swords className="h-5 w-5" />, tone: 'bg-primary/12 text-primary' },
  RANK_UP: { icon: <TrendingUp className="h-5 w-5" />, tone: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' },
  INFO: { icon: <Info className="h-5 w-5" />, tone: 'bg-sky-500/12 text-sky-600 dark:text-sky-400' },
}

/** Date relative en français, sans dépendance de formatage supplémentaire. */
function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `il y a ${days} j`
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function NotificationsScreen() {
  const token = useApp(s => s.token)!
  const notifications = useApp(s => s.notifications)
  const unreadCount = useApp(s => s.unreadCount)
  const setNotifications = useApp(s => s.setNotifications)
  const markAllReadLocal = useApp(s => s.markAllRead)
  const markReadLocal = useApp(s => s.markRead)
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chargement impossible')
      setNotifications(data.notifications || [], data.unreadCount)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token, setNotifications])

  useEffect(() => {
    void load()
  }, [load])

  async function markAll() {
    markAllReadLocal()
    await fetch('/api/notifications?all=true', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async function markOne(id: string) {
    markReadLocal(id)
    await fetch(`/api/notifications?id=${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async function removeOne(id: string) {
    // Retrait optimiste : la liste réagit immédiatement au clic.
    setNotifications(
      notifications.filter(n => n.id !== id),
      notifications.filter(n => n.id !== id && !n.read).length
    )
    await fetch(`/api/notifications?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async function clearAll() {
    setNotifications([], 0)
    await fetch('/api/notifications?all=true', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    toast({ title: 'Notifications supprimées' })
  }

  return (
    <div className="container mx-auto max-w-3xl px-3 sm:px-4">
      <div className="animate-in-up mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-gradient">Notifications</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
          </p>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAll} className="gap-1.5">
              <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
            </Button>
          )}
          {notifications.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Tout effacer</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer toutes les notifications ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est définitive. Vos parties et statistiques ne sont pas affectées.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-7 w-7" />}
          title="Aucune notification"
          description="Résultats de parties, succès débloqués et invitations apparaîtront ici."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const visual = VISUALS[n.type] ?? VISUALS.INFO
            return (
              <Card
                key={n.id}
                className={cn(
                  'group transition-colors',
                  !n.read && 'border-primary/40 bg-primary/5'
                )}
              >
                <CardContent className="flex items-start gap-3 p-3.5">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      visual.tone
                    )}
                  >
                    {visual.icon}
                  </div>

                  <button
                    onClick={() => !n.read && markOne(n.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{n.title}</p>
                      {!n.read && (
                        <Badge variant="default" className="h-4 shrink-0 px-1.5 text-[9px]">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {relativeDate(n.createdAt)}
                    </p>
                  </button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOne(n.id)}
                    aria-label="Supprimer cette notification"
                    className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
