import { PeriodicTableGrid } from "@/components/science/periodic-table-grid"

export default function PeriodicTablePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Periodic Table</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          All 118 confirmed elements. Click any element to open its full explorer with atomic structure, electron
          configuration, isotopes, and physical properties. Toggle a property heatmap to visualize periodic trends.
        </p>
      </div>
      <PeriodicTableGrid />
    </div>
  )
}
