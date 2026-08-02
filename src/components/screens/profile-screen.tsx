'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { COUNTRIES } from '@/components/screens/auth-screen'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { StatTile } from '@/components/ui/stat-tile'
import { useToast } from '@/hooks/use-toast'
import {
  Trophy, Target, Star, TrendingUp, Save, Crown, Flame, Loader2, Globe2, KeyRound, Shield,
} from 'lucide-react'

export function ProfileScreen() {
  const user = useApp(s => s.user)!
  const token = useApp(s => s.token)!
  const updateUser = useApp(s => s.updateUser)
  const setView = useApp(s => s.setView)
  const { toast } = useToast()

  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    pseudo: user.pseudo,
    fullName: user.fullName || '',
    country: user.country,
    avatarUrl: user.avatarUrl || '',
    phone: user.phone || '',
  })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })

  // Le rang mondial et les compteurs sont recalculés à l'ouverture de l'écran :
  // ils ont pu changer depuis la dernière partie.
  useEffect(() => {
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : null))
      .then(d => d?.user && updateUser(d.user))
      .catch(() => undefined)
  }, [token, updateUser])

  async function saveProfile() {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateUser(data.user)
      toast({ title: 'Profil mis à jour' })
    } catch (e) {
      toast({
        title: 'Échec de la mise à jour',
        description: e instanceof Error ? e.message : 'Erreur inconnue',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (passwords.newPassword !== passwords.confirm) {
      toast({
        title: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      })
      return
    }
    if (passwords.newPassword.length < 8) {
      toast({ title: 'Mot de passe trop court', description: '8 caractères minimum.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' })
      toast({ title: 'Mot de passe modifié' })
    } catch (e) {
      toast({
        title: 'Échec',
        description: e instanceof Error ? e.message : 'Erreur inconnue',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const winRate = user.gamesPlayed > 0 ? Math.round((user.wins / user.gamesPlayed) * 100) : 0
  const xpInLevel = user.xp % 500

  return (
    <div className="container mx-auto max-w-5xl px-3 sm:px-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Carte d'identité */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6 text-center">
            <PlayerAvatar
              name={user.pseudo}
              src={user.avatarUrl}
              className="mx-auto mb-3 h-24 w-24 text-2xl"
            />
            <h2 className="text-xl font-bold">{user.pseudo}</h2>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>

            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <Badge variant="outline" className="gap-1">
                <Globe2 className="h-3 w-3" /> {user.country}
              </Badge>
              {user.role === 'ADMIN' && (
                <Badge className="gap-1">
                  <Shield className="h-3 w-3" /> Administrateur
                </Badge>
              )}
            </div>

            {user.rank && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                <Crown className="h-3.5 w-3.5" /> Rang mondial #{user.rank}
                {user.nationalRank && (
                  <span className="text-xs opacity-80">· #{user.nationalRank} national</span>
                )}
              </div>
            )}

            <div className="mt-5 rounded-xl bg-muted/60 p-3 text-left">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium">Niveau {user.level}</span>
                <span className="tabular-nums text-muted-foreground">{xpInLevel} / 500 XP</span>
              </div>
              <Progress value={(xpInLevel / 500) * 100} className="h-2" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {500 - xpInLevel} XP avant le niveau {user.level + 1}
              </p>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" onClick={() => setView('achievements')} className="gap-2">
                <Star className="h-4 w-4" /> Mes succès
              </Button>
              {user.role === 'ADMIN' && (
                <Button variant="outline" onClick={() => setView('admin')} className="gap-2">
                  <Shield className="h-4 w-4" /> Administration
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistiques et réglages */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              icon={<Trophy className="h-4 w-4" />}
              value={user.totalScore.toLocaleString('fr-FR')}
              label="Score total"
              tone="primary"
            />
            <StatTile
              icon={<Target className="h-4 w-4" />}
              value={user.gamesPlayed}
              label="Parties jouées"
              tone="info"
            />
            <StatTile
              icon={<Star className="h-4 w-4" />}
              value={user.wins}
              label="Victoires"
              hint={`${user.losses} défaite${user.losses > 1 ? 's' : ''}`}
              tone="success"
            />
            <StatTile
              icon={<TrendingUp className="h-4 w-4" />}
              value={`${winRate}%`}
              label="Taux de victoire"
              tone="violet"
            />
          </div>

          {(user.bestStreak ?? 0) > 0 && (
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="flex items-center gap-3 p-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">
                    Meilleure série : {user.bestStreak} bonnes réponses d&apos;affilée
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enchaînez sans erreur pour battre votre record.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Paramètres du compte</CardTitle>
              <CardDescription>Modifiez vos informations et votre mot de passe.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="infos">
                <TabsList className="mb-4 grid w-full grid-cols-2">
                  <TabsTrigger value="infos">Informations</TabsTrigger>
                  <TabsTrigger value="security">Sécurité</TabsTrigger>
                </TabsList>

                <TabsContent value="infos" className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pseudo">Pseudonyme</Label>
                      <Input
                        id="pseudo"
                        value={profile.pseudo}
                        maxLength={24}
                        onChange={e => setProfile({ ...profile, pseudo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fullname">Nom complet</Label>
                      <Input
                        id="fullname"
                        value={profile.fullName}
                        onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Pays</Label>
                      <Select
                        value={profile.country}
                        onValueChange={v => setProfile({ ...profile, country: v })}
                      >
                        <SelectTrigger id="country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {COUNTRIES.map(c => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        placeholder="Facultatif"
                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="avatar">URL de l&apos;avatar</Label>
                    <Input
                      id="avatar"
                      value={profile.avatarUrl}
                      placeholder="https://exemple.fr/photo.jpg"
                      onChange={e => setProfile({ ...profile, avatarUrl: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Laissez vide pour utiliser les initiales de votre pseudonyme.
                    </p>
                  </div>

                  <Button onClick={saveProfile} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer les modifications
                  </Button>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current">Mot de passe actuel</Label>
                    <Input
                      id="current"
                      type="password"
                      autoComplete="current-password"
                      value={passwords.currentPassword}
                      onChange={e =>
                        setPasswords({ ...passwords, currentPassword: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new">Nouveau mot de passe</Label>
                      <Input
                        id="new"
                        type="password"
                        autoComplete="new-password"
                        value={passwords.newPassword}
                        onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirmation</Label>
                      <Input
                        id="confirm"
                        type="password"
                        autoComplete="new-password"
                        value={passwords.confirm}
                        onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    8 caractères minimum. Mélangez majuscules, chiffres et symboles.
                  </p>
                  <Button
                    onClick={changePassword}
                    disabled={saving || !passwords.currentPassword || !passwords.newPassword}
                    className="gap-2"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Modifier le mot de passe
                  </Button>

                  <div className="rounded-xl border p-3 text-xs text-muted-foreground">
                    <p className="mb-1 font-medium text-foreground">Compte créé le</p>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
