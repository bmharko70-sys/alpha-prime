"use client"

import type { ElementData } from "@/lib/science/types"
import { Panel } from "@/components/science/tool-page"
import { SceneShell } from "@/components/science/scene-shell"
import { AtomModel3D } from "@/components/science/atom-model-3d"
import { Button } from "@/components/ui/button"
import * as React from "react"

export function ElementDetail({ element }: { element: ElementData }) {
  const [paused, setPaused] = React.useState(false)
  return <div className="grid gap-6 lg:grid-cols-[1fr_320px]"><Panel title="Atomic model"><div className="h-[380px]"><SceneShell ariaLabel={`${element.name} atomic model`} paused={paused} showPauseControl onTogglePaused={() => setPaused((value) => !value)}><AtomModel3D element={element} paused={paused} /></SceneShell></div><p className="mt-3 text-xs text-muted-foreground">Schematic Bohr-style teaching model. Drag to rotate, scroll to zoom, and use the controls to pause electron motion.</p></Panel><Panel title="Measured data"><dl className="grid gap-3 text-sm">{[["Atomic number", element.atomicNumber], ["Atomic mass", `${element.atomicMass} u`], ["Category", element.category.replaceAll("-", " ")], ["State", element.standardState25C], ["Density", element.density ? `${element.density} g/cm³` : "Not available"], ["Electron configuration", element.electronConfigurationShort]].map(([label, value]) => <div key={String(label)} className="border-b border-border pb-2"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-mono">{value}</dd></div>)}</dl><Button className="mt-5 w-full" variant="outline" onClick={() => navigator.clipboard?.writeText(`${element.name} (${element.symbol}) — atomic number ${element.atomicNumber}`)}>Copy element summary</Button></Panel></div>
}
