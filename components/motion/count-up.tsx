"use client"

import * as React from "react"
import { useReducedMotion } from "@/components/motion/use-reduced-motion"

interface CountUpProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
}

/**
 * Animates a number counting up from 0 to `end` once it scrolls into view.
 * Respects reduced motion by rendering the final value immediately.
 */
export function CountUp({ end, duration = 1400, suffix = "", prefix = "", className = "" }: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [value, setValue] = React.useState(0)
  const reducedMotion = useReducedMotion()

  React.useEffect(() => {
    if (reducedMotion) {
      setValue(end)
      return
    }
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        observer.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setValue(Math.round(eased * end))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [end, duration, reducedMotion])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value}
      {suffix}
    </span>
  )
}
