"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ContextualLoaderProps {
  label: string
  className?: string
}

/**
 * A small inline loader that communicates *what* is loading, not just that
 * something is. Use for AI calls, structure fetches, or map/timeline loads.
 */
export function ContextualLoader({ label, className }: ContextualLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2.5 font-mono text-xs text-muted-foreground", className)}
    >
      <span className="ai-thinking-nodes">
        <i />
        <i />
        <i />
      </span>
      <span>{label}</span>
    </div>
  )
}
