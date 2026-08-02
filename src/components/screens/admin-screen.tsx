'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, FileQuestion, Tags, BarChart3, Trash2, Edit, Plus, Upload, ShieldBan, ShieldCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AdminScreen() {
  const token = useApp(s => s.token)!
  const user = useApp(s => s.user)!
  const setView = useApp(s => s.setView)
  const { toast } = useToast()
  const [tab, setTab] = useState('stats')

  if (user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldBan className="w-12 h-12 mx-auto mb-3 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground mb-4">Vous devez être administrateur pour accéder à cette section.</p>
            <Button onClick={() => setView('lobby')}>Retour au salon</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-orange-900">Administration</h1>
          <p className="text-muted-foreground">Gérez la plateforme</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4">
          <TabsTrigger value="stats"><BarChart3 className="w-4 h-4 mr-1" /> Stats</TabsTrigger>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" /> Utilisateurs</TabsTrigger>
          <TabsTrigger value="questions"><FileQuestion className="w-4 h-4 mr-1" /> Questions</TabsTrigger>
          <TabsTrigger value="categories"><Tags className="w-4 h-4 mr-1" /> Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="stats"><StatsTab headers={headers} /></TabsContent>
        <TabsContent value="users"><UsersTab headers={headers} /></TabsContent>
        <TabsContent value="questions"><QuestionsTab headers={headers} /></TabsContent>
        <TabsContent value="categories"><CategoriesTab headers={headers} /></TabsContent>
      </Tabs>
    </div>
  )
}

// ---------- Stats ----------
function StatsTab({ headers }: { headers: Record<string, string> }) {
  const [stats, setStats] = useState<any>(null)
  useEffect(() => {
    fetch('/api/admin/stats', { headers }).then(r => r.json()).then(setStats)
  }, [])
  if (!stats) return <p className="text-center py-8 text-muted-foreground">Chargement...</p>
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox icon={<Users className="w-5 h-5" />} value={stats.totalPlayers} label="Joueurs" color="text-blue-600 bg-blue-50" />
        <StatBox icon={<FileQuestion className="w-5 h-5" />} value={stats.totalQuestions} label="Questions" color="text-purple-600 bg-purple-50" />
        <StatBox icon={<Tags className="w-5 h-5" />} value={stats.totalCategories} label="Catégories" color="text-orange-600 bg-orange-50" />
        <StatBox icon={<BarChart3 className="w-5 h-5" />} value={`${stats.winRate}%`} label="Taux de victoire" color="text-green-600 bg-green-50" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-orange-900">Catégories les plus jouées</CardTitle></CardHeader>
        <CardContent>
          {stats.topCategories.length === 0 ? <p className="text-sm text-muted-foreground">Pas encore de données.</p> : (
            <div className="space-y-2">
              {stats.topCategories.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <span className="font-medium">{c.name}</span>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{c.answered} réponses</span>
                    <Badge variant="outline">{c.successRate}% réussite</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-orange-900">Questions les plus difficiles</CardTitle></CardHeader>
          <CardContent>
            {stats.hardest.length === 0 ? <p className="text-sm text-muted-foreground">Pas encore de données.</p> : (
              <div className="space-y-2">
                {stats.hardest.map((q: any, i: number) => (
                  <div key={i} className="text-sm p-2 rounded-lg bg-red-50">
                    <p className="font-medium truncate">{q.text}</p>
                    <p className="text-xs text-red-700">{Math.round(q.successRate)}% de réussite</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-orange-900">Questions les plus faciles</CardTitle></CardHeader>
          <CardContent>
            {stats.easiest.length === 0 ? <p className="text-sm text-muted-foreground">Pas encore de données.</p> : (
              <div className="space-y-2">
                {stats.easiest.map((q: any, i: number) => (
                  <div key={i} className="text-sm p-2 rounded-lg bg-green-50">
                    <p className="font-medium truncate">{q.text}</p>
                    <p className="text-xs text-green-700">{Math.round(q.successRate)}% de réussite</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatBox({ icon, value, label, color }: { icon: React.ReactNode; value: any; label: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${color}`}>{icon}</div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

// ---------- Users ----------
function UsersTab({ headers }: { headers: Record<string, string> }) {
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [q, setQ] = useState('')

  async function load() {
    const r = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { headers })
    const d = await r.json()
    setUsers(d.users || [])
  }
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const r = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`, { headers })
      const d = await r.json()
      if (!cancelled) setUsers(d.users || [])
    })()
    return () => { cancelled = true }
  }, [])

  async function makeAdmin(u: any) {
    await fetch(`/api/admin/users?id=${u.id}`, { method: 'PATCH', headers, body: JSON.stringify({ role: 'ADMIN' }) })
    toast({ title: `${u.pseudo} est maintenant admin` })
    load()
  }
  async function demoteAdmin(u: any) {
    await fetch(`/api/admin/users?id=${u.id}`, { method: 'PATCH', headers, body: JSON.stringify({ role: 'USER' }) })
    toast({ title: `${u.pseudo} n'est plus admin` })
    load()
  }
  async function deleteUser(u: any) {
    if (!confirm(`Supprimer ${u.pseudo} ?`)) return
    await fetch(`/api/admin/users?id=${u.id}`, { method: 'DELETE', headers })
    toast({ title: 'Utilisateur supprimé' })
    load()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-orange-900">Utilisateurs ({users.length})</CardTitle>
        <div className="flex gap-2">
          <Input placeholder="Rechercher..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
          <Button onClick={load}>Rechercher</Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8"><AvatarFallback className="bg-orange-200 text-orange-800 text-xs">{u.pseudo.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium text-sm">{u.pseudo}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{u.country}</TableCell>
                  <TableCell className="text-sm">
                    <p>{u.totalScore} pts · Niv. {u.level}</p>
                    <p className="text-xs text-muted-foreground">{u.wins}V / {u.losses}D</p>
                  </TableCell>
                  <TableCell><Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{u.role}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {u.role === 'ADMIN'
                        ? <Button size="sm" variant="ghost" onClick={() => demoteAdmin(u)}>Rétrograder</Button>
                        : <Button size="sm" variant="ghost" onClick={() => makeAdmin(u)}>Admin</Button>
                      }
                      <Button size="icon" variant="ghost" onClick={() => deleteUser(u)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ---------- Questions ----------
function QuestionsTab({ headers }: { headers: Record<string, string> }) {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ text: '', propositionA: '', propositionB: '', propositionC: '', propositionD: '', correctAnswer: 'A', explanation: '', difficulty: 'MEDIUM', categoryId: '' })
  const [importText, setImportText] = useState('')
  const [importCat, setImportCat] = useState('')

  async function load() {
    const url = filter === 'all' ? '/api/admin/questions' : `/api/admin/questions?categoryId=${filter}`
    const r = await fetch(url, { headers })
    const d = await r.json()
    setQuestions(d.questions || [])
  }
  async function loadCats() {
    const r = await fetch('/api/categories')
    const d = await r.json()
    setCategories(d.categories || [])
    if (d.categories?.[0]) setForm(f => ({ ...f, categoryId: f.categoryId || d.categories[0].id }))
  }
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [rc, rq] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/admin/questions', { headers }),
      ])
      const dc = await rc.json()
      const dq = await rq.json()
      if (cancelled) return
      setCategories(dc.categories || [])
      if (dc.categories?.[0]) setForm(f => ({ ...f, categoryId: f.categoryId || dc.categories[0].id }))
      setQuestions(dq.questions || [])
    })()
    return () => { cancelled = true }
  }, [])

  function openNew() {
    setEditing(null)
    setForm({ text: '', propositionA: '', propositionB: '', propositionC: '', propositionD: '', correctAnswer: 'A', explanation: '', difficulty: 'MEDIUM', categoryId: categories[0]?.id || '' })
    setShowForm(true)
  }
  function openEdit(q: any) {
    setEditing(q)
    setForm({ text: q.text, propositionA: q.propositionA, propositionB: q.propositionB, propositionC: q.propositionC, propositionD: q.propositionD, correctAnswer: q.correctAnswer, explanation: q.explanation || '', difficulty: q.difficulty, categoryId: q.categoryId })
    setShowForm(true)
  }

  async function save() {
    if (!form.text || !form.propositionA || !form.categoryId) {
      toast({ title: 'Champs requis manquants', variant: 'destructive' })
      return
    }
    const url = editing ? `/api/admin/questions?id=${editing.id}` : '/api/admin/questions'
    const method = editing ? 'PATCH' : 'POST'
    const r = await fetch(url, { method, headers, body: JSON.stringify(form) })
    if (r.ok) {
      toast({ title: editing ? 'Question modifiée' : 'Question créée' })
      setShowForm(false)
      load()
    } else {
      toast({ title: 'Erreur', variant: 'destructive' })
    }
  }

  async function del(q: any) {
    if (!confirm('Supprimer cette question ?')) return
    await fetch(`/api/admin/questions?id=${q.id}`, { method: 'DELETE', headers })
    toast({ title: 'Question supprimée' })
    load()
  }

  async function doImport() {
    if (!importCat || !importText.trim()) {
      toast({ title: 'Sélectionnez une catégorie et collez vos questions', variant: 'destructive' })
      return
    }
    try {
      // Parse CSV/TSV: text;A;B;C;D;correct(A/B/C/D)
      const lines = importText.trim().split('\n').filter(l => l.trim())
      const parsed = lines.map(line => {
        const parts = line.split(/[;\t,]/).map(s => s.trim())
        return {
          text: parts[0], propositionA: parts[1], propositionB: parts[2], propositionC: parts[3], propositionD: parts[4],
          correctAnswer: (parts[5] || 'A').toUpperCase() as 'A' | 'B' | 'C' | 'D',
          difficulty: 'MEDIUM',
        }
      }).filter(p => p.text && p.propositionA && p.propositionB && p.propositionC && p.propositionD)
      if (parsed.length === 0) {
        toast({ title: 'Format invalide. Exemple: Question;Rép A;Rép B;Rép C;Rép D;A', variant: 'destructive' })
        return
      }
      const r = await fetch('/api/admin/import', { method: 'POST', headers, body: JSON.stringify({ categoryId: importCat, questions: parsed }) })
      const d = await r.json()
      if (r.ok) {
        toast({ title: `${d.imported} questions importées` })
        setImportText('')
        load()
      } else {
        toast({ title: 'Erreur', description: d.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-orange-900">Questions ({questions.length})</CardTitle>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={v => { setFilter(v); setTimeout(load, 0) }}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={openNew} className="bg-orange-600 hover:bg-orange-700"><Plus className="w-4 h-4 mr-1" /> Nouvelle</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[40vh]">
            <div className="space-y-1">
              {questions.map(q => (
                <div key={q.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{q.text}</p>
                    <p className="text-xs text-muted-foreground">{q.category.name} · {q.difficulty} · Bonne: {q.correctAnswer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(q)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del(q)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-orange-900 flex items-center gap-2"><Upload className="w-5 h-5" /> Importer en masse (CSV)</CardTitle>
          <CardDescription>Format: question;répA;répB;répC;répD;A (ou B/C/D)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={importCat} onValueChange={setImportCat}>
            <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={"Combien font 2+2;1;2;3;4;D\nCapitale de la France;Lyon;Paris;Marseille;Nice;B"}
            className="font-mono text-sm"
            rows={6}
          />
          <Button onClick={doImport} className="bg-orange-600 hover:bg-orange-700"><Upload className="w-4 h-4 mr-1" /> Importer</Button>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="border-orange-300">
          <CardHeader><CardTitle className="text-orange-900">{editing ? 'Modifier la question' : 'Nouvelle question'}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} rows={2} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Proposition A</Label>
                <Input value={form.propositionA} onChange={e => setForm({ ...form, propositionA: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Proposition B</Label>
                <Input value={form.propositionB} onChange={e => setForm({ ...form, propositionB: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Proposition C</Label>
                <Input value={form.propositionC} onChange={e => setForm({ ...form, propositionC: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Proposition D</Label>
                <Input value={form.propositionD} onChange={e => setForm({ ...form, propositionD: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Bonne réponse</Label>
                <Select value={form.correctAnswer} onValueChange={v => setForm({ ...form, correctAnswer: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulté</Label>
                <Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Facile</SelectItem>
                    <SelectItem value="MEDIUM">Moyenne</SelectItem>
                    <SelectItem value="HARD">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.categoryId} onValueChange={v => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Explication (optionnel)</Label>
              <Input value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={save} className="bg-orange-600 hover:bg-orange-700">Enregistrer</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------- Categories ----------
function CategoriesTab({ headers }: { headers: Record<string, string> }) {
  const { toast } = useToast()
  const [cats, setCats] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', icon: '', color: '' })

  async function load() {
    const r = await fetch('/api/admin/categories', { headers })
    const d = await r.json()
    setCats(d.categories || [])
  }
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const r = await fetch('/api/admin/categories', { headers })
      const d = await r.json()
      if (!cancelled) setCats(d.categories || [])
    })()
    return () => { cancelled = true }
  }, [])

  async function save() {
    if (!form.name) { toast({ title: 'Nom requis', variant: 'destructive' }); return }
    const r = await fetch('/api/admin/categories', { method: 'POST', headers, body: JSON.stringify(form) })
    if (r.ok) {
      toast({ title: 'Catégorie créée' })
      setForm({ name: '', description: '', icon: '', color: '' })
      setShowForm(false)
      load()
    }
  }

  async function del(c: any) {
    if (!confirm(`Supprimer "${c.name}" ?`)) return
    const r = await fetch(`/api/admin/categories?id=${c.id}`, { method: 'DELETE', headers })
    const d = await r.json()
    if (r.ok) { toast({ title: 'Catégorie supprimée' }); load() }
    else toast({ title: 'Impossible', description: d.error, variant: 'destructive' })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-orange-900">Catégories ({cats.length})</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} className="bg-orange-600 hover:bg-orange-700"><Plus className="w-4 h-4 mr-1" /> Nouvelle</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="p-3 rounded-lg border border-orange-200 space-y-3">
            <div className="grid sm:grid-cols-2 gap-2">
              <Input placeholder="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Icône (Lucide)" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
            </div>
            <Input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Input placeholder="Couleur (hex)" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
            <Button onClick={save} className="bg-orange-600 hover:bg-orange-700">Créer</Button>
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-2">
          {cats.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white" style={{ background: c.color || '#f97316' }}>
                  {c.name.slice(0, 1)}
                </div>
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c._count?.questions || 0} questions</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => del(c)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
