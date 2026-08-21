import type { ElementData } from "../types"
import { computeElectronConfiguration } from "../chem/electron-configuration"
import { RAW_ELEMENTS } from "./elements-raw"
import { NOTABLE_ISOTOPES } from "./isotopes"

function buildElement(raw: (typeof RAW_ELEMENTS)[number]): ElementData {
  const [
    atomicNumber,
    symbol,
    name,
    category,
    group,
    period,
    block,
    atomicMass,
    electronegativity,
    ionizationEnergy,
    electronAffinity,
    atomicRadius,
    ionicRadius,
    covalentRadius,
    density,
    meltingPoint,
    boilingPoint,
    state,
    appearance,
    crystalStructure,
    magneticBehavior,
    discoveryYear,
    discoveredBy,
    oxidationStates,
    namedFor,
    uses,
    occurrence,
  ] = raw

  const config = computeElectronConfiguration(atomicNumber)

  return {
    atomicNumber,
    symbol,
    name,
    category,
    group,
    period,
    block,
    atomicMass,
    electronConfiguration: config.ordered,
    electronConfigurationShort: config.shorthand,
    electronsPerShell: config.electronsPerShell,
    electronegativity,
    ionizationEnergy,
    electronAffinity,
    atomicRadius,
    ionicRadius,
    covalentRadius,
    density,
    meltingPoint,
    boilingPoint,
    state,
    appearance,
    crystalStructure,
    magneticBehavior,
    discoveryYear,
    discoveredBy,
    oxidationStates,
    namedFor,
    isotopes: NOTABLE_ISOTOPES[symbol] ?? [],
    uses,
    occurrence,
    standardState25C: state === "unknown" ? "unknown (not experimentally measured)" : state,
  }
}

export const ELEMENTS: ElementData[] = RAW_ELEMENTS.map(buildElement)

export const ELEMENTS_BY_SYMBOL: Record<string, ElementData> = Object.fromEntries(
  ELEMENTS.map((el) => [el.symbol, el]),
)

export const ELEMENTS_BY_NUMBER: Record<number, ElementData> = Object.fromEntries(
  ELEMENTS.map((el) => [el.atomicNumber, el]),
)

export function getElementBySymbol(symbol: string): ElementData | undefined {
  return ELEMENTS_BY_SYMBOL[symbol] ?? ELEMENTS_BY_SYMBOL[symbol?.charAt(0).toUpperCase() + symbol?.slice(1).toLowerCase()]
}

export function getElementByNumber(n: number): ElementData | undefined {
  return ELEMENTS_BY_NUMBER[n]
}

/**
 * Derives the number of valence electrons from group number using the
 * standard main-group rule (group 1-2 => group number; group 13-18 =>
 * group number - 10). Transition metals (groups 3-12) and f-block elements
 * don't follow a single simple rule, so we fall back to the outermost
 * shell's electron count from the computed configuration.
 */
export function getValenceElectrons(element: ElementData): number | null {
  if (element.group === 1 || element.group === 2) return element.group
  if (element.group && element.group >= 13 && element.group <= 18) {
    return element.group === 18 && element.symbol === "He" ? 2 : element.group - 10
  }
  const shells = element.electronsPerShell
  return shells.length > 0 ? shells[shells.length - 1] : null
}

export function searchElements(query: string): ElementData[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const asNumber = Number.parseInt(q.replace(/^atomic number\s*/i, ""), 10)
  return ELEMENTS.filter((el) => {
    if (!Number.isNaN(asNumber) && el.atomicNumber === asNumber) return true
    return (
      el.name.toLowerCase().includes(q) ||
      el.symbol.toLowerCase() === q ||
      el.symbol.toLowerCase().includes(q) ||
      el.category.replace("-", " ").includes(q)
    )
  }).slice(0, 20)
}

export const CATEGORY_LABELS: Record<ElementData["category"], string> = {
  "alkali-metal": "Alkali Metal",
  "alkaline-earth": "Alkaline Earth Metal",
  "transition-metal": "Transition Metal",
  "post-transition-metal": "Post-Transition Metal",
  metalloid: "Metalloid",
  nonmetal: "Nonmetal",
  halogen: "Halogen",
  "noble-gas": "Noble Gas",
  lanthanide: "Lanthanide",
  actinide: "Actinide",
  unknown: "Unknown / Unclassified",
}

export const CATEGORY_COLOR_VAR: Record<ElementData["category"], string> = {
  "alkali-metal": "var(--cat-alkali-metal)",
  "alkaline-earth": "var(--cat-alkaline-earth)",
  "transition-metal": "var(--cat-transition-metal)",
  "post-transition-metal": "var(--cat-post-transition)",
  metalloid: "var(--cat-metalloid)",
  nonmetal: "var(--cat-nonmetal)",
  halogen: "var(--cat-halogen)",
  "noble-gas": "var(--cat-noble-gas)",
  lanthanide: "var(--cat-lanthanide)",
  actinide: "var(--cat-actinide)",
  unknown: "var(--cat-unknown)",
}
