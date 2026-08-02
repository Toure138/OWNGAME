'use client'

import { useEffect, useState } from 'react'
import { useApp, OnlinePlayer } from '@/lib/store'
import { sendInvite, eventBus } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Search, Zap, Globe, Sword, Crown, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { GamePrepareModal } from '@/components/game/game-prepare-modal'

interface Category { id: string; name: string; color?: string | null }

export function LobbyScreen() {
  const user = useApp(s => s.user)!
  const onlinePlayers = useApp(s => s.onlinePlayers)
  const connected = useApp(s => s.connected)
  const categoryFilter = useApp(s => s.categoryFilter)
  const setCategoryFilter = useApp(s => s.setCategoryFilter)
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [categories, setCategories] = useState<Category[]>([])
  const [matchmaking, setMatchmaking] = useState(false)
  const [gamePrepare, setGamePrepare] = useState<{ opponentId: string; opponentPseudo: string; opponentAvatarUrl: string | null; categoryFilter: string | null } | null>(null)
  const [pendingInvite, setPendingInvite] = useState<{ invitationId: string; toUserId: string; toPseudo: string } | null>(null)

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []))
  }, [])

  // Listen for game:prepare events (when my invite was accepted)
  useEffect(() => {
    const off = eventBus.on('game:prepare', (data: any) => {
      setGamePrepare({
        opponentId: data.opponentId,
        opponentPseudo: data.opponentPseudo,
        opponentAvatarUrl: data.opponentAvatarUrl,
        categoryFilter: data.categoryFilter,
      })
      setPendingInvite(null)
    })
    return () => { off() }
  }, [])

  function statusLabel(s: string) {
    if (s === 'AVAILABLE') return { label: 'Disponible', color: 'bg-green-500' }
    if (s === 'IN_GAME') return { label: 'En partie', color: 'bg-amber-500' }
    return { label: 'En ligne', color: 'bg-blue-500' }
  }

  function filtered() {
    return onlinePlayers.filter(p => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
      if (search && !p.pseudo.toLowerCase().includes(search.toLowerCase()) && !p.country.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }

  async function invitePlayer(p: OnlinePlayer) {
    const token = useApp.getState().token!
    const r = await sendInvite(token, p.userId, categoryFilter)
    if (r.ok) {
      setPendingInvite({ invitationId: r.invitationId, toUserId: p.userId, toPseudo: p.pseudo })
      toast({ title: 'Invitation envoyée', description: `En attente de la réponse de ${p.pseudo}...` })
    } else {
      toast({ title: 'Impossible d\'inviter', description: r.error, variant: 'destructive' })
    }
  }

  function cancelInvite() {
    setPendingInvite(null)
  }

  async function autoMatchmake() {
    setMatchmaking(true)
    const available = onlinePlayers.filter(p => p.status === 'AVAILABLE')
    if (available.length === 0) {
      toast({ title: 'Aucun joueur disponible', description: 'Réessayez dans quelques instants', variant: 'destructive' })
      setMatchmaking(false)
      return
    }
    // Pick a random opponent
    const opponent = available[Math.floor(Math.random() * available.length)]
    setTimeout(() => {
      invitePlayer(opponent)
      setMatchmaking(false)
    }, 800)
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-orange-900">Salon des joueurs</h1>
          <p className="text-muted-foreground">Défiez un adversaire ou laissez le système vous trouver un match</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'default' : 'secondary'} className="gap-1">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            {connected ? 'Connecté' : 'Hors ligne'}
          </Badge>
          <Badge variant="outline" className="gap-1"><Users className="w-3 h-3" /> {onlinePlayers.length} en ligne</Badge>
        </div>
      </div>

      {/* Category filter + matchmaking */}
      <Card className="mb-6 border-orange-200">
        <CardContent className="p-4 sm:p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-orange-900">Catégorie de questions</label>
              <Select value={categoryFilter || 'ALL'} onValueChange={v => setCategoryFilter(v === 'ALL' ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">🎲 Aléatoire (toutes catégories)</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={autoMatchmake}
                disabled={matchmaking || !connected}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white h-10"
              >
                {matchmaking ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recherche...</> : <><Zap className="w-4 h-4 mr-2" /> Trouver un adversaire</>}
              </Button>
            </div>
            <div className="flex items-end">
              <div className="text-xs text-muted-foreground bg-orange-50 rounded-lg p-3 w-full">
                💡 Astuce : vous pouvez aussi défier un joueur précis dans la liste ci-dessous.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingInvite && (
        <Card className="mb-4 border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Invitation envoyée à {pendingInvite.toPseudo}</p>
                <p className="text-sm text-amber-700">En attente de réponse...</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={cancelInvite}>Annuler</Button>
          </CardContent>
        </Card>
      )}

      {/* Online players */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900"><Globe className="w-5 h-5" /> Joueurs en ligne</CardTitle>
          <CardDescription>Parcourez et défiez les joueurs connectés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher par pseudo ou pays..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="AVAILABLE">Disponibles</SelectItem>
                <SelectItem value="IN_GAME">En partie</SelectItem>
                <SelectItem value="ONLINE">En ligne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered().length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Aucun joueur ne correspond à votre recherche.</p>
              <p className="text-sm mt-1">Ouvrez l'application dans un autre onglet avec un autre compte pour tester le multijoueur !</p>
            </div>
          ) : (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-2">
                {filtered().map(p => {
                  const st = statusLabel(p.status)
                  return (
                    <div key={p.userId} className="flex items-center justify-between p-3 rounded-xl border hover:bg-orange-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <Avatar className="w-11 h-11">
                            <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">{p.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${st.color}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{p.pseudo}</p>
                            <Badge variant="outline" className="text-xs">Niv. {p.level}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.country} · {st.label}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={p.status === 'AVAILABLE' ? 'default' : 'secondary'}
                        disabled={p.status !== 'AVAILABLE'}
                        onClick={() => invitePlayer(p)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Sword className="w-4 h-4 mr-1" /> Défier
                      </Button>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {gamePrepare && (
        <GamePrepareModal
          opponent={gamePrepare}
          onClose={() => setGamePrepare(null)}
        />
      )}
    </div>
  )
}
