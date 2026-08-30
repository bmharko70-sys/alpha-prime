import { z } from 'zod'

export const BiologyIntent = z.enum(['definition', 'overview', 'structure', 'function', 'mechanism', 'process', 'comparison', 'classification', 'location', 'cause', 'effect', 'role', 'research', 'application'])
export const ParsedBiologyQuerySchema = z.object({ originalQuery: z.string().min(3).max(240), normalizedQuery: z.string().min(3).max(240), keywords: z.array(z.string()).max(24), phrases: z.array(z.string()).max(12), intent: BiologyIntent, entityType: z.string(), variants: z.array(z.string()).min(1).max(8), correction: z.string().optional(), recent: z.boolean() })
export type ParsedBiologyQuery = z.infer<typeof ParsedBiologyQuerySchema>

const aliases: Record<string, string> = { photosyn: 'photosynthesis', dna: 'deoxyribonucleic acid', rna: 'ribonucleic acid', atp: 'adenosine triphosphate', mrna: 'messenger RNA', mitochondria: 'mitochondrion', wbc: 'leukocyte', rbc: 'erythrocyte', 'cell-eating': 'phagocytosis' }
const corrections: Record<string, string> = { phagocitosis: 'phagocytosis', phagocytosys: 'phagocytosis', photosythesis: 'photosynthesis', mitocondria: 'mitochondria', meosis: 'meiosis', chlorophyl: 'chlorophyll', respitory: 'respiratory', eukaryot: 'eukaryote', prokaryot: 'prokaryote', nucleous: 'nucleus', enviroment: 'environment' }
const stopWords = new Set('a an the is are was were how what why where when does do of and or to in for with on by from about explain compare difference between function structure process tell me can you please'.split(' '))
const intents: Array<[RegExp, z.infer<typeof BiologyIntent>]> = [[/\b(compare|versus|vs\.?|difference)\b/i, 'comparison'], [/\b(latest|recent|current|new research|study)\b/i, 'research'], [/\b(where|location|found|distributed|habitat)\b/i, 'location'], [/\b(why|cause)\b/i, 'cause'], [/\b(effect|impact|result)\b/i, 'effect'], [/\b(role|important|importance)\b/i, 'role'], [/\b(structure|anatomy|parts|composition)\b/i, 'structure'], [/\b(how does|how do|mechanism|pathway)\b/i, 'mechanism'], [/\b(process|steps|stages|cycle|convert)\b/i, 'process'], [/\b(function|used for|does it do)\b/i, 'function'], [/\b(what is|define|meaning)\b/i, 'definition']]

function distance(a: string, b: string) { const row = Array.from({ length: b.length + 1 }, (_, i) => i); for (let i = 1; i <= a.length; i++) { let previous = row[0]; row[0] = i; for (let j = 1; j <= b.length; j++) { const current = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1)); previous = current } } return row[b.length] }
function fuzzy(token: string) { const candidates = Object.keys(corrections); const match = candidates.find((candidate) => token.length >= 7 && distance(token, candidate) <= Math.max(2, Math.floor(candidate.length * 0.25))); return match ? corrections[match] : token }

export function parseBiologyQuery(input: string): ParsedBiologyQuery {
  const originalQuery = input.trim().replace(/\s+/g, ' ').slice(0, 240)
  const rawTokens = originalQuery.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter(Boolean)
  const correctedTokens = rawTokens.map((token) => corrections[token] ?? fuzzy(token))
  const expanded = correctedTokens.map((token) => aliases[token] ?? token)
  const changed = expanded.some((token, index) => token !== rawTokens[index])
  const keywords = [...new Set(expanded.filter((token) => token.length > 2 && !stopWords.has(token)))]
  const intent = intents.find(([pattern]) => pattern.test(originalQuery))?.[1] ?? 'overview'
  const entityType = /\b(gene|protein|enzyme|dna|rna|atp)\b/i.test(originalQuery) ? 'molecule' : /\b(species|animal|plant|bacterium|organism)\b/i.test(originalQuery) ? 'organism' : /\b(cell|organelle|mitochondrion|nucleus)\b/i.test(originalQuery) ? 'cellular structure' : /\b(disease|virus|pathogen)\b/i.test(originalQuery) ? 'disease or pathogen' : intent === 'process' || intent === 'mechanism' ? 'biological process' : 'biological concept'
  const normalizedQuery = expanded.join(' ')
  const variants = [...new Set([normalizedQuery, keywords.join(' '), `${keywords.join(' ')} biology`, `${keywords.join(' ')} review`, originalQuery])].filter((value) => value.length >= 3).slice(0, 8)
  return ParsedBiologyQuerySchema.parse({ originalQuery, normalizedQuery, keywords, phrases: [keywords.slice(0, 5).join(' ')], intent, entityType, variants, correction: changed ? normalizedQuery : undefined, recent: /\b(latest|recent|current|new|2026)\b/i.test(originalQuery) })
}
