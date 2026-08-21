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
import { Search, Atom, FlaskConical, Wrench, Beaker, FileText } from "lucide-react"

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
        className={className ?? "w-full justify-start gap-2 text-muted-foreground sm:w-64"}
        onClick={() => setOpen(true)}
      >
        <Search data-icon="inline-start" />
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
  const index = React.useMemo(() => buildSearchIndex(), [])

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
          <CommandEmpty>No results found.</CommandEmpty>
          {Array.from(grouped.entries()).map(([category, entries]) => {
            const meta = CATEGORY_META[category]
            return (
              <CommandGroup key={category} heading={meta.label}>
                {entries.slice(0, category === "element" ? 12 : 8).map((entry) => (
                  <CommandItem key={entry.id} value={entry.id} onSelect={() => handleSelect(entry)}>
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
