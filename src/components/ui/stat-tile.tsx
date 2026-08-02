'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

type Tone = 'primary' | 'success' | 'danger' | 'info' | 'violet' | 'neutral'

// Chaque ton n'agit que sur la pastille d'icône : la valeur reste dans la
// couleur de texte par défaut, pour rester lisible dans les deux thèmes.
const TONES: Record<Tone, string> = {
  primary: 'bg-primary/12 text-primary',
  success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
  danger: 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
  info: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  violet: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
  neutral: 'bg-muted text-muted-foreground',
}

export function StatTile({
  icon,
  value,
  label,
  hint,
  tone = 'primary',
  className,
}: {
  icon?: React.ReactNode
  value: React.ReactNode
  label: string
  hint?: string
  tone?: Tone
  className?: string
}) {
  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-4">
        {icon && (
          <div
            className={cn(
              'mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl',
              TONES[tone]
            )}
          >
            {icon}
          </div>
        )}
        {/* `tabular-nums` évite que la largeur saute quand la valeur change. */}
        <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{hint}</p>}
      </CardContent>
    </Card>
  )
}
