'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/store'
import {
  eventBus,
  clearGameBuffer,
  answerQuestion,
  sendChat as postChat,
  leaveGame,
} from '@/hooks/use-realtime'
import { playSound } from '@/lib/sound'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { TimerRing } from '@/components/game/timer-ring'
import { Confetti } from '@/components/game/confetti'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Trophy, Send, MessageSquare, CheckCircle2, XCircle, LogOut, Flame, Clock,
  Eye, Lightbulb, Medal, Home, Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Choice = 'A' | 'B' | 'C' | 'D'
const CHOICES: Choice[] = ['A', 'B', 'C', 'D']

interface Player {
  userId: string
  pseudo: string
  avatarUrl: string | null
  country: string
  level: number
}

interface Game {
  id: string
  playerA: Player
  playerB: Player
  categoryFilter: string | null
  totalQuestions: number
  scoreA: number
  scoreB: number
  correctA: number
  correctB: number
  streakA: number
  streakB: number
  timerSeconds: number
}

interface Question {
  index: number
  total: number
  text: string
  propositions: Record<Choice, string>
  categoryName?: string | null
  difficulty?: string | null
  answeredBy: 'A' | 'B'
  timerSeconds: number
  startedAt: number
}

interface Result {
  questionIndex: number
  correct: Choice
  chosen: Choice | null
  isCorrect: boolean
  timeout?: boolean
  points: number
  explanation?: string | null
  scoreA: number
  scoreB: number
  correctA: number
  correctB: number
  streakA: number
  streakB: number
  answeredBy: 'A' | 'B'
}

interface Summary {
  gameId: string
  winnerId: string | null
  scoreA: number
  scoreB: number
  correctA: number
  correctB: number
  avgTimeA: number
  avgTimeB: number
  bestStreakA: number
  bestStreakB: number
  totalQuestions: number
  forfeit: boolean
  youAre: 'A' | 'B'
  playerA: Player
  playerB: Player
  questions: Array<{
    index: number
    text: string
    propositions: Record<Choice, string>
    correct: Choice
    chosen: Choice | null
    answeredBy: 'A' | 'B'
    correctA: boolean | null
    correctB: boolean | null
    explanation?: string | null
  }>
}

interface ChatMsg {
  id: string
  senderId: string
  senderPseudo: string
  content: string
  timestamp: number
}

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: 'Facile',
  MEDIUM: 'Moyen',
  HARD: 'Difficile',
}

export function GameScreen() {
  const user = useApp(s => s.user)!
  const token = useApp(s => s.token)!
  const setView = useApp(s => s.setView)
  const soundEnabled = useApp(s => s.soundEnabled)

  const [game, setGame] = useState<Game | null>(null)
  const [youAre, setYouAre] = useState<'A' | 'B'>('A')
  const [question, setQuestion] = useState<Question | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [timeLeft, setTimeLeft] = useState(20)
  const [chosen, setChosen] = useState<Choice | null>(null)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [unreadChat, setUnreadChat] = useState(0)

  const chatBoxRef = useRef<HTMLDivElement>(null)
  const soundRef = useRef(soundEnabled)
  useEffect(() => {
    soundRef.current = soundEnabled
  }, [soundEnabled])

  // --- Réception des événements de partie ------------------------------------
  useEffect(() => {
    const offs = [
      eventBus.on('game:started', data => {
        // `chat` n'est présent qu'à la reprise d'une partie après un
        // rechargement de page ; il vaut le tableau vide au démarrage.
        const payload = data as { game: Game; youAre: 'A' | 'B'; chat?: ChatMsg[] }
        setGame(payload.game)
        setYouAre(payload.youAre)
        setSummary(null)
        setQuestion(null)
        setResult(null)
        setChosen(null)
        setChat(payload.chat ?? [])
        setUnreadChat(0)
      }),

      eventBus.on('game:question', data => {
        const q = data as Question
        setQuestion(q)
        setResult(null)
        setChosen(null)
        // Le temps restant est calculé depuis l'horodatage serveur : un client
        // qui a pris du retard reste synchronisé avec l'adversaire.
        const elapsed = (Date.now() - q.startedAt) / 1000
        setTimeLeft(Math.max(0, Math.round(q.timerSeconds - elapsed)))
      }),

      eventBus.on('game:question-result', data => {
        const r = data as Result
        setResult(r)
        setGame(prev =>
          prev
            ? {
                ...prev,
                scoreA: r.scoreA,
                scoreB: r.scoreB,
                correctA: r.correctA,
                correctB: r.correctB,
                streakA: r.streakA,
                streakB: r.streakB,
              }
            : prev
        )
      }),

      eventBus.on('game:finished', data => {
        const s = data as Summary
        setSummary(s)
        setQuestion(null)
        setResult(null)
      }),

      eventBus.on('game:chat:message', data => {
        const m = data as ChatMsg
        setChat(prev => [...prev, m])
        if (m.senderId !== user.id) setUnreadChat(n => n + 1)
      }),
    ]
    return () => offs.forEach(off => off())
  }, [user.id])

  // --- Sons liés au résultat de la question courante --------------------------
  const myTurn = question?.answeredBy === youAre
  useEffect(() => {
    if (!result || !soundRef.current) return
    if (result.answeredBy !== youAre) return
    playSound(result.timeout ? 'timeout' : result.isCorrect ? 'correct' : 'wrong')
  }, [result, youAre])

  useEffect(() => {
    if (!summary || !soundRef.current) return
    const won = summary.winnerId === user.id
    playSound(won ? 'victory' : 'defeat')
  }, [summary, user.id])

  // --- Compte à rebours -------------------------------------------------------
  useEffect(() => {
    if (!question || result) return
    if (timeLeft <= 0) return
    const id = setTimeout(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearTimeout(id)
  }, [question, result, timeLeft])

  // Tic sonore sur les cinq dernières secondes, uniquement pour le joueur
  // dont c'est le tour : l'adversaire n'a rien à faire.
  useEffect(() => {
    if (!question || result || !myTurn || chosen) return
    if (timeLeft > 0 && timeLeft <= 5 && soundRef.current) playSound('tick')
  }, [timeLeft, question, result, myTurn, chosen])

  useEffect(() => {
    if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
  }, [chat])

  // --- Actions ----------------------------------------------------------------
  const answer = useCallback(
    async (choice: Choice) => {
      if (!game || !question || result || chosen) return
      if (question.answeredBy !== youAre) return
      setChosen(choice)
      if (soundRef.current) playSound('click')
      const elapsed = Date.now() - question.startedAt
      const res = await answerQuestion(token, game.id, choice, Math.max(0, Math.round(elapsed)))
      // Réponse refusée (temps écoulé côté serveur) : on rend la main pour que
      // l'interface ne reste pas bloquée sur un choix qui n'a pas été pris.
      if (!res.ok) setChosen(null)
    },
    [game, question, result, chosen, youAre, token]
  )

  // Raccourcis clavier : 1-4 ou A-D pour répondre.
  useEffect(() => {
    if (!myTurn || result || chosen) return
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const key = e.key.toUpperCase()
      const byLetter = CHOICES.indexOf(key as Choice)
      const byDigit = ['1', '2', '3', '4'].indexOf(key)
      const index = byLetter >= 0 ? byLetter : byDigit
      if (index >= 0) {
        e.preventDefault()
        void answer(CHOICES[index])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [myTurn, result, chosen, answer])

  async function submitChat() {
    const content = chatInput.trim()
    if (!content || !game) return
    setChatInput('')
    await postChat(token, game.id, content)
  }

  async function forfeit() {
    if (!game) return
    await leaveGame(token, game.id)
    setView('lobby')
  }

  function backToLobby() {
    setSummary(null)
    setGame(null)
    clearGameBuffer()
    setView('lobby')
  }

  // --- Écran de fin -----------------------------------------------------------
  if (summary) {
    return <GameSummary summary={summary} userId={user.id} onBack={backToLobby} onLeaderboard={() => setView('leaderboard')} />
  }

  // --- Aucune partie en cours -------------------------------------------------
  if (!game) {
    return (
      <div className="container mx-auto max-w-lg px-4">
        <Card>
          <CardContent className="p-10 text-center">
            <Trophy className="mx-auto mb-4 h-14 w-14 animate-pulse text-primary" />
            <h2 className="text-xl font-bold">Aucune partie en cours</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Retournez au salon pour défier un adversaire.
            </p>
            <Button onClick={() => setView('lobby')} className="mt-5 gap-2">
              <Home className="h-4 w-4" /> Aller au salon
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const me = youAre === 'A' ? game.playerA : game.playerB
  const opponent = youAre === 'A' ? game.playerB : game.playerA
  const myScore = youAre === 'A' ? game.scoreA : game.scoreB
  const oppScore = youAre === 'A' ? game.scoreB : game.scoreA
  const myCorrect = youAre === 'A' ? game.correctA : game.correctB
  const oppCorrect = youAre === 'A' ? game.correctB : game.correctA
  const myStreak = youAre === 'A' ? game.streakA : game.streakB
  const questionNumber = question ? question.index + 1 : 0
  const progress = (questionNumber / game.totalQuestions) * 100

  return (
    <div className="container mx-auto max-w-6xl px-3 sm:px-4">
      {/* Tableau de score */}
      <Card className="mb-3">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <ScorePanel
              player={me}
              score={myScore}
              correct={myCorrect}
              streak={myStreak}
              isMe
              active={myTurn}
            />

            <div className="shrink-0 text-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Question</p>
              <p className="text-xl font-black tabular-nums sm:text-2xl">
                {questionNumber || '—'}
                <span className="text-sm font-medium text-muted-foreground">
                  /{game.totalQuestions}
                </span>
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-0.5 h-7 gap-1 text-destructive">
                    <LogOut className="h-3 w-3" />
                    <span className="text-xs">Abandonner</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Abandonner la partie ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      La victoire sera attribuée à {opponent.pseudo} et la partie comptera comme
                      une défaite dans vos statistiques.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Continuer à jouer</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={forfeit}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Abandonner
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <ScorePanel
              player={opponent}
              score={oppScore}
              correct={oppCorrect}
              streak={youAre === 'A' ? game.streakB : game.streakA}
              align="right"
              active={!!question && !myTurn}
            />
          </div>
          <Progress value={progress} className="mt-3 h-1.5" />
        </CardContent>
      </Card>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Question */}
        <div className="lg:col-span-2">
          {question ? (
            <Card className={cn(myTurn && timeLeft <= 5 && !result && 'animate-urgent')}>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={myTurn ? 'default' : 'secondary'} className="gap-1">
                      {myTurn ? (
                        <>
                          <Flame className="h-3 w-3" /> À vous de jouer
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" /> Tour de {opponent.pseudo}
                        </>
                      )}
                    </Badge>
                    {question.categoryName && (
                      <Badge variant="outline" className="text-[10px]">
                        {question.categoryName}
                      </Badge>
                    )}
                    {question.difficulty && (
                      <Badge variant="outline" className="text-[10px]">
                        {DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty}
                      </Badge>
                    )}
                  </div>
                  <TimerRing
                    remaining={timeLeft}
                    total={question.timerSeconds}
                    size={68}
                    className="shrink-0"
                  />
                </div>

                <h2 className="animate-in-up mb-5 text-lg font-bold leading-snug sm:text-xl">
                  {question.text}
                </h2>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {CHOICES.map((letter, i) => {
                    const isChosen = chosen === letter
                    const isRight = result && letter === result.correct
                    const isWrongPick = result && result.chosen === letter && !result.isCorrect

                    return (
                      <button
                        key={letter}
                        onClick={() => answer(letter)}
                        disabled={!!result || !!chosen || !myTurn}
                        className={cn(
                          'group flex min-h-[3.5rem] items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
                          'disabled:cursor-not-allowed',
                          result
                            ? isRight
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : isWrongPick
                                ? 'animate-shake border-destructive bg-destructive/10'
                                : 'border-border opacity-50'
                            : isChosen
                              ? 'border-primary bg-primary/10'
                              : myTurn
                                ? 'border-border hover:border-primary hover:bg-accent active:scale-[0.99]'
                                : 'border-border opacity-70'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors',
                            result && isRight
                              ? 'bg-emerald-500 text-white'
                              : result && isWrongPick
                                ? 'bg-destructive text-destructive-foreground'
                                : isChosen
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary'
                          )}
                        >
                          {letter}
                        </span>
                        <span className="flex-1 text-sm sm:text-base">
                          {question.propositions[letter]}
                        </span>
                        {result && isRight && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                        )}
                        {result && isWrongPick && (
                          <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                        )}
                        {/* Rappel du raccourci, sans encombrer sur mobile */}
                        {!result && myTurn && (
                          <kbd className="hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-block">
                            {i + 1}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>

                {result && (
                  <div
                    className={cn(
                      'animate-in-up mt-4 rounded-xl border p-3.5',
                      result.answeredBy === youAre
                        ? result.isCorrect
                          ? 'border-emerald-500/40 bg-emerald-500/10'
                          : 'border-destructive/40 bg-destructive/10'
                        : 'bg-muted/50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">
                        {result.timeout
                          ? '⏱️ Temps écoulé'
                          : result.isCorrect
                            ? '✓ Bonne réponse'
                            : '✗ Mauvaise réponse'}
                        {result.answeredBy !== youAre && (
                          <span className="ml-1 font-normal text-muted-foreground">
                            (pour {opponent.pseudo})
                          </span>
                        )}
                      </p>
                      {result.points > 0 && result.answeredBy === youAre && (
                        <Badge className="animate-pop bg-emerald-500 text-white hover:bg-emerald-500">
                          +{result.points} pts
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm">
                      Réponse attendue :{' '}
                      <strong>{question.propositions[result.correct]}</strong>
                    </p>
                    {result.explanation && (
                      <p className="mt-2 flex gap-1.5 text-sm text-muted-foreground">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                        {result.explanation}
                      </p>
                    )}
                  </div>
                )}

                {!myTurn && !result && (
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    {opponent.pseudo} réfléchit… vous reprenez la main à la question suivante.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="mx-auto mb-3 h-12 w-12 animate-pulse text-primary" />
                <p className="text-muted-foreground">Question suivante…</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat */}
        <Card className="flex flex-col lg:max-h-[calc(100vh-14rem)]">
          <div className="flex items-center justify-between border-b p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4" /> Discussion
            </p>
            {unreadChat > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {unreadChat} nouveau{unreadChat > 1 ? 'x' : ''}
              </Badge>
            )}
          </div>

          <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-3">
            <div
              ref={chatBoxRef}
              onClick={() => setUnreadChat(0)}
              className="max-h-40 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 lg:max-h-none"
            >
              {chat.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Aucun message. Restez fair-play !
                </p>
              ) : (
                chat.map(m => {
                  const mine = m.senderId === user.id
                  return (
                    <div key={m.id} className={cn('flex', mine && 'justify-end')}>
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-3 py-1.5 text-sm',
                          mine
                            ? 'rounded-br-sm bg-primary text-primary-foreground'
                            : 'rounded-bl-sm bg-muted'
                        )}
                      >
                        {!mine && (
                          <span className="mb-0.5 block text-[10px] font-semibold opacity-70">
                            {m.senderPseudo}
                          </span>
                        )}
                        <span className="break-words">{m.content}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitChat()}
                placeholder="Votre message…"
                maxLength={300}
                className="text-sm"
              />
              <Button size="icon" onClick={submitChat} disabled={!chatInput.trim()} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function ScorePanel({
  player, score, correct, streak, isMe, active, align = 'left',
}: {
  player: Player
  score: number
  correct: number
  streak: number
  isMe?: boolean
  active?: boolean
  align?: 'left' | 'right'
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 transition-all sm:gap-3 sm:p-2',
        active && 'bg-primary/10 ring-2 ring-primary/40',
        align === 'right' && 'flex-row-reverse text-right'
      )}
    >
      <PlayerAvatar name={player.pseudo} src={player.avatarUrl} className="h-10 w-10 sm:h-12 sm:w-12" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold sm:text-base">
          {player.pseudo}
          {isMe && <span className="ml-1 text-xs font-normal text-primary">(vous)</span>}
        </p>
        <p
          className={cn(
            'flex items-center gap-1.5 text-[11px] text-muted-foreground',
            align === 'right' && 'justify-end'
          )}
        >
          <span>{correct} ✓</span>
          {streak >= 2 && (
            <span className="flex items-center gap-0.5 text-orange-500">
              <Flame className="h-3 w-3" />
              {streak}
            </span>
          )}
        </p>
        <p className="text-lg font-black tabular-nums text-primary sm:text-xl">{score}</p>
      </div>
    </div>
  )
}

function GameSummary({
  summary, userId, onBack, onLeaderboard,
}: {
  summary: Summary
  userId: string
  onBack: () => void
  onLeaderboard: () => void
}) {
  const won = summary.winnerId === userId
  const draw = summary.winnerId === null
  const you = summary.youAre

  const mine = {
    player: you === 'A' ? summary.playerA : summary.playerB,
    score: you === 'A' ? summary.scoreA : summary.scoreB,
    correct: you === 'A' ? summary.correctA : summary.correctB,
    avgTime: you === 'A' ? summary.avgTimeA : summary.avgTimeB,
    streak: you === 'A' ? summary.bestStreakA : summary.bestStreakB,
  }
  const theirs = {
    player: you === 'A' ? summary.playerB : summary.playerA,
    score: you === 'A' ? summary.scoreB : summary.scoreA,
    correct: you === 'A' ? summary.correctB : summary.correctA,
    avgTime: you === 'A' ? summary.avgTimeB : summary.avgTimeA,
    streak: you === 'A' ? summary.bestStreakB : summary.bestStreakA,
  }
  const myQuestions = Math.round(summary.totalQuestions / 2)

  return (
    <div className="container mx-auto max-w-4xl px-3 sm:px-4">
      {won && <Confetti />}

      <Card className="overflow-hidden">
        <div
          className={cn(
            'p-8 text-center text-white',
            won
              ? 'bg-gradient-to-br from-amber-400 to-orange-600'
              : draw
                ? 'bg-gradient-to-br from-slate-500 to-slate-700'
                : 'bg-gradient-to-br from-rose-500 to-red-700'
          )}
        >
          <div className="animate-pop">
            {won ? (
              <Trophy className="mx-auto mb-3 h-16 w-16" />
            ) : draw ? (
              <Medal className="mx-auto mb-3 h-16 w-16" />
            ) : (
              <Crown className="mx-auto mb-3 h-16 w-16 opacity-70" />
            )}
            <h2 className="text-3xl font-black sm:text-4xl">
              {won ? 'Victoire !' : draw ? 'Match nul' : 'Défaite'}
            </h2>
            <p className="mt-1 text-lg opacity-90">
              {summary.forfeit ? 'Partie abandonnée' : `${mine.score} — ${theirs.score}`}
            </p>
          </div>
        </div>

        <CardContent className="p-4 sm:p-6">
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            <PlayerResult data={mine} isMe winner={won} questions={myQuestions} />
            <PlayerResult data={theirs} winner={!won && !draw} questions={myQuestions} />
          </div>

          <h3 className="mb-3 font-bold">Détail des {summary.questions.length} questions</h3>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {summary.questions.map(q => {
              const wasMine = q.answeredBy === you
              const outcome = wasMine ? (you === 'A' ? q.correctA : q.correctB) : null
              return (
                <div
                  key={q.index}
                  className={cn(
                    'rounded-xl border p-3',
                    wasMine
                      ? outcome
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-destructive/30 bg-destructive/5'
                      : 'bg-muted/40'
                  )}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground">Q{q.index + 1}.</span> {q.text}
                    </p>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {wasMine ? 'Vous' : theirs.player.pseudo}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bonne réponse :{' '}
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {q.propositions[q.correct]}
                    </span>
                  </p>
                  {wasMine && !outcome && (
                    <p className="mt-0.5 text-xs text-destructive">
                      {q.chosen
                        ? `Vous avez répondu : ${q.propositions[q.chosen]}`
                        : 'Aucune réponse dans le temps imparti'}
                    </p>
                  )}
                  {q.explanation && (
                    <p className="mt-1.5 flex gap-1.5 text-xs italic text-muted-foreground">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {q.explanation}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button onClick={onBack} className="flex-1 gap-2">
              <Home className="h-4 w-4" /> Retour au salon
            </Button>
            <Button variant="outline" onClick={onLeaderboard} className="gap-2">
              <Crown className="h-4 w-4" /> Voir le classement
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PlayerResult({
  data, isMe, winner, questions,
}: {
  data: { player: Player; score: number; correct: number; avgTime: number; streak: number }
  isMe?: boolean
  winner?: boolean
  questions: number
}) {
  return (
    <Card className={cn(winner && 'border-amber-400 bg-amber-500/5')}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <PlayerAvatar name={data.player.pseudo} src={data.player.avatarUrl} className="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">
              {data.player.pseudo}
              {isMe && <span className="ml-1 text-xs font-normal text-primary">(vous)</span>}
            </p>
            <p className="text-xs text-muted-foreground">Niveau {data.player.level}</p>
          </div>
          {winner && <Trophy className="h-5 w-5 shrink-0 text-amber-500" />}
        </div>
        <div className="grid grid-cols-4 gap-1 text-center">
          <Metric value={data.score} label="Points" />
          <Metric value={`${data.correct}/${questions}`} label="Justes" />
          <Metric
            value={data.avgTime > 0 ? `${(data.avgTime / 1000).toFixed(1)}s` : '—'}
            label="Temps"
            icon={<Clock className="h-3 w-3" />}
          />
          <Metric value={data.streak} label="Série" icon={<Flame className="h-3 w-3" />} />
        </div>
      </CardContent>
    </Card>
  )
}

function Metric({
  value, label, icon,
}: {
  value: React.ReactNode
  label: string
  icon?: React.ReactNode
}) {
  return (
    <div>
      <p className="text-lg font-black tabular-nums">{value}</p>
      <p className="flex items-center justify-center gap-0.5 text-[10px] text-muted-foreground">
        {icon}
        {label}
      </p>
    </div>
  )
}
