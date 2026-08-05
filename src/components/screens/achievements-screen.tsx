'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/ui/states'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Trophy, Medal, Star, Zap, Flame, Crown, Target, Award, Lock, Sparkles, Timer, Swords,
  Scroll, GraduationCap, BookOpen, Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AchievementRow {
  code: string
  name: string
  description: string
  unlocked: boolean
  unlockedAt: string | null
}

// Icône et teinte par succès : un mur d'icônes identiques serait illisible.
const VISUALS: Record<string, { icon: React.ReactNode; tone: string }> = {
  FIRST_GAME: { icon: <Swords className="h-7 w-7" />, tone: 'text-sky-500' },
  FIRST_WIN: { icon: <Trophy className="h-7 w-7" />, tone: 'text-amber-500' },
  FIVE_WINS: { icon: <Medal className="h-7 w-7" />, tone: 'text-amber-500' },
  TEN_WINS: { icon: <Award className="h-7 w-7" />, tone: 'text-orange-500' },
  TWENTY_FIVE_WINS: { icon: <Crown className="h-7 w-7" />, tone: 'text-orange-600' },
  LEVEL_5: { icon: <Star className="h-7 w-7" />, tone: 'text-violet-500' },
  LEVEL_10: { icon: <Star className="h-7 w-7" />, tone: 'text-violet-600' },
  LEVEL_20: { icon: <Sparkles className="h-7 w-7" />, tone: 'text-fuchsia-500' },
  PERFECT_GAME: { icon: <Target className="h-7 w-7" />, tone: 'text-emerald-500' },
  STREAK_5: { icon: <Flame className="h-7 w-7" />, tone: 'text-orange-500' },
  SPEEDSTER: { icon: <Zap className="h-7 w-7" />, tone: 'text-yellow-500' },
  CENTURION: { icon: <Timer className="h-7 w-7" />, tone: 'text-teal-500' },
  FIRST_DIPLOMA: { icon: <Scroll className="h-7 w-7" />, tone: 'text-emerald-500' },
  BACHELIER: { icon: <GraduationCap className="h-7 w-7" />, tone: 'text-blue-500' },
  DOCTEUR: { icon: <Crown className="h-7 w-7" />, tone: 'text-rose-500' },
  CURSUS_COMPLET: { icon: <BookOpen className="h-7 w-7" />, tone: 'text-violet-600' },
  MAJOR_DE_PROMO: { icon: <Sparkles className="h-7 w-7" />, tone: 'text-amber-500' },
  MACHINE_SLAYER: { icon: <Bot className="h-7 w-7" />, tone: 'text-sky-600' },
}

export function AchievementsScreen() {
  const token = useApp(s => s.token)!
  const user = useApp(s => s.user)!
  const [items, setItems] = useState<AchievementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/achievements', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chargement impossible')
      setItems(data.achievements || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  const unlocked = items.filter(a => a.unlocked).length
  const ratio = items.length ? (unlocked / items.length) * 100 : 0
  const xpInLevel = user.xp % 500

  return (
    <div className="container mx-auto max-w-4xl px-3 sm:px-4">
      <div className="animate-in-up mb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          <span className="text-gradient">Succès</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Débloquez des trophées en jouant et en progressant.
        </p>
      </div>

      <Card className="mb-5">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Progression</p>
              <p className="text-2xl font-bold tabular-nums">
                {unlocked}
                <span className="text-base font-medium text-muted-foreground">
                  {' '}/ {items.length || '—'}
                </span>
              </p>
            </div>
            <Badge variant="secondary" className="gap-1.5">
              <Star className="h-3.5 w-3.5" /> Niveau {user.level}
            </Badge>
          </div>
          <Progress value={ratio} className="h-2" />

          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Vers le niveau {user.level + 1}</span>
              <span className="tabular-nums">{xpInLevel} / 500 XP</span>
            </div>
            <Progress value={(xpInLevel / 500) * 100} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(a => {
            const visual = VISUALS[a.code] ?? {
              icon: <Trophy className="h-7 w-7" />,
              tone: 'text-primary',
            }
            return (
              <Card
                key={a.code}
                className={cn(
                  'relative overflow-hidden transition-all',
                  a.unlocked
                    ? 'border-amber-400/50 bg-amber-500/5 hover:shadow-md'
                    : 'opacity-70 hover:opacity-100'
                )}
              >
                <CardContent className="p-4">
                  <div
                    className={cn(
                      'mb-3 flex h-12 w-12 items-center justify-center rounded-xl',
                      a.unlocked ? `bg-background ${visual.tone}` : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {a.unlocked ? visual.icon : <Lock className="h-6 w-6" />}
                  </div>
                  <p className="font-semibold">{a.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                  {a.unlocked && a.unlockedAt && (
                    <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400">
                      Débloqué le{' '}
                      {new Date(a.unlockedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
