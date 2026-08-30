import { z } from 'zod'

export const ParsedBiologyQuerySchema = z.object({
  originalQuery: z.string().min(3).max(240),
  normalizedQuery: z.string().min(3).max(240),
  keywords: z.array(z.string()).max(24),
  phrases: z.array(z.string()).max(12),
  intent: z.enum(['definition', 'mechanism', 'structure', 'process', 'comparison', 'application', 'overview']),
  variants: z.array(z.string()).min(1).max(8),
  correction: z.string().optional(),
})
export type ParsedBiologyQuery = z.infer<typeof ParsedBiologyQuerySchema>

const aliases: Record<string, string> = { photosyn: 'photosynthesis', dna: 'deoxyribonucleic acid', rna: 'ribonucleic acid', atp: 'adenosine triphosphate', mrna: 'messenger RNA', mitochondria: 'mitochondrion' }
const corrections: Record<string, string> = { photosythesis: 'photosynthesis', mitosis: 'mitosis', meosis: 'meiosis', chlorophyl: 'chlorophyll', respitory: 'respiratory', eukaryot: 'eukaryote', prokaryot: 'prokaryote', nucleous: 'nucleus', enviroment: 'environment' }
const stopWords = new Set('a an the is are was were how what why where when does do of and or to in for with on by from about explain compare difference between function structure process'.split(' '))

export function parseBiologyQuery(input: string): ParsedBiologyQuery {
  const originalQuery = input.trim().replace(/\s+/g, ' ').slice(0, 240)
  const rawTokens = originalQuery.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter(Boolean)
  const correctedTokens = rawTokens.map((token) => corrections[token] ?? token)
  const changed = correctedTokens.some((token, index) => token !== rawTokens[index])
  const expanded = correctedTokens.map((token) => aliases[token] ?? token)
  const normalizedQuery = expanded.join(' ')
  const keywords = [...new Set(expanded.filter((token) => token.length > 2 && !stopWords.has(token)))]
  const comparison = /\b(compare|versus|vs\.?|difference|differentiate)\b/i.test(originalQuery)
  const mechanism = /\bhow does|how do|mechanism|pathway|why\b/i.test(originalQuery)
  const structure = /\bstructure|anatomy|parts|組織\b/i.test(originalQuery)
  const process = /\bprocess| 단계|cycle|steps|convert|synthesis\b/i.test(originalQuery)
  const intent = comparison ? 'comparison' : mechanism ? 'mechanism' : structure ? 'structure' : process ? 'process' : /\bwhat is|define|meaning\b/i.test(originalQuery) ? 'definition' : 'overview'
  const variants = [...new Set([normalizedQuery, keywords.join(' '), originalQuery, comparison ? `${keywords.join(' ')} comparison` : `${keywords.join(' ')} biology`])].filter((v) => v.length >= 3).slice(0, 8)
  return ParsedBiologyQuerySchema.parse({ originalQuery, normalizedQuery, keywords, phrases: comparison ? [originalQuery] : keywords.slice(0, 4), intent, variants, correction: changed ? normalizedQuery : undefined })
}
