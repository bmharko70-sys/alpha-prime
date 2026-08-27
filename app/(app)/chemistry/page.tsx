import Link from "next/link"
import { ArrowUpRight, FlaskConical, Search, Sparkles } from "lucide-react"
import { CHEMISTRY_NAV } from "@/lib/nav-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function ChemistryPage() {
  return (
    <main className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-sm md:p-10">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-primary">
            <FlaskConical className="size-4" aria-hidden="true" />
            Chemistry laboratory
          </div>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-6xl">Think in atoms.</h1>
          <p className="mt-4 max-w-2xl text-pretty leading-7 text-muted-foreground">
            A connected workspace for exploring matter, verifying reactions, understanding molecular structure, and solving quantitative chemistry with transparent working.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input className="h-11 pl-9" placeholder="Search an element or molecule" aria-label="Search chemistry" />
            </div>
            <Link href="/assistant" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">
              <Sparkles className="size-4 text-primary" aria-hidden="true" /> Ask the tutor
            </Link>
          </div>
        </div>
        <div className="absolute -right-16 -top-20 size-64 rounded-full border border-primary/10" aria-hidden="true" />
      </section>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Four connected systems</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Choose your starting point</h2>
        </div>
        <span className="hidden font-mono text-xs text-muted-foreground sm:block">CORE / VERIFIED / LIVE</span>
      </div>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Chemistry laboratory systems">
        {CHEMISTRY_NAV.items.map((item, index) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full min-h-52 border-border/80 transition-all duration-200 group-hover:-translate-y-1 group-hover:border-primary/60 group-hover:shadow-lg">
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </CardHeader>
                <CardContent>
                  <CardTitle className="flex items-center gap-2 text-xl">{item.title}<ArrowUpRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" /></CardTitle>
                  <CardDescription className="mt-2 max-w-sm leading-6">{item.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </section>
    </main>
  )
}
