'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { History, Trophy, Calendar, Clock } from 'lucide-react'

export function HistoryScreen() {
  const token = useApp(s => s.token)!
  const user = useApp(s => s.user)!
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => {
      const m: Record<string, string> = {}
      for (const c of d.categories || []) m[c.id] = c.name
      setCategories(m)
    })
    fetch('/api/games/history', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setGames(d.games || []); setLoading(false) })
  }, [token])

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-4">
        <h1 className="text-3xl font-black text-orange-900">Historique des parties</h1>
        <p className="text-muted-foreground">{games.length} partie(s) jouée(s)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-orange-900 flex items-center gap-2"><History className="w-5 h-5" /> Vos dernières parties</CardTitle>
          <CardDescription>Retrouvez tous vos résultats</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : games.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Aucune partie jouée pour le moment.</p>
              <p className="text-sm mt-1">Lancez votre première partie depuis le salon !</p>
            </div>
          ) : (
            <ScrollArea className="h-[70vh] pr-4">
              <div className="space-y-2">
                {games.map(g => {
                  const won = g.outcome === 'WIN'
                  const lost = g.outcome === 'LOSS'
                  return (
                    <div key={g.id} className={`p-3 rounded-lg border ${won ? 'border-green-200 bg-green-50' : lost ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-orange-200 text-orange-800 text-sm font-bold">{g.opponent.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">vs {g.opponent.pseudo}</p>
                              <Badge variant={won ? 'default' : lost ? 'destructive' : 'secondary'} className="text-xs">
                                {won ? 'Victoire' : lost ? 'Défaite' : 'Nul'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(g.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(g.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>{g.categoryFilter ? categories[g.categoryFilter] || 'Catégorie' : 'Aléatoire'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-black text-lg ${won ? 'text-green-700' : lost ? 'text-red-700' : 'text-slate-700'}`}>
                            {g.myScore} - {g.oppScore}
                          </p>
                          <p className="text-xs text-muted-foreground">{g.myCorrect}/{g.myCorrect + (10 - g.myCorrect)} correctes</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
