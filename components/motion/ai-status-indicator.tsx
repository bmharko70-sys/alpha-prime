"use client"

import * as React from "react"
import { Loader2, Search, Sparkles, CheckCircle2, AlertCircle, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

export type AIStatus = "idle" | "listening" | "thinking" | "searching" | "generating" | "completed" | "error"

const STATUS_CONFIG: Record<AIStatus, { label: string; icon: React.ComponentType<{ className?: string }>; spin?: boolean; breathe?: boolean }> = {
  idle: { label: "Ready", icon: Sparkles },
  listening: { label: "Listening…", icon: Mic, breathe: true },
  thinking: { label: "Thinking…", icon: Loader2, spin: true },
  searching: { label: "Looking up verified data…", icon: Search, breathe: true },
  generating: { label: "Composing answer…", icon: Loader2, spin: true },
  completed: { label: "Done", icon: CheckCircle2 },
  error: { label: "Something went wrong", icon: AlertCircle },
}

interface AIStatusIndicatorProps {
  status: AIStatus
  className?: string
}

/**
 * Accessible status readout for the AI assistant. Announces state changes
 * via a polite live region and pairs each state with a distinct icon/motion.
 */
export function AIStatusIndicator({ status, className }: AIStatusIndicatorProps) {
  const { label, icon: Icon, spin, breathe } = STATUS_CONFIG[status]
  const tone =
    status === "error"
      ? "text-destructive"
      : status === "completed"
        ? "text-emerald-400"
        : "text-primary"

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2 font-mono text-xs", tone, className)}
    >
      <Icon className={cn("size-3.5", spin && "status-spin", breathe && "status-breathe")} />
      <span>{label}</span>
    </div>
  )
}
