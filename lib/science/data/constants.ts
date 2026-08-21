import type { PhysicalConstant } from "../types"

export const CONSTANTS = {
  AVOGADRO: 6.02214076e23,
  GAS_CONSTANT: 8.314462618, // J/(mol*K)
  GAS_CONSTANT_L_ATM: 0.0820573, // L*atm/(mol*K)
  FARADAY: 96485.33212, // C/mol
  PLANCK: 6.62607015e-34, // J*s
  SPEED_OF_LIGHT: 2.99792458e8, // m/s
  BOLTZMANN: 1.380649e-23, // J/K
  ELEMENTARY_CHARGE: 1.602176634e-19, // C
  STANDARD_TEMPERATURE_K: 273.15,
  STANDARD_PRESSURE_ATM: 1,
  WATER_KW_25C: 1.0e-14, // ion product of water at 25C
} as const

export const CONSTANTS_LIST: PhysicalConstant[] = [
  { symbol: "N_A", name: "Avogadro constant", value: CONSTANTS.AVOGADRO, unit: "mol^-1", description: "Number of particles in one mole of substance" },
  { symbol: "R", name: "Gas constant", value: CONSTANTS.GAS_CONSTANT, unit: "J/(mol*K)", description: "Relates pressure, volume, temperature, and moles of an ideal gas" },
  { symbol: "F", name: "Faraday constant", value: CONSTANTS.FARADAY, unit: "C/mol", description: "Electric charge per mole of electrons" },
  { symbol: "h", name: "Planck constant", value: CONSTANTS.PLANCK, unit: "J*s", description: "Relates a photon's energy to its frequency" },
  { symbol: "c", name: "Speed of light", value: CONSTANTS.SPEED_OF_LIGHT, unit: "m/s", description: "Speed of light in vacuum" },
  { symbol: "k_B", name: "Boltzmann constant", value: CONSTANTS.BOLTZMANN, unit: "J/K", description: "Relates temperature to kinetic energy of particles" },
  { symbol: "e", name: "Elementary charge", value: CONSTANTS.ELEMENTARY_CHARGE, unit: "C", description: "Electric charge of a single proton" },
  { symbol: "K_w", name: "Ion product of water (25C)", value: CONSTANTS.WATER_KW_25C, unit: "mol^2/L^2", description: "[H+][OH-] at 25C, basis for the pH/pOH relationship" },
]
