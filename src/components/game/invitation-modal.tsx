'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { respondInvite } from '@/hooks/use-realtime'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Swords, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

/** Durée de vie d'une invitation côté serveur (`GAME_CONFIG.invitationTtlMs`). */
const INVITE_TTL_MS = 60_000

export function InvitationModal() {
  const invitations = useApp(s => s.invitations)
  const removeInvitation = useApp(s => s.removeInvitation)
  const token = useApp(s => s.token)
  const { toast } = useToast()
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [remaining, setRemaining] = useState(INVITE_TTL_MS)
  const [responding, setResponding] = useState(false)

  const current = invitations[0]

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, string> = {}
        for (const c of d.categories || []) map[c.id] = c.name
        setCategories(map)
      })
      .catch(() => setCategories({}))
  }, [])

  // Compte à rebours visuel, calé sur l'expiration côté serveur.
  useEffect(() => {
    if (!current) return
    const tick = () => setRemaining(Math.max(0, INVITE_TTL_MS - (Date.now() - current.createdAt)))
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [current])

  if (!current || !token) return null

  async function respond(accept: boolean) {
    if (!current || responding) return
    setResponding(true)
    const result = await respondInvite(token!, current.id, accept)
    if (result.ok) {
      toast(
        accept
          ? { title: 'Défi accepté', description: 'La partie va démarrer…' }
          : { title: 'Défi refusé' }
      )
    } else {
      toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
    }
    removeInvitation(current.id)
    setResponding(false)
  }

  const categoryLabel = current.categoryFilter
    ? (categories[current.categoryFilter] ?? 'Catégorie choisie')
    : 'Toutes catégories'
  const seconds = Math.ceil(remaining / 1000)

  return (
    <Dialog open onOpenChange={() => respond(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" /> Défi reçu
          </DialogTitle>
          <DialogDescription>Un joueur souhaite vous affronter.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 rounded-xl border bg-accent/40 p-4">
          <PlayerAvatar
            name={current.fromPseudo}
            src={current.fromAvatarUrl}
            className="h-14 w-14 text-lg"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{current.fromPseudo}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {current.fromLevel ? (
                <Badge variant="secondary" className="text-[10px]">
                  Niveau {current.fromLevel}
                </Badge>
              ) : null}
              <Badge variant="outline" className="text-[10px]">
                {categoryLabel}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Réponse attendue</span>
            <span className="tabular-nums">{seconds} s</span>
          </div>
          <Progress value={(remaining / INVITE_TTL_MS) * 100} className="h-1.5" />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => respond(false)}
            disabled={responding}
            className="gap-1.5"
          >
            <X className="h-4 w-4" /> Refuser
          </Button>
          <Button onClick={() => respond(true)} disabled={responding} className="gap-1.5">
            <Swords className="h-4 w-4" /> Accepter le défi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
