// Shared type definitions for the Academia O1 science data engine.
// Every field here is either a real, well-established public-domain scientific
// value or explicitly typed as optional/null when it does not apply to a given
// element (e.g. noble gases have no defined electronegativity).

export type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth"
  | "transition-metal"
  | "post-transition-metal"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble-gas"
  | "lanthanide"
  | "actinide"
  | "unknown"

export type MatterState = "solid" | "liquid" | "gas" | "unknown"

export type MagneticBehavior = "diamagnetic" | "paramagnetic" | "ferromagnetic" | "unknown"

export interface ElementIsotope {
  massNumber: number
  symbol: string // e.g. "C-12"
  abundance: number | null // percent natural abundance, null if synthetic/trace
  stable: boolean
  halfLife: string | null // human readable, null if stable
}

export interface ElementData {
  atomicNumber: number
  symbol: string
  name: string
  category: ElementCategory
  group: number | null // 1-18, null for lanthanides/actinides (f-block placement)
  period: number
  block: "s" | "p" | "d" | "f"
  atomicMass: number // standard atomic weight (u)
  electronConfiguration: string // full, e.g. "1s2 2s2 2p6"
  electronConfigurationShort: string // noble-gas shorthand
  electronsPerShell: number[] // e.g. [2, 8, 1]
  electronegativity: number | null // Pauling scale
  ionizationEnergy: number | null // kJ/mol, first ionization
  electronAffinity: number | null // kJ/mol
  atomicRadius: number | null // pm, empirical
  ionicRadius: number | null // pm, of most common ion
  covalentRadius: number | null // pm
  density: number | null // g/cm3 at STP
  meltingPoint: number | null // Kelvin
  boilingPoint: number | null // Kelvin
  state: MatterState // at STP
  appearance: string
  crystalStructure: string
  magneticBehavior: MagneticBehavior
  discoveryYear: number | null
  discoveredBy: string
  oxidationStates: number[]
  yearNamed?: string
  namedFor: string
  isotopes: ElementIsotope[]
  uses: string[]
  occurrence: string
  standardState25C: string
}

export interface AtomPosition {
  element: string // element symbol
  x: number
  y: number
  z: number
}

export interface BondDef {
  a: number // index into atoms array
  b: number
  order: 1 | 2 | 3 // single/double/triple
}

export interface MoleculeData {
  formula: string
  name: string
  molarMass: number // g/mol, computed from elements but stored for display
  geometry: string // VSEPR molecular geometry description
  bondAngle: string | null
  polarity: "polar" | "nonpolar" | "unknown"
  atoms: AtomPosition[]
  bonds: BondDef[]
  description: string
  source?: string
  sourceId?: string
}

export interface PhysicalConstant {
  symbol: string
  name: string
  value: number
  unit: string
  description: string
}
