'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { startExam } from '@/hooks/use-realtime'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatTile } from '@/components/ui/stat-tile'
import { ListSkeleton } from '@/components/ui/states'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  GraduationCap,
  Lock,
  Pencil,
  Scroll,
  Sparkles,
  Target,
  Timer,
} from 'lucide-react'

interface Step {
  code: string
  name: string
  short: string
  holder: string
  school: string
  icon: string
  color: string
  questions: number
  passRate: number
  timer: number
  xpReward: number
  availableQuestions: number
  playable: boolean
  locked: boolean
  lockedBy: string | null
  obtained: boolean
  diploma: {
    mention: string
    percent: number
    correct: number
    total: number
    attempts: number
    obtainedAt: string
  } | null
}

interface Progress {
  steps: Step[]
  highestDegree: string | null
  title: string
  obtained: number
  total: number
  next: string | null
}

// Les icônes sont désignées par leur nom dans `academic.mjs`, qui est du
// JavaScript pur et ne peut pas importer de composants React.
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Pencil,
  BookOpen,
  GraduationCap,
  Scroll,
  Award,
  Crown,
}

const MENTION_LABELS: Record<string, string> = {
  EXCELLENT: 'Félicitations du jury',
  TRES_BIEN: 'Très bien',
  BIEN: 'Bien',
  ASSEZ_BIEN: 'Assez bien',
  PASSABLE: 'Passable',
}

export function AcademyScreen() {
  const token = useApp(s => s.token)!
  const setView = useApp(s => s.setView)
  const connected = useApp(s => s.connected)
  const { toast } = useToast()

  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/academic/progress', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setProgress(data)
    } catch {
      // L'écran reste sur son état précédent ; un rechargement suffit.
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  async function present(step: Step) {
    setStarting(step.code)
    const result = await startExam(token, step.code)
    setStarting(null)
    if (!result.ok) {
      toast({
        title: 'Examen impossible',
        description: result.error,
        variant: 'destructive',
      })
      return
    }
    // `game:started` bascule l'affichage sur le plateau ; ce filet couvre le cas
    // où l'événement tarderait d'un ou deux cycles d'interrogation.
    setView('game')
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-3 sm:px-4">
        <ListSkeleton rows={6} />
      </div>
    )
  }

  if (!progress) return null

  const percentComplete = Math.round((progress.obtained / progress.total) * 100)

  return (
    <div className="container mx-auto max-w-4xl px-3 sm:px-4">
      <div className="animate-in-up mb-5">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Parcours <span className="text-gradient">académique</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Six examens, du certificat d’études au doctorat. Chaque diplôme ouvre le suivant.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={<GraduationCap className="h-4 w-4" />}
          value={`${progress.obtained} / ${progress.total}`}
          label="Diplômes obtenus"
          tone="primary"
        />
        <StatTile
          icon={<Sparkles className="h-4 w-4" />}
          value={progress.title}
          label="Votre titre"
          tone="violet"
        />
        <StatTile
          icon={<Target className="h-4 w-4" />}
          value={`${percentComplete} %`}
          label="Cursus accompli"
          tone="success"
        />
        <StatTile
          icon={<Award className="h-4 w-4" />}
          value={
            progress.steps.find(s => s.code === progress.next)?.short ?? 'Terminé'
          }
          label="Prochain examen"
          tone="info"
        />
      </div>

      <Card className="mb-5">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Progression du cursus</span>
            <span className="tabular-nums text-muted-foreground">
              {progress.obtained} sur {progress.total}
            </span>
          </div>
          <Progress value={percentComplete} className="h-2" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {progress.steps.map(s => (
              <Badge
                key={s.code}
                variant={s.obtained ? 'default' : 'outline'}
                className={cn('text-[10px]', !s.obtained && 'text-muted-foreground')}
                style={s.obtained ? { backgroundColor: s.color, borderColor: s.color } : undefined}
              >
                {s.short}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {progress.steps.map((step, index) => {
          const Icon = ICONS[step.icon] ?? GraduationCap
          const isNext = progress.next === step.code
          const disabled = step.locked || !step.playable || !connected || !!starting

          return (
            <Card
              key={step.code}
              className={cn(
                'transition-colors',
                step.obtained && 'border-emerald-500/40 bg-emerald-500/[0.04]',
                isNext && 'border-primary/50 shadow-sm',
                step.locked && 'opacity-70'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${step.color}1f`, color: step.color }}
                    >
                      {step.locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{step.name}</CardTitle>
                        <Badge variant="outline" className="text-[10px]">
                          Étape {index + 1}
                        </Badge>
                        {step.obtained && (
                          <Badge className="gap-1 bg-emerald-600 text-[10px] hover:bg-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Obtenu
                          </Badge>
                        )}
                        {isNext && !step.obtained && (
                          <Badge className="text-[10px]">À passer</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-0.5">{step.school}</CardDescription>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={step.obtained ? 'outline' : 'default'}
                    disabled={disabled}
                    onClick={() => present(step)}
                    className="shrink-0"
                  >
                    {starting === step.code
                      ? 'Ouverture…'
                      : step.obtained
                        ? 'Repasser'
                        : 'Passer l’examen'}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> {step.questions} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" /> {step.passRate} % pour réussir
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="h-3.5 w-3.5" /> {step.timer} s par question
                  </span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> +{step.xpReward} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {step.availableQuestions} au programme
                  </span>
                </div>

                {step.locked && (
                  <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs">
                    Verrouillé — obtenez d’abord : <strong>{step.lockedBy}</strong>.
                  </p>
                )}

                {!step.playable && !step.locked && (
                  <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    Pas assez de questions à ce niveau dans la banque
                    ({step.availableQuestions}) pour composer l’examen.
                  </p>
                )}

                {step.diploma && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs">
                    <Badge variant="secondary" className="text-[10px]">
                      {MENTION_LABELS[step.diploma.mention] ?? step.diploma.mention}
                    </Badge>
                    <span className="tabular-nums">
                      {step.diploma.correct}/{step.diploma.total} — {step.diploma.percent} %
                    </span>
                    <span className="text-muted-foreground">
                      {step.diploma.attempts > 1
                        ? `${step.diploma.attempts} tentatives`
                        : '1re tentative'}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(step.diploma.obtainedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Les examens se jouent seul, face au jury : toutes les questions sont pour vous.
        Un échec n’enlève rien — l’examen se repasse autant de fois que nécessaire.
      </p>
    </div>
  )
}
