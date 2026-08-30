"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { buildSearchIndex, searchEntries, type SearchEntry, type SearchCategory } from "@/lib/science/search-index"
import { Search, Atom, FlaskConical, Wrench, Beaker, FileText, Globe, Loader2 } from "lucide-react"

const CATEGORY_META: Record<SearchCategory, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  element: { label: "Elements", icon: Atom },
  molecule: { label: "Molecules", icon: FlaskConical },
  tool: { label: "Tools", icon: Wrench },
  simulation: { label: "Simulations", icon: Beaker },
  page: { label: "Pages", icon: FileText },
}

export function GlobalSearchTrigger({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        variant="outline"
        className={className ?? "w-full justify-start gap-2 text-muted-foreground sm:w-64" + " press-feedback"}
        onClick={() => setOpen(true)}
      >
        <Search data-icon="inline-start" className="transition-transform duration-200 group-hover/button:scale-110" />
        <span className="flex-1 text-left">Search elements, tools…</span>
        <Kbd>⌘K</Kbd>
      </Button>
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [webState, setWebState] = React.useState<{ loading: boolean; error?: string; data?: { domain: string; retrievalStatus: string; answer: { title: string; answer: string; keyPoints: string[]; limitations: string }; sources: { title: string; url: string; publisher: string }[] } }>({ loading: false })
  const index = React.useMemo(() => buildSearchIndex(), [])

  React.useEffect(() => {
    const topic = query.trim()
    if (topic.length < 2) { setWebState({ loading: false }); return }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setWebState({ loading: true })
      try {
        const response = await fetch("/api/research", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: topic }), signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Web research is unavailable.")
        setWebState({ loading: false, data })
      } catch (error) {
        if (!controller.signal.aborted) setWebState({ loading: false, error: error instanceof Error ? error.message : "Web research is unavailable." })
      }
    }, 450)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  const results = React.useMemo(() => searchEntries(query, index, 50), [query, index])

  const grouped = React.useMemo(() => {
    const groups = new Map<SearchCategory, SearchEntry[]>()
    for (const entry of results) {
      const list = groups.get(entry.category) ?? []
      list.push(entry)
      groups.set(entry.category, list)
    }
    return groups
  }, [results])

  function handleSelect(entry: SearchEntry) {
    onOpenChange(false)
    setQuery("")
    router.push(entry.href)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Academia O1"
      description="Search elements, molecules, tools, and simulations"
    >
      <Command>
        <CommandInput placeholder="Search elements, molecules, tools…" value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>{webState.loading ? <span className="flex items-center gap-2"><Loader2 className="status-spin" /> Searching live web sources…</span> : webState.error ? <span className="text-destructive">{webState.error}</span> : "No local results. Live research is still loading."}</CommandEmpty>
          {webState.data && (
            <CommandGroup heading="Live web research" className="reveal reveal-fade reveal-visible">
              <CommandItem value={`web-${query}`} onSelect={() => { onOpenChange(false); router.push(`/research?q=${encodeURIComponent(query)}`) }}>
                <Globe className="text-cyan-300" />
                <div className="flex min-w-0 flex-col gap-1"><span className="truncate">{webState.data.answer.title}</span><span className="line-clamp-2 text-xs text-muted-foreground">{webState.data.answer.answer}</span><span className="text-[10px] text-cyan-300">{webState.data.sources.length} web sources · {webState.data.domain}</span></div>
              </CommandItem>
            </CommandGroup>
          )}
          {Array.from(grouped.entries()).map(([category, entries], groupIndex) => {
            const meta = CATEGORY_META[category]
            return (
              <CommandGroup
                key={category}
                heading={meta.label}
                className="reveal reveal-fade reveal-visible"
                style={{ animationDelay: `${groupIndex * 40}ms` }}
              >
                {entries.slice(0, category === "element" ? 12 : 8).map((entry) => (
                  <CommandItem key={entry.id} value={entry.id} onSelect={() => handleSelect(entry)} className="transition-colors duration-150">
                    <meta.icon className="text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{entry.title}</span>
                      {entry.subtitle && <span className="text-xs text-muted-foreground">{entry.subtitle}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
