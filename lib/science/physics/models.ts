// ============================================================================
// PHYSICS LABORATORY: CORE VALIDATION & UTILITIES
// ============================================================================

/** Clamp a value to [min, max], replacing NaN/Infinity with min. */
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))

/** Validate input: ensure finite positive value. */
export const validatePositive = (value: number, fallback = 1): number => {
  if (!Number.isFinite(value) || value <= 0) return fallback
  return value
}

/** Format number for display with optional decimal places. */
export const fmt = (n: number, digits = 2): string =>
  Number.isFinite(n) ? n.toFixed(digits) : '—'

// ============================================================================
// PENDULUM PHYSICS
// ============================================================================

export interface PendulumState {
  t: number
  theta: number
  omega: number
  alpha: number
  x: number
  y: number
  vx: number
  vy: number
  energy: number
}

export const pendulumStep = (
  theta: number,
  omega: number,
  length: number,
  g: number,
  damping: number,
  dt: number
): { theta: number; omega: number; alpha: number } => {
  const alpha = -(g / validatePositive(length)) * Math.sin(theta) - damping * omega
  const nextOmega = omega + alpha * dt
  const nextTheta = theta + nextOmega * dt
  return { theta: nextTheta, omega: nextOmega, alpha }
}

export const pendulumEnergy = (
  theta: number,
  omega: number,
  mass: number,
  length: number,
  g: number
): number => {
  const height = -length * Math.cos(theta)
  const pe = mass * g * height
  const ke = 0.5 * mass * (length * omega) ** 2
  return pe + ke
}

// ============================================================================
// SPRING & SHM PHYSICS
// ============================================================================

export interface SpringState {
  t: number
  x: number
  v: number
  a: number
  ke: number
  pe: number
  energy: number
}

export const springStep = (
  x: number,
  v: number,
  mass: number,
  k: number,
  damping: number,
  dt: number
): { x: number; v: number; a: number } => {
  const m = validatePositive(mass)
  const ks = validatePositive(k)
  const a = (-ks * x - damping * v) / m
  const nextV = v + a * dt
  const nextX = x + nextV * dt
  return { x: nextX, v: nextV, a }
}

export const springEnergy = (x: number, v: number, k: number, mass: number): number => {
  const pe = 0.5 * validatePositive(k) * x * x
  const ke = 0.5 * validatePositive(mass) * v * v
  return pe + ke
}

// ============================================================================
// COLLISION PHYSICS
// ============================================================================

export const collision = (
  m1: number,
  v1: number,
  m2: number,
  v2: number,
  e: number
): { v1f: number; v2f: number } => {
  const m1v = validatePositive(m1)
  const m2v = validatePositive(m2)
  const denom = m1v + m2v
  const relVel = v1 - v2
  const impulse = ((1 + e) * m2v * relVel) / denom
  return {
    v1f: v1 - impulse / m1v,
    v2f: v2 + impulse / m2v,
  }
}

// ============================================================================
// PROJECTILE MOTION PHYSICS
// ============================================================================

export interface ProjectileState {
  t: number
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
}

export const projectileStep = (
  x: number,
  y: number,
  vx: number,
  vy: number,
  g: number,
  dt: number
): ProjectileState => {
  const ax = 0
  const ay = -validatePositive(g)
  const nextVx = vx + ax * dt
  const nextVy = vy + ay * dt
  const nextX = x + nextVx * dt
  const nextY = Math.max(0, y + nextVy * dt)
  return { t: 0, x: nextX, y: nextY, vx: nextVx, vy: nextVy, ax, ay }
}

export const projectileRange = (v0: number, angleDeg: number, g: number, h0: number = 0): number => {
  const a = (angleDeg * Math.PI) / 180
  const vx = v0 * Math.cos(a)
  const vy = v0 * Math.sin(a)
  const flight = (vy + Math.sqrt(Math.max(0, vy * vy + 2 * g * h0))) / validatePositive(g)
  return vx * flight
}

export const projectileMaxHeight = (v0: number, angleDeg: number, g: number, h0: number = 0): number => {
  const a = (angleDeg * Math.PI) / 180
  const vy = v0 * Math.sin(a)
  return h0 + (vy * vy) / (2 * validatePositive(g))
}

// ============================================================================
// BUOYANCY & DENSITY PHYSICS
// ============================================================================

export const density = (mass: number, volume: number): number =>
  validatePositive(mass) / validatePositive(volume)

export const buoyancy = (
  mass: number,
  volume: number,
  fluidDensity: number,
  g: number = 9.81
): {
  objectDensity: number
  buoyantForce: number
  weight: number
  netForce: number
  floats: boolean
} => {
  const m = validatePositive(mass)
  const v = validatePositive(volume)
  const fd = validatePositive(fluidDensity)
  const objDensity = density(m, v)
  const weight = m * validatePositive(g)
  const buoyantForce = fd * validatePositive(g) * v
  return {
    objectDensity: objDensity,
    buoyantForce,
    weight,
    netForce: buoyantForce - weight,
    floats: objDensity < fd,
  }
}

// ============================================================================
// DATA RECORDING & VISUALIZATION
// ============================================================================

export type Sample = { t: number; [key: string]: number }

export const seriesPath = (samples: Sample[], key: string, width = 560, height = 150): string => {
  if (!samples.length) return ''
  const values = samples.map((s) => Number(s[key] ?? 0))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1e-9)
  return samples
    .map((s, i) => {
      const x = (i / Math.max(samples.length - 1, 1)) * width
      const y = height - (((Number(s[key] ?? 0) - min) / range) * (height - 12) + 6)
      return `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

// ============================================================================
// LABORATORY CONFIGURATION
// ============================================================================

export const physicsConstants = { g: 9.81, waterDensity: 1000 }

export type LabId = 'pendulum' | 'spring' | 'collision' | 'buoyancy' | 'projectile'

export const labs: Array<{ id: LabId; name: string; subtitle: string; symbol: string }> = [
  { id: 'pendulum', name: 'Pendulum', subtitle: 'Nonlinear motion', symbol: '◌' },
  { id: 'spring', name: 'Spring & SHM', subtitle: 'Oscillation and energy', symbol: '∿' },
  { id: 'collision', name: 'Collision', subtitle: 'Momentum and impulse', symbol: '↔' },
  { id: 'buoyancy', name: 'Buoyancy', subtitle: 'Archimedes principle', symbol: '↑' },
  { id: 'projectile', name: 'Projectile', subtitle: 'Angled trajectory motion', symbol: '→' },
]

export const materials: Array<{ name: string; density: number }> = [
  { name: 'Cork', density: 240 },
  { name: 'Oak Wood', density: 700 },
  { name: 'Aluminum', density: 2700 },
  { name: 'Iron', density: 7874 },
  { name: 'Copper', density: 8960 },
  { name: 'Lead', density: 11340 },
]
