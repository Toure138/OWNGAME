'use client'

import { cn } from '@/lib/utils'

/**
 * Chronomètre circulaire.
 *
 * L'anneau se vide sur toute la durée de la question ; la couleur bascule vers
 * l'ambre puis le rouge dans les cinq dernières secondes, de sorte que
 * l'urgence reste perceptible sans dépendre uniquement de la couleur (la valeur
 * numérique reste affichée au centre).
 */
export function TimerRing({
  remaining,
  total,
  size = 76,
  className,
}: {
  remaining: number
  total: number
  size?: number
  className?: string
}) {
  const stroke = size >= 70 ? 6 : 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  const urgent = remaining <= 5
  const warning = remaining <= 10 && !urgent

  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
      role="timer"
      aria-live="off"
      aria-label={`${remaining} secondes restantes`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          className={cn(
            'transition-[stroke-dashoffset,stroke] duration-1000 ease-linear',
            urgent ? 'stroke-destructive' : warning ? 'stroke-amber-500' : 'stroke-primary'
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'text-xl font-bold tabular-nums leading-none',
            urgent && 'animate-pulse text-destructive'
          )}
        >
          {remaining}
        </span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">sec</span>
      </div>
    </div>
  )
}
