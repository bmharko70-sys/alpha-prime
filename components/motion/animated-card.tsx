"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * A surface that lifts subtly on hover/focus and settles on press.
 * Intended for clickable cards, tiles, and list rows (wrap a <Link> or <button>).
 */
export const AnimatedCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("surface-interactive", className)} {...props}>
        {children}
      </div>
    )
  },
)
AnimatedCard.displayName = "AnimatedCard"
