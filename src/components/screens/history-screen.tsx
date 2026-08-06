'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { StatTile } from '@/components/ui/stat-tile'
import { EmptyState, ErrorState, ListSkeleton, StatsSkeleton } from '@/components/ui/states'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  History, Trophy, Target, Clock, Percent, Calendar, Flag, ChevronRight, Bot,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const MENTION_LABELS: Record<string, string> = {
  EXCELLENT: 'Félicitations du jury',
  TRES_BIEN: 'Très bien',
  BIEN: 'Bien',
  ASSEZ_BIEN: 'Assez bien',
  PASSABLE: 'Passable',
}

interface GameRow {
  id: string
  date: string
  mode: 'DUEL' | 'SOLO' | 'EXAM'
  botProfile: string | null
  examLevel: string | null
  passed: boolean | null
  mention: string | null
  outcome: 'WIN' | 'LOSS' | 'DRAW'
  forfeit: boolean
  categoryFilter: string | null
  totalQuestions: number
  myQuestions: number
  myScore: number
  oppScore: number
  myCorrect: number
  oppCorrect: number
  myAvgTime: number
  opponent: { id: string; pseudo: string; avatarUrl: string | null; country: string; level: number }
}

interface Stats {
  total: number
  /** Parties disputées contre un adversaire : duels et solo, hors examens. */
  matches: number
  duels: number
  solo: number
  wins: number
  losses: number
  draws: number
  winRate: number
  exams: { taken: number; passed: number }
  accuracy: number
  avgTime: number
  bestScore: number
}

export function HistoryScreen() {
  const token = useApp(s => s.token)!
  const setView = useApp(s => s.setView)
  const [games, setGames] = useState<GameRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'DRAW'>('ALL')
  const [modeFilter, setModeFilter] = useState<'ALL' | 'DUEL' | 'SOLO' | 'EXAM'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [gamesRes, catsRes] = await Promise.all([
        fetch('/api/games/history', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/categories'),
      ])
      const gamesData = await gamesRes.json()
      if (!gamesRes.ok) throw new Error(gamesData.error || 'Chargement impossible')
      setGames(gamesData.games || [])
      setStats(gamesData.stats || null)

      const catsData = await catsRes.json()
      const map: Record<string, string> = {}
      for (const c of catsData.categories || []) map[c.id] = c.name
      setCategories(map)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(
    () =>
      games
        .filter(g => modeFilter === 'ALL' || g.mode === modeFilter)
        .filter(g => filter === 'ALL' || g.outcome === filter),
    [games, filter, modeFilter]
  )

  return (
    <div className="container mx-auto max-w-4xl px-3 sm:px-4">
      <div className="animate-in-up mb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          <span className="text-gradient">Historique</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {stats ? `${stats.total} partie${stats.total > 1 ? 's' : ''} disputée${stats.total > 1 ? 's' : ''}` : 'Vos résultats'}
        </p>
      </div>

      {loading ? (
        <StatsSkeleton />
      ) : stats && stats.total > 0 ? (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            icon={<Percent className="h-4 w-4" />}
            value={`${stats.winRate}%`}
            label="Taux de victoire"
            hint={`${stats.wins}V · ${stats.losses}D · ${stats.draws}N — hors examens`}
            tone="success"
          />
          <StatTile
            icon={<Target className="h-4 w-4" />}
            value={`${stats.accuracy}%`}
            label="Bonnes réponses"
            tone="info"
          />
          {stats.exams.taken > 0 ? (
            <StatTile
              icon={<GraduationCap className="h-4 w-4" />}
              value={`${stats.exams.passed}/${stats.exams.taken}`}
              label="Examens réussis"
              hint={`${stats.solo} partie${stats.solo > 1 ? 's' : ''} solo`}
              tone="violet"
            />
          ) : (
            <StatTile
              icon={<Clock className="h-4 w-4" />}
              value={stats.avgTime > 0 ? `${(stats.avgTime / 1000).toFixed(1)}s` : '—'}
              label="Temps de réponse moyen"
              tone="violet"
            />
          )}
          <StatTile
            icon={<Trophy className="h-4 w-4" />}
            value={stats.bestScore.toLocaleString('fr-FR')}
            label="Meilleur score"
            tone="primary"
          />
        </div>
      ) : null}

      {games.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <ToggleGroup
            type="single"
            value={modeFilter}
            onValueChange={v => v && setModeFilter(v as typeof modeFilter)}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <ToggleGroupItem value="ALL">Tous les modes</ToggleGroupItem>
            <ToggleGroupItem value="DUEL">Duels ({stats?.duels ?? 0})</ToggleGroupItem>
            <ToggleGroupItem value="SOLO">Solo ({stats?.solo ?? 0})</ToggleGroupItem>
            <ToggleGroupItem value="EXAM">Examens ({stats?.exams.taken ?? 0})</ToggleGroupItem>
          </ToggleGroup>

          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={v => v && setFilter(v as typeof filter)}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <ToggleGroupItem value="ALL">Tous</ToggleGroupItem>
            <ToggleGroupItem value="WIN">Gagnées ({stats?.wins ?? 0})</ToggleGroupItem>
            <ToggleGroupItem value="LOSS">Perdues ({stats?.losses ?? 0})</ToggleGroupItem>
            <ToggleGroupItem value="DRAW">Nuls ({stats?.draws ?? 0})</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {loading ? (
        <ListSkeleton rows={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<History className="h-7 w-7" />}
          title={games.length === 0 ? 'Aucune partie jouée' : 'Aucune partie dans ce filtre'}
          description={
            games.length === 0
              ? 'Vos duels apparaîtront ici dès votre première partie terminée.'
              : 'Choisissez un autre filtre pour voir vos autres résultats.'
          }
          action={
            games.length === 0 ? (
              <Button onClick={() => setView('lobby')} className="gap-2">
                <ChevronRight className="h-4 w-4" /> Aller au salon
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setFilter('ALL')}>
                Voir toutes les parties
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map(g => {
            const won = g.outcome === 'WIN'
            const lost = g.outcome === 'LOSS'
            const date = new Date(g.date)
            return (
              <Card
                key={g.id}
                className={cn(
                  'overflow-hidden transition-shadow hover:shadow-md',
                  won && 'border-l-4 border-l-emerald-500',
                  lost && 'border-l-4 border-l-destructive',
                  !won && !lost && 'border-l-4 border-l-muted-foreground/40'
                )}
              >
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <PlayerAvatar
                      name={g.opponent.pseudo}
                      src={g.opponent.avatarUrl}
                      className="h-10 w-10 text-xs"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-semibold">
                          {g.mode === 'EXAM' ? g.opponent.pseudo : `vs ${g.opponent.pseudo}`}
                        </p>
                        <Badge
                          variant={won ? 'default' : lost ? 'destructive' : 'secondary'}
                          className={cn('text-[10px]', won && 'bg-emerald-500 hover:bg-emerald-500')}
                        >
                          {/* Un examen se solde par un verdict, pas par une
                              victoire : « Défaite » face à un jury n'a pas de sens. */}
                          {g.mode === 'EXAM'
                            ? won
                              ? 'Reçu'
                              : 'Ajourné'
                            : won
                              ? 'Victoire'
                              : lost
                                ? 'Défaite'
                                : 'Nul'}
                        </Badge>
                        {g.mode === 'SOLO' && (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <Bot className="h-2.5 w-2.5" /> Solo
                          </Badge>
                        )}
                        {g.mode === 'EXAM' && g.mention && won && (
                          <Badge variant="outline" className="text-[10px]">
                            {MENTION_LABELS[g.mention] ?? g.mention}
                          </Badge>
                        )}
                        {g.forfeit && (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <Flag className="h-2.5 w-2.5" /> Abandon
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {date.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>
                          {g.categoryFilter
                            ? (categories[g.categoryFilter] ?? 'Catégorie')
                            : 'Toutes catégories'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={cn(
                        'text-lg font-black tabular-nums',
                        won && 'text-emerald-600 dark:text-emerald-400',
                        lost && 'text-destructive'
                      )}
                    >
                      {g.myScore} – {g.oppScore}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {g.myCorrect}/{g.myQuestions} bonnes réponses
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
