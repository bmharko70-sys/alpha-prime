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
  const base = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&pageSize=12&resultType=core&sort=RELEVANCE'
  const run = async (term: string) => {
    const response = await fetch(`${base}&query=${encodeURIComponent(term)}`, { signal: AbortSignal.timeout(12000), headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error('Europe PMC retrieval failed')
    return (await response.json())?.resultList?.result ?? []
  }
  let results = await run(`${query} AND OPEN_ACCESS:Y`)
  if (!results.some((x: any) => x.abstractText || x.title)) results = await run(query)
  return results.filter((x: any) => x.id && x.title && (x.abstractText || x.authorString || x.journalTitle)).map((x: any) => ({ id: String(x.doi ?? x.pmcid ?? x.id), title: x.title, url: x.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${x.pmcid}/` : `https://europepmc.org/article/MED/${x.id}`, publisher: x.journalTitle ?? 'Europe PMC', type: 'journal', published: x.pubYear, retrieved: new Date().toISOString().slice(0, 10), confidence: 'high', snippet: String(x.abstractText ?? `${x.title}. Published in ${x.journalTitle ?? 'Europe PMC'}.`).slice(0, 900) }))
}

async function retrieve(parsed: ReturnType<typeof parseBiologyQuery>) {
  const batches = await Promise.allSettled(parsed.variants.slice(0, 4).map(retrieveOne))
  const sources = batches.flatMap((b) => b.status === 'fulfilled' ? b.value : [])
  if (parsed.intent === 'research' || parsed.recent) {
    try {
      const response = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(parsed.keywords.join(' '))}&filter=from-pub-date:2020-01-01&rows=5&select=DOI,title,URL,published,container-title`, { signal: AbortSignal.timeout(10000), headers: { accept: 'application/json' } })
      const items = (await response.json())?.message?.items ?? []
      sources.push(...items.filter((item: any) => item.DOI && item.title?.[0]).map((item: any) => ({ id: String(item.DOI), title: item.title[0], url: item.URL ?? `https://doi.org/${item.DOI}`, publisher: item['container-title']?.[0] ?? 'Crossref', type: 'journal', published: String(item.published?.['date-parts']?.[0]?.[0] ?? ''), retrieved: new Date().toISOString().slice(0, 10), confidence: 'high', snippet: `${item.title[0]} — recent scholarly record indexed by Crossref.` })))
    } catch { /* optional recent provider */ }
  }
  const unique = [...new Map(sources.map((s) => [s.id, s])).values()].slice(0, 10)
  if (unique.length < 3) {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(parsed.keywords.join(' '))}&srlimit=1&format=json&origin=*`
      const searchResponse = await fetch(searchUrl, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } })
      const search = await searchResponse.json()
      const title = search?.query?.search?.[0]?.title
      if (title) {
        const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { signal: AbortSignal.timeout(8000), headers: { accept: 'application/json' } })
        const x = await r.json()
        if (x.extract) unique.push({ id: 'WIKI', title: x.title ?? title, url: x.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`, publisher: 'Wikipedia', type: 'reference', retrieved: new Date().toISOString().slice(0, 10), confidence: 'medium', snippet: x.extract.slice(0, 900) })
      }
    } catch { /* evidence may be empty */ }
  }
  return unique
}

async function fallback(query: string, sources: BiologySource[], parsedQuery?: ReturnType<typeof parseBiologyQuery>): Promise<BiologyResearch> { let text = ''; try { text = await groqRetrievalFallback(query, 'biology') } catch {} const first = sources[0]; return { query, parsedQuery: parsedQuery ? { originalQuery: parsedQuery.originalQuery, normalizedQuery: parsedQuery.normalizedQuery, keywords: parsedQuery.keywords, intent: parsedQuery.intent, correction: parsedQuery.correction } : undefined, title: query, summary: isUsableGroqFallback(text) ? text : first?.snippet ?? 'The academic and reference searches returned no matching records for this query. Try a more specific Biology term or rephrase the question.', definition: first?.snippet ?? 'No source abstract was returned.', importance: [], keyFacts: sources.slice(0, 5).map((s, i) => ({ label: `Evidence ${i + 1}`, value: s.snippet ?? s.title, evidence: [s.id] })), process: sources.slice(0, 4).map((source, index) => ({ stage: `Evidence stage ${index + 1}`, detail: source.snippet ?? source.title, mechanism: 'The retrieved evidence describes this part of the biological topic. Inspect the source record for full methods and context.', inputs: [], outputs: [], location: source.publisher, dependencies: [], evidence: [source.id] })), timeline: [], related: [], sources, flashcards: [], questions: [], limitations: 'Evidence was limited; inspect the linked source records before relying on this orientation.' }
}

async function synthesize(query: string, parsedQuery: ReturnType<typeof parseBiologyQuery>, sources: BiologySource[]) {
  if (!sources.length) return fallback(query, sources, parsedQuery)
  const evidence = sources.map((s) => `[${s.id}] ${s.title}\n${s.snippet ?? ''}`).join('\n\n')
  const prompt = `You are an evidence-grounded Biology tutor. Use only the evidence below for factual claims. Return valid JSON with title, summary, definition, importance (array), keyFacts (label,value,evidence), process (stage,detail,mechanism,inputs,outputs,location,dependencies,evidence), timeline, related, flashcards (front,back,sourceIds), questions (prompt,options,answer,explanation,sourceIds), limitations, and optional comparison {headers,rows} and sections {title,content,evidence}. Make sections dynamic and empty when inapplicable. For any mechanism, pathway, cycle, lifecycle, experiment, or how/why query, process MUST contain 4-8 ordered stages. Each stage must explain the mechanism in 2-4 sentences and include concrete inputs, outputs, location/context, dependencies or regulation, and 1-3 exact source IDs. Never invent stages or source IDs; if evidence is insufficient, return an explicit limitation rather than an empty process. Preserve uncertainty and conflicts. Every source ID must exactly match the evidence IDs. Original question: ${query}\nNormalized: ${parsedQuery.normalizedQuery}\nEvidence:\n${evidence}`
  try { const result = await generateText({ model: groqModel(), prompt, temperature: 0.2 }); const value = JSON.parse(result.text); const safeSources = sources.filter((source) => source.id && source.title && source.url)
    const validEvidence = (ids: unknown) => Array.isArray(ids) ? ids.filter((id) => safeSources.some((source) => source.id === id)) : []
    value.process = Array.isArray(value.process) ? value.process.filter((step: any) => typeof step?.stage === 'string' && typeof step?.detail === 'string').slice(0, 8).map((step: any) => ({ stage: step.stage.slice(0, 120), detail: step.detail.slice(0, 1200), mechanism: typeof step.mechanism === 'string' ? step.mechanism.slice(0, 900) : undefined, inputs: Array.isArray(step.inputs) ? step.inputs.filter((item: unknown): item is string => typeof item === 'string').slice(0, 8) : [], outputs: Array.isArray(step.outputs) ? step.outputs.filter((item: unknown): item is string => typeof item === 'string').slice(0, 8) : [], location: typeof step.location === 'string' ? step.location.slice(0, 240) : undefined, dependencies: Array.isArray(step.dependencies) ? step.dependencies.filter((item: unknown): item is string => typeof item === 'string').slice(0, 8) : [], evidence: validEvidence(step.evidence) })) : []
    if (value.process.length < 2 && ['mechanism', 'process', 'pathway', 'cycle', 'how', 'works', 'lifecycle', 'experiment'].some((term) => parsedQuery.normalizedQuery.includes(term))) value.process = safeSources.slice(0, 4).map((source: BiologySource, index: number) => ({ stage: `Evidence stage ${index + 1}`, detail: source.snippet ?? source.title, mechanism: 'The retrieved record provides the attributable context for this stage; consult the source for the complete mechanism.', inputs: [], outputs: [], location: source.publisher, dependencies: [], evidence: [source.id] }))
    value.process = Array.isArray(value.process) ? value.process.filter((step: any) => typeof step?.stage === 'string' && typeof step?.detail === 'string').slice(0, 8).map((step: any) => ({ ...step, stage: step.stage.slice(0, 120), detail: step.detail.slice(0, 1200), mechanism: typeof step.mechanism === 'string' ? step.mechanism.slice(0, 900) : undefined, inputs: Array.isArray(step.inputs) ? step.inputs.filter((item: unknown): item is string => typeof item === 'string').slice(0, 8) : [], outputs: Array.isArray(step.outputs) ? step.outputs.filter((item: unknown): item is string => typeof item === 'string').slice(0, 8) : [], location: typeof step.location === 'string' ? step.location.slice(0, 240) : undefined, dependencies: Array.isArray(step.dependencies) ? step.dependencies.filter((item: unknown): item is string => typeof item === 'string').slice(0, 8) : [], evidence: validEvidence(step.evidence) })) : []
    value.keyFacts = Array.isArray(value.keyFacts) ? value.keyFacts.map((fact: any) => ({ ...fact, evidence: validEvidence(fact.evidence) })) : []
    value.flashcards = Array.isArray(value.flashcards) ? value.flashcards.map((card: any) => ({ ...card, sourceIds: validEvidence(card.sourceIds) })) : []
    return { query, entityType: parsedQuery.entityType, evidenceLevel: safeSources.length >= 3 ? 'high' : safeSources.length ? 'moderate' : 'low', parsedQuery: { originalQuery: parsedQuery.originalQuery, normalizedQuery: parsedQuery.normalizedQuery, keywords: parsedQuery.keywords, intent: parsedQuery.intent, entityType: parsedQuery.entityType, correction: parsedQuery.correction, recent: parsedQuery.recent }, sources: safeSources, ...value, flashcards: Array.isArray(value.flashcards) ? value.flashcards.slice(0, 5) : [], questions: Array.isArray(value.questions) ? value.questions.slice(0, 3) : [] } as BiologyResearch } catch { return fallback(query, sources, parsedQuery) }
}

export async function POST(request: NextRequest) {
  let body: any; try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 240) : ''; if (query.length < 3) return Response.json({ error: 'Ask a Biology question with at least 3 characters.' }, { status: 400 })
  const stream = new ReadableStream({ async start(controller) { try { emit(controller, { stage: 'analyzing', message: 'Understanding your question and search terms', progress: 12 }); const parsed = parseBiologyQuery(query); emit(controller, { stage: 'searching', message: 'Searching academic sources and reference material', progress: 32 }); const sources = await retrieve(parsed); emit(controller, { stage: 'evaluating', message: `Evaluating ${sources.length} attributable records`, progress: 60 }); emit(controller, { stage: 'generating', message: 'Organizing an evidence-grounded study brief', progress: 86 }); const data = await synthesize(query, parsed, sources); emit(controller, { stage: 'complete', message: 'Evidence-backed Biology brief ready', progress: 100, data }); controller.close() } catch (e) { emit(controller, { stage: 'error', message: e instanceof Error ? e.message : 'Research failed', progress: 0 }); controller.close() } } })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
}
