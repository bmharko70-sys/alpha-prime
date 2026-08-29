import { ELEMENTS } from '@/lib/science/data/elements'
import { MOLECULES } from '@/lib/science/data/molecules'

export type SearchCategory = 'element' | 'molecule' | 'tool' | 'simulation' | 'page'

export interface SearchEntry {
  id: string
  title: string
  subtitle?: string
  category: SearchCategory
  href: string
  keywords: string[]
}

export const TOOL_ENTRIES: SearchEntry[] = [
  { id: 'periodic-table', title: 'Periodic Table', subtitle: 'Interactive 118-element explorer', category: 'tool', href: '/chemistry/periodic-table', keywords: ['elements', 'table'] },
  { id: 'trends', title: 'Periodic Trends', subtitle: 'Electronegativity, radius, ionization energy', category: 'tool', href: '/chemistry/trends', keywords: ['electronegativity', 'atomic radius', 'ionization'] },
  { id: 'molecular-viewer', title: 'Molecular Viewer', subtitle: '3D ball-and-stick / space-filling models', category: 'tool', href: '/chemistry/molecular-viewer', keywords: ['3d', 'molecule', 'compound'] },
  { id: 'bonding', title: 'Bonding & Lewis Structures', subtitle: 'Lewis dot diagrams, VSEPR geometry', category: 'tool', href: '/chemistry/bonding', keywords: ['lewis', 'vsepr', 'bond'] },
  { id: 'equation-balancer', title: 'Equation Balancer', subtitle: 'Balance any chemical reaction', category: 'tool', href: '/chemistry/equation-balancer', keywords: ['balance', 'reaction', 'stoichiometry'] },
  { id: 'stoichiometry', title: 'Stoichiometry Calculator', subtitle: 'Mole ratios, limiting reagent, yield', category: 'tool', href: '/chemistry/stoichiometry', keywords: ['moles', 'limiting reagent', 'yield'] },
  { id: 'concentration', title: 'Concentration Calculator', subtitle: 'Molarity, dilution, molality', category: 'tool', href: '/chemistry/concentration', keywords: ['molarity', 'dilution', 'molality'] },
  { id: 'acid-base', title: 'Acid-Base Lab', subtitle: 'pH, pOH, titration curves', category: 'tool', href: '/chemistry/acid-base', keywords: ['ph', 'poh', 'titration', 'acid', 'base'] },
  { id: 'sims', title: 'Chemistry Simulations', subtitle: '12 interactive lab simulations', category: 'page', href: '/chemistry/simulations', keywords: ['simulation', 'lab', 'experiment'] },
  { id: 'assistant', title: 'Science AI Assistant', subtitle: 'Ask questions, get computed answers', category: 'page', href: '/assistant', keywords: ['ai', 'chat', 'assistant', 'help'] },
  { id: 'physics', title: 'Physics', subtitle: 'Mechanics, waves, electromagnetism', category: 'page', href: '/physics', keywords: ['physics'] },
  { id: 'biology', title: 'Biology', subtitle: 'Cells, organisms, genetics', category: 'page', href: '/biology', keywords: ['biology'] },
  { id: 'history-geography', title: 'History & Geography', subtitle: 'Civilizations, timelines, and places', category: 'page', href: '/history', keywords: ['history', 'geography', 'atlas', 'timeline', 'civilizations'] },
]

export function buildSearchIndex(): SearchEntry[] {
  const elementEntries: SearchEntry[] = ELEMENTS.map((el) => ({
    id: `element-${el.symbol}`,
    title: `${el.name} (${el.symbol})`,
    subtitle: `Element ${el.atomicNumber} · ${el.category.replace(/-/g, ' ')}`,
    category: 'element',
    href: `/chemistry/element/${el.symbol.toLowerCase()}`,
    keywords: [el.name.toLowerCase(), el.symbol.toLowerCase(), String(el.atomicNumber), el.category],
  }))

  const moleculeEntries: SearchEntry[] = MOLECULES.map((m) => ({
    id: `molecule-${m.formula}`,
    title: m.name,
    subtitle: m.formula,
    category: 'molecule',
    href: `/chemistry/molecular-viewer?molecule=${encodeURIComponent(m.formula)}`,
    keywords: [m.name.toLowerCase(), m.formula.toLowerCase()],
  }))

  return [...TOOL_ENTRIES, ...elementEntries, ...moleculeEntries]
}

export function searchEntries(query: string, entries: SearchEntry[], limit = 40): SearchEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries.slice(0, limit)

  const scored = entries
    .map((entry) => {
      const haystack = [entry.title, entry.subtitle ?? '', ...entry.keywords].join(' ').toLowerCase()
      let score = -1
      if (haystack.startsWith(q)) score = 100
      else if (entry.title.toLowerCase().startsWith(q)) score = 90
      else if (haystack.includes(q)) score = 50
      else if (entry.keywords.some((k) => k.includes(q))) score = 30
      return { entry, score }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((s) => s.entry)
}
