'use client'

import { useEffect, useRef } from 'react'

/**
 * Pluie de confettis dessinée sur un canvas, jouée une seule fois à la
 * victoire. Aucune dépendance externe, et l'animation s'arrête d'elle-même
 * quand toutes les particules sont sorties de l'écran.
 *
 * L'effet est ignoré si l'utilisateur a demandé une réduction des animations.
 */
export function Confetti({ duration = 3200 }: { duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const colors = ['#f59e0b', '#f97316', '#10b981', '#3b82f6', '#a855f7', '#ef4444']
    const particles = Array.from({ length: 130 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      speed: 2 + Math.random() * 3.5,
      drift: -1 + Math.random() * 2,
      angle: Math.random() * Math.PI * 2,
      spin: -0.12 + Math.random() * 0.24,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))

    const startedAt = performance.now()
    let frame = 0

    const render = (now: number) => {
      const elapsed = now - startedAt
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      // Les particules s'estompent sur le dernier tiers de l'animation.
      const fade = elapsed > duration * 0.7 ? Math.max(0, 1 - (elapsed - duration * 0.7) / (duration * 0.3)) : 1

      for (const p of particles) {
        p.y += p.speed
        p.x += p.drift
        p.angle += p.spin

        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()

        if (p.y > window.innerHeight + 30) {
          p.y = -20
          p.x = Math.random() * window.innerWidth
        }
      }

      if (elapsed < duration) frame = requestAnimationFrame(render)
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [duration])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  )
}
