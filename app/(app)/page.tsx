import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, FlaskConical, Atom, Dna, Bot, Grid3x3, Box, Scale, TestTubes } from "lucide-react"

const FEATURED_TOOLS = [
  { title: "Periodic Table", href: "/chemistry/periodic-table", icon: Grid3x3, description: "All 118 elements with real atomic data, searchable and filterable by category." },
  { title: "Molecular Viewer", href: "/chemistry/molecular-viewer", icon: Box, description: "Rotate 3D ball-and-stick and space-filling models of real compounds." },
  { title: "Equation Balancer", href: "/chemistry/equation-balancer", icon: Scale, description: "Balances any chemical equation using exact linear-algebra methods." },
  { title: "Acid-Base Lab", href: "/chemistry/acid-base", icon: TestTubes, description: "Compute pH, pOH, and titration curves for strong and weak acids/bases." },
]

const SUBJECTS = [
  {
    title: "Chemistry",
    href: "/chemistry",
    icon: FlaskConical,
    status: "Live",
    description: "118-element periodic table, 3D atomic and molecular models, equation balancing, stoichiometry, acid-base chemistry, and 12 lab simulations.",
  },
  {
    title: "Physics",
    href: "/physics",
    icon: Atom,
    status: "In progress",
    description: "Mechanics, waves, electromagnetism, and thermodynamics simulators — coming next.",
  },
  {
    title: "Biology",
    href: "/biology",
    icon: Dna,
    status: "In progress",
    description: "Cell structures, organ systems, and genetics models — coming next.",
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
      <section className="flex flex-col gap-4">
        <Badge variant="secondary" className="w-fit font-mono text-xs">
          Academia O1
        </Badge>
        <h1 className="max-w-2xl text-balance font-sans text-4xl font-semibold tracking-tight sm:text-5xl">
          An interactive laboratory for chemistry, physics, and biology.
        </h1>
        <p className="max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Real scientific data, 3D atomic and molecular models, working simulations, and an AI assistant that can
          balance equations and compute answers for you — not just describe them.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {SUBJECTS.map((subject) => (
          <Link key={subject.href} href={subject.href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <subject.icon className="size-5" />
                  </div>
                  <Badge variant={subject.status === "Live" ? "default" : "secondary"} className="text-xs">
                    {subject.status}
                  </Badge>
                </div>
                <CardTitle className="pt-2">{subject.title}</CardTitle>
                <CardDescription className="leading-relaxed">{subject.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Explore <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Featured tools</h2>
          <Link href="/chemistry" className="text-sm font-medium text-primary hover:underline">
            View all chemistry tools
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/50">
                <CardHeader>
                  <tool.icon className="size-5 text-muted-foreground" />
                  <CardTitle className="text-base">{tool.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-start gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </div>
              <div>
                <p className="font-medium">Ask the Science AI Assistant</p>
                <p className="text-sm text-muted-foreground">
                  It can look up elements, balance equations, and compute pH — with real, verified tool calls.
                </p>
              </div>
            </div>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Open assistant <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
