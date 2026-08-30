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

export type BiologyFlashcard = { front: string; back: string; sourceIds: string[] }
export type BiologyQuestion = { prompt: string; options: string[]; answer: number; explanation: string; sourceIds: string[] }

export type BiologyResearch = {
  query: string
  parsedQuery?: { originalQuery: string; normalizedQuery: string; keywords: string[]; intent: string; entityType?: string; correction?: string; recent?: boolean }
  entityType?: string
  evidenceLevel?: 'low' | 'moderate' | 'high'
  comparison?: { headers: string[]; rows: string[][] }
  sections?: { title: string; content: string; evidence: string[] }[]
  title: string
  summary: string
  definition: string
  importance: string[]
  keyFacts: { label: string; value: string; evidence: string[] }[]
  process: { stage: string; detail: string }[]
  timeline: { date: string; event: string; detail: string }[]
  misconceptions?: { myth: string; correction: string }[]
  related: string[]
  sources: BiologySource[]
  flashcards: BiologyFlashcard[]
  questions: BiologyQuestion[]
  limitations?: string
}

export type ResearchEvent = { stage: ResearchStage; message: string; progress: number; data?: BiologyResearch }
