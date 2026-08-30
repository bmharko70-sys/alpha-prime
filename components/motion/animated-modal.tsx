"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Applies consistent entrance motion to dialog/sheet/popover content.
 * Wrap the direct content of Radix/base-ui Content components with this.
 */
export function AnimatedModalContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("modal-in", className)} {...props}>
      {children}
    </div>
  )
}

/**
 * Applies consistent fade-in motion to dialog/sheet overlay/veil elements.
 */
export function AnimatedModalOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("veil-in", className)} {...props} />
}
