'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { StatTile } from '@/components/ui/stat-tile'
import { EmptyState, ErrorState, ListSkeleton, StatsSkeleton } from '@/components/ui/states'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Users, FileQuestion, Tags, BarChart3, Trash2, Pencil, Plus, Upload, ShieldBan,
  ShieldCheck, Search, Loader2, Activity, TrendingUp, Radio, Save, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Headers = Record<string, string>

export function AdminScreen() {
  const token = useApp(s => s.token)!
  const user = useApp(s => s.user)!
  const setView = useApp(s => s.setView)

  const headers = useMemo<Headers>(
    () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }),
    [token]
  )

  if (user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto max-w-lg px-4">
        <Card>
          <CardContent className="p-10 text-center">
            <ShieldBan className="mx-auto mb-3 h-12 w-12 text-destructive" />
            <h2 className="text-xl font-bold">Accès refusé</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cette section est réservée aux administrateurs.
            </p>
            <Button onClick={() => setView('lobby')} className="mt-5">
              Retour au salon
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-3 sm:px-4">
      <div className="animate-in-up mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Administration</h1>
          <p className="text-sm text-muted-foreground">Pilotez la plateforme et son contenu.</p>
        </div>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="mb-4 grid w-full grid-cols-4">
          <TabsTrigger value="stats" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Statistiques</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Joueurs</span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-1.5">
            <FileQuestion className="h-4 w-4" />
            <span className="hidden sm:inline">Questions</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <Tags className="h-4 w-4" />
            <span className="hidden sm:inline">Catégories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <StatsTab headers={headers} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab headers={headers} currentUserId={user.id} />
        </TabsContent>
        <TabsContent value="questions">
          <QuestionsTab headers={headers} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab headers={headers} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Statistiques
// ---------------------------------------------------------------------------

function StatsTab({ headers }: { headers: Headers }) {
  const [stats, setStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/admin/stats', { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chargement impossible')
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    }
  }, [headers])

  useEffect(() => {
    void load()
  }, [load])

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!stats) return <StatsSkeleton count={4} />

  const maxDayGames = Math.max(1, ...stats.activity.map((a: any) => a.games))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<Users className="h-4 w-4" />}
          value={stats.totalPlayers}
          label="Joueurs inscrits"
          hint={`+${stats.newPlayersThisWeek} cette semaine`}
          tone="info"
        />
        <StatTile
          icon={<Activity className="h-4 w-4" />}
          value={stats.totalGames}
          label="Parties jouées"
          hint={`+${stats.gamesThisWeek} cette semaine`}
          tone="success"
        />
        <StatTile
          icon={<FileQuestion className="h-4 w-4" />}
          value={stats.totalQuestions.toLocaleString('fr-FR')}
          label="Questions"
          hint={`${stats.totalCategories} catégories`}
          tone="violet"
        />
        <StatTile
          icon={<Radio className="h-4 w-4" />}
          value={stats.realtime.onlinePlayers}
          label="En ligne maintenant"
          hint={`${stats.realtime.activeGames} partie(s) en cours`}
          tone="primary"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Activité sur 14 jours */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Parties sur 14 jours</CardTitle>
            <CardDescription>Volume quotidien de duels terminés</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.activity.every((a: any) => a.games === 0) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune partie sur la période.
              </p>
            ) : (
              <div className="flex h-32 items-end gap-1">
                {stats.activity.map((a: any) => (
                  <div key={a.date} className="group relative flex flex-1 flex-col justify-end">
                    <div
                      className="rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                      style={{ height: `${(a.games / maxDayGames) * 100}%`, minHeight: a.games ? 4 : 1 }}
                    />
                    {/* Info-bulle native : pas de dépendance supplémentaire */}
                    <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-1.5 py-0.5 text-[10px] opacity-0 shadow transition-opacity group-hover:opacity-100">
                      {a.games} le {new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition par difficulté */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Répartition par difficulté</CardTitle>
            <CardDescription>Composition de la banque de questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.difficultyBreakdown.map((d: any) => {
              const label = { EASY: 'Facile', MEDIUM: 'Moyen', HARD: 'Difficile' }[
                d.difficulty as string
              ]
              const pct = stats.totalQuestions ? (d.count / stats.totalQuestions) * 100 : 0
              const tone =
                d.difficulty === 'EASY'
                  ? 'bg-emerald-500'
                  : d.difficulty === 'MEDIUM'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
              return (
                <div key={d.difficulty}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {d.count} ({Math.round(pct)} %)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Catégories les plus jouées</CardTitle>
          <CardDescription>
            Le taux de réussite n&apos;apparaît qu&apos;une fois les questions réellement jouées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topCategories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune donnée.</p>
          ) : (
            <div className="space-y-1.5">
              {stats.topCategories.map((c: any) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-accent/40"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color || 'var(--primary)' }}
                    />
                    <span className="truncate text-sm font-medium">{c.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs">
                    <span className="text-muted-foreground">{c.questions} questions</span>
                    <span className="text-muted-foreground">{c.answered} réponses</span>
                    <Badge variant="outline" className="tabular-nums">
                      {c.successRate === null ? '—' : `${c.successRate} %`}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <QuestionRanking
          title="Questions les plus difficiles"
          description="Au moins 3 réponses enregistrées"
          items={stats.hardest}
          tone="danger"
        />
        <QuestionRanking
          title="Questions les plus faciles"
          description="Au moins 3 réponses enregistrées"
          items={stats.easiest}
          tone="success"
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Meilleurs joueurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {stats.topPlayers.map((p: any, i: number) => (
            <div key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
              <span className="w-5 text-center text-sm font-bold text-muted-foreground">
                {i + 1}
              </span>
              <PlayerAvatar name={p.pseudo} className="h-8 w-8 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.pseudo}</p>
                <p className="text-xs text-muted-foreground">
                  {p.country} · Niv. {p.level}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-primary">
                {p.totalScore.toLocaleString('fr-FR')}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function QuestionRanking({
  title, description, items, tone,
}: {
  title: string
  description: string
  items: any[]
  tone: 'danger' | 'success'
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Pas encore assez de parties jouées.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((q: any) => (
              <div
                key={q.id}
                className={cn(
                  'rounded-lg p-2.5 text-sm',
                  tone === 'danger' ? 'bg-destructive/8' : 'bg-emerald-500/8'
                )}
              >
                <p className="line-clamp-2 font-medium">{q.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {q.category} · {q.successRate} % de réussite sur {q.timesAnswered} réponses
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Joueurs
// ---------------------------------------------------------------------------

function UsersTab({ headers, currentUserId }: { headers: Headers; currentUserId: string }) {
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<any>(null)

  const load = useCallback(
    async (q = '') => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { headers })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Chargement impossible')
        setUsers(data.users || [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    },
    [headers]
  )

  useEffect(() => {
    void load()
  }, [load])

  // Recherche différée : évite une requête par frappe clavier.
  useEffect(() => {
    const id = setTimeout(() => void load(search), 350)
    return () => clearTimeout(id)
  }, [search, load])

  async function patch(id: string, body: object, successMessage: string) {
    const res = await fetch(`/api/admin/users?id=${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      toast({ title: 'Action refusée', description: data.error, variant: 'destructive' })
      return
    }
    setUsers(list => list.map(u => (u.id === id ? { ...u, ...data.user } : u)))
    toast({ title: successMessage })
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE', headers })
    const data = await res.json()
    if (!res.ok) {
      toast({ title: 'Suppression refusée', description: data.error, variant: 'destructive' })
      return
    }
    setUsers(list => list.filter(u => u.id !== id))
    toast({ title: 'Joueur supprimé' })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Joueurs ({users.length})</CardTitle>
        <CardDescription>Rôles, suspensions et suppression de comptes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par pseudo, e-mail ou nom…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <ListSkeleton rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => load(search)} />
        ) : users.length === 0 ? (
          <EmptyState icon={<Users className="h-7 w-7" />} title="Aucun joueur trouvé" />
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {users.map(u => {
              const isSelf = u.id === currentUserId
              return (
                <div
                  key={u.id}
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3',
                    u.banned && 'border-destructive/40 bg-destructive/5'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <PlayerAvatar name={u.pseudo} src={u.avatarUrl} className="h-10 w-10 text-xs" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-semibold">{u.pseudo}</p>
                        {u.role === 'ADMIN' && (
                          <Badge className="text-[10px]">Admin</Badge>
                        )}
                        {u.banned && (
                          <Badge variant="destructive" className="text-[10px]">
                            Suspendu
                          </Badge>
                        )}
                        {isSelf && (
                          <Badge variant="outline" className="text-[10px]">
                            Vous
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {u.country} · Niv. {u.level} · {u.gamesPlayed} parties ·{' '}
                        {u.totalScore.toLocaleString('fr-FR')} pts
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs">
                      <Switch
                        checked={u.role === 'ADMIN'}
                        disabled={isSelf}
                        onCheckedChange={checked =>
                          patch(
                            u.id,
                            { role: checked ? 'ADMIN' : 'USER' },
                            checked ? 'Rôle administrateur accordé' : 'Rôle administrateur retiré'
                          )
                        }
                      />
                      Admin
                    </label>
                    <Button
                      variant={u.banned ? 'outline' : 'ghost'}
                      size="sm"
                      disabled={isSelf}
                      onClick={() =>
                        patch(
                          u.id,
                          { banned: !u.banned },
                          u.banned ? 'Compte réactivé' : 'Compte suspendu'
                        )
                      }
                      className="gap-1.5"
                    >
                      <ShieldBan className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{u.banned ? 'Réactiver' : 'Suspendre'}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isSelf}
                      onClick={() => setToDelete(u)}
                      className="h-8 w-8 text-destructive"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <AlertDialog open={!!toDelete} onOpenChange={open => !open && setToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer {toDelete?.pseudo} ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le compte, son historique de parties, ses notifications et ses succès seront
                définitivement supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (toDelete) void remove(toDelete.id)
                  setToDelete(null)
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

const EMPTY_QUESTION = {
  text: '',
  propositionA: '',
  propositionB: '',
  propositionC: '',
  propositionD: '',
  correctAnswer: 'A' as 'A' | 'B' | 'C' | 'D',
  explanation: '',
  difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
  categoryId: '',
}

function QuestionsTab({ headers }: { headers: Headers }) {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [toDelete, setToDelete] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (categoryId !== 'ALL') params.set('categoryId', categoryId)
      const res = await fetch(`/api/admin/questions?${params}`, { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chargement impossible')
      setQuestions(data.questions || [])
      setTotal(data.total || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [headers, search, categoryId])

  useEffect(() => {
    fetch('/api/admin/categories', { headers })
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => setCategories([]))
  }, [headers])

  useEffect(() => {
    const id = setTimeout(() => void load(), 300)
    return () => clearTimeout(id)
  }, [load])

  async function remove(id: string) {
    const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE', headers })
    const data = await res.json()
    if (!res.ok) {
      toast({ title: 'Suppression refusée', description: data.error, variant: 'destructive' })
      return
    }
    setQuestions(list => list.filter(q => q.id !== id))
    setTotal(t => t - 1)
    toast({ title: 'Question supprimée' })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              Questions ({questions.length} affichées sur {total})
            </CardTitle>
            <CardDescription>Créez, modifiez et importez des questions.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="gap-1.5">
              <Upload className="h-4 w-4" /> Importer
            </Button>
            <Button
              size="sm"
              onClick={() =>
                setEditing({ ...EMPTY_QUESTION, categoryId: categories[0]?.id || '' })
              }
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" /> Nouvelle
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans les énoncés…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="ALL">Toutes les catégories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.questionCount})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <ListSkeleton rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : questions.length === 0 ? (
          <EmptyState icon={<FileQuestion className="h-7 w-7" />} title="Aucune question trouvée" />
        ) : (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {questions.map(q => (
              <div key={q.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{q.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Réponse {q.correctAnswer} :{' '}
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {q[`proposition${q.correctAnswer}`]}
                    </span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {q.category?.name}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {{ EASY: 'Facile', MEDIUM: 'Moyen', HARD: 'Difficile' }[q.difficulty as string]}
                    </Badge>
                    {q.timesAnswered > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {Math.round((q.timesCorrect / q.timesAnswered) * 100)} % de réussite
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditing({ ...q, categoryId: q.categoryId, explanation: q.explanation || '' })}
                    aria-label="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setToDelete(q)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <QuestionDialog
            headers={headers}
            categories={categories}
            question={editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              void load()
            }}
          />
        )}

        {importOpen && (
          <ImportDialog
            headers={headers}
            categories={categories}
            onClose={() => setImportOpen(false)}
            onImported={() => {
              setImportOpen(false)
              void load()
            }}
          />
        )}

        <AlertDialog open={!!toDelete} onOpenChange={open => !open && setToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette question ?</AlertDialogTitle>
              <AlertDialogDescription className="line-clamp-3">
                « {toDelete?.text} »
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (toDelete) void remove(toDelete.id)
                  setToDelete(null)
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

function QuestionDialog({
  headers, categories, question, onClose, onSaved,
}: {
  headers: Headers
  categories: any[]
  question: any
  onClose: () => void
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({ ...question })
  const [saving, setSaving] = useState(false)
  const isEdit = !!question.id

  async function save() {
    setSaving(true)
    try {
      const payload = {
        text: form.text,
        propositionA: form.propositionA,
        propositionB: form.propositionB,
        propositionC: form.propositionC,
        propositionD: form.propositionD,
        correctAnswer: form.correctAnswer,
        explanation: form.explanation || null,
        difficulty: form.difficulty,
        categoryId: form.categoryId,
      }
      const res = await fetch(
        isEdit ? `/api/admin/questions?id=${question.id}` : '/api/admin/questions',
        { method: isEdit ? 'PATCH' : 'POST', headers, body: JSON.stringify(payload) }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: isEdit ? 'Question modifiée' : 'Question créée' })
      onSaved()
    } catch (e) {
      toast({
        title: 'Enregistrement impossible',
        description: e instanceof Error ? e.message : 'Erreur inconnue',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier la question' : 'Nouvelle question'}</DialogTitle>
          <DialogDescription>
            Les quatre propositions doivent être distinctes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="q-text">Énoncé</Label>
            <Textarea
              id="q-text"
              rows={2}
              value={form.text}
              onChange={e => setForm({ ...form, text: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(['A', 'B', 'C', 'D'] as const).map(letter => (
              <div key={letter} className="space-y-2">
                <Label htmlFor={`q-${letter}`} className="flex items-center gap-2">
                  Proposition {letter}
                  {form.correctAnswer === letter && (
                    <Badge className="bg-emerald-500 text-[10px] hover:bg-emerald-500">
                      Bonne réponse
                    </Badge>
                  )}
                </Label>
                <Input
                  id={`q-${letter}`}
                  value={form[`proposition${letter}`] || ''}
                  onChange={e => setForm({ ...form, [`proposition${letter}`]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Bonne réponse</Label>
              <Select
                value={form.correctAnswer}
                onValueChange={v => setForm({ ...form, correctAnswer: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['A', 'B', 'C', 'D'] as const).map(l => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulté</Label>
              <Select
                value={form.difficulty}
                onValueChange={v => setForm({ ...form, difficulty: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Facile</SelectItem>
                  <SelectItem value="MEDIUM">Moyen</SelectItem>
                  <SelectItem value="HARD">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={form.categoryId}
                onValueChange={v => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-explanation">Explication (facultative)</Label>
            <Textarea
              id="q-explanation"
              rows={2}
              value={form.explanation || ''}
              onChange={e => setForm({ ...form, explanation: e.target.value })}
              placeholder="Affichée aux joueurs après la réponse."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const IMPORT_EXAMPLE = `[
  {
    "text": "Quelle est la capitale du Portugal ?",
    "propositionA": "Porto",
    "propositionB": "Lisbonne",
    "propositionC": "Faro",
    "propositionD": "Braga",
    "correctAnswer": "B",
    "difficulty": "EASY",
    "explanation": "Lisbonne est la capitale depuis 1255."
  }
]`

function ImportDialog({
  headers, categories, onClose, onImported,
}: {
  headers: Headers
  categories: any[]
  onClose: () => void
  onImported: () => void
}) {
  const { toast } = useToast()
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [raw, setRaw] = useState('')
  const [importing, setImporting] = useState(false)

  async function run() {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      toast({
        title: 'JSON invalide',
        description: 'Vérifiez la syntaxe du tableau collé.',
        variant: 'destructive',
      })
      return
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      toast({ title: 'Un tableau non vide est attendu', variant: 'destructive' })
      return
    }

    setImporting(true)
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers,
        body: JSON.stringify({ categoryId, questions: parsed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({
        title: `${data.imported} question(s) importée(s)`,
        description:
          data.rejected > 0
            ? `${data.rejected} ligne(s) ignorée(s) (doublon ou propositions identiques).`
            : undefined,
      })
      onImported()
    } catch (e) {
      toast({
        title: 'Import impossible',
        description: e instanceof Error ? e.message : 'Erreur inconnue',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des questions</DialogTitle>
          <DialogDescription>
            Collez un tableau JSON. Les doublons d&apos;énoncé sont ignorés automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Catégorie de destination</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="import-json">Données JSON</Label>
              <Button variant="ghost" size="sm" onClick={() => setRaw(IMPORT_EXAMPLE)}>
                Insérer un exemple
              </Button>
            </div>
            <Textarea
              id="import-json"
              rows={12}
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder={IMPORT_EXAMPLE}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="text-muted-foreground">
              Champs requis : <code>text</code>, <code>propositionA</code> à{' '}
              <code>propositionD</code>, <code>correctAnswer</code> (A–D). Facultatifs :{' '}
              <code>difficulty</code> (EASY, MEDIUM, HARD) et <code>explanation</code>.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={run} disabled={importing || !categoryId || !raw.trim()} className="gap-2">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------------

function CategoriesTab({ headers }: { headers: Headers }) {
  const { toast } = useToast()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<any>(null)
  const [toDelete, setToDelete] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/categories', { headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chargement impossible')
      setCategories(data.categories || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [headers])

  useEffect(() => {
    void load()
  }, [load])

  async function save(form: any) {
    const isEdit = !!form.id
    const res = await fetch(
      isEdit ? `/api/admin/categories?id=${form.id}` : '/api/admin/categories',
      {
        method: isEdit ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          icon: form.icon || null,
          color: form.color || null,
        }),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      toast({ title: 'Enregistrement impossible', description: data.error, variant: 'destructive' })
      return
    }
    toast({ title: isEdit ? 'Catégorie modifiée' : 'Catégorie créée' })
    setEditing(null)
    void load()
  }

  async function remove(category: any, force: boolean) {
    const res = await fetch(
      `/api/admin/categories?id=${category.id}${force ? '&force=true' : ''}`,
      { method: 'DELETE', headers }
    )
    const data = await res.json()
    if (!res.ok) {
      toast({ title: 'Suppression refusée', description: data.error, variant: 'destructive' })
      return
    }
    toast({
      title: 'Catégorie supprimée',
      description: data.deletedQuestions
        ? `${data.deletedQuestions} question(s) supprimée(s) avec elle.`
        : undefined,
    })
    void load()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Catégories ({categories.length})</CardTitle>
            <CardDescription>Thématiques proposées dans le salon.</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setEditing({ name: '', description: '', icon: '', color: '#f97316' })}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> Nouvelle
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <ListSkeleton rows={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : categories.length === 0 ? (
          <EmptyState icon={<Tags className="h-7 w-7" />} title="Aucune catégorie" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-9 w-9 shrink-0 rounded-xl"
                    style={{ backgroundColor: (c.color || '#f97316') + '26' }}
                  >
                    <span
                      className="m-[0.7rem] block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: c.color || '#f97316' }}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.questionCount} question{c.questionCount > 1 ? 's' : ''}
                      {c.description ? ` · ${c.description}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditing({ ...c })}
                    aria-label="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setToDelete(c)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <Dialog open onOpenChange={open => !open && setEditing(null)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editing.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="c-name">Nom</Label>
                  <Input
                    id="c-name"
                    value={editing.name}
                    onChange={e => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-desc">Description</Label>
                  <Input
                    id="c-desc"
                    value={editing.description || ''}
                    onChange={e => setEditing({ ...editing, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="c-icon">Icône (nom Lucide)</Label>
                    <Input
                      id="c-icon"
                      placeholder="BookOpen"
                      value={editing.icon || ''}
                      onChange={e => setEditing({ ...editing, icon: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-color">Couleur</Label>
                    <div className="flex gap-2">
                      <Input
                        id="c-color"
                        type="color"
                        className="h-9 w-14 p-1"
                        value={editing.color || '#f97316'}
                        onChange={e => setEditing({ ...editing, color: e.target.value })}
                      />
                      <Input
                        value={editing.color || ''}
                        placeholder="#f97316"
                        onChange={e => setEditing({ ...editing, color: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Annuler
                </Button>
                <Button onClick={() => save(editing)} className="gap-2">
                  <Save className="h-4 w-4" /> Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <AlertDialog open={!!toDelete} onOpenChange={open => !open && setToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer « {toDelete?.name} » ?</AlertDialogTitle>
              <AlertDialogDescription>
                {toDelete?.questionCount > 0
                  ? `Cette catégorie contient ${toDelete.questionCount} question(s), qui seront supprimées avec elle.`
                  : 'Cette catégorie ne contient aucune question.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (toDelete) void remove(toDelete, toDelete.questionCount > 0)
                  setToDelete(null)
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
