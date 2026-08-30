"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastTone = "success" | "error" | "info"

interface AnimatedToastProps {
  tone?: ToastTone
  message: string
  className?: string
}

const TONE_CONFIG: Record<ToastTone, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  success: { icon: CheckCircle2, color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  error: { icon: AlertCircle, color: "text-destructive border-destructive/30 bg-destructive/10" },
  info: { icon: Info, color: "text-primary border-primary/30 bg-primary/10" },
}

/**
 * A small, accessible feedback surface for success/error/info confirmations
 * (e.g. after balancing an equation or saving a note). Not a toast manager —
 * render conditionally where the feedback happens.
 */
export function AnimatedToast({ tone = "info", message, className }: AnimatedToastProps) {
  const { icon: Icon, color } = TONE_CONFIG[tone]
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("toast-in flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", color, className)}
    >
      <Icon className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
