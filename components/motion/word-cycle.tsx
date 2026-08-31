"use client"

import * as React from "react"
import { useReducedMotion } from "@/components/motion/use-reduced-motion"

interface WordCycleProps {
  words: string[]
  className?: string
  interval?: number
}

/**
 * Cycles through a list of words with a typewriter-style type/delete effect.
 * Respects reduced motion by statically showing the first word.
 */
export function WordCycle({ words, className = "", interval = 2200 }: WordCycleProps) {
  const [wordIndex, setWordIndex] = React.useState(0)
  const [text, setText] = React.useState("")
  const [phase, setPhase] = React.useState<"typing" | "pausing" | "deleting">("typing")
  const reducedMotion = useReducedMotion()

  React.useEffect(() => {
    if (reducedMotion) {
      setText(words[0] ?? "")
      return
    }
    const current = words[wordIndex] ?? ""
    let timeout: ReturnType<typeof setTimeout>

    if (phase === "typing") {
      if (text.length < current.length) {
        timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), 55)
      } else {
        timeout = setTimeout(() => setPhase("pausing"), interval)
      }
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("deleting"), 40)
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(current.slice(0, text.length - 1)), 30)
      } else {
        setWordIndex((index) => (index + 1) % words.length)
        setPhase("typing")
      }
    }
    return () => clearTimeout(timeout)
  }, [text, phase, wordIndex, words, interval, reducedMotion])

  return (
    <span className={className}>
      {text}
      {!reducedMotion && <span className="ml-0.5 inline-block w-[2px] animate-pulse-glow bg-current align-middle" style={{ height: "0.8em" }} aria-hidden="true" />}
    </span>
  )
}
