"use client"

import Link from "next/link"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { GlobalSearchTrigger } from "@/components/global-search"
import { Button } from "@/components/ui/button"
import { Bot } from "lucide-react"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <div className="flex flex-1 items-center justify-between gap-3">
        <GlobalSearchTrigger className="w-full max-w-sm justify-start gap-2 text-muted-foreground" />
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/assistant" />}>
          <Bot data-icon="inline-start" />
          Ask the AI Assistant
        </Button>
      </div>
    </header>
  )
}
