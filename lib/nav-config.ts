import type { LucideIcon } from "lucide-react"
import {
  FlaskConical,
  Grid3x3,
  TrendingUp,
  Box,
  Share2,
  Scale,
  Calculator,
  Droplets,
  TestTubes,
  Beaker,
  Atom,
  Dna,
  Bot,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  description?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const CHEMISTRY_NAV: NavSection = {
  title: "Chemistry",
  items: [
    { title: "Periodic Table", href: "/chemistry/periodic-table", icon: Grid3x3, description: "118 elements, searchable & filterable" },
    { title: "Periodic Trends", href: "/chemistry/trends", icon: TrendingUp, description: "Electronegativity, radius, ionization energy" },
    { title: "Molecular Viewer", href: "/chemistry/molecular-viewer", icon: Box, description: "3D compound models" },
    { title: "Bonding & Lewis Structures", href: "/chemistry/bonding", icon: Share2, description: "Lewis diagrams, VSEPR geometry" },
    { title: "Equation Balancer", href: "/chemistry/equation-balancer", icon: Scale, description: "Balance any reaction" },
    { title: "Stoichiometry", href: "/chemistry/stoichiometry", icon: Calculator, description: "Mole ratios & limiting reagent" },
    { title: "Concentration Lab", href: "/chemistry/concentration", icon: Droplets, description: "Molarity, dilution, molality" },
    { title: "Acid-Base Lab", href: "/chemistry/acid-base", icon: TestTubes, description: "pH, titration curves" },
    { title: "Simulations", href: "/chemistry/simulations", icon: Beaker, description: "12 interactive experiments" },
  ],
}

export const TOP_NAV: NavItem[] = [
  { title: "Chemistry", href: "/chemistry", icon: FlaskConical },
  { title: "Physics", href: "/physics", icon: Atom },
  { title: "Biology", href: "/biology", icon: Dna },
  { title: "AI Assistant", href: "/assistant", icon: Bot },
]
