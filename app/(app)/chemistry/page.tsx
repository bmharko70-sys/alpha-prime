import Link from "next/link"
import { CHEMISTRY_NAV } from "@/lib/nav-config"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ChemistryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chemistry</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Explore the periodic table, build molecules in 3D, balance real chemical equations, and run interactive
          lab simulations grounded in real physical chemistry.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CHEMISTRY_NAV.items.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <Icon className="size-5 text-primary" />
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
