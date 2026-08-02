'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// Couleur de repli dérivée du pseudo : deux joueurs différents obtiennent des
// pastilles distinctes, et la même personne garde toujours la même couleur.
const PALETTE = [
  'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'bg-teal-500/15 text-teal-700 dark:text-teal-300',
  'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
]

function colorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export function PlayerAvatar({
  name,
  src,
  className,
  status,
}: {
  name: string
  src?: string | null
  className?: string
  status?: 'AVAILABLE' | 'IN_GAME' | null
}) {
  return (
    <div className="relative shrink-0">
      <Avatar className={cn('h-11 w-11', className)}>
        {src ? <AvatarImage src={src} alt={name} /> : null}
        <AvatarFallback className={cn('font-bold', colorFor(name))}>
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {status && (
        <span
          aria-label={status === 'AVAILABLE' ? 'Disponible' : 'En partie'}
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background',
            status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500'
          )}
        />
      )}
    </div>
  )
}
