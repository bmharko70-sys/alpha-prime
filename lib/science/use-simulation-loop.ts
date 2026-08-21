"use client"

import * as React from "react"

/**
 * Shared fixed-timestep simulation loop used by every 2D canvas simulation.
 * Runs `step(dt)` on every animation frame with a real elapsed-time delta
 * (capped to avoid huge jumps on tab-refocus), and exposes play/pause/reset.
 */
export function useSimulationLoop(step: (dtSeconds: number) => void, options?: { autoStart?: boolean; maxDt?: number }) {
  const [running, setRunning] = React.useState(options?.autoStart ?? true)
  const rafRef = React.useRef<number | null>(null)
  const lastTimeRef = React.useRef<number | null>(null)
  const stepRef = React.useRef(step)
  stepRef.current = step

  React.useEffect(() => {
    if (!running) {
      lastTimeRef.current = null
      return
    }

    function tick(time: number) {
      if (lastTimeRef.current != null) {
        const dt = Math.min((time - lastTimeRef.current) / 1000, options?.maxDt ?? 0.05)
        stepRef.current(dt)
      }
      lastTimeRef.current = time
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [running, options?.maxDt])

  const toggle = React.useCallback(() => setRunning((r) => !r), [])
  const play = React.useCallback(() => setRunning(true), [])
  const pause = React.useCallback(() => setRunning(false), [])

  return { running, toggle, play, pause }
}
