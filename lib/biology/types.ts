export type ResearchStage = 'analyzing' | 'searching' | 'evaluating' | 'cross-checking' | 'structuring' | 'generating' | 'complete' | 'error'

export type BiologySource = {
  id: string
  title: string
  url: string
  publisher: string
  type: 'database' | 'journal' | 'institution' | 'reference'
  published?: string
  retrieved: string
  confidence: 'high' | 'medium'
  snippet?: string
}

export type BiologyResearch = {
  query: string
  title: string
  summary: string
  definition: string
  importance: string[]
  keyFacts: { label: string; value: string; evidence: string[] }[]
  process: { stage: string; detail: string }[]
  timeline: { date: string; event: string; detail: string }[]
  misconceptions: { myth: string; correction: string }[]
  related: string[]
  sources: BiologySource[]
  limitations?: string
}

export type ResearchEvent = { stage: ResearchStage; message: string; progress: number; data?: BiologyResearch }
