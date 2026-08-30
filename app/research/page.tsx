import { ExternalLink, Search, ShieldCheck } from "lucide-react"

export default async function ResearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-cyan-300"><Search className="size-4" /> Live research</div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight">{q || "Search the web"}</h1>
        <p className="max-w-2xl leading-7 text-muted-foreground">Web-derived information only. Results are retrieved from live public sources and linked for verification.</p>
      </header>
      {q ? <ResearchResult query={q} /> : <p className="rounded-xl border border-border p-6 text-muted-foreground">Open search and enter any topic, question, place, event, person, or concept.</p>}
    </main>
  )
}

async function ResearchResult({ query }: { query: string }) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/research`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }), cache: "no-store" })
  const data = await response.json()
  if (!response.ok) return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">{data.error || "No web-derived result was found."}</div>
  return <section className="flex flex-col gap-6">
    <div className="rounded-xl border border-border bg-card p-6"><div className="mb-4 flex items-center gap-2 text-sm text-emerald-300"><ShieldCheck className="size-4" /> Retrieved from live web sources · {data.domain}</div><h2 className="text-2xl font-semibold">{data.answer.title}</h2><p className="mt-4 whitespace-pre-wrap leading-8 text-muted-foreground">{data.answer.answer}</p>{data.answer.keyPoints?.length ? <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6">{data.answer.keyPoints.map((point: string) => <li key={point}>{point}</li>)}</ul> : null}</div>
    <div className="flex flex-col gap-3"><h2 className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Sources</h2>{data.sources.map((source: { title: string; url: string; publisher: string }) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 hover:border-cyan-300/50"><span><span className="block font-medium">{source.title}</span><span className="text-sm text-muted-foreground">{source.publisher}</span></span><ExternalLink className="size-4 shrink-0 text-cyan-300" /></a>)}</div>
  </section>
}
