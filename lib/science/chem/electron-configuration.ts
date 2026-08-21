// Computes ground-state electron configurations algorithmically from the
// atomic number using the Aufbau principle (Madelung filling order), with a
// documented table of the real, well-known exceptions to Aufbau that occur
// due to subshell stability effects (e.g. Cr, Cu, Pd, La, Au...).
//
// This is deliberately NOT a per-element hardcoded lookup of full
// configurations — only the *exceptions* (a standard, finite chemistry fact)
// are tabulated; every other element's configuration is derived by the
// filling algorithm below.

type Subshell = "s" | "p" | "d" | "f"

const SUBSHELL_CAPACITY: Record<Subshell, number> = { s: 2, p: 6, d: 10, f: 14 }
const SUBSHELL_ORDER: Subshell[] = ["s", "p", "d", "f"]

// Madelung (n + l) filling order.
const FILLING_ORDER: Array<{ n: number; l: Subshell }> = [
  { n: 1, l: "s" },
  { n: 2, l: "s" },
  { n: 2, l: "p" },
  { n: 3, l: "s" },
  { n: 3, l: "p" },
  { n: 4, l: "s" },
  { n: 3, l: "d" },
  { n: 4, l: "p" },
  { n: 5, l: "s" },
  { n: 4, l: "d" },
  { n: 5, l: "p" },
  { n: 6, l: "s" },
  { n: 4, l: "f" },
  { n: 5, l: "d" },
  { n: 6, l: "p" },
  { n: 7, l: "s" },
  { n: 5, l: "f" },
  { n: 6, l: "d" },
  { n: 7, l: "p" },
]

// Documented ground-state exceptions to the naive Aufbau fill order.
// Each entry gives the exact subshell occupation for the *valence* subshells
// that differ from the baseline algorithmic fill, for that element only.
const AUFBAU_EXCEPTIONS: Record<number, Array<{ n: number; l: Subshell; count: number }>> = {
  24: [{ n: 3, l: "d", count: 5 }, { n: 4, l: "s", count: 1 }], // Cr
  29: [{ n: 3, l: "d", count: 10 }, { n: 4, l: "s", count: 1 }], // Cu
  41: [{ n: 4, l: "d", count: 4 }, { n: 5, l: "s", count: 1 }], // Nb
  42: [{ n: 4, l: "d", count: 5 }, { n: 5, l: "s", count: 1 }], // Mo
  44: [{ n: 4, l: "d", count: 7 }, { n: 5, l: "s", count: 1 }], // Ru
  45: [{ n: 4, l: "d", count: 8 }, { n: 5, l: "s", count: 1 }], // Rh
  46: [{ n: 4, l: "d", count: 10 }, { n: 5, l: "s", count: 0 }], // Pd
  47: [{ n: 4, l: "d", count: 10 }, { n: 5, l: "s", count: 1 }], // Ag
  57: [{ n: 4, l: "f", count: 0 }, { n: 5, l: "d", count: 1 }, { n: 6, l: "s", count: 2 }], // La
  58: [{ n: 4, l: "f", count: 1 }, { n: 5, l: "d", count: 1 }, { n: 6, l: "s", count: 2 }], // Ce
  64: [{ n: 4, l: "f", count: 7 }, { n: 5, l: "d", count: 1 }, { n: 6, l: "s", count: 2 }], // Gd
  78: [{ n: 5, l: "d", count: 9 }, { n: 6, l: "s", count: 1 }], // Pt
  79: [{ n: 5, l: "d", count: 10 }, { n: 6, l: "s", count: 1 }], // Au
  89: [{ n: 5, l: "f", count: 0 }, { n: 6, l: "d", count: 1 }, { n: 7, l: "s", count: 2 }], // Ac
  90: [{ n: 5, l: "f", count: 0 }, { n: 6, l: "d", count: 2 }, { n: 7, l: "s", count: 2 }], // Th
  91: [{ n: 5, l: "f", count: 2 }, { n: 6, l: "d", count: 1 }, { n: 7, l: "s", count: 2 }], // Pa
  92: [{ n: 5, l: "f", count: 3 }, { n: 6, l: "d", count: 1 }, { n: 7, l: "s", count: 2 }], // U
  93: [{ n: 5, l: "f", count: 4 }, { n: 6, l: "d", count: 1 }, { n: 7, l: "s", count: 2 }], // Np
  96: [{ n: 5, l: "f", count: 7 }, { n: 6, l: "d", count: 1 }, { n: 7, l: "s", count: 2 }], // Cm
  103: [{ n: 5, l: "f", count: 14 }, { n: 7, l: "s", count: 2 }, { n: 7, l: "p", count: 1 }], // Lr
}

// Nearest noble gas (atomic number, symbol) at or below a given number, used
// for shorthand notation.
const NOBLE_GASES: Array<{ z: number; symbol: string }> = [
  { z: 2, symbol: "He" },
  { z: 10, symbol: "Ne" },
  { z: 18, symbol: "Ar" },
  { z: 36, symbol: "Kr" },
  { z: 54, symbol: "Xe" },
  { z: 86, symbol: "Rn" },
  { z: 118, symbol: "Og" },
]

export interface ComputedConfiguration {
  full: string // e.g. "1s2 2s2 2p6 3s2 3p6 4s1 3d5"
  ordered: string // grouped/sorted by shell for conventional display
  shorthand: string // e.g. "[Ar] 4s1 3d5"
  electronsPerShell: number[] // index 0 = shell 1
  isAufbauException: boolean
  subshells: Array<{ n: number; l: Subshell; count: number }>
}

export function computeElectronConfiguration(atomicNumber: number): ComputedConfiguration {
  const occ = new Map<string, number>() // key `${n}${l}` -> electron count
  let remaining = atomicNumber

  for (const { n, l } of FILLING_ORDER) {
    if (remaining <= 0) break
    const cap = SUBSHELL_CAPACITY[l]
    const put = Math.min(cap, remaining)
    occ.set(`${n}${l}`, put)
    remaining -= put
  }

  const isAufbauException = Boolean(AUFBAU_EXCEPTIONS[atomicNumber])
  if (isAufbauException) {
    for (const override of AUFBAU_EXCEPTIONS[atomicNumber]) {
      const key = `${override.n}${override.l}`
      if (override.count === 0) {
        occ.delete(key)
      } else {
        occ.set(key, override.count)
      }
    }
  }

  const subshells: Array<{ n: number; l: Subshell; count: number }> = []
  for (const [key, count] of occ.entries()) {
    const n = Number.parseInt(key.slice(0, -1), 10)
    const l = key.slice(-1) as Subshell
    if (count > 0) subshells.push({ n, l, count })
  }

  // "Ordered" conventional notation: sort by n asc, then s<p<d<f.
  const orderedSubshells = [...subshells].sort((a, b) => {
    if (a.n !== b.n) return a.n - b.n
    return SUBSHELL_ORDER.indexOf(a.l) - SUBSHELL_ORDER.indexOf(b.l)
  })

  // "Full" (filling-order) notation, matching the order electrons were added.
  const fillingSubshells = FILLING_ORDER.map(({ n, l }) => ({ n, l, count: occ.get(`${n}${l}`) ?? 0 })).filter(
    (s) => s.count > 0,
  )

  const full = fillingSubshells.map((s) => `${s.n}${s.l}${s.count}`).join(" ")
  const ordered = orderedSubshells.map((s) => `${s.n}${s.l}${s.count}`).join(" ")

  const electronsPerShell: number[] = []
  for (const s of subshells) {
    electronsPerShell[s.n - 1] = (electronsPerShell[s.n - 1] ?? 0) + s.count
  }
  for (let i = 0; i < electronsPerShell.length; i++) {
    if (electronsPerShell[i] === undefined) electronsPerShell[i] = 0
  }

  // Shorthand: previous noble gas + remaining subshells in conventional order.
  let precedingNobleGas: { z: number; symbol: string } | null = null
  for (const ng of NOBLE_GASES) {
    if (ng.z < atomicNumber) precedingNobleGas = ng
  }
  let shorthand = ordered
  if (precedingNobleGas) {
    const coreShells = new Set<string>()
    let coreRemaining = precedingNobleGas.z
    for (const { n, l } of FILLING_ORDER) {
      if (coreRemaining <= 0) break
      const cap = SUBSHELL_CAPACITY[l]
      const put = Math.min(cap, coreRemaining)
      if (put === cap) coreShells.add(`${n}${l}`)
      coreRemaining -= put
    }
    const valence = orderedSubshells.filter((s) => !coreShells.has(`${s.n}${s.l}`) || s.count !== SUBSHELL_CAPACITY[s.l])
    const valenceStr = valence.map((s) => `${s.n}${s.l}${s.count}`).join(" ")
    shorthand = `[${precedingNobleGas.symbol}] ${valenceStr}`.trim()
  }

  return {
    full,
    ordered,
    shorthand,
    electronsPerShell,
    isAufbauException,
    subshells: orderedSubshells,
  }
}
