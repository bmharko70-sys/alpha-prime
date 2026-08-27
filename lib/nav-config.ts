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
    { title: "Interactive Periodic Table", href: "/chemistry/periodic-table", icon: Grid3x3, description: "Search all 118 elements and compare trends" },
    { title: "Equation & Reaction Lab", href: "/chemistry/equation-lab", icon: Scale, description: "Parse, balance, classify, and verify reactions" },
    { title: "Molecule & 3D Structure Lab", href: "/chemistry/molecule-lab", icon: Box, description: "Explore supported structures, bonds, and geometry" },
    { title: "Calculator & Stoichiometry Lab", href: "/chemistry/calculator-lab", icon: Calculator, description: "Solve molar mass, concentration, and reaction quantities" },
  ],
}

export const TOP_NAV: NavItem[] = [
  { title: "Chemistry", href: "/chemistry", icon: FlaskConical },
  { title: "Physics", href: "/physics", icon: Atom },
  { title: "Biology", href: "/biology", icon: Dna },
  { title: "AI Assistant", href: "/assistant", icon: Bot },
]
