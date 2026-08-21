import { parseFormula } from './formula'

export interface BalancedEquation {
  reactants: { formula: string; coefficient: number }[]
  products: { formula: string; coefficient: number }[]
  balanced: boolean
  error?: string
}

/**
 * Balances a chemical equation given as "A + B -> C + D" (also accepts "=").
 * Uses the real linear-algebra approach: builds the stoichiometric matrix
 * (element rows x compound columns, products negated), finds its integer
 * null-space vector via exact fraction Gaussian elimination, then scales
 * to the smallest positive integer coefficients. This works for any valid
 * reaction, not a lookup table.
 */
export function balanceEquation(equation: string): BalancedEquation {
  const sides = equation.split(/->|=>|=/).map((s) => s.trim())
  if (sides.length !== 2 || !sides[0] || !sides[1]) {
    return { reactants: [], products: [], balanced: false, error: 'Use the form "A + B -> C + D".' }
  }

  const reactantFormulas = sides[0].split('+').map((s) => s.trim()).filter(Boolean)
  const productFormulas = sides[1].split('+').map((s) => s.trim()).filter(Boolean)
  const allFormulas = [...reactantFormulas, ...productFormulas]

  if (allFormulas.length < 2) {
    return { reactants: [], products: [], balanced: false, error: 'Enter at least one reactant and one product.' }
  }

  let parsedCompounds: Record<string, number>[]
  try {
    parsedCompounds = allFormulas.map((f) => {
      const parsed = parseFormula(f)
      if (Object.keys(parsed).length === 0) throw new Error(`Could not parse "${f}"`)
      return parsed
    })
  } catch (e) {
    return { reactants: [], products: [], balanced: false, error: (e as Error).message }
  }

  const elements = Array.from(new Set(parsedCompounds.flatMap((c) => Object.keys(c))))

  // Build matrix: rows = elements, cols = compounds. Sign convention:
  // reactants positive, products negative, so a valid balance is Ax = 0.
  const numReactants = reactantFormulas.length
  const matrix: number[][] = elements.map((el) =>
    parsedCompounds.map((compound, colIndex) => {
      const count = compound[el] ?? 0
      return colIndex < numReactants ? count : -count
    })
  )

  const solution = nullSpaceRational(matrix, allFormulas.length)
  if (!solution) {
    return { reactants: [], products: [], balanced: false, error: 'No integer solution found — check the formulas.' }
  }

  return {
    reactants: reactantFormulas.map((formula, i) => ({ formula, coefficient: solution[i] })),
    products: productFormulas.map((formula, i) => ({ formula, coefficient: solution[numReactants + i] })),
    balanced: true,
  }
}

/** Exact rational arithmetic via BigInt fractions to avoid floating-point drift. */
class Frac {
  constructor(public n: bigint, public d: bigint) {
    if (d < 0n) {
      n = -n
      d = -d
    }
    const g = gcdBig(n < 0n ? -n : n, d) || 1n
    this.n = n / g
    this.d = d / g
  }
  static from(x: number) {
    return new Frac(BigInt(x), 1n)
  }
  add(o: Frac) {
    return new Frac(this.n * o.d + o.n * this.d, this.d * o.d)
  }
  sub(o: Frac) {
    return new Frac(this.n * o.d - o.n * this.d, this.d * o.d)
  }
  mul(o: Frac) {
    return new Frac(this.n * o.n, this.d * o.d)
  }
  div(o: Frac) {
    return new Frac(this.n * o.d, this.d * o.n)
  }
  isZero() {
    return this.n === 0n
  }
  toNumber() {
    return Number(this.n) / Number(this.d)
  }
}

function gcdBig(a: bigint, b: bigint): bigint {
  while (b) {
    ;[a, b] = [b, a % b]
  }
  return a
}

/**
 * Finds a null-space vector of `matrix` (rows x numCols) using Gaussian
 * elimination in exact rational arithmetic, then scales to positive integers.
 * Assumes a 1-dimensional null space (true for a single balanced reaction).
 */
function nullSpaceRational(matrix: number[][], numCols: number): number[] | null {
  const rows = matrix.length
  const M: Frac[][] = matrix.map((row) => row.map((v) => Frac.from(v)))

  const pivotCols: number[] = []
  let pivotRow = 0

  for (let col = 0; col < numCols && pivotRow < rows; col++) {
    let sel = -1
    for (let r = pivotRow; r < rows; r++) {
      if (!M[r][col].isZero()) {
        sel = r
        break
      }
    }
    if (sel === -1) continue

    ;[M[pivotRow], M[sel]] = [M[sel], M[pivotRow]]
    const pivotVal = M[pivotRow][col]
    M[pivotRow] = M[pivotRow].map((v) => v.div(pivotVal))

    for (let r = 0; r < rows; r++) {
      if (r === pivotRow) continue
      const factor = M[r][col]
      if (factor.isZero()) continue
      M[r] = M[r].map((v, c) => v.sub(factor.mul(M[pivotRow][c])))
    }

    pivotCols.push(col)
    pivotRow++
  }

  const freeCols = Array.from({ length: numCols }, (_, i) => i).filter((c) => !pivotCols.includes(c))
  if (freeCols.length === 0) return null // only trivial solution — under-determined system missing a free variable

  const freeCol = freeCols[0]
  const solution: Frac[] = new Array(numCols).fill(null).map(() => Frac.from(0))
  solution[freeCol] = Frac.from(1)

  for (let i = 0; i < pivotCols.length; i++) {
    const col = pivotCols[i]
    solution[col] = M[i][freeCol].mul(Frac.from(-1))
  }

  // Scale all fractions to a common integer denominator.
  let commonDen = 1n
  for (const f of solution) commonDen = lcmBig(commonDen, f.d)
  const ints = solution.map((f) => (f.n * (commonDen / f.d)))

  const g = ints.reduce((acc, v) => gcdBig(acc, v < 0n ? -v : v), 0n) || 1n
  const reduced = ints.map((v) => v / g)

  // All coefficients must be non-zero and same sign (flip if needed) for a physical reaction.
  if (reduced.some((v) => v === 0n)) return null
  const allPositive = reduced.every((v) => v > 0n)
  const allNegative = reduced.every((v) => v < 0n)
  if (!allPositive && !allNegative) return null

  const finalCoeffs = allNegative ? reduced.map((v) => -v) : reduced
  return finalCoeffs.map((v) => Number(v))
}

function lcmBig(a: bigint, b: bigint): bigint {
  if (a === 0n || b === 0n) return 0n
  return (a * b) / gcdBig(a < 0n ? -a : a, b < 0n ? -b : b)
}

export type ReactionType =
  | 'synthesis'
  | 'decomposition'
  | 'single-replacement'
  | 'double-replacement'
  | 'combustion'
  | 'acid-base'
  | 'unknown'

/** Classifies a balanced equation's reaction type from its shape and composition. */
export function classifyReaction(eq: BalancedEquation): ReactionType {
  if (!eq.balanced) return 'unknown'
  const { reactants, products } = eq

  const hasO2 = reactants.some((r) => r.formula.trim() === 'O2')
  const producesCO2AndH2O =
    products.some((p) => p.formula.trim() === 'CO2') && products.some((p) => p.formula.trim() === 'H2O')
  if (hasO2 && producesCO2AndH2O) return 'combustion'

  if (reactants.length >= 2 && products.length === 1) return 'synthesis'
  if (reactants.length === 1 && products.length >= 2) return 'decomposition'

  if (reactants.length === 2 && products.length === 2) {
    const reactantElementCounts = reactants.map((r) => Object.keys(parseFormula(r.formula)).length)
    const isElementPlusCompound = reactantElementCounts.some((c) => c === 1)
    if (isElementPlusCompound) return 'single-replacement'

    const containsAcidLike = reactants.some((r) => /^H[A-Z]/.test(r.formula) || r.formula.startsWith('H2'))
    const containsHydroxide = reactants.some((r) => r.formula.includes('OH'))
    if (containsAcidLike && containsHydroxide) return 'acid-base'

    return 'double-replacement'
  }

  return 'unknown'
}
