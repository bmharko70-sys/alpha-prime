import Link from "next/link"
import { Compass, Home } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function RootNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-16 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted">
          <Compass className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Error 404</p>
        <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight">This coordinate doesn&apos;t exist.</h1>
        <p className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">
          The page you&apos;re looking for was moved, renamed, or never charted. Head back to the lab overview to keep
          exploring.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "default" }), "transition-transform duration-150 active:scale-[0.97]")}
          >
            <Home className="mr-2 h-4 w-4" aria-hidden="true" />
            Return home
          </Link>
        </div>
      </div>
    </main>
  )
}
