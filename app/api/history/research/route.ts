import { NextResponse } from "next/server"
import { makeCards, makeQuiz, sourceTypeFor, validateLocation, type HistoricalResearch, type GeoLocation } from "@/lib/history/types"

export const dynamic = "force-dynamic"

function cleanText(value: unknown) { return typeof value === "string" ? value.replace(/<[^>]*>/g, "").trim() : "" }

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim()
  if (!query || query.length < 2) return NextResponse.json({ error: "Enter a historical event, person, place, or geographic feature." }, { status: 400 })
  try {
    const headers = { "User-Agent": "AcademiaO1/1.0 educational-research" }
    const [wikiResponse, geoResponse] = await Promise.all([
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replaceAll(" ", "_"))}`, { headers, next: { revalidate: 3600 } }),
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&q=${encodeURIComponent(query)}`, { headers, next: { revalidate: 3600 } }),
    ])
    const wiki = wikiResponse.ok ? await wikiResponse.json() : null
    const places = geoResponse.ok ? await geoResponse.json() : []
    const accessedDate = new Date().toISOString().slice(0, 10)
    const sources = wiki?.content_urls?.desktop?.page ? [{ title: `Wikipedia — ${wiki.title ?? query}`, url: wiki.content_urls.desktop.page, publisher: "Wikimedia Foundation", accessedDate, sourceType: sourceTypeFor(wiki.content_urls.desktop.page) }] : []
    const locations: GeoLocation[] = places.map((place: { display_name?: string; lat?: string; lon?: string; type?: string }) => ({ name: place.display_name?.split(",")[0] ?? query, lat: Number(place.lat), lon: Number(place.lon), type: place.type === "city" || place.type === "town" ? "city" : "feature", significance: `OpenStreetMap place result for ${query}.` })).filter(validateLocation)
    const summary = cleanText(wiki?.extract) || `Live geographic search results are available for ${query}, but no matching encyclopedia summary was returned.`
    const research: HistoricalResearch = { query, title: wiki?.title ?? query, kind: locations.length && wiki ? "both" : locations.length ? "geographic" : "historical", summary, background: ["This topic was retrieved from live public web services and should be read alongside the linked sources.", "Use the timeline and map together to connect chronology with place."], causes: ["The source record does not provide a structured causal analysis for this query; treat this section as a prompt for further investigation."], significance: wiki?.description ? `${cleanText(wiki.description)}. The topic is presented with source provenance so you can inspect the original context.` : "No verified significance statement was returned by the live source.", timeline: [{ id: "overview", date: "Source overview", title: "Live source overview", detail: summary }], locations, relatedTopics: ["Historical context", "Geographic context", "Primary sources"], sources, freshness: `Retrieved ${accessedDate} from live web services`, cached: false }
    return NextResponse.json({ research, cards: makeCards(research), quiz: makeQuiz(research) })
  } catch { return NextResponse.json({ error: "Unable to retrieve live information. Showing no cached result for this topic." }, { status: 503 }) }
}
