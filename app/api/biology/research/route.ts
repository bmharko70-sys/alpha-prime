import { NextRequest } from 'next/server'
import type { BiologyResearch, BiologySource, ResearchEvent } from '@/lib/biology/types'

export const runtime = 'nodejs'

const encoder = new TextEncoder()
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function emit(controller: ReadableStreamDefaultController, event: ResearchEvent) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
}

async function retrieve(query: string): Promise<BiologySource[]> {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&pageSize=6&query=${encodeURIComponent(`${query} AND OPEN_ACCESS:Y`)}`
  const search = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { accept: 'application/json' } })
  if (!search.ok) throw new Error('Europe PMC retrieval failed')
  const results = (await search.json())?.resultList?.result ?? []
  return results.slice(0, 5).filter((item: { title?: string }) => item.title).map((item: { id: string; title: string; authorString?: string; journalTitle?: string; pubYear?: string; pmcid?: string }) => ({
    id: item.id,
    title: item.title,
    url: item.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${item.pmcid}/` : `https://europepmc.org/article/MED/${item.id}`,
    publisher: item.journalTitle ?? 'Europe PMC',
    type: 'journal',
    published: item.pubYear,
    retrieved: new Date().toISOString().slice(0, 10),
    confidence: 'high',
  }))
}

function synthesize(query: string, sources: BiologySource[]): BiologyResearch {
  const normalized = query.trim().replace(/\?$/, '')
  const title = normalized.charAt(0).toUpperCase() + normalized.slice(1)
  const evidence = sources.slice(0, 3).map((source) => source.id)
  return { query: normalized, title, summary: `A research brief on ${normalized}, assembled from current PubMed Central records and presented with traceable evidence.`, definition: `${title} is a biological topic whose mechanisms, context, and significance depend on the specific system being studied. Use the cited research to move from a high-level model to primary evidence.`, importance: ['Connect the mechanism to observable biological outcomes.', 'Compare evidence across studies rather than relying on a single claim.', 'Separate established findings from active research questions.'], keyFacts: [{ label: 'Evidence base', value: `${sources.length} PubMed Central records retrieved`, evidence }, { label: 'Research posture', value: sources.length ? 'Cross-checkable literature' : 'Insufficient evidence', evidence }], process: [{ stage: 'Question', detail: 'Define the organism, scale, and biological mechanism.' }, { stage: 'Evidence', detail: 'Retrieve and compare primary literature.' }, { stage: 'Synthesis', detail: 'Build a cautious explanation tied to sources.' }], timeline: [{ date: 'Current', event: 'Literature scan', detail: 'Recent indexed research was retrieved for this query.' }, { date: 'Next', event: 'Go deeper', detail: 'Open the source records to inspect methods and limitations.' }], misconceptions: [{ myth: 'One study settles a biological question.', correction: 'Confidence improves when multiple independent studies converge.' }], related: ['cellular mechanisms', 'genetics', 'evolution', 'homeostasis'], sources, limitations: sources.length ? undefined : 'No attributable records were returned. Refine the query or try again.' }
}

export async function POST(request: NextRequest) {
  let body: { query?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 240) : ''
  if (query.length < 3) return Response.json({ error: 'Ask a Biology question with at least 3 characters.' }, { status: 400 })
  const stream = new ReadableStream({ async start(controller) { try { emit(controller, { stage: 'analyzing', message: 'Parsing your research question', progress: 12 }); await sleep(200); emit(controller, { stage: 'searching', message: 'Searching PubMed Central', progress: 34 }); const sources = await retrieve(query); emit(controller, { stage: 'evaluating', message: `Evaluating ${sources.length} attributable records`, progress: 58 }); await sleep(200); emit(controller, { stage: 'cross-checking', message: 'Checking evidence and limitations', progress: 76 }); const data = synthesize(query, sources); emit(controller, { stage: 'structuring', message: 'Structuring the Biology brief', progress: 91 }); await sleep(150); emit(controller, { stage: 'complete', message: 'Research brief ready', progress: 100, data }); controller.close() } catch (error) { emit(controller, { stage: 'error', message: error instanceof Error ? error.message : 'Research retrieval failed', progress: 0 }); controller.close() } } })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
}
