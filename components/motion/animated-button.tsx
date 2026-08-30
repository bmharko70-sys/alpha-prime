"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AnimatedButtonProps = React.ComponentProps<typeof Button>

/**
 * Thin wrapper around the base Button that guarantees consistent
 * press/hover feedback. Use anywhere a click triggers a meaningful action.
 */
export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, ...props }, ref) => {
    return <Button ref={ref} className={cn("press-feedback", className)} {...props} />
  },
)
AnimatedButton.displayName = "AnimatedButton"
