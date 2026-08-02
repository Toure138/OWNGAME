'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Le thème résolu n'est connu qu'après hydratation : on rend un emplacement
  // de même taille pour éviter tout décalage de mise en page.
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={isDark ? 'Passer en thème clair' : 'Passer en thème sombre'}
      title={isDark ? 'Thème clair' : 'Thème sombre'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {mounted ? (
        isDark ? (
          <Sun className="h-[1.15rem] w-[1.15rem]" />
        ) : (
          <Moon className="h-[1.15rem] w-[1.15rem]" />
        )
      ) : (
        <span className="h-[1.15rem] w-[1.15rem]" />
      )}
    </Button>
  )
}
