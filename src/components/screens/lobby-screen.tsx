'use client'

import { useEffect, useMemo, useState } from 'react'
import { useApp, type OnlinePlayer } from '@/lib/store'
import { sendInvite, cancelInvite, eventBus } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { StatTile } from '@/components/ui/stat-tile'
import { EmptyState, ListSkeleton } from '@/components/ui/states'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useToast } from '@/hooks/use-toast'
import { GamePrepareModal } from '@/components/game/game-prepare-modal'
import {
  Users, Search, Zap, Swords, Loader2, X, Trophy, Flame, Target, Layers, Shuffle,
} from 'lucide-react'

interface Category {
  id: string
  name: string
  color?: string | null
  questionCount: number
}

type PrepareData = {
  opponentId: string
  opponentPseudo: string
  opponentAvatarUrl: string | null
  categoryFilter: string | null
}

export function LobbyScreen() {
  const user = useApp(s => s.user)!
  const token = useApp(s => s.token)!
  const onlinePlayers = useApp(s => s.onlinePlayers)
  const connected = useApp(s => s.connected)
  const categoryFilter = useApp(s => s.categoryFilter)
  const setCategoryFilter = useApp(s => s.setCategoryFilter)
  const pendingInvite = useApp(s => s.pendingInvite)
  const setPendingInvite = useApp(s => s.setPendingInvite)
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'IN_GAME'>('ALL')
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [matchmaking, setMatchmaking] = useState(false)
  const [prepare, setPrepare] = useState<PrepareData | null>(null)
  const [waitingOpponent, setWaitingOpponent] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false))
  }, [])

  useEffect(() => {
    const offs = [
      // Notre invitation a été acceptée : à nous de lancer la partie.
      eventBus.on('game:prepare', data => {
        setPrepare(data as PrepareData)
        setPendingInvite(null)
      }),
      // Nous avons accepté : l'autre joueur prépare le match.
      eventBus.on('game:pending', data => {
        setWaitingOpponent((data as { opponentPseudo: string }).opponentPseudo)
      }),
      eventBus.on('invite:declined', data => {
        const pseudo = (data as { byPseudo?: string }).byPseudo
        toast({
          title: 'Défi décliné',
          description: pseudo ? `${pseudo} a refusé votre invitation.` : 'Invitation refusée.',
        })
      }),
      eventBus.on('invite:expired', () => {
        toast({ title: 'Invitation expirée', description: 'Aucune réponse en une minute.' })
        setWaitingOpponent(null)
      }),
      eventBus.on('game:started', () => setWaitingOpponent(null)),
    ]
    return () => offs.forEach(off => off())
  }, [setPendingInvite, toast])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return onlinePlayers
      .filter(p => statusFilter === 'ALL' || p.status === statusFilter)
      .filter(
        p =>
          !term ||
          p.pseudo.toLowerCase().includes(term) ||
          p.country.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        // Les joueurs disponibles d'abord : ce sont les seuls actionnables.
        if (a.status !== b.status) return a.status === 'AVAILABLE' ? -1 : 1
        return b.level - a.level
      })
  }, [onlinePlayers, search, statusFilter])

  const availableCount = onlinePlayers.filter(p => p.status === 'AVAILABLE').length
  const selectedCategory = categories.find(c => c.id === categoryFilter)

  async function invite(player: OnlinePlayer) {
    const result = await sendInvite(token, player.userId, categoryFilter)
    if (result.ok) {
      setPendingInvite({
        invitationId: result.invitationId,
        toUserId: player.userId,
        toPseudo: player.pseudo,
        sentAt: Date.now(),
      })
      toast({
        title: 'Défi envoyé',
        description: `En attente de la réponse de ${player.pseudo}…`,
      })
    } else {
      toast({ title: 'Défi impossible', description: result.error, variant: 'destructive' })
    }
  }

  async function abortInvite() {
    if (!pendingInvite) return
    await cancelInvite(token, pendingInvite.invitationId)
    setPendingInvite(null)
  }

  async function autoMatch() {
    const candidates = onlinePlayers.filter(p => p.status === 'AVAILABLE')
    if (!candidates.length) {
      toast({
        title: 'Aucun adversaire disponible',
        description: 'Ouvrez l’application dans un autre onglet avec un second compte pour tester.',
        variant: 'destructive',
      })
      return
    }
    setMatchmaking(true)
    // Adversaire de niveau proche, à défaut au hasard : un duel déséquilibré
    // est moins intéressant pour les deux joueurs.
    const sorted = [...candidates].sort(
      (a, b) => Math.abs(a.level - user.level) - Math.abs(b.level - user.level)
    )
    const pool = sorted.slice(0, Math.min(3, sorted.length))
    const opponent = pool[Math.floor(Math.random() * pool.length)]
    setTimeout(async () => {
      await invite(opponent)
      setMatchmaking(false)
    }, 600)
  }

  return (
    <div className="container mx-auto max-w-6xl px-3 sm:px-4">
      <div className="animate-in-up mb-5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Salon <span className="text-gradient">des joueurs</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Défiez un adversaire ou laissez le système vous en trouver un.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<Users className="h-4 w-4" />}
          value={onlinePlayers.length}
          label="Joueurs en ligne"
          tone="info"
        />
        <StatTile
          icon={<Target className="h-4 w-4" />}
          value={availableCount}
          label="Disponibles"
          tone="success"
        />
        <StatTile
          icon={<Trophy className="h-4 w-4" />}
          value={user.totalScore.toLocaleString('fr-FR')}
          label="Votre score"
          tone="primary"
        />
        <StatTile
          icon={<Flame className="h-4 w-4" />}
          value={`Niv. ${user.level}`}
          label={`${user.xp % 500} / 500 XP`}
          tone="violet"
        />
      </div>

      {/* Configuration de la partie */}
      <Card className="mb-4">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-sm font-medium" htmlFor="category">
                <Layers className="h-4 w-4 text-muted-foreground" /> Catégorie des questions
              </label>
              <Select
                value={categoryFilter || 'ALL'}
                onValueChange={v => setCategoryFilter(v === 'ALL' ? null : v)}
              >
                <SelectTrigger id="category" disabled={loadingCategories}>
                  <SelectValue placeholder="Chargement…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="ALL">
                    <span className="flex items-center gap-2">
                      <Shuffle className="h-3.5 w-3.5" /> Toutes catégories
                    </span>
                  </SelectItem>
                  {categories.map(c => (
                    // Une catégorie de moins de 4 questions ne permet pas de
                    // constituer une partie : on la rend inutilisable.
                    <SelectItem key={c.id} value={c.id} disabled={c.questionCount < 4}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.color || 'var(--primary)' }}
                        />
                        {c.name}
                        <span className="text-xs text-muted-foreground">({c.questionCount})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedCategory
                  ? `${selectedCategory.questionCount} questions dans « ${selectedCategory.name} »`
                  : `${categories.reduce((s, c) => s + c.questionCount, 0).toLocaleString('fr-FR')} questions disponibles`}
              </p>
            </div>

            <div className="flex items-end">
              <Button
                onClick={autoMatch}
                disabled={matchmaking || !connected || !!pendingInvite}
                size="lg"
                className="w-full gap-2 md:w-56"
              >
                {matchmaking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Recherche…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" /> Trouver un adversaire
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingInvite && (
        <Card className="animate-in-up mb-4 border-primary/40 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-semibold">Défi envoyé à {pendingInvite.toPseudo}</p>
                <p className="text-sm text-muted-foreground">
                  En attente de réponse — expire au bout d&apos;une minute.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={abortInvite} className="gap-1.5">
              <X className="h-3.5 w-3.5" /> Annuler
            </Button>
          </CardContent>
        </Card>
      )}

      {waitingOpponent && (
        <Card className="animate-in-up mb-4 border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-semibold">Défi accepté</p>
              <p className="text-sm text-muted-foreground">
                {waitingOpponent} prépare la partie, elle démarre dans un instant…
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des joueurs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Joueurs connectés</CardTitle>
              <CardDescription>Cliquez sur « Défier » pour lancer un duel.</CardDescription>
            </div>
            <ToggleGroup
              type="single"
              value={statusFilter}
              onValueChange={v => v && setStatusFilter(v as typeof statusFilter)}
              variant="outline"
              size="sm"
            >
              <ToggleGroupItem value="ALL">Tous</ToggleGroupItem>
              <ToggleGroupItem value="AVAILABLE">Disponibles</ToggleGroupItem>
              <ToggleGroupItem value="IN_GAME">En partie</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>

        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un pseudo ou un pays…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {!connected ? (
            <ListSkeleton rows={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title={
                onlinePlayers.length === 0
                  ? 'Vous êtes seul dans le salon'
                  : 'Aucun joueur ne correspond à votre recherche'
              }
              description={
                onlinePlayers.length === 0
                  ? 'Ouvrez l’application dans une fenêtre de navigation privée avec le compte player@demo.fr pour tester un duel.'
                  : 'Modifiez le filtre ou effacez la recherche.'
              }
              action={
                search || statusFilter !== 'ALL' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearch('')
                      setStatusFilter('ALL')
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {filtered.map(p => {
                const busy = p.status !== 'AVAILABLE'
                return (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <PlayerAvatar name={p.pseudo} src={p.avatarUrl} status={p.status} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{p.pseudo}</p>
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            Niv. {p.level}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.country} · {busy ? 'En partie' : 'Disponible'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={busy ? 'secondary' : 'default'}
                      disabled={busy || !!pendingInvite}
                      onClick={() => invite(p)}
                      className="shrink-0 gap-1.5"
                    >
                      <Swords className="h-4 w-4" />
                      <span className="hidden sm:inline">Défier</span>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {prepare && <GamePrepareModal opponent={prepare} onClose={() => setPrepare(null)} />}
    </div>
  )
}
