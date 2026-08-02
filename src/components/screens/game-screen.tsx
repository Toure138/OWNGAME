'use client'

import { useEffect, useRef, useState } from 'react'
import { useApp } from '@/lib/store'
import { eventBus, answerQuestion as sendAnswer, sendChat as sendChatMsg, leaveGame as quitGame } from '@/hooks/use-realtime'

function clearGameBuffer() {
  eventBus.clearBuffer('game:started')
  eventBus.clearBuffer('game:question')
  eventBus.clearBuffer('game:question-result')
  eventBus.clearBuffer('game:finished')
}
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trophy, Clock, Send, MessageSquare, CheckCircle2, XCircle, LogOut } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PlayerInfo { userId: string; pseudo: string; avatarUrl: string | null; country: string; level: number }
interface Question {
  index: number
  text: string
  propositions: { A: string; B: string; C: string; D: string }
  categoryId: string
  answeredBy: 'A' | 'B'
  timerSeconds: number
  scoreA: number
  scoreB: number
}

interface QuestionResult {
  questionIndex: number
  correct: 'A' | 'B' | 'C' | 'D'
  chosen: 'A' | 'B' | 'C' | 'D' | null
  isCorrect: boolean
  timeout?: boolean
  scoreA: number
  scoreB: number
  correctA: number
  correctB: number
  answeredBy: 'A' | 'B'
}

interface GameSummary {
  gameId: string
  winnerId: string | null
  scoreA: number
  scoreB: number
  correctA: number
  correctB: number
  avgTimeA: number
  avgTimeB: number
  forfeit: boolean
  questions: Array<{
    index: number
    text: string
    propositions: any
    correct: 'A' | 'B' | 'C' | 'D'
    chosen: 'A' | 'B' | 'C' | 'D' | null
    answeredBy: 'A' | 'B'
    correctA: boolean | null
    correctB: boolean | null
    explanation?: string
  }>
}

interface ChatMsg {
  id: string
  senderId: string
  senderPseudo: string
  content: string
  timestamp: number
}

export function GameScreen() {
  const user = useApp(s => s.user)!
  const token = useApp(s => s.token)!
  const setView = useApp(s => s.setView)
  const { toast } = useToast()

  const [game, setGame] = useState<any>(null)
  const [youAre, setYouAre] = useState<'A' | 'B'>('A')
  const [question, setQuestion] = useState<Question | null>(null)
  const [result, setResult] = useState<QuestionResult | null>(null)
  const [summary, setSummary] = useState<GameSummary | null>(null)
  const [timeLeft, setTimeLeft] = useState(20)
  const [chosen, setChosen] = useState<'A' | 'B' | 'C' | 'D' | null>(null)
  const [chat, setChat] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const questionStartRef = useRef<number>(0)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<any>(null)
  const tokenRef = useRef<string>('')

  useEffect(() => { gameRef.current = game }, [game])
  useEffect(() => { tokenRef.current = token }, [token])

  // Listen for game events via the event bus (registered once)
  useEffect(() => {
    const offs: Array<() => void> = []

    offs.push(eventBus.on('game:started', (data: any) => {
      // Clear any buffered events from a previous game
      eventBus.clearBuffer('game:question')
      eventBus.clearBuffer('game:question-result')
      eventBus.clearBuffer('game:finished')
      setGame(data.game)
      setYouAre(data.youAre)
      setChat([])
      setSummary(null)
      setQuestion(null)
      setResult(null)
      setChosen(null)
    }))

    offs.push(eventBus.on('game:question', (q: any) => {
      setQuestion(q)
      setResult(null)
      setChosen(null)
      setTimeLeft(q.timerSeconds)
      questionStartRef.current = Date.now()
    }))

    offs.push(eventBus.on('game:question-result', (r: QuestionResult) => {
      setResult(r)
      setQuestion(prev => prev ? { ...prev, scoreA: r.scoreA, scoreB: r.scoreB } : null)
      setGame((prev: any) => prev ? { ...prev, scoreA: r.scoreA, scoreB: r.scoreB, correctA: r.correctA, correctB: r.correctB } : prev)
    }))

    offs.push(eventBus.on('game:finished', (s: GameSummary) => {
      setSummary(s)
      setQuestion(null)
      setResult(null)
      const g = gameRef.current
      const tk = tokenRef.current
      if (g) {
        fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerAId: g.playerA.userId,
            playerBId: g.playerB.userId,
            categoryFilter: g.categoryFilter,
            questionsData: s.questions,
            scoreA: s.scoreA,
            scoreB: s.scoreB,
            correctA: s.correctA,
            correctB: s.correctB,
            avgTimeA: s.avgTimeA,
            avgTimeB: s.avgTimeB,
            winnerId: s.winnerId,
          }),
        }).then(() => {
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${tk}` } })
            .then(r => r.json())
            .then(d => { if (d.user) useApp.getState().updateUser(d.user) })
        })
      }
    }))

    offs.push(eventBus.on('game:chat:message', (m: ChatMsg) => {
      setChat(prev => [...prev, m])
    }))

    return () => { offs.forEach(off => off()) }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (!question || result) return
    if (timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    return () => clearTimeout(t)
  }, [question, result, timeLeft])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chat])

  async function answer(choice: 'A' | 'B' | 'C' | 'D') {
    if (!question || result || chosen) return
    if (question.answeredBy !== youAre) return
    setChosen(choice)
    const responseTime = Date.now() - questionStartRef.current
    await sendAnswer(token, game.id, choice, responseTime)
  }

  async function sendChat() {
    if (!chatInput.trim() || !game) return
    await sendChatMsg(token, game.id, chatInput.trim())
    setChatInput('')
  }

  async function forfeit() {
    if (!game) return
    if (!confirm('Quitter la partie ? Elle sera comptée comme une défaite.')) return
    await quitGame(token, game.id)
    setView('lobby')
  }

  function backToLobby() {
    setSummary(null)
    setGame(null)
    clearGameBuffer()
    setView('lobby')
  }

  // ----- Summary screen -----
  if (summary) {
    const won = summary.winnerId === user.id
    const draw = !summary.winnerId
    const myScore = youAre === 'A' ? summary.scoreA : summary.scoreB
    const oppScore = youAre === 'A' ? summary.scoreB : summary.scoreA
    const myCorrect = youAre === 'A' ? summary.correctA : summary.correctB
    const oppCorrect = youAre === 'A' ? summary.correctB : summary.correctA
    const myAvg = youAre === 'A' ? summary.avgTimeA : summary.avgTimeB
    const oppAvg = youAre === 'A' ? summary.avgTimeB : summary.avgTimeA
    const opponent = youAre === 'A' ? game?.playerB : game?.playerA

    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="border-orange-200 shadow-2xl overflow-hidden">
          <div className={`p-8 text-center text-white ${won ? 'bg-gradient-to-br from-amber-500 to-orange-600' : draw ? 'bg-gradient-to-br from-slate-500 to-slate-700' : 'bg-gradient-to-br from-rose-500 to-red-700'}`}>
            <Trophy className="w-16 h-16 mx-auto mb-3" />
            <h2 className="text-4xl font-black mb-2">{won ? 'Victoire !' : draw ? 'Match nul' : 'Défaite'}</h2>
            <p className="text-lg opacity-90">{summary.forfeit ? 'Partie abandonnée' : 'Partie terminée'}</p>
          </div>
          <CardContent className="p-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <PlayerScoreCard name={user.pseudo} score={myScore} correct={myCorrect} avgTime={myAvg} isWinner={won} isMe />
              <PlayerScoreCard name={opponent?.pseudo || 'Adversaire'} score={oppScore} correct={oppCorrect} avgTime={oppAvg} isWinner={!won && !draw} />
            </div>

            <h3 className="font-bold text-lg mb-3 text-orange-900">Détail des questions</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {summary.questions.map((q, i) => {
                const wasMyTurn = (youAre === 'A' && q.answeredBy === 'A') || (youAre === 'B' && q.answeredBy === 'B')
                const myResult = youAre === 'A' ? q.correctA : q.correctB
                return (
                  <div key={i} className={`p-3 rounded-lg border ${wasMyTurn ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium">Q{i + 1}. {q.text}</p>
                      <Badge variant="outline" className="text-xs shrink-0">{wasMyTurn ? 'Vous' : 'Adversaire'}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Bonne réponse : <span className="font-semibold text-green-700">{q.propositions[q.correct]}</span></p>
                    {wasMyTurn && (
                      <p className={`text-xs font-medium ${myResult ? 'text-green-600' : 'text-red-600'}`}>
                        {myResult ? '✓ Correct' : q.chosen ? `✗ Vous avez répondu : ${q.propositions[q.chosen]}` : '✗ Pas répondu'}
                      </p>
                    )}
                    {q.explanation && <p className="text-xs text-muted-foreground italic mt-1">💡 {q.explanation}</p>}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={backToLobby} className="flex-1 bg-orange-600 hover:bg-orange-700">Retour au salon</Button>
              <Button variant="outline" onClick={() => setView('leaderboard')}>Voir le classement</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-orange-500 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2 text-orange-900">En attente d'une partie...</h2>
            <p className="text-muted-foreground">Retournez au salon pour défier un joueur.</p>
            <Button onClick={() => setView('lobby')} className="mt-4 bg-orange-600 hover:bg-orange-700">Aller au salon</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const me = youAre === 'A' ? game.playerA : game.playerB
  const opp = youAre === 'A' ? game.playerB : game.playerA
  const myScore = youAre === 'A' ? game.scoreA : game.scoreB
  const oppScore = youAre === 'A' ? game.scoreB : game.scoreA
  const myCorrect = youAre === 'A' ? game.correctA || 0 : game.correctB || 0
  const oppCorrect = youAre === 'A' ? game.correctB || 0 : game.correctA || 0
  const myTurn = question?.answeredBy === youAre
  const timerPct = question ? (timeLeft / question.timerSeconds) * 100 : 0

  return (
    <div className="container mx-auto p-3 max-w-6xl">
      <Card className="mb-3 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <PlayerMini name={me.pseudo} avatar={me.avatarUrl} level={me.level} score={myScore} correct={myCorrect} isMe highlight={myTurn} />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Question</p>
              <p className="text-2xl font-black text-orange-900">{question ? `${question.index + 1}` : '?'}/20</p>
              <Button variant="ghost" size="sm" onClick={forfeit} className="mt-1 text-red-600 hover:text-red-700">
                <LogOut className="w-3 h-3 mr-1" /> Abandonner
              </Button>
            </div>
            <PlayerMini name={opp.pseudo} avatar={opp.avatarUrl} level={opp.level} score={oppScore} correct={oppCorrect} highlight={!myTurn && !!question} />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          {question ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={myTurn ? 'default' : 'secondary'} className={myTurn ? 'bg-orange-600' : ''}>
                    {myTurn ? '🎯 À vous de jouer' : '⏳ Tour de l\'adversaire'}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-orange-600'}`} />
                    <span className={`text-xl font-bold ${timeLeft <= 5 ? 'text-red-500' : 'text-orange-900'}`}>{timeLeft}s</span>
                  </div>
                </div>
                <Progress value={timerPct} className="h-2 mb-6" />
                <h2 className="text-xl sm:text-2xl font-bold mb-6 text-slate-900">{question.text}</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(['A', 'B', 'C', 'D'] as const).map(letter => {
                    const isSelected = chosen === letter
                    const isCorrect = result && letter === result.correct
                    const isWrong = result && isSelected && !result.isCorrect
                    let className = 'justify-start text-left h-auto py-4 px-4 text-base border-2 '
                    if (result) {
                      if (isCorrect) className += 'border-green-500 bg-green-50 text-green-900'
                      else if (isWrong) className += 'border-red-500 bg-red-50 text-red-900'
                      else className += 'border-slate-200 opacity-60'
                    } else if (isSelected) {
                      className += 'border-orange-500 bg-orange-50'
                    } else {
                      className += 'border-slate-200 hover:border-orange-400 hover:bg-orange-50'
                    }
                    const disabled = !!result || !!chosen || !myTurn
                    return (
                      <Button key={letter} variant="outline" className={className} disabled={disabled} onClick={() => answer(letter)}>
                        <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center mr-3 shrink-0">{letter}</span>
                        <span className="flex-1">{question.propositions[letter]}</span>
                        {result && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-600 ml-2" />}
                        {result && isWrong && <XCircle className="w-5 h-5 text-red-600 ml-2" />}
                      </Button>
                    )
                  })}
                </div>
                {result && (
                  <div className={`mt-4 p-3 rounded-lg ${result.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <p className="font-semibold">{result.timeout ? '⏱️ Temps écoulé !' : result.isCorrect ? '✓ Bonne réponse !' : '✗ Mauvaise réponse'}</p>
                    <p className="text-sm mt-1">La bonne réponse était : <strong>{question.propositions[result.correct]}</strong></p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-orange-500 animate-pulse" />
                <p className="text-muted-foreground">En attente de la prochaine question...</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="lg:col-span-1 flex flex-col h-[60vh] lg:h-auto">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-orange-900"><MessageSquare className="w-4 h-4" /> Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-2 min-h-0">
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 max-h-48 lg:max-h-none">
              {chat.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Aucun message. Soyez fair-play !</p>
              ) : (
                chat.map(m => (
                  <div key={m.id} className={`text-sm ${m.senderId === user.id ? 'text-right' : ''}`}>
                    <span className={`inline-block px-3 py-1.5 rounded-lg ${m.senderId === user.id ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-900'}`}>
                      {m.senderId !== user.id && <span className="text-xs font-semibold block opacity-70 mb-0.5">{m.senderPseudo}</span>}
                      {m.content}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Message..." className="text-sm" maxLength={500} />
              <Button size="icon" onClick={sendChat} className="bg-orange-600 hover:bg-orange-700 shrink-0"><Send className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PlayerMini({ name, avatar, level, score, correct, isMe, highlight }: { name: string; avatar: string | null; level: number; score: number; correct: number; isMe?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${highlight ? 'bg-orange-100 ring-2 ring-orange-400' : ''}`}>
      <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
        <AvatarFallback className="bg-orange-200 text-orange-800 font-bold">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="font-semibold truncate text-sm sm:text-base">{name} {isMe && <span className="text-xs text-orange-600">(vous)</span>}</p>
        <p className="text-xs text-muted-foreground">Niv. {level} · {correct} ✓</p>
        <p className="text-lg font-black text-orange-700">{score} pts</p>
      </div>
    </div>
  )
}

function PlayerScoreCard({ name, score, correct, avgTime, isWinner, isMe }: { name: string; score: number; correct: number; avgTime: number; isWinner: boolean; isMe?: boolean }) {
  return (
    <Card className={isWinner ? 'border-amber-400 bg-amber-50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-lg">{name} {isMe && <span className="text-xs text-orange-600">(vous)</span>}</p>
          {isWinner && <Trophy className="w-5 h-5 text-amber-500" />}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-2xl font-black text-orange-700">{score}</p><p className="text-xs text-muted-foreground">Points</p></div>
          <div><p className="text-2xl font-black text-green-600">{correct}</p><p className="text-xs text-muted-foreground">Correctes</p></div>
          <div><p className="text-2xl font-black text-slate-700">{(avgTime / 1000).toFixed(1)}s</p><p className="text-xs text-muted-foreground">Temps moyen</p></div>
        </div>
      </CardContent>
    </Card>
  )
}
