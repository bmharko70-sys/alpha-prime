import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SimLayoutProps {
  title: string
  description: string
  controls: React.ReactNode
  children: React.ReactNode
  readout?: React.ReactNode
  className?: string
}

/**
 * Shared two-column layout for every chemistry simulation: a canvas/stage
 * area plus a controls sidebar, with an optional live-readout panel below
 * the controls. Used to keep all 12 simulations visually and structurally
 * consistent.
 */
export function SimLayout({ title, description, controls, children, readout, className }: SimLayoutProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <CardContent className="aspect-[4/3] p-0 sm:aspect-video">{children}</CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">{controls}</CardContent>
          </Card>
          {readout && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Readout</CardTitle>
                <CardDescription className="text-xs">Live computed values</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 font-mono text-sm">{readout}</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
