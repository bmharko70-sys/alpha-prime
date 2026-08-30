"use client"

import * as React from "react"

/**
 * Tracks the user's `prefers-reduced-motion` preference reactively.
 * Defaults to `false` on the server and during the first paint to avoid
 * hydration mismatches, then syncs to the real value on mount.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(query.matches)
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches)
    query.addEventListener("change", listener)
    return () => query.removeEventListener("change", listener)
  }, [])

  return reduced
}
