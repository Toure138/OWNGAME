'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Trophy, Star, Target, TrendingUp, Save, Crown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Canada', 'Maroc', 'Algérie', 'Tunisie', 'Sénégal', 'Côte d\'Ivoire', 'Cameroun', 'Espagne', 'Italie', 'Portugal', 'Allemagne', 'Royaume-Uni', 'États-Unis', 'Brésil', 'Mexique', 'Japon', 'Chine', 'Autre']

export function ProfileScreen() {
  const user = useApp(s => s.user)!
  const token = useApp(s => s.token)!
  const updateUser = useApp(s => s.updateUser)
  const setView = useApp(s => s.setView)
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [pseudo, setPseudo] = useState(user.pseudo)
  const [fullName, setFullName] = useState(user.fullName || '')
  const [country, setCountry] = useState(user.country)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '')
  const [saving, setSaving] = useState(false)
  const [achievements, setAchievements] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/achievements', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setAchievements(d.achievements || []))
  }, [token])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pseudo, fullName, country, avatarUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateUser(data.user)
      setEditing(false)
      toast({ title: 'Profil mis à jour' })
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const winRate = user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0
  const xpForNextLevel = (user.level * 500)
  const xpProgress = (user.xp % 500) / 500 * 100

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <Card className="lg:col-span-1 border-orange-200">
          <CardContent className="p-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-3">
              <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-600 text-white text-3xl font-bold">
                {user.pseudo.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-orange-900">{user.pseudo}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="outline" className="mt-2">{user.country}</Badge>
            {user.rank && (
              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
                <Crown className="w-3.5 h-3.5" /> Rang mondial #{user.rank}
              </div>
            )}
            <div className="mt-4 p-3 rounded-lg bg-orange-50">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Niveau {user.level}</span>
                <span className="text-muted-foreground">{user.xp} / {xpForNextLevel} XP</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>
            {user.role === 'ADMIN' && (
              <Button onClick={() => setView('admin')} variant="outline" className="w-full mt-3 border-orange-300 text-orange-700">
                Accéder à l'administration
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<Trophy className="w-5 h-5" />} value={user.totalScore} label="Score total" color="text-amber-600 bg-amber-50" />
            <StatCard icon={<Target className="w-5 h-5" />} value={user.gamesPlayed} label="Parties jouées" color="text-blue-600 bg-blue-50" />
            <StatCard icon={<Star className="w-5 h-5" />} value={user.wins} label="Victoires" color="text-green-600 bg-green-50" />
            <StatCard icon={<TrendingUp className="w-5 h-5" />} value={`${winRate}%`} label="Taux de victoire" color="text-purple-600 bg-purple-50" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-900">Informations du profil</CardTitle>
              <CardDescription>{editing ? 'Modifiez vos informations' : 'Vos informations personnelles'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label>Pseudonyme</Label>
                    <Input value={pseudo} onChange={e => setPseudo(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom complet</Label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pays</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>URL de l'avatar (optionnel)</Label>
                    <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={save} disabled={saving} className="bg-orange-600 hover:bg-orange-700">
                      <Save className="w-4 h-4 mr-1" /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
                  </div>
                </>
              ) : (
                <>
                  <Row label="Pseudonyme" value={user.pseudo} />
                  <Row label="Nom complet" value={user.fullName || '—'} />
                  <Row label="Email" value={user.email} />
                  <Row label="Téléphone" value={user.phone || '—'} />
                  <Row label="Pays" value={user.country} />
                  <Row label="Défaites" value={String(user.losses)} />
                  <Row label="Membre depuis" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '—'} />
                  <Button variant="outline" onClick={() => setEditing(true)} className="mt-2">Modifier le profil</Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-900 flex items-center gap-2"><Trophy className="w-5 h-5" /> Succès & Badges</CardTitle>
              <CardDescription>{achievements.filter(a => a.unlocked).length} / {achievements.length} débloqués</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {achievements.map(a => (
                  <div key={a.code} className={`p-3 rounded-lg border text-center ${a.unlocked ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                    <Trophy className={`w-7 h-7 mx-auto mb-1 ${a.unlocked ? 'text-amber-500' : 'text-slate-400'}`} />
                    <p className="text-sm font-semibold">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: any; label: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${color}`}>{icon}</div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  )
}
