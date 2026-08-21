import type { ElementIsotope } from "../types"

// Scientifically notable isotopes per element (not exhaustive nuclide charts).
// Abundance is natural terrestrial abundance in percent, null when the
// isotope is synthetic/trace or the element has no stable isotopes.
export const NOTABLE_ISOTOPES: Record<string, ElementIsotope[]> = {
  H: [
    { massNumber: 1, symbol: "H-1 (protium)", abundance: 99.9885, stable: true, halfLife: null },
    { massNumber: 2, symbol: "H-2 (deuterium)", abundance: 0.0115, stable: true, halfLife: null },
    { massNumber: 3, symbol: "H-3 (tritium)", abundance: null, stable: false, halfLife: "12.32 years" },
  ],
  He: [
    { massNumber: 3, symbol: "He-3", abundance: 0.0002, stable: true, halfLife: null },
    { massNumber: 4, symbol: "He-4", abundance: 99.9998, stable: true, halfLife: null },
  ],
  C: [
    { massNumber: 12, symbol: "C-12", abundance: 98.93, stable: true, halfLife: null },
    { massNumber: 13, symbol: "C-13", abundance: 1.07, stable: true, halfLife: null },
    { massNumber: 14, symbol: "C-14", abundance: null, stable: false, halfLife: "5,730 years (radiocarbon dating)" },
  ],
  N: [
    { massNumber: 14, symbol: "N-14", abundance: 99.636, stable: true, halfLife: null },
    { massNumber: 15, symbol: "N-15", abundance: 0.364, stable: true, halfLife: null },
  ],
  O: [
    { massNumber: 16, symbol: "O-16", abundance: 99.757, stable: true, halfLife: null },
    { massNumber: 17, symbol: "O-17", abundance: 0.038, stable: true, halfLife: null },
    { massNumber: 18, symbol: "O-18", abundance: 0.205, stable: true, halfLife: null },
  ],
  Na: [{ massNumber: 23, symbol: "Na-23", abundance: 100, stable: true, halfLife: null }],
  Cl: [
    { massNumber: 35, symbol: "Cl-35", abundance: 75.76, stable: true, halfLife: null },
    { massNumber: 37, symbol: "Cl-37", abundance: 24.24, stable: true, halfLife: null },
  ],
  K: [
    { massNumber: 39, symbol: "K-39", abundance: 93.258, stable: true, halfLife: null },
    { massNumber: 40, symbol: "K-40", abundance: 0.012, stable: false, halfLife: "1.25 billion years (K-Ar dating)" },
    { massNumber: 41, symbol: "K-41", abundance: 6.73, stable: true, halfLife: null },
  ],
  Co: [
    { massNumber: 59, symbol: "Co-59", abundance: 100, stable: true, halfLife: null },
    { massNumber: 60, symbol: "Co-60", abundance: null, stable: false, halfLife: "5.27 years (radiotherapy source)" },
  ],
  I: [
    { massNumber: 127, symbol: "I-127", abundance: 100, stable: true, halfLife: null },
    { massNumber: 131, symbol: "I-131", abundance: null, stable: false, halfLife: "8.02 days (medical tracer)" },
  ],
  Cs: [
    { massNumber: 133, symbol: "Cs-133", abundance: 100, stable: true, halfLife: null },
    { massNumber: 137, symbol: "Cs-137", abundance: null, stable: false, halfLife: "30.17 years (fission byproduct)" },
  ],
  Tc: [{ massNumber: 99, symbol: "Tc-99m", abundance: null, stable: false, halfLife: "6.01 hours (medical imaging)" }],
  U: [
    { massNumber: 234, symbol: "U-234", abundance: 0.0054, stable: false, halfLife: "245,500 years" },
    { massNumber: 235, symbol: "U-235", abundance: 0.7204, stable: false, halfLife: "703.8 million years (fissile)" },
    { massNumber: 238, symbol: "U-238", abundance: 99.2742, stable: false, halfLife: "4.468 billion years" },
  ],
  Pu: [{ massNumber: 239, symbol: "Pu-239", abundance: null, stable: false, halfLife: "24,110 years (fissile, weapons/fuel)" }],
  Ra: [{ massNumber: 226, symbol: "Ra-226", abundance: null, stable: false, halfLife: "1,600 years" }],
  Rn: [{ massNumber: 222, symbol: "Rn-222", abundance: null, stable: false, halfLife: "3.82 days" }],
  P: [{ massNumber: 31, symbol: "P-31", abundance: 100, stable: true, halfLife: null }],
  F: [{ massNumber: 19, symbol: "F-19", abundance: 100, stable: true, halfLife: null }],
  Al: [{ massNumber: 27, symbol: "Al-27", abundance: 100, stable: true, halfLife: null }],
  Au: [{ massNumber: 197, symbol: "Au-197", abundance: 100, stable: true, halfLife: null }],
  Ag: [
    { massNumber: 107, symbol: "Ag-107", abundance: 51.84, stable: true, halfLife: null },
    { massNumber: 109, symbol: "Ag-109", abundance: 48.16, stable: true, halfLife: null },
  ],
  Fe: [
    { massNumber: 54, symbol: "Fe-54", abundance: 5.85, stable: true, halfLife: null },
    { massNumber: 56, symbol: "Fe-56", abundance: 91.75, stable: true, halfLife: null },
    { massNumber: 57, symbol: "Fe-57", abundance: 2.12, stable: true, halfLife: null },
    { massNumber: 58, symbol: "Fe-58", abundance: 0.28, stable: true, halfLife: null },
  ],
  Cu: [
    { massNumber: 63, symbol: "Cu-63", abundance: 69.15, stable: true, halfLife: null },
    { massNumber: 65, symbol: "Cu-65", abundance: 30.85, stable: true, halfLife: null },
  ],
  Sr: [{ massNumber: 90, symbol: "Sr-90", abundance: null, stable: false, halfLife: "28.8 years (fission byproduct)" }],
  Am: [{ massNumber: 241, symbol: "Am-241", abundance: null, stable: false, halfLife: "432.2 years (smoke detectors)" }],
  Th: [{ massNumber: 232, symbol: "Th-232", abundance: 100, stable: false, halfLife: "14.05 billion years" }],
}
