import { NextResponse } from "next/server"
import { makeCards, makeQuiz, sourceTypeFor, validateLocation, type HistoricalResearch, type GeoLocation } from "@/lib/history/types"
import { groqRetrievalFallback } from "@/lib/ai/retrieval"
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const HEADERS = { "User-Agent": "AcademiaO1/1.0 educational-research (contact: research@academia-o1.app)" }
const FETCH_TIMEOUT_MS = 6000

function cleanText(value: unknown) { return typeof value === "string" ? value.replace(/<[^>]*>/g, "").trim() : "" }

function withTimeout(url: string, revalidate: number) {
  return fetch(url, { headers: HEADERS, next: { revalidate }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).catch(() => null)
}

/** Wikipedia's opensearch endpoint resolves fuzzy, partial, or misspelled queries to real page titles — this is what lets any topic phrase (not just exact titles) find a match. */
async function resolveWikiTitles(query: string): Promise<{ titles: string[]; descriptions: string[] }> {
  const response = await withTimeout(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=8&namespace=0&format=json&origin=*`, 1800)
  if (!response?.ok) return { titles: [], descriptions: [] }
  const data = await response.json().catch(() => null)
  if (!Array.isArray(data)) return { titles: [], descriptions: [] }
  return { titles: data[1] ?? [], descriptions: data[2] ?? [] }
}

/** Tries the raw query first, then each resolved candidate title, skipping disambiguation pages, until a real article summary is found. */
async function resolveSummary(query: string, candidates: string[]) {
  const tried = new Set<string>()
  for (const title of [query, ...candidates]) {
    const key = title.toLowerCase()
    if (tried.has(key)) continue
    tried.add(key)
    const response = await withTimeout(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(" ", "_"))}`, 3600)
    if (!response?.ok) continue
    const summary = await response.json().catch(() => null)
    if (summary && summary.type !== "disambiguation") return summary
  }
  return null
}

/** Pulls the full plaintext article body (beyond the short summary) so background/context has real substance instead of one paragraph. */
async function fetchFullExtract(title: string) {
  const response = await withTimeout(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(title)}`, 3600)
  if (!response?.ok) return []
  const data = await response.json().catch(() => null)
  const pages = data?.query?.pages ?? {}
  const firstPage = Object.values(pages)[0] as { extract?: string } | undefined
  const extract: string = firstPage?.extract ?? ""
  return extract
    .split(/\n+/)
    .map((line) => line.replace(/^==+\s*|\s*==+$/g, "").trim())
    .filter((line) => line.length > 40 && !/^see also$|^references$|^external links$|^notes$|^further reading$/i.test(line))
    .slice(0, 8)
}

export async function GET(request: Request) {
  const limitResult = rateLimit(`history-research:${getClientIp(request)}`, 20, 60_000)
  if (!limitResult.ok) return rateLimitResponse(limitResult)

  const query = new URL(request.url).searchParams.get("q")?.trim()
  if (!query || query.length < 2) return NextResponse.json({ error: "Enter a historical event, person, place, or geographic feature." }, { status: 400 })
  try {
    const [{ titles: candidateTitles, descriptions: candidateDescriptions }, geoResponse, wikidataResponse] = await Promise.all([
      resolveWikiTitles(query),
      withTimeout(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&addressdetails=1&q=${encodeURIComponent(query)}`, 3600),
      withTimeout(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&limit=6&origin=*`, 3600),
    ])
    const wiki = await resolveSummary(query, candidateTitles)
    const wikidata = wikidataResponse?.ok ? await wikidataResponse.json().catch(() => null) : null
    const places = geoResponse?.ok ? await geoResponse.json().catch(() => []) : []
    const resolvedTitle = wiki?.title ?? query
    const paragraphs = wiki ? await fetchFullExtract(resolvedTitle) : []
    const accessedDate = new Date().toISOString().slice(0, 10)

    const sources = wiki?.content_urls?.desktop?.page
      ? [{ title: `Wikipedia — ${wiki.title ?? query}`, url: wiki.content_urls.desktop.page, publisher: "Wikimedia Foundation", accessedDate, sourceType: sourceTypeFor(wiki.content_urls.desktop.page) }]
      : []

    const geoLocations: GeoLocation[] = (places as { display_name?: string; lat?: string; lon?: string; type?: string }[])
      .map((place) => ({ name: place.display_name?.split(",")[0] ?? query, lat: Number(place.lat), lon: Number(place.lon), type: place.type === "city" || place.type === "town" ? "city" as const : "feature" as const, significance: `OpenStreetMap place result for ${query}.` }))
      .filter(validateLocation)

    const wikiCoordinate: GeoLocation | null = wiki?.coordinates?.lat != null && wiki?.coordinates?.lon != null
      ? { name: wiki.title ?? query, lat: Number(wiki.coordinates.lat), lon: Number(wiki.coordinates.lon), type: "event", significance: cleanText(wiki.description) || `Primary location associated with ${wiki.title ?? query}.` }
      : null

    const locations: GeoLocation[] = [wikiCoordinate, ...geoLocations].filter((location): location is GeoLocation => !!location && validateLocation(location))
      .filter((location, index, all) => all.findIndex((other) => Math.abs(other.lat - location.lat) < 0.01 && Math.abs(other.lon - location.lon) < 0.01) === index)

    const summary = cleanText(wiki?.extract) || (locations.length ? `Live geographic search results are available for ${query}, but no matching encyclopedia summary was returned.` : "")

    if (!wiki && !locations.length) {
      throw new Error("No live encyclopedia or geographic match")
    }

    const background = paragraphs.length
      ? paragraphs.slice(0, 4)
      : ["This topic was retrieved from live public web services and should be read alongside the linked sources.", "Use the timeline and map together to connect chronology with place."]

    const timeline = paragraphs.length
      ? paragraphs.slice(0, 5).map((detail, index) => ({ id: `section-${index}`, date: index === 0 ? "Overview" : `Context ${index}`, title: index === 0 ? "Live source overview" : `Related development ${index}`, detail }))
      : [{ id: "overview", date: "Source overview", title: "Live source overview", detail: summary || `No structured timeline is available yet for ${query}.` }]

    const relatedTopics = [
      ...candidateTitles.filter((title) => title.toLowerCase() !== resolvedTitle.toLowerCase()),
      ...(wikidata?.search ?? []).map((item: { label?: string }) => item.label).filter(Boolean),
    ].filter((topic, index, all) => all.indexOf(topic) === index).slice(0, 6)

    const research: HistoricalResearch = {
      query,
      title: resolvedTitle,
      kind: locations.length && wiki ? "both" : locations.length ? "geographic" : "historical",
      summary: summary || `No verified summary was returned for ${query}, but related context is listed below.`,
      background,
      causes: paragraphs.length > 4 ? paragraphs.slice(4, 6) : ["The source record does not provide a structured causal analysis for this query; treat this section as a prompt for further investigation."],
      significance: wiki?.description ? `${cleanText(wiki.description)}. The topic is presented with source provenance so you can inspect the original context.` : "No verified significance statement was returned by the live source.",
      timeline,
      locations,
      relatedTopics: relatedTopics.length ? relatedTopics : candidateDescriptions.filter(Boolean).slice(0, 3),
      sources,
      freshness: `Retrieved ${accessedDate} from live web services`,
      cached: false,
    }
    return NextResponse.json({ research, cards: makeCards(research), quiz: makeQuiz(research) })
  } catch {
    try {
      const fallback = await groqRetrievalFallback(query, "history")
      return NextResponse.json({ research: { query, title: query, kind: "historical", summary: fallback, background: ["AI-generated orientation only; verify against primary and scholarly sources."], causes: [], significance: "Not independently verified.", timeline: [], locations: [], relatedTopics: [], sources: [], freshness: "Generated by Groq because live retrieval was unavailable", cached: false }, cards: [], quiz: [] })
    } catch { return NextResponse.json({ error: "Live retrieval and Groq fallback are unavailable. Try again shortly." }, { status: 503 }) }
  }
}
