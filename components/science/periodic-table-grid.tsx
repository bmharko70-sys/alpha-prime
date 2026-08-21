"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ELEMENTS } from "@/lib/science/data/elements"
import type { ElementCategory, ElementData } from "@/lib/science/types"
import { categoryColor } from "@/lib/science/chem/category-colors"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const LANTHANIDE_ROW = 9
const ACTINIDE_ROW = 10

type HeatmapProperty = "none" | "electronegativity" | "atomicRadius" | "ionizationEnergy" | "density"

function gridPosition(el: ElementData): { row: number; col: number } {
  if (el.atomicNumber >= 57 && el.atomicNumber <= 71) {
    return { row: LANTHANIDE_ROW, col: el.atomicNumber - 57 + 3 }
  }
  if (el.atomicNumber >= 89 && el.atomicNumber <= 103) {
    return { row: ACTINIDE_ROW, col: el.atomicNumber - 89 + 3 }
  }
  return { row: el.period, col: el.group ?? 3 }
}

function heatmapValue(el: ElementData, prop: HeatmapProperty): number | null {
  if (prop === "none") return null
  return el[prop]
}

export function PeriodicTableGrid() {
  const [heatmap, setHeatmap] = useState<HeatmapProperty>("none")
  const [activeCategory, setActiveCategory] = useState<ElementCategory | "all">("all")

  const { min, max } = useMemo(() => {
    if (heatmap === "none") return { min: 0, max: 1 }
    const values = ELEMENTS.map((e) => heatmapValue(e, heatmap)).filter((v): v is number => v != null)
    return { min: Math.min(...values), max: Math.max(...values) }
  }, [heatmap])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Property heatmap</span>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["none", "Off"],
              ["electronegativity", "Electronegativity"],
              ["atomicRadius", "Atomic radius"],
              ["ionizationEnergy", "Ionization energy"],
              ["density", "Density"],
            ] as [HeatmapProperty, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setHeatmap(key)}
              className={cn(
                "rounded-sm px-2 py-1 text-xs font-medium transition-colors",
                heatmap === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="grid gap-1 overflow-x-auto pb-2"
        style={{
          gridTemplateColumns: "repeat(18, minmax(52px, 1fr))",
          gridTemplateRows: "repeat(10, auto)",
        }}
      >
        {ELEMENTS.map((el) => {
          const { row, col } = gridPosition(el)
          const value = heatmapValue(el, heatmap)
          const intensity = value != null ? (value - min) / Math.max(max - min, 1e-6) : null
          const dimmed = activeCategory !== "all" && el.category !== activeCategory
          return (
            <Tooltip key={el.atomicNumber}>
              <TooltipTrigger
                render={
                  <Link
                    href={`/chemistry/elements/${el.symbol.toLowerCase()}`}
                    style={{
                      gridRow: row,
                      gridColumn: col,
                      backgroundColor: heatmap === "none" ? categoryColor(el.category) : undefined,
                    }}
                    className={cn(
                      "group relative flex aspect-square flex-col items-center justify-center rounded-sm border border-black/10 p-0.5 text-center transition-transform hover:z-10 hover:scale-110 hover:shadow-lg dark:border-white/10",
                      dimmed && "opacity-20",
                    )}
                  />
                }
              >
                {heatmap !== "none" && (
                  <div
                    className="absolute inset-0 rounded-sm"
                    style={{
                      backgroundColor:
                        intensity != null
                          ? `oklch(${0.35 + intensity * 0.45} 0.15 225)`
                          : "var(--muted)",
                    }}
                  />
                )}
                <span className="relative text-[9px] leading-none text-foreground/70">{el.atomicNumber}</span>
                <span className="relative font-mono text-xs font-bold leading-tight text-foreground sm:text-sm">
                  {el.symbol}
                </span>
                <span className="relative hidden text-[8px] leading-none text-foreground/70 sm:block">
                  {el.atomicMass.toFixed(1)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <p className="font-semibold">
                    {el.name} ({el.symbol})
                  </p>
                  <p className="text-muted-foreground">
                    Z={el.atomicNumber} &middot; {el.atomicMass.toFixed(3)} u
                  </p>
                  {heatmap !== "none" && value != null && (
                    <p className="text-muted-foreground">
                      {heatmap}: {value}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
        {/* f-block placeholder markers in the main grid */}
        <div
          style={{ gridRow: 6, gridColumn: 3 }}
          className="flex aspect-square items-center justify-center rounded-sm border border-dashed border-border text-[8px] text-muted-foreground"
        >
          57-71
        </div>
        <div
          style={{ gridRow: 7, gridColumn: 3 }}
          className="flex aspect-square items-center justify-center rounded-sm border border-dashed border-border text-[8px] text-muted-foreground"
        >
          89-103
        </div>
      </div>

      <CategoryLegend active={activeCategory} onSelect={setActiveCategory} />
    </div>
  )
}

function CategoryLegend({
  active,
  onSelect,
}: {
  active: ElementCategory | "all"
  onSelect: (c: ElementCategory | "all") => void
}) {
  const categories: ElementCategory[] = [
    "alkali-metal",
    "alkaline-earth",
    "transition-metal",
    "post-transition-metal",
    "metalloid",
    "nonmetal",
    "halogen",
    "noble-gas",
    "lanthanide",
    "actinide",
  ]
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "rounded-sm px-2 py-1 text-xs font-medium transition-colors",
          active === "all" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/70",
        )}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className={cn(
            "flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-opacity",
            active !== "all" && active !== c && "opacity-40",
          )}
          style={{ backgroundColor: categoryColor(c) }}
        >
          <span className="text-foreground/90">
            {c
              .split("-")
              .map((w) => w[0].toUpperCase() + w.slice(1))
              .join(" ")}
          </span>
        </button>
      ))}
    </div>
  )
}
