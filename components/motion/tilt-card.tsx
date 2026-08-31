"use client"

import * as React from "react"
import { useReducedMotion } from "@/components/motion/use-reduced-motion"

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /** Maximum rotation in degrees. */
  strength?: number
}

/**
 * Wraps children with a subtle 3D tilt that follows the pointer, plus a
 * cursor-tracked highlight. Respects reduced motion by disabling the effect.
 */
export function TiltCard({ children, strength = 6, className = "", style, ...rest }: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [transform, setTransform] = React.useState("")
  const [glow, setGlow] = React.useState({ x: 50, y: 50, active: false })
  const reducedMotion = useReducedMotion()

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    const rotateY = (px - 0.5) * strength * 2
    const rotateX = (0.5 - py) * strength * 2
    setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`)
    setGlow({ x: px * 100, y: py * 100, active: true })
  }

  const handlePointerLeave = () => {
    setTransform("")
    setGlow((g) => ({ ...g, active: false }))
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transform: transform || undefined, ...style }}
      {...rest}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300"
        style={{
          opacity: glow.active ? 1 : 0,
          background: `radial-gradient(220px circle at ${glow.x}% ${glow.y}%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 70%)`,
        }}
      />
      {children}
    </div>
  )
}
