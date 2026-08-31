"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] App shell error:", error)
  }, [error])

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-destructive">System fault</p>
        <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight">This module hit an unexpected error.</h1>
        <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">
          The lab instrument for this page failed to render. You can retry the operation or return to the home screen.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="transition-transform duration-150 active:scale-[0.97]">
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }), "transition-transform duration-150 active:scale-[0.97]")}
          >
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Return home
          </Link>
        </div>
      </div>
    </main>
  )
}
