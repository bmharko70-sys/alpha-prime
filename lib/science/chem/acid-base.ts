/** Real acid/base equilibrium math — strong-acid/base exact, weak-acid/base via Ka/Kb quadratic. */

const KW = 1.0e-14 // water autoionization constant at 25°C

export interface PhResult {
  pH: number
  pOH: number
  hConcentration: number
  ohConcentration: number
  classification: 'strongly acidic' | 'acidic' | 'neutral' | 'basic' | 'strongly basic'
}

function classify(pH: number): PhResult['classification'] {
  if (pH < 3) return 'strongly acidic'
  if (pH < 6.5) return 'acidic'
  if (pH <= 7.5) return 'neutral'
  if (pH < 11) return 'basic'
  return 'strongly basic'
}

/** Strong acid/base fully dissociates: [H+] = concentration (acid) or via Kw (base). */
export function strongAcidPh(concentrationMolar: number): PhResult {
  const h = concentrationMolar
  const pH = -Math.log10(h)
  const oh = KW / h
  return { pH, pOH: 14 - pH, hConcentration: h, ohConcentration: oh, classification: classify(pH) }
}

export function strongBasePh(concentrationMolar: number): PhResult {
  const oh = concentrationMolar
  const pOH = -Math.log10(oh)
  const pH = 14 - pOH
  const h = KW / oh
  return { pH, pOH, hConcentration: h, ohConcentration: oh, classification: classify(pH) }
}

/**
 * Weak acid HA <-> H+ + A-. Solves Ka = x^2 / (C0 - x) exactly via the
 * quadratic formula rather than the small-x approximation.
 */
export function weakAcidPh(concentrationMolar: number, ka: number): PhResult {
  // x^2 + Ka*x - Ka*C0 = 0
  const a = 1
  const b = ka
  const c = -ka * concentrationMolar
  const x = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
  const h = Math.max(x, 1e-14)
  const pH = -Math.log10(h)
  return { pH, pOH: 14 - pH, hConcentration: h, ohConcentration: KW / h, classification: classify(pH) }
}

/** Weak base B + H2O <-> BH+ + OH-. Solves Kb = x^2 / (C0 - x) exactly. */
export function weakBasePh(concentrationMolar: number, kb: number): PhResult {
  const a = 1
  const b = kb
  const c = -kb * concentrationMolar
  const x = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a)
  const oh = Math.max(x, 1e-14)
  const pOH = -Math.log10(oh)
  const pH = 14 - pOH
  return { pH, pOH, hConcentration: KW / oh, ohConcentration: oh, classification: classify(pH) }
}

/** Henderson–Hasselbalch buffer equation: pH = pKa + log10([A-]/[HA]). */
export function bufferPh(ka: number, baseConcentration: number, acidConcentration: number): number {
  const pKa = -Math.log10(ka)
  return pKa + Math.log10(baseConcentration / acidConcentration)
}

/** Common named acids/bases with real literature Ka/Kb values, for the acid-base lab presets. */
export const COMMON_ACIDS = [
  { name: 'Hydrochloric acid', formula: 'HCl', type: 'strong' as const, ka: null },
  { name: 'Sulfuric acid', formula: 'H2SO4', type: 'strong' as const, ka: null },
  { name: 'Nitric acid', formula: 'HNO3', type: 'strong' as const, ka: null },
  { name: 'Acetic acid', formula: 'CH3COOH', type: 'weak' as const, ka: 1.8e-5 },
  { name: 'Carbonic acid', formula: 'H2CO3', type: 'weak' as const, ka: 4.3e-7 },
  { name: 'Hydrofluoric acid', formula: 'HF', type: 'weak' as const, ka: 6.6e-4 },
  { name: 'Formic acid', formula: 'HCOOH', type: 'weak' as const, ka: 1.8e-4 },
]

export const COMMON_BASES = [
  { name: 'Sodium hydroxide', formula: 'NaOH', type: 'strong' as const, kb: null },
  { name: 'Potassium hydroxide', formula: 'KOH', type: 'strong' as const, kb: null },
  { name: 'Ammonia', formula: 'NH3', type: 'weak' as const, kb: 1.8e-5 },
  { name: 'Methylamine', formula: 'CH3NH2', type: 'weak' as const, kb: 4.4e-4 },
  { name: 'Pyridine', formula: 'C5H5N', type: 'weak' as const, kb: 1.7e-9 },
]

/** Titration: strong acid with strong base, computing pH at a given volume of titrant added. */
export function titrationPh(
  acidConcentration: number,
  acidVolumeMl: number,
  baseConcentration: number,
  baseVolumeAddedMl: number
): number {
  const molesAcid = acidConcentration * (acidVolumeMl / 1000)
  const molesBase = baseConcentration * (baseVolumeAddedMl / 1000)
  const totalVolumeL = (acidVolumeMl + baseVolumeAddedMl) / 1000

  const netMoles = molesAcid - molesBase
  if (Math.abs(netMoles) < 1e-12) return 7 // equivalence point (strong/strong)

  if (netMoles > 0) {
    const h = netMoles / totalVolumeL
    return -Math.log10(h)
  } else {
    const oh = -netMoles / totalVolumeL
    const pOH = -Math.log10(oh)
    return 14 - pOH
  }
}
