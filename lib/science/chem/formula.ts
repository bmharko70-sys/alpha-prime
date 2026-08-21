import { getElementBySymbol } from '@/lib/science/data/elements'

/** A parsed chemical formula: element symbol -> atom count. */
export type ParsedFormula = Record<string, number>

/**
 * Parses a chemical formula string (supports nested parentheses and
 * hydrates like "CuSO4.5H2O") into element -> count map.
 */
export function parseFormula(formula: string): ParsedFormula {
  const clean = formula.trim()
  // Handle hydrates / adducts separated by "." or "·"
  const parts = clean.split(/[.·]/).map((p) => p.trim())

  const total: ParsedFormula = {}

  for (const part of parts) {
    // A leading multiplier like "5H2O"
    const multiplierMatch = part.match(/^(\d+)(.*)$/)
    const multiplier = multiplierMatch ? Number.parseInt(multiplierMatch[1], 10) : 1
    const body = multiplierMatch ? multiplierMatch[2] : part

    const parsed = parseGroup(body)
    for (const [symbol, count] of Object.entries(parsed)) {
      total[symbol] = (total[symbol] ?? 0) + count * multiplier
    }
  }

  return total
}

function parseGroup(formula: string): ParsedFormula {
  let index = 0

  function parseExpression(): ParsedFormula {
    const counts: ParsedFormula = {}

    while (index < formula.length) {
      const char = formula[index]

      if (char === '(' || char === '[') {
        index++
        const inner = parseExpression()
        // consume closing bracket
        index++
        const multiplier = readNumber()
        for (const [symbol, count] of Object.entries(inner)) {
          counts[symbol] = (counts[symbol] ?? 0) + count * multiplier
        }
      } else if (char === ')' || char === ']') {
        break
      } else if (/[A-Z]/.test(char)) {
        const symbol = readSymbol()
        const count = readNumber()
        counts[symbol] = (counts[symbol] ?? 0) + count
      } else {
        // skip unknown/whitespace/charge markers
        index++
      }
    }

    return counts
  }

  function readSymbol(): string {
    let symbol = formula[index]
    index++
    while (index < formula.length && /[a-z]/.test(formula[index])) {
      symbol += formula[index]
      index++
    }
    return symbol
  }

  function readNumber(): number {
    let numStr = ''
    while (index < formula.length && /\d/.test(formula[index])) {
      numStr += formula[index]
      index++
    }
    return numStr === '' ? 1 : Number.parseInt(numStr, 10)
  }

  return parseExpression()
}

/** Computes the molar mass (g/mol) of a formula string using real atomic masses. */
export function molarMass(formula: string): number {
  const parsed = parseFormula(formula)
  let mass = 0
  for (const [symbol, count] of Object.entries(parsed)) {
    const element = getElementBySymbol(symbol)
    if (!element) continue
    mass += element.atomicMass * count
  }
  return mass
}

/** Returns per-element mass breakdown and percent composition for a formula. */
export function massComposition(formula: string) {
  const parsed = parseFormula(formula)
  const total = molarMass(formula)
  return Object.entries(parsed).map(([symbol, count]) => {
    const element = getElementBySymbol(symbol)
    const elementMass = (element?.atomicMass ?? 0) * count
    return {
      symbol,
      name: element?.name ?? symbol,
      count,
      mass: elementMass,
      percent: total > 0 ? (elementMass / total) * 100 : 0,
    }
  })
}

/** Formats a parsed formula map back into a display string, e.g. { C: 6, H: 12, O: 6 } -> "C6H12O6". */
export function formatFormula(parsed: ParsedFormula): string {
  return Object.entries(parsed)
    .map(([symbol, count]) => (count === 1 ? symbol : `${symbol}${count}`))
    .join('')
}
