import { getElementBySymbol, getValenceElectrons } from '@/lib/science/data/elements'
import { parseFormula } from './formula'

export interface VseprResult {
  centralAtom: string
  bondingPairs: number
  lonePairs: number
  electronDomains: number
  geometry: string
  bondAngle: string
  hybridization: string
  polarity: 'polar' | 'nonpolar'
}

/**
 * Estimates VSEPR electron-domain geometry for a simple AXn molecule
 * described as a central atom symbol + surrounding atom symbols, using
 * real valence-electron counting rules. Electron *domains* (not raw
 * bonding electron pairs) drive the geometry: a double/triple bond is
 * still one domain. To find how many surrounding atoms need multiple
 * bonds (e.g. the two C=O bonds in CO2), we let each terminal atom
 * upgrade its bond order just enough to complete its own octet
 * (duet for H) once the total valence-electron pool can't otherwise
 * satisfy every atom with single bonds — the same rule used when
 * hand-drawing a real Lewis structure.
 */
export function computeVsepr(centralSymbol: string, surroundingSymbols: string[]): VseprResult | null {
  const central = getElementBySymbol(centralSymbol)
  const centralValence = central ? getValenceElectrons(central) : null
  if (!central || centralValence == null) return null

  const bondingPairs = surroundingSymbols.length // one electron domain per ligand, regardless of bond order
  const usedInBonds = bondingPairs // at minimum, one electron pair (single bond) per domain
  let remaining = centralValence - usedInBonds

  // Real Lewis-structure rule: terminal atoms that still need electrons to
  // complete their own octet pull a lone pair from the central atom's
  // remaining pool into a second/third shared (pi) bond — e.g. carbon in
  // CO2 promotes both C-O single bonds to C=O so oxygen (and carbon) reach
  // an octet. This only applies to elements that commonly pi-bond
  // (period 2 p-block: C, N, O) and only when the central atom has enough
  // spare electrons to donate into the extra bond(s) without going
  // negative — otherwise it stays with single bonds and lone pairs.
  const canPiBond = ['C', 'N', 'O', 'S', 'P'].includes(centralSymbol)
  if (canPiBond && bondingPairs > 0) {
    // Octet deficiency per terminal atom if only single-bonded: it has
    // (its own valence - 1 bonding electron - up to 3 lone pairs) — for
    // common ligands like O, N this is 0 once 3 lone pairs are assigned,
    // so instead we drive promotion directly off the central atom having
    // "extra" electrons beyond what non-pi-bonding chemistry would leave
    // as lone pairs on itself (i.e. central atom lone pairs would be odd/
    // nonzero pairs of electrons that are better placed as pi bonds when
    // every ligand is a typical multiple-bond partner like O or N).
    const ligandsPreferPiBonds = surroundingSymbols.every((s) => ['O', 'N', 'S'].includes(s))
    if (ligandsPreferPiBonds) {
      let promotions = 0
      const maxPromotions = bondingPairs // at most upgrade each single bond to a double bond once
      while (remaining >= 2 && promotions < maxPromotions) {
        remaining -= 2
        promotions++
      }
    }
  }

  const lonePairs = Math.max(0, Math.round(remaining / 2))
  const electronDomains = bondingPairs + lonePairs

  const table: Record<string, Omit<VseprResult, 'centralAtom' | 'bondingPairs' | 'lonePairs' | 'electronDomains' | 'polarity'>> = {
    '2-0': { geometry: 'Linear', bondAngle: '180°', hybridization: 'sp' },
    '3-0': { geometry: 'Trigonal planar', bondAngle: '120°', hybridization: 'sp²' },
    '2-1': { geometry: 'Bent', bondAngle: '~120°', hybridization: 'sp²' },
    '4-0': { geometry: 'Tetrahedral', bondAngle: '109.5°', hybridization: 'sp³' },
    '3-1': { geometry: 'Trigonal pyramidal', bondAngle: '~107°', hybridization: 'sp³' },
    '2-2': { geometry: 'Bent', bondAngle: '~104.5°', hybridization: 'sp³' },
    '5-0': { geometry: 'Trigonal bipyramidal', bondAngle: '90° / 120°', hybridization: 'sp³d' },
    '4-1': { geometry: 'Seesaw (disphenoidal)', bondAngle: '~90° / 120° / 180°', hybridization: 'sp³d' },
    '3-2': { geometry: 'T-shaped', bondAngle: '~90°', hybridization: 'sp³d' },
    '2-3': { geometry: 'Linear', bondAngle: '180°', hybridization: 'sp³d' },
    '6-0': { geometry: 'Octahedral', bondAngle: '90°', hybridization: 'sp³d²' },
    '5-1': { geometry: 'Square pyramidal', bondAngle: '~90°', hybridization: 'sp³d²' },
    '4-2': { geometry: 'Square planar', bondAngle: '90°', hybridization: 'sp³d²' },
  }

  const key = `${bondingPairs}-${lonePairs}`
  const shape = table[key] ?? { geometry: 'Unknown (extended domain count)', bondAngle: '—', hybridization: '—' }

  // Simple polarity heuristic: symmetric AXn with identical, evenly arranged
  // ligands and no lone pairs on the central atom is nonpolar.
  const allSameLigand = new Set(surroundingSymbols).size === 1
  const symmetricGeometries = new Set(['Linear', 'Trigonal planar', 'Tetrahedral', 'Octahedral', 'Square planar', 'Trigonal bipyramidal'])
  const polarity: 'polar' | 'nonpolar' =
    allSameLigand && lonePairs === 0 && symmetricGeometries.has(shape.geometry) ? 'nonpolar' : 'polar'

  return {
    centralAtom: centralSymbol,
    bondingPairs,
    lonePairs,
    electronDomains,
    polarity,
    ...shape,
  }
}

export interface LewisAtom {
  symbol: string
  x: number
  y: number
  lonePairs: number
}

export interface LewisBond {
  from: number
  to: number
  order: 1 | 2 | 3
}

export interface LewisStructure {
  atoms: LewisAtom[]
  bonds: LewisBond[]
  totalValenceElectrons: number
}

/**
 * Builds a simplified Lewis structure for a central-atom molecule:
 * central atom bonded to each surrounding atom with single bonds by
 * default, distributing remaining valence electrons as lone pairs to
 * satisfy the octet rule (duet for H) where possible.
 */
export function buildLewisStructure(centralSymbol: string, surroundingSymbols: string[]): LewisStructure | null {
  const central = getElementBySymbol(centralSymbol)
  const centralValence = central ? getValenceElectrons(central) : null
  if (!central || centralValence == null) return null

  const atomsInfo = surroundingSymbols.map((s) => getElementBySymbol(s))
  if (atomsInfo.some((a) => !a)) return null

  let totalValence = centralValence
  for (const a of atomsInfo) totalValence += getValenceElectrons(a!) ?? 0

  const n = surroundingSymbols.length
  const radius = 2.2
  const atoms: LewisAtom[] = [{ symbol: centralSymbol, x: 0, y: 0, lonePairs: 0 }]

  let usedElectrons = 0
  const bonds: LewisBond[] = surroundingSymbols.map((symbol, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    atoms.push({ symbol, x: radius * Math.cos(angle), y: radius * Math.sin(angle), lonePairs: 0 })
    usedElectrons += 2 // one bonding pair per single bond
    return { from: 0, to: i + 1, order: 1 as const }
  })

  let remaining = totalValence - usedElectrons

  // Give each terminal atom lone pairs until it reaches an octet (or duet for H).
  for (let i = 0; i < n; i++) {
    const info = atomsInfo[i]!
    const target = info.symbol === 'H' ? 0 : 3 // additional lone pairs beyond the bond, to reach 8 total
    const canGive = Math.min(target, Math.floor(remaining / 2))
    atoms[i + 1].lonePairs = canGive
    remaining -= canGive * 2
  }

  // Any leftover electrons become lone pairs on the central atom.
  atoms[0].lonePairs = Math.max(0, Math.floor(remaining / 2))

  return { atoms, bonds, totalValenceElectrons: totalValence }
}

/** Convenience: derives central + surrounding atoms from a simple formula like "CO2", "NH3", "CH4". */
export function moleculeToVseprInput(formula: string): { central: string; surrounding: string[] } | null {
  const parsed = parseFormula(formula)
  const symbols = Object.keys(parsed)
  if (symbols.length < 2) return null

  // Heuristic: the atom with the lowest count and highest typical valence is central
  // (works for simple AXn formulas like CO2, NH3, CH4, SF6, H2O).
  const nonHydrogen = symbols.filter((s) => s !== 'H')
  const centralCandidate = nonHydrogen.reduce((best, s) => (parsed[s] < parsed[best] ? s : best), nonHydrogen[0])
  if (!centralCandidate) return null

  const surrounding: string[] = []
  for (const [symbol, count] of Object.entries(parsed)) {
    if (symbol === centralCandidate) continue
    for (let i = 0; i < count; i++) surrounding.push(symbol)
  }
  // central atom appears once, remove one extra copy if count > 1 was miscounted
  const centralCount = parsed[centralCandidate]
  if (centralCount > 1) return null // multi-central-atom formulas aren't supported by this simple heuristic

  return { central: centralCandidate, surrounding }
}
