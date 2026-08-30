"use client"

import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { GlobalSearchTrigger } from "@/components/global-search"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-800/80 bg-[#0b141c]/90 px-3 backdrop-blur supports-backdrop-filter:bg-[#0b141c]/75">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex flex-1 items-center justify-between gap-3">
        <GlobalSearchTrigger className="w-full max-w-sm justify-start gap-2 border-slate-800 bg-slate-950/30 font-mono text-xs tracking-wide text-slate-500 transition-colors duration-200 hover:border-cyan-200/30" />
        <div className="hidden items-center gap-2 font-mono text-[9px] tracking-[0.16em] text-slate-500 sm:flex"><span className="size-1.5 animate-pulse rounded-full bg-cyan-300" /> SYSTEMS NOMINAL</div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/assistant" />}
          className="press-feedback border-cyan-200/20 font-mono text-[10px] tracking-wide text-cyan-100 transition-colors duration-200 hover:bg-cyan-200/10"
        >
          <Bot data-icon="inline-start" className="transition-transform duration-200 group-hover/button:scale-110" />
          ASK ASSISTANT
        </Button>
      </div>
    </header>
  )
}
