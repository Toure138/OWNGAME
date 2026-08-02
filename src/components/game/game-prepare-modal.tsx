'use client'

import { useState } from 'react'
import { useApp } from '@/lib/store'
import { startGame } from '@/hooks/use-realtime'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Swords } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface QuestionDTO {
  id: string
  text: string
  propositionA: string
  propositionB: string
  propositionC: string
  propositionD: string
  correctAnswer: 'A' | 'B' | 'C' | 'D'
  explanation?: string | null
  categoryId: string
}

interface Props {
  opponent: { opponentId: string; opponentPseudo: string; opponentAvatarUrl: string | null; categoryFilter: string | null }
  onClose: () => void
}

export function GamePrepareModal({ opponent, onClose }: Props) {
  const user = useApp(s => s.user)!
  const token = useApp(s => s.token)!
  const setView = useApp(s => s.setView)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function startGameHandler() {
    setLoading(true)
    try {
      const url = opponent.categoryFilter
        ? `/api/questions/random?categoryId=${opponent.categoryFilter}&limit=20`
        : `/api/questions/random?limit=20`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      const questions: QuestionDTO[] = data.questions
      if (questions.length < 5) {
        throw new Error('Pas assez de questions dans cette catégorie (minimum 5)')
      }

      const r = await startGame(token, opponent.opponentId, opponent.categoryFilter, questions.map(q => ({
        questionId: q.id,
        text: q.text,
        propositions: { A: q.propositionA, B: q.propositionB, C: q.propositionC, D: q.propositionD },
        correct: q.correctAnswer,
        explanation: q.explanation,
        categoryId: q.categoryId,
      })))

      if (r.ok) {
        toast({ title: 'Partie lancée !', description: 'Bonne chance 🎯' })
        setView('game')
        onClose()
      } else {
        throw new Error(r.error || 'Erreur')
      }
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' })
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-900">
            <Swords className="w-5 h-5 text-orange-600" /> Adversaire prêt !
          </DialogTitle>
          <DialogDescription>
            {opponent.opponentPseudo} a accepté votre défi. Lancez la partie !
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-4 p-6">
          <div className="text-center">
            <Avatar className="w-16 h-16 mx-auto mb-2">
              <AvatarFallback className="bg-orange-200 text-orange-800 font-bold text-xl">
                {user.pseudo.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold">{user.pseudo}</p>
            <p className="text-xs text-muted-foreground">Niv. {user.level}</p>
          </div>
          <div className="text-2xl font-black text-orange-600">VS</div>
          <div className="text-center">
            <Avatar className="w-16 h-16 mx-auto mb-2">
              <AvatarFallback className="bg-amber-200 text-amber-800 font-bold text-xl">
                {opponent.opponentPseudo.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold">{opponent.opponentPseudo}</p>
            <p className="text-xs text-muted-foreground">Adversaire</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={startGameHandler} disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Préparation...</> : '🚀 Démarrer la partie'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
