'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Sparkles, Users, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const COUNTRIES = ['France', 'Belgique', 'Suisse', 'Canada', 'Maroc', 'Algérie', 'Tunisie', 'Sénégal', 'Côte d\'Ivoire', 'Cameroun', 'Espagne', 'Italie', 'Portugal', 'Allemagne', 'Royaume-Uni', 'États-Unis', 'Brésil', 'Mexique', 'Japon', 'Chine', 'Autre']

export function AuthScreen() {
  const setAuth = useApp(s => s.setAuth)
  const { toast } = useToast()
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPseudo, setRegPseudo] = useState('')
  const [regFullName, setRegFullName] = useState('')
  const [regCountry, setRegCountry] = useState('France')

  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!loginEmail || !loginPassword) {
      toast({ title: 'Erreur', description: 'Email et mot de passe requis', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setAuth(data.token, data.user)
      toast({ title: 'Bienvenue', description: `Connecté en tant que ${data.user.pseudo}` })
    } catch (e: any) {
      toast({ title: 'Échec de connexion', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    if (!regEmail || !regPassword || !regPseudo) {
      toast({ title: 'Erreur', description: 'Email, mot de passe et pseudo requis', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword, pseudo: regPseudo, fullName: regFullName, country: regCountry }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setAuth(data.token, data.user)
      toast({ title: 'Compte créé', description: `Bienvenue ${data.user.pseudo} !` })
    } catch (e: any) {
      toast({ title: 'Échec de l\'inscription', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(role: 'player' | 'admin') {
    if (role === 'player') {
      setLoginEmail('player@demo.fr')
      setLoginPassword('demo123')
    } else {
      setLoginEmail('admin@qvgdm.fr')
      setLoginPassword('admin123')
    }
    setMode('login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex flex-col gap-6 p-8">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl">
              <Trophy className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-orange-900">Qui veut gagner</h1>
              <p className="text-5xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">20 millions ?</p>
            </div>
          </div>
          <p className="text-lg text-orange-900/80 leading-relaxed">
            Affrontez d'autres joueurs en temps réel sur 20 questions de culture générale.
            Montez dans le classement, débloquez des succès et devenez le champion !
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Feature icon={<Users className="w-5 h-5" />} title="Multijoueur temps réel" desc="Affrontez des joueurs du monde entier" />
            <Feature icon={<Zap className="w-5 h-5" />} title="20 sec / question" desc="Un rythme soutenu" />
            <Feature icon={<Sparkles className="w-5 h-5" />} title="20 catégories" desc="Maths, IA, cinéma, sport..." />
            <Feature icon={<Trophy className="w-5 h-5" />} title="Classements & succès" desc="Mondial, national, hebdo..." />
          </div>
        </div>

        <Card className="border-orange-200 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-900">Connexion</CardTitle>
            <CardDescription>Accédez à votre compte ou créez-en un nouveau</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Se connecter</TabsTrigger>
                <TabsTrigger value="register">S'inscrire</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="vous@exemple.fr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                </div>
                <Button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
                <div className="text-xs text-center text-muted-foreground">
                  <p>Comptes de démonstration :</p>
                  <div className="flex gap-2 justify-center mt-1">
                    <Button variant="outline" size="sm" onClick={() => fillDemo('player')}>Joueur</Button>
                    <Button variant="outline" size="sm" onClick={() => fillDemo('admin')}>Admin</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pseudo">Pseudonyme *</Label>
                  <Input id="pseudo" value={regPseudo} onChange={e => setRegPseudo(e.target.value)} placeholder="VotrePseudo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullname">Nom complet (optionnel)</Label>
                  <Input id="fullname" value={regFullName} onChange={e => setRegFullName(e.target.value)} placeholder="Prénom Nom" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email *</Label>
                  <Input id="email2" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="vous@exemple.fr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Mot de passe * (min 6)</Label>
                  <Input id="password2" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Select value={regCountry} onValueChange={setRegCountry}>
                    <SelectTrigger id="country"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleRegister} disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                  {loading ? 'Création...' : 'Créer mon compte'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/60 backdrop-blur border border-orange-100">
      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">{icon}</div>
      <div>
        <p className="font-semibold text-sm text-orange-900">{title}</p>
        <p className="text-xs text-orange-900/70">{desc}</p>
      </div>
    </div>
  )
}
