import type { ElementCategory } from "@/lib/science/types"

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  "alkali-metal": "Alkali metal",
  "alkaline-earth": "Alkaline earth metal",
  "transition-metal": "Transition metal",
  "post-transition-metal": "Post-transition metal",
  metalloid: "Metalloid",
  nonmetal: "Nonmetal",
  halogen: "Halogen",
  "noble-gas": "Noble gas",
  lanthanide: "Lanthanide",
  actinide: "Actinide",
  unknown: "Unknown",
}

export const CATEGORY_CSS_VAR: Record<ElementCategory, string> = {
  "alkali-metal": "--cat-alkali-metal",
  "alkaline-earth": "--cat-alkaline-earth",
  "transition-metal": "--cat-transition-metal",
  "post-transition-metal": "--cat-post-transition",
  metalloid: "--cat-metalloid",
  nonmetal: "--cat-nonmetal",
  halogen: "--cat-halogen",
  "noble-gas": "--cat-noble-gas",
  lanthanide: "--cat-lanthanide",
  actinide: "--cat-actinide",
  unknown: "--cat-unknown",
}

export function categoryColor(category: ElementCategory): string {
  return `var(${CATEGORY_CSS_VAR[category]})`
}
