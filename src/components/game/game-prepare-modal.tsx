'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { startGame } from '@/hooks/use-realtime'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlayerAvatar } from '@/components/ui/player-avatar'
import { Loader2, Swords, Rocket } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Props {
  opponent: {
    opponentId: string
    opponentPseudo: string
    opponentAvatarUrl: string | null
    categoryFilter: string | null
    /** Longueur fixée à l'invitation, relayée telle quelle au lancement. */
    questionCount: number
  }
  onClose: () => void
}

export function GamePrepareModal({ opponent, onClose }: Props) {
  const user = useApp(s => s.user)!
  const token = useApp(s => s.token)!
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categoryName, setCategoryName] = useState<string | null>(null)

  useEffect(() => {
    if (!opponent.categoryFilter) return
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => {
        const found = (d.categories || []).find(
          (c: { id: string }) => c.id === opponent.categoryFilter
        )
        setCategoryName(found?.name ?? null)
      })
      .catch(() => setCategoryName(null))
  }, [opponent.categoryFilter])

  // Les questions sont tirées par le serveur : le client n'envoie que
  // l'adversaire, la catégorie et la longueur convenue.
  async function launch() {
    setLoading(true)
    const result = await startGame(
      token,
      opponent.opponentId,
      opponent.categoryFilter,
      opponent.questionCount
    )
    if (result.ok) {
      toast({ title: 'Partie lancée', description: 'Bonne chance 🎯' })
      onClose()
    } else {
      toast({
        title: 'Impossible de lancer la partie',
        description: result.error,
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => !loading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" /> Adversaire prêt
          </DialogTitle>
          <DialogDescription>
            {opponent.opponentPseudo} a accepté votre défi. Lancez la partie quand vous voulez.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-6 py-5">
          <PlayerSide name={user.pseudo} avatar={user.avatarUrl} caption={`Niveau ${user.level}`} />
          <div className="text-2xl font-black text-primary">VS</div>
          <PlayerSide
            name={opponent.opponentPseudo}
            avatar={opponent.opponentAvatarUrl}
            caption="Adversaire"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <Badge variant="secondary">{opponent.questionCount} questions</Badge>
          <Badge variant="secondary">20 s par question</Badge>
          <Badge variant="secondary">
            {opponent.categoryFilter ? (categoryName ?? 'Catégorie choisie') : 'Toutes catégories'}
          </Badge>
        </div>

        <DialogFooter className="mt-2">
          <Button onClick={launch} disabled={loading} size="lg" className="w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Préparation…
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" /> Démarrer la partie
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PlayerSide({
  name, avatar, caption,
}: {
  name: string
  avatar?: string | null
  caption: string
}) {
  return (
    <div className="text-center">
      <PlayerAvatar name={name} src={avatar} className="mx-auto mb-2 h-16 w-16 text-xl" />
      <p className="max-w-[7rem] truncate font-semibold">{name}</p>
      <p className="text-xs text-muted-foreground">{caption}</p>
    </div>
  )
}
