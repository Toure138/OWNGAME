'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states'
import { Crown, Medal, Award, TrendingUp, Globe2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const SCOPES = [
  { id: 'global', label: 'Mondial' },
  { id: 'national', label: 'National' },
  { id: 'weekly', label: 'Hebdo' },
  { id: 'monthly', label: 'Mensuel' },
  { id: 'yearly', label: 'Annuel' },
] as const

/** Abréviation du diplôme, telle qu'on la porte à côté d'un nom. */
const DEGREE_SHORT: Record<string, string> = {
  CEP: 'CEP',
  BEPC: 'BEPC',
  BAC: 'Bac',
  LICENCE: 'Licence',
  MASTER: 'Master',
  DOCTORAT: 'Dr',
}

interface Entry {
  id: string
  pseudo: string
  avatarUrl: string | null
  country: string
  level: number
  highestDegree: string | null
  totalScore: number
  wins: number
  losses: number
  gamesPlayed: number
  winRate: number
}

export function LeaderboardScreen() {
  const token = useApp(s => s.token)!
  const user = useApp(s => s.user)!
  const [scope, setScope] = useState<string>('global')
  const [players, setPlayers] = useState<Entry[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/leaderboard?scope=${scope}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chargement impossible')
      setPlayers(data.players || [])
      setMyRank(data.myRank ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [scope, token])

  useEffect(() => {
    void load()
  }, [load])

  const podium = players.slice(0, 3)
  const rest = players.slice(3)
  const periodScope = ['weekly', 'monthly', 'yearly'].includes(scope)

  return (
    <div className="container mx-auto max-w-4xl px-3 sm:px-4">
      <div className="animate-in-up mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-gradient">Classement</span>
          </h1>
          <p className="text-sm text-muted-foreground">Les meilleurs joueurs de la plateforme.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={load} aria-label="Actualiser">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      <Tabs value={scope} onValueChange={setScope} className="mb-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
          {SCOPES.map(s => (
            <TabsTrigger key={s.id} value={s.id} className="text-xs sm:text-sm">
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {myRank !== null && (
        <Card className="ring-gradient mb-4">
          <CardContent className="flex items-center justify-between gap-3 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
                #{myRank}
              </div>
              <div className="min-w-0">
                <p className="font-semibold">Votre position</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.pseudo} · {user.totalScore.toLocaleString('fr-FR')} pts
                </p>
              </div>
            </div>
            <Badge variant="secondary">Niveau {user.level}</Badge>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <ListSkeleton rows={8} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : players.length === 0 ? (
        <EmptyState
          icon={<Globe2 className="h-7 w-7" />}
          title="Classement vide"
          description={
            periodScope
              ? 'Aucune partie terminée sur cette période. Lancez un duel pour y figurer.'
              : 'Aucun joueur classé pour le moment.'
          }
        />
      ) : (
        <>
          {/* Podium — affiché seulement quand il y a au moins trois joueurs */}
          {podium.length === 3 && (
            <div className="mb-5 grid grid-cols-3 items-end gap-2 sm:gap-3">
              <PodiumStep entry={podium[1]} rank={2} isMe={podium[1].id === user.id} />
              <PodiumStep entry={podium[0]} rank={1} isMe={podium[0].id === user.id} />
              <PodiumStep entry={podium[2]} rank={3} isMe={podium[2].id === user.id} />
            </div>
          )}

          <Card>
            <CardContent className="space-y-1 p-2 sm:p-3">
              {(podium.length === 3 ? rest : players).map((p, i) => {
                const rank = (podium.length === 3 ? 4 : 1) + i
                const isMe = p.id === user.id
                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl p-2.5 transition-colors',
                      isMe ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-accent/40'
                    )}
                  >
                    <span className="w-8 shrink-0 text-center text-sm font-bold tabular-nums text-muted-foreground">
                      {rank}
                    </span>
                    <PlayerAvatar name={p.pseudo} src={p.avatarUrl} className="h-9 w-9 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate font-semibold">
                        <span className="truncate">{p.pseudo}</span>
                        {p.highestDegree && (
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {DEGREE_SHORT[p.highestDegree] ?? p.highestDegree}
                          </Badge>
                        )}
                        {isMe && <span className="text-xs font-normal text-primary">(vous)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.country} · Niv. {p.level} · {p.winRate}% de victoires
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold tabular-nums text-primary">
                        {p.totalScore.toLocaleString('fr-FR')}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.wins}V · {p.losses}D
                      </p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {periodScope && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Scores cumulés sur les parties terminées de la période.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function PodiumStep({ entry, rank, isMe }: { entry: Entry; rank: number; isMe?: boolean }) {
  const styles: Record<number, { height: string; icon: React.ReactNode; ring: string }> = {
    1: {
      height: 'h-28',
      icon: <Crown className="h-5 w-5 text-amber-500" />,
      ring: 'ring-2 ring-amber-400',
    },
    2: {
      height: 'h-24',
      icon: <Medal className="h-5 w-5 text-slate-400" />,
      ring: 'ring-2 ring-slate-300',
    },
    3: {
      height: 'h-20',
      icon: <Award className="h-5 w-5 text-amber-700" />,
      ring: 'ring-2 ring-amber-700/50',
    },
  }
  const style = styles[rank]

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1.5">{style.icon}</div>
      <PlayerAvatar
        name={entry.pseudo}
        src={entry.avatarUrl}
        className={cn(rank === 1 ? 'h-14 w-14' : 'h-12 w-12', style.ring)}
      />
      <p className="mt-1.5 w-full truncate px-1 text-center text-xs font-semibold sm:text-sm">
        {entry.pseudo}
        {isMe && <span className="text-primary"> (vous)</span>}
      </p>
      <p className="text-xs font-bold tabular-nums text-primary">
        {entry.totalScore.toLocaleString('fr-FR')}
      </p>
      <div
        className={cn(
          'mt-1.5 flex w-full items-start justify-center rounded-t-xl pt-2 text-lg font-black text-muted-foreground',
          style.height,
          rank === 1 ? 'bg-amber-500/15' : rank === 2 ? 'bg-slate-400/15' : 'bg-amber-700/15'
        )}
      >
        {rank}
      </div>
    </div>
  )
}
