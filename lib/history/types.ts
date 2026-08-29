export type SourceType = "reference" | "government" | "museum" | "university" | "archive" | "academic" | "primary-source"

export type Source = {
  title: string
  url: string
  publisher?: string
  accessedDate: string
  sourceType: SourceType
}

export type TimelineEvent = { id: string; date: string; title: string; detail: string }
export type GeoLocation = { name: string; lat: number; lon: number; type: "event" | "feature" | "city"; significance: string }
export type HistoricalResearch = {
  query: string
  title: string
  kind: "historical" | "geographic" | "both"
  summary: string
  background: string[]
  causes: string[]
  significance: string
  timeline: TimelineEvent[]
  locations: GeoLocation[]
  relatedTopics: string[]
  sources: Source[]
  freshness: string
  cached: boolean
}

export function validateLocation(location: GeoLocation) {
  return Number.isFinite(location.lat) && Number.isFinite(location.lon) && location.lat >= -90 && location.lat <= 90 && location.lon >= -180 && location.lon <= 180
}

export function sourceTypeFor(url: string): SourceType {
  const host = new URL(url).hostname
  if (host.includes(".gov")) return "government"
  if (host.includes(".edu")) return "university"
  if (host.includes("museum")) return "museum"
  if (host.includes("wikipedia")) return "reference"
  return "academic"
}

export function makeCards(research: HistoricalResearch) {
  return [
    { front: `What is ${research.title}?`, back: research.summary },
    { front: "What is its historical significance?", back: research.significance },
    ...research.timeline.slice(0, 2).map((event) => ({ front: `When did ${event.title} happen?`, back: `${event.date} — ${event.detail}` })),
  ]
}

export function makeQuiz(research: HistoricalResearch) {
  return research.timeline.slice(0, 3).map((event, index) => ({ question: `Which statement best describes ${event.title}?`, answer: event.detail, options: [event.detail, research.background[index % Math.max(1, research.background.length)] ?? research.summary, research.significance] }))
}
