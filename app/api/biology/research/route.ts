import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import type { BiologyResearch, BiologySource, ResearchEvent } from '@/lib/biology/types'
import { groqModel } from '@/lib/ai/groq'
import { groqRetrievalFallback, isUsableGroqFallback } from '@/lib/ai/retrieval'

export const runtime = 'nodejs'
const encoder = new TextEncoder()
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
function emit(controller: ReadableStreamDefaultController, event: ResearchEvent) { controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)) }

async function retrieve(query: string): Promise<BiologySource[]> {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&pageSize=20&resultType=core&sort=RELEVANCE&query=${encodeURIComponent(`${query} AND OPEN_ACCESS:Y AND (ABSTRACT:*)`)}`
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error('Live Europe PMC retrieval failed')
  const results = (await response.json())?.resultList?.result ?? []
  const sources = results.filter((item: { title?: string; abstractText?: string }) => item.title && item.abstractText).map((item: { id: string; title: string; journalTitle?: string; pubYear?: string; pmcid?: string; abstractText?: string }) => ({ id: item.id, title: item.title, url: item.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${item.pmcid}/` : `https://europepmc.org/article/MED/${item.id}`, publisher: item.journalTitle ?? 'Europe PMC', type: 'journal' as const, published: item.pubYear, retrieved: new Date().toISOString().slice(0, 10), confidence: 'high' as const, snippet: item.abstractText?.slice(0, 700) }))
  let uniqueSources: BiologySource[] = [...new Map<string, BiologySource>(sources.map((source: BiologySource) => [source.id, source])).values()].slice(0, 8)
  if (uniqueSources.length < 3) {
    try {
      const wiki = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replaceAll(' ', '_'))}`, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } })
      if (wiki.ok) { const summary = await wiki.json(); if (summary.extract) { sources.unshift({ id: 'WIKI', title: summary.title ?? query, url: summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replaceAll(' ', '_'))}`, publisher: 'Wikipedia', type: 'reference', retrieved: new Date().toISOString().slice(0, 10), confidence: 'medium', snippet: summary.extract.slice(0, 900) }) } }
    } catch { /* Europe PMC remains usable when Wikipedia is unavailable. */ }
  }
  uniqueSources = [...new Map<string, BiologySource>(sources.map((source: BiologySource) => [source.id, source])).values()].slice(0, 8)
  return uniqueSources
}

async function evidenceFallback(query: string, sources: BiologySource[]): Promise<BiologyResearch> {
  let aiBackground = ''
  try { aiBackground = await groqRetrievalFallback(query, 'biology') } catch { /* Keep the evidence-only fallback usable when Groq is unavailable. */ }

  const first = sources.find((source) => source.snippet) ?? sources[0]
  const excerpt = first?.snippet ?? 'No abstract was returned by the live literature service.'
  const ids = sources.slice(0, 3).map((source) => source.id)
  return { query, sources, title: query, summary: isUsableGroqFallback(aiBackground) ? aiBackground : excerpt, definition: excerpt, importance: [isUsableGroqFallback(aiBackground) ? 'AI-generated orientation is shown because live literature returned limited evidence; verify it against scholarly sources.' : 'This explanation is taken directly from live source abstracts because Groq generation was unavailable.'], keyFacts: sources.slice(0, 4).map((source, index) => ({ label: `Evidence ${index + 1}`, value: source.snippet ?? source.title, evidence: [source.id] })), process: [], timeline: [], related: [], flashcards: sources.slice(0, 5).map((source) => ({ front: `What does this source report about ${query}?`, back: source.snippet ?? source.title, sourceIds: [source.id] })), questions: ids.length ? [{ prompt: `Which source is directly associated with the live evidence for “${query}”?`, options: [first.title, 'No source was retrieved', 'An unrelated textbook', 'A simulated record'], answer: 0, explanation: `The live result is ${first.publisher}, record ${first.id}.`, sourceIds: [first.id] }] : [], limitations: 'Groq generation was unavailable, so the app displayed live source evidence without AI synthesis.' }
}

async function synthesize(query: string, sources: BiologySource[]): Promise<BiologyResearch> {
  const evidence = sources.map((source) => `[${source.id}] ${source.title}\n${source.snippet ?? ''}`).join('\n\n')
  const prompt = `You are a careful academic Biology tutor and evidence synthesizer. Answer the user's question using ONLY the supplied evidence when making factual claims. Separate direct evidence from reasonable interpretation, preserve uncertainty, and never add unsupported dates, measurements, diagnoses, or citations. If evidence is insufficient or sources disagree, say exactly what is missing or conflicting. Return ONLY valid JSON matching this shape: {"title":string,"summary":string,"definition":string,"importance":string[],"keyFacts":[{"label":string,"value":string,"evidence":string[]}],"process":[{"stage":string,"detail":string}],"timeline":[{"date":string,"event":string,"detail":string}],"related":string[],"flashcards":[{"front":string,"back":string,"sourceIds":string[]}],"questions":[{"prompt":string,"options":string[],"answer":number,"explanation":string,"sourceIds":string[]}],"limitations":string}. Create 5 flashcards and 3 multiple-choice questions. Every evidence/sourceIds value must be an ID from the evidence list. Never invent citations.\nUSER QUESTION: ${query}\nEVIDENCE:\n${evidence}`
  try {
    const result = await generateText({ model: groqModel(), prompt, temperature: 0.2 })
    const parsed = JSON.parse(result.text) as Omit<BiologyResearch, 'query' | 'sources'>
    return { query, sources, ...parsed, flashcards: parsed.flashcards ?? [], questions: parsed.questions ?? [] }
  } catch {
    return await evidenceFallback(query, sources)
  }
}

export async function POST(request: NextRequest) {
  let body: { query?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 240) : ''
  if (query.length < 3) return Response.json({ error: 'Ask a Biology question with at least 3 characters.' }, { status: 400 })
  const stream = new ReadableStream({ async start(controller) { try { emit(controller, { stage: 'analyzing', message: 'Parsing your research question', progress: 12 }); await sleep(150); emit(controller, { stage: 'searching', message: 'Searching live Europe PMC literature', progress: 32 }); const sources = await retrieve(query); emit(controller, { stage: 'evaluating', message: `Evaluating ${sources.length} attributable records`, progress: 58 }); await sleep(150); emit(controller, { stage: 'cross-checking', message: 'Grounding the explanation in source abstracts', progress: 74 }); emit(controller, { stage: 'generating', message: 'Generating study material with Groq', progress: 88 }); const data = await synthesize(query, sources); emit(controller, { stage: 'complete', message: 'Evidence-backed Biology brief ready', progress: 100, data }); controller.close() } catch (error) { emit(controller, { stage: 'error', message: error instanceof Error ? error.message : 'Research generation failed', progress: 0 }); controller.close() } } })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
}
