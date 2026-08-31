"use client"

import * as React from "react"
import { useReducedMotion } from "@/components/motion/use-reduced-motion"

/**
 * Tracks normalized pointer position (-1..1 on both axes) relative to a
 * container element, for subtle cursor-reactive parallax effects. Returns a
 * ref to attach to the container and the current { x, y } offset.
 */
export function usePointerParallax<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [offset, setOffset] = React.useState({ x: 0, y: 0 })
  const reducedMotion = useReducedMotion()

  React.useEffect(() => {
    if (reducedMotion) return
    const node = ref.current
    if (!node) return

    const handlePointerMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1
      setOffset({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) })
    }
    const handlePointerLeave = () => setOffset({ x: 0, y: 0 })

    node.addEventListener("pointermove", handlePointerMove)
    node.addEventListener("pointerleave", handlePointerLeave)
    return () => {
      node.removeEventListener("pointermove", handlePointerMove)
      node.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [reducedMotion])

  return { ref, offset }
}
