'use client'

import { useApp } from '@/lib/store'
import { respondInvite } from '@/hooks/use-realtime'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sword, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useEffect, useState } from 'react'

export function InvitationModal() {
  const invitations = useApp(s => s.invitations)
  const removeInvitation = useApp(s => s.removeInvitation)
  const categoryFilter = useApp(s => s.categoryFilter)
  const setCategoryFilter = useApp(s => s.setCategoryFilter)
  const token = useApp(s => s.token)
  const { toast } = useToast()
  const [categories, setCategories] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => {
      const m: Record<string, string> = {}
      for (const c of d.categories || []) m[c.id] = c.name
      setCategories(m)
    })
  }, [])

  const current = invitations[0]
  if (!current || !token) return null

  async function respond(accept: boolean) {
    if (!current) return
    const r = await respondInvite(token!, current.id, accept)
    if (r.ok) {
      if (accept) {
        toast({ title: 'Invitation acceptée', description: 'La partie va commencer...' })
        if (current.categoryFilter) setCategoryFilter(current.categoryFilter)
      } else {
        toast({ title: 'Invitation refusée' })
      }
    } else {
      toast({ title: 'Erreur', description: r.error, variant: 'destructive' })
    }
    removeInvitation(current.id)
  }

  const catName = current.categoryFilter ? categories[current.categoryFilter] || 'Catégorie' : 'Aléatoire'

  return (
    <Dialog open={true} onOpenChange={() => respond(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-900">
            <Sword className="w-5 h-5 text-orange-600" />
            Défi reçu !
          </DialogTitle>
          <DialogDescription>
            Un joueur souhaite vous affronter
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-50">
          <Avatar className="w-14 h-14">
            <AvatarFallback className="bg-orange-200 text-orange-800 font-bold text-lg">
              {current.fromPseudo.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-lg text-orange-900">{current.fromPseudo}</p>
            <p className="text-sm text-orange-700">Catégorie : {catName}</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => respond(false)} className="gap-1">
            <X className="w-4 h-4" /> Refuser
          </Button>
          <Button onClick={() => respond(true)} className="bg-orange-600 hover:bg-orange-700 gap-1">
            <Sword className="w-4 h-4" /> Accepter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
