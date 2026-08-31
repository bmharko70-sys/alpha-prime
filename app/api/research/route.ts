import { generateText } from "ai"
import { groqModel } from "@/lib/ai/groq"
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const runtime = "nodejs"

type Domain = "biology" | "history" | "geography" | "general"

type Source = { title: string; url: string; publisher: string; retrieved: string; kind: "live" | "ai" }

function detectDomain(query: string): Domain {
  const q = query.toLowerCase()
  if (/cell|gene|protein|organism|disease|enzyme|ecology|evolution|biology|anatomy|physiology/.test(q)) return "biology"
  if (/where|location|place|map|coordinates|geography|mountain|river|city|country|region/.test(q)) return "geography"
  if (/when|war|empire|revolution|histor|president|ancient|civilization|battle|dynasty|treaty/.test(q)) return "history"
  return "general"
}

function clean(value: unknown) { return typeof value === "string" ? value.replace(/<[^>]*>/g, "").trim() : "" }

async function liveSources(query: string, domain: Domain): Promise<{ context: string; sources: Source[] }> {
  const retrieved = new Date().toISOString().slice(0, 10)
  if (domain === "biology") {
    const response = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&pageSize=12&resultType=core&sort=RELEVANCE&query=${encodeURIComponent(`${query} AND (ABSTRACT:*)`)}`, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) throw new Error("Biology literature retrieval failed")
    const items = (await response.json())?.resultList?.result ?? []
    const rows = items.filter((item: { title?: string; abstractText?: string }) => item.title && item.abstractText)
    return { context: rows.map((item: { id: string; title: string; abstractText: string }) => `[${item.id}] ${item.title}\n${item.abstractText.slice(0, 1200)}`).join("\n\n"), sources: rows.slice(0, 8).map((item: { id: string; title: string; pmcid?: string }) => ({ title: item.title, url: item.pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${item.pmcid}/` : `https://europepmc.org/article/MED/${item.id}`, publisher: "Europe PMC", retrieved, kind: "live" })) }
  }
  const [wikiResponse, geoResponse] = await Promise.all([
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replaceAll(" ", "_"))}`, { signal: AbortSignal.timeout(8000) }),
    fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&addressdetails=1&q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "AcademiaO1/1.0 educational-research" }, signal: AbortSignal.timeout(8000) }),
  ])
  const wiki = wikiResponse.ok ? await wikiResponse.json() : null
  const places = geoResponse.ok ? await geoResponse.json() : []
  const wikiText = clean(wiki?.extract)
  const placeText = places.map((p: { display_name?: string; lat?: string; lon?: string }) => `${p.display_name ?? query} (${p.lat}, ${p.lon})`).join("\n")
  const sources: Source[] = wiki?.content_urls?.desktop?.page ? [{ title: `Wikipedia — ${wiki.title ?? query}`, url: wiki.content_urls.desktop.page, publisher: "Wikimedia Foundation", retrieved, kind: "live" }] : []
  return { context: [wikiText, placeText].filter(Boolean).join("\n\n"), sources }
}

export async function POST(request: Request) {
  const limitResult = rateLimit(`research:${getClientIp(request)}`, 20, 60_000)
  if (!limitResult.ok) return rateLimitResponse(limitResult)

  let body: { query?: string }
  try { body = await request.json() } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }) }
  const query = typeof body.query === "string" ? body.query.trim().slice(0, 300) : ""
  if (query.length < 2) return Response.json({ error: "Enter a question or topic with at least two characters." }, { status: 400 })
  const domain = detectDomain(query)
  let context = ""
  let sources: Source[] = []
  let retrievalStatus = "live"
  try { ({ context, sources } = await liveSources(query, domain)) } catch { retrievalStatus = "ai-fallback" }
  if (!context) return Response.json({ error: "No usable web-derived information was found for this query. Try a more specific topic." }, { status: 404 })
  try {
    const result = await generateText({ model: groqModel(), temperature: 0.15, prompt: `You are a rigorous universal research assistant. Domain: ${domain}. Answer the query using only the supplied context. Distinguish sourced facts from inference, state uncertainty, and never invent citations, coordinates, dates, quotations, or statistics. Return JSON only: {"title":string,"answer":string,"keyPoints":string[],"limitations":string}. Query: ${query}\nCONTEXT:\n${context}` })
    const answer = JSON.parse(result.text)
    return Response.json({ domain, retrievalStatus, answer, sources })
  } catch { return Response.json({ domain, retrievalStatus, answer: { title: query, answer: context, keyPoints: [], limitations: "AI structuring was unavailable; the retrieved context is shown verbatim for verification." }, sources }) }
}
