'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Crown, Medal, Award } from 'lucide-react'

const SCOPES: Array<{ id: string; label: string }> = [
  { id: 'global', label: 'Mondial' },
  { id: 'national', label: 'National' },
  { id: 'weekly', label: 'Hebdo' },
  { id: 'monthly', label: 'Mensuel' },
  { id: 'yearly', label: 'Annuel' },
]

export function LeaderboardScreen() {
  const token = useApp(s => s.token)!
  const user = useApp(s => s.user)!
  const [scope, setScope] = useState('global')
  const [players, setPlayers] = useState<any[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const r = await fetch(`/api/leaderboard?scope=${scope}`, { headers: { Authorization: `Bearer ${token}` } })
        const d = await r.json()
        if (!cancelled) {
          setPlayers(d.players || [])
          setMyRank(d.myRank)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, scope])

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-4">
        <h1 className="text-3xl font-black text-orange-900">Classement</h1>
        <p className="text-muted-foreground">Les meilleurs joueurs de la communauté</p>
      </div>

      <Tabs value={scope} onValueChange={setScope} className="mb-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          {SCOPES.map(s => <TabsTrigger key={s.id} value={s.id}>{s.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {myRank && (
        <Card className="mb-4 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center">#{myRank}</div>
              <div>
                <p className="font-semibold">Votre position</p>
                <p className="text-xs text-muted-foreground">{user.pseudo} · {user.totalScore} pts</p>
              </div>
            </div>
            <Badge className="bg-amber-500">Niv. {user.level}</Badge>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-orange-900">Top 100</CardTitle>
          <CardDescription>{SCOPES.find(s => s.id === scope)?.label}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : players.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aucun joueur dans ce classement pour le moment.</p>
          ) : (
            <div className="space-y-1">
              {players.map((p, i) => {
                const isMe = p.id === user.id
                const rank = i + 1
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg ${isMe ? 'bg-amber-100 ring-1 ring-amber-400' : i < 3 ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="w-8 text-center font-bold">
                      {rank === 1 ? <Crown className="w-5 h-5 mx-auto text-amber-500" /> :
                       rank === 2 ? <Medal className="w-5 h-5 mx-auto text-slate-400" /> :
                       rank === 3 ? <Award className="w-5 h-5 mx-auto text-amber-700" /> :
                       <span className="text-sm text-muted-foreground">{rank}</span>}
                    </div>
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-orange-200 text-orange-800 text-sm font-bold">{p.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{p.pseudo} {isMe && <span className="text-xs text-orange-600">(vous)</span>}</p>
                      <p className="text-xs text-muted-foreground">{p.country} · Niv. {p.level} · {p.winRate}% victoires</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-orange-700">{p.totalScore}</p>
                      <p className="text-xs text-muted-foreground">{p.wins}V · {p.gamesPlayed - p.wins}D</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
