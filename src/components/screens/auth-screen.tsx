'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ThemeToggle } from '@/components/theme-toggle'
import { useToast } from '@/hooks/use-toast'
import {
  Trophy, Sparkles, Users, Zap, Loader2, Eye, EyeOff, ShieldCheck, Globe2,
} from 'lucide-react'

export const COUNTRIES = [
  'France', 'Belgique', 'Suisse', 'Canada', 'Maroc', 'Algérie', 'Tunisie', 'Sénégal',
  "Côte d'Ivoire", 'Cameroun', 'Mali', 'Burkina Faso', 'Bénin', 'Togo', 'Niger', 'Guinée',
  'Congo', 'Gabon', 'Madagascar', 'Espagne', 'Italie', 'Portugal', 'Allemagne',
  'Royaume-Uni', 'États-Unis', 'Brésil', 'Mexique', 'Japon', 'Chine', 'Inde', 'Autre',
]

interface Stats {
  questions: number
  categories: number
  users: number
}

export function AuthScreen() {
  const setAuth = useApp(s => s.setAuth)
  const { toast } = useToast()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)

  const [login, setLogin] = useState({ email: '', password: '' })
  const [register, setRegister] = useState({
    email: '', password: '', pseudo: '', fullName: '', country: 'France',
  })

  // Les chiffres affichés viennent de la sonde de santé : la page d'accueil
  // annonce le contenu réellement présent en base, pas une valeur codée en dur.
  useEffect(() => {
    fetch('/api/health')
      .then(r => (r.ok ? r.json() : null))
      .then(d => d?.database && setStats(d.database))
      .catch(() => setStats(null))
  }, [])

  async function submit(path: string, body: object, successTitle: string) {
    setLoading(true)
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue')
      setAuth(data.token, data.user)
      toast({ title: successTitle, description: `Bonjour ${data.user.pseudo} 👋` })
    } catch (e) {
      toast({
        title: 'Échec',
        description: e instanceof Error ? e.message : 'Erreur inconnue',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    if (!login.email || !login.password) {
      toast({ title: 'Champs requis', description: 'Renseignez votre e-mail et votre mot de passe.', variant: 'destructive' })
      return
    }
    void submit('/api/auth/login', login, 'Connexion réussie')
  }

  const handleRegister = () => {
    if (!register.email || !register.password || !register.pseudo) {
      toast({ title: 'Champs requis', description: 'Pseudonyme, e-mail et mot de passe sont obligatoires.', variant: 'destructive' })
      return
    }
    if (register.password.length < 8) {
      toast({ title: 'Mot de passe trop court', description: '8 caractères minimum.', variant: 'destructive' })
      return
    }
    void submit('/api/auth/register', register, 'Compte créé')
  }

  function fillDemo(role: 'player' | 'admin') {
    setMode('login')
    setLogin(
      role === 'player'
        ? { email: 'player@demo.fr', password: 'demo123' }
        : { email: 'admin@qvgdm.fr', password: 'admin123' }
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2">
        {/* Présentation — masquée sur mobile pour laisser la place au formulaire */}
        <div className="hidden flex-col gap-7 lg:flex">
          <div className="flex items-center gap-4">
            <div className="animate-float flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-xl">
              <Trophy className="h-9 w-9 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Qui veut gagner</h1>
              <p className="text-gradient text-5xl font-black leading-tight">20 millions ?</p>
            </div>
          </div>

          <p className="text-lg leading-relaxed text-muted-foreground">
            Défiez un adversaire en temps réel sur 20 questions. Répondez vite : chaque seconde
            gagnée rapporte des points bonus.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Feature
              icon={<Users className="h-5 w-5" />}
              title="Duels en direct"
              desc="Salon, invitations et chat de partie"
            />
            <Feature
              icon={<Zap className="h-5 w-5" />}
              title="20 s par question"
              desc="Bonus de rapidité à la clé"
            />
            <Feature
              icon={<Sparkles className="h-5 w-5" />}
              title={stats ? `${stats.questions.toLocaleString('fr-FR')} questions` : '20 catégories'}
              desc={stats ? `réparties en ${stats.categories} catégories` : 'Maths, IA, cinéma, sport…'}
            />
            <Feature
              icon={<Globe2 className="h-5 w-5" />}
              title="Classements"
              desc="Mondial, national, hebdo, mensuel"
            />
          </div>
        </div>

        {/* Formulaire */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold">20 Millions</span>
            </div>
            <CardTitle className="text-2xl">
              {mode === 'login' ? 'Content de vous revoir' : 'Créer un compte'}
            </CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Connectez-vous pour rejoindre le salon.'
                : 'Quelques secondes suffisent pour commencer à jouer.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={mode} onValueChange={v => setMode(v as 'login' | 'register')}>
              <TabsList className="mb-5 grid w-full grid-cols-2">
                <TabsTrigger value="login">Se connecter</TabsTrigger>
                <TabsTrigger value="register">S&apos;inscrire</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <Field label="Adresse e-mail" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="vous@exemple.fr"
                    value={login.email}
                    onChange={e => setLogin({ ...login, email: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                </Field>
                <Field label="Mot de passe" htmlFor="password">
                  <PasswordInput
                    id="password"
                    autoComplete="current-password"
                    value={login.password}
                    show={showPassword}
                    onToggle={() => setShowPassword(v => !v)}
                    onChange={v => setLogin({ ...login, password: v })}
                    onEnter={handleLogin}
                  />
                </Field>

                <Button onClick={handleLogin} disabled={loading} className="w-full" size="lg">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loading ? 'Connexion…' : 'Se connecter'}
                </Button>

                <div className="rounded-xl border border-dashed p-3">
                  <p className="mb-2 text-center text-xs text-muted-foreground">
                    Comptes de démonstration
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fillDemo('player')} className="gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Joueur
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fillDemo('admin')} className="gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Administrateur
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <Field label="Pseudonyme" htmlFor="pseudo" required>
                  <Input
                    id="pseudo"
                    placeholder="VotrePseudo"
                    maxLength={24}
                    value={register.pseudo}
                    onChange={e => setRegister({ ...register, pseudo: e.target.value })}
                  />
                </Field>
                <Field label="Adresse e-mail" htmlFor="email2" required>
                  <Input
                    id="email2"
                    type="email"
                    autoComplete="email"
                    placeholder="vous@exemple.fr"
                    value={register.email}
                    onChange={e => setRegister({ ...register, email: e.target.value })}
                  />
                </Field>
                <Field label="Mot de passe" htmlFor="password2" required hint="8 caractères minimum">
                  <PasswordInput
                    id="password2"
                    autoComplete="new-password"
                    value={register.password}
                    show={showPassword}
                    onToggle={() => setShowPassword(v => !v)}
                    onChange={v => setRegister({ ...register, password: v })}
                    onEnter={handleRegister}
                  />
                  <PasswordStrength value={register.password} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nom complet" htmlFor="fullname">
                    <Input
                      id="fullname"
                      placeholder="Facultatif"
                      value={register.fullName}
                      onChange={e => setRegister({ ...register, fullName: e.target.value })}
                    />
                  </Field>
                  <Field label="Pays" htmlFor="country">
                    <Select
                      value={register.country}
                      onValueChange={v => setRegister({ ...register, country: v })}
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
                  </Field>
                </div>

                <Button onClick={handleRegister} disabled={loading} className="w-full" size="lg">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loading ? 'Création…' : 'Créer mon compte'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({
  label, htmlFor, required, hint, children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function PasswordInput({
  id, value, show, onToggle, onChange, onEnter, autoComplete,
}: {
  id: string
  value: string
  show: boolean
  onToggle: () => void
  onChange: (v: string) => void
  onEnter?: () => void
  autoComplete?: string
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder="••••••••"
        className="pr-10"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

/** Jauge indicative : longueur, casse, chiffres et symboles. */
function PasswordStrength({ value }: { value: string }) {
  if (!value) return null
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^\w\s]/.test(value)) score++

  const levels = [
    { label: 'Très faible', color: 'bg-destructive' },
    { label: 'Faible', color: 'bg-destructive' },
    { label: 'Correct', color: 'bg-amber-500' },
    { label: 'Bon', color: 'bg-emerald-500' },
    { label: 'Excellent', color: 'bg-emerald-500' },
  ]
  const level = levels[Math.min(score, levels.length) - 1] ?? levels[0]

  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="flex h-1.5 flex-1 gap-1">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${i < score ? level.color : 'bg-muted'}`}
          />
        ))}
      </div>
      <span className="w-20 text-right text-[11px] text-muted-foreground">{level.label}</span>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card/60 p-3.5 backdrop-blur">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}
