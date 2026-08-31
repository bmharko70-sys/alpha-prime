"use client"

import * as React from "react"
import { useReducedMotion } from "@/components/motion/use-reduced-motion"

interface BootLogProps {
  lines: string[]
  className?: string
  lineDelay?: number
}

/**
 * Reveals a sequence of terminal-style log lines one at a time, each with a
 * brief "pending" state before it resolves to OK. Purely decorative status
 * theater for a boot/startup sequence.
 */
export function BootLog({ lines, className = "", lineDelay = 420 }: BootLogProps) {
  const reducedMotion = useReducedMotion()
  const [resolved, setResolved] = React.useState(reducedMotion ? lines.length : 0)

  React.useEffect(() => {
    if (reducedMotion) {
      setResolved(lines.length)
      return
    }
    if (resolved >= lines.length) return
    const timer = setTimeout(() => setResolved((count) => count + 1), lineDelay)
    return () => clearTimeout(timer)
  }, [resolved, lines.length, lineDelay, reducedMotion])

  return (
    <div className={`space-y-1.5 font-mono text-[11px] ${className}`} aria-live="polite">
      {lines.map((line, index) => {
        const isVisible = index < resolved
        const isPending = index === resolved
        if (!isVisible && !isPending) return null
        return (
          <div
            key={line}
            className={`flex items-center justify-between gap-3 transition-opacity duration-300 ${isVisible || isPending ? "opacity-100" : "opacity-0"}`}
          >
            <span className="text-slate-500">
              <span className="text-cyan-200/50">{">"}</span> {line}
            </span>
            <span className={isVisible ? "text-cyan-300" : "text-slate-600 status-breathe"}>{isVisible ? "OK" : "···"}</span>
          </div>
        )
      })}
    </div>
  )
}
