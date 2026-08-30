import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import type { BiologyResearch, BiologySource, ResearchEvent } from '@/lib/biology/types'
import { groqModel } from '@/lib/ai/groq'
import { parseBiologyQuery } from '@/lib/biology/query'
import { groqRetrievalFallback, isUsableGroqFallback } from '@/lib/ai/retrieval'

export const runtime = 'nodejs'
const encoder = new TextEncoder()
const emit = (c: ReadableStreamDefaultController, e: ResearchEvent) => c.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`))

async function retrieveOne(query: string): Promise<BiologySource[]> {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&pageSize=12&resultType=core&sort=RELEVANCE&query=${encodeURIComponent(`${query} AND OPEN_ACCESS:Y`)}`
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error('Europe PMC retrieval failed')
  const results = (await response.json())?.resultList?.result ?? []
  return results.filter((x: any) => x.id && x.title && x.abstractText).map((x: any) => ({ id: String(x.doi ?? x.id), title: x.title, url: x.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${x.pmcid}/` : `https://europepmc.org/article/MED/${x.id}`, publisher: x.journalTitle ?? 'Europe PMC', type: 'journal', published: x.pubYear, retrieved: new Date().toISOString().slice(0, 10), confidence: 'high', snippet: x.abstractText.slice(0, 900) }))
}

async function retrieve(parsed: ReturnType<typeof parseBiologyQuery>) {
  const batches = await Promise.allSettled(parsed.variants.slice(0, 4).map(retrieveOne))
  const sources = batches.flatMap((b) => b.status === 'fulfilled' ? b.value : [])
  const unique = [...new Map(sources.map((s) => [s.id, s])).values()].slice(0, 10)
  if (unique.length < 3) {
    try { const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(parsed.keywords.slice(0, 5).join('_'))}`, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } }); const x = await r.json(); if (x.extract) unique.push({ id: 'WIKI', title: x.title ?? parsed.originalQuery, url: x.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(x.title ?? parsed.originalQuery)}`, publisher: 'Wikipedia', type: 'reference', retrieved: new Date().toISOString().slice(0, 10), confidence: 'medium', snippet: x.extract.slice(0, 900) }) } catch { /* evidence may be empty */ }
  }
  return unique
}

async function fallback(query: string, sources: BiologySource[], parsedQuery?: ReturnType<typeof parseBiologyQuery>): Promise<BiologyResearch> { let text = ''; try { text = await groqRetrievalFallback(query, 'biology') } catch {} const first = sources[0]; return { query, parsedQuery: parsedQuery ? { originalQuery: parsedQuery.originalQuery, normalizedQuery: parsedQuery.normalizedQuery, keywords: parsedQuery.keywords, intent: parsedQuery.intent, correction: parsedQuery.correction } : undefined, title: query, summary: isUsableGroqFallback(text) ? text : first?.snippet ?? 'No live evidence was returned.', definition: first?.snippet ?? 'No source abstract was returned.', importance: [], keyFacts: sources.slice(0, 5).map((s, i) => ({ label: `Evidence ${i + 1}`, value: s.snippet ?? s.title, evidence: [s.id] })), process: [], timeline: [], related: [], sources, flashcards: [], questions: [], limitations: 'Evidence was limited; inspect the linked source records before relying on this orientation.' }
}

async function synthesize(query: string, parsedQuery: ReturnType<typeof parseBiologyQuery>, sources: BiologySource[]) {
  if (!sources.length) return fallback(query, sources, parsedQuery)
  const evidence = sources.map((s) => `[${s.id}] ${s.title}\n${s.snippet ?? ''}`).join('\n\n')
  const prompt = `You are an evidence-grounded Biology tutor. Use only the evidence below for factual claims. Return valid JSON with title, summary, definition, importance (array), keyFacts (label,value,evidence), process (stage,detail), timeline, related, flashcards (front,back,sourceIds), questions (prompt,options,answer,explanation,sourceIds), limitations, and optional comparison {headers,rows} and sections {title,content,evidence}. Make sections dynamic and empty when inapplicable. Preserve uncertainty and conflicts. Every source ID must exactly match the evidence IDs. Original question: ${query}\nNormalized: ${parsedQuery.normalizedQuery}\nEvidence:\n${evidence}`
  try { const result = await generateText({ model: groqModel(), prompt, temperature: 0.2 }); const value = JSON.parse(result.text); return { query, parsedQuery: { originalQuery: parsedQuery.originalQuery, normalizedQuery: parsedQuery.normalizedQuery, keywords: parsedQuery.keywords, intent: parsedQuery.intent, correction: parsedQuery.correction }, sources, ...value, flashcards: Array.isArray(value.flashcards) ? value.flashcards.slice(0, 5) : [], questions: Array.isArray(value.questions) ? value.questions.slice(0, 3) : [] } as BiologyResearch } catch { return fallback(query, sources) }
}

export async function POST(request: NextRequest) {
  let body: any; try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 240) : ''; if (query.length < 3) return Response.json({ error: 'Ask a Biology question with at least 3 characters.' }, { status: 400 })
  const stream = new ReadableStream({ async start(controller) { try { emit(controller, { stage: 'analyzing', message: 'Understanding your question and search terms', progress: 12 }); const parsed = parseBiologyQuery(query); emit(controller, { stage: 'searching', message: 'Searching academic sources and reference material', progress: 32 }); const sources = await retrieve(parsed); emit(controller, { stage: 'evaluating', message: `Evaluating ${sources.length} attributable records`, progress: 60 }); emit(controller, { stage: 'generating', message: 'Organizing an evidence-grounded study brief', progress: 86 }); const data = await synthesize(query, parsed, sources); emit(controller, { stage: 'complete', message: 'Evidence-backed Biology brief ready', progress: 100, data }); controller.close() } catch (e) { emit(controller, { stage: 'error', message: e instanceof Error ? e.message : 'Research failed', progress: 0 }); controller.close() } } })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
}
