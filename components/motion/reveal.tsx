"use client"

import * as React from "react"
import { useReducedMotion } from "@/components/motion/use-reduced-motion"

type RevealVariant = "up" | "fade" | "scale"

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: RevealVariant
  /** 0-6, maps to staggered animation-delay steps */
  delay?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Reveal immediately on mount instead of waiting for scroll into view */
  immediate?: boolean
  as?: React.ElementType
}

const variantClass: Record<RevealVariant, string> = {
  up: "",
  fade: "reveal-fade",
  scale: "reveal-scale",
}

/**
 * Reveals its children with a subtle entrance animation, either immediately
 * on mount or the first time it scrolls into view. Respects reduced motion.
 */
export function Reveal({
  children,
  variant = "up",
  delay = 0,
  immediate = false,
  as: Component = "div",
  className = "",
  ...rest
}: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)
  const reducedMotion = useReducedMotion()

  React.useEffect(() => {
    if (immediate || reducedMotion) {
      setVisible(true)
      return
    }
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [immediate, reducedMotion])

  const delayClass = delay > 0 ? `reveal-delay-${delay}` : ""

  return (
    <Component
      ref={ref}
      className={`reveal ${variantClass[variant]} ${delayClass} ${visible ? "reveal-visible" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Component>
  )
}
