'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, CheckCheck, Trophy, Sword, TrendingUp, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function NotificationsScreen() {
  const token = useApp(s => s.token)!
  const notifications = useApp(s => s.notifications)
  const setNotifications = useApp(s => s.setNotifications)
  const addNotification = useApp(s => s.addNotification)
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [liveNotifs, setLiveNotifs] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications || []); setLoading(false) })
  }, [token])

  // Combine persisted + live notifications (live ones first)
  useEffect(() => {
    setLiveNotifs(notifications)
  }, [notifications])

  async function markAllRead() {
    await fetch('/api/notifications?all=true', { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
    setNotifications(notifications.map(n => ({ ...n, read: true })))
    toast({ title: 'Notifications marquées comme lues' })
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const iconForType = (type: string) => {
    if (type === 'GAME_WON' || type === 'ACHIEVEMENT') return <Trophy className="w-5 h-5 text-amber-500" />
    if (type === 'GAME_LOST') return <Sword className="w-5 h-5 text-red-500" />
    if (type === 'INVITE') return <Sword className="w-5 h-5 text-orange-500" />
    if (type === 'RANK_UP') return <TrendingUp className="w-5 h-5 text-green-500" />
    return <Info className="w-5 h-5 text-blue-500" />
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-orange-900">Notifications</h1>
          <p className="text-muted-foreground">{notifications.filter(n => !n.read).length} non lue(s)</p>
        </div>
        {notifications.some(n => !n.read) && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" /> Tout marquer comme lu
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-orange-900 flex items-center gap-2"><Bell className="w-5 h-5" /> Toutes vos notifications</CardTitle>
          <CardDescription>Invitations, résultats, succès...</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Aucune notification pour le moment.</p>
            </div>
          ) : (
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-2">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer ${!n.read ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}
                    onClick={() => !n.read && markRead(n.id)}
                  >
                    <div className="mt-0.5">{iconForType(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
