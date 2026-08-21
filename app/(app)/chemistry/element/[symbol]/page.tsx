import { notFound } from "next/navigation"
import { getElementBySymbol } from "@/lib/science/data/elements"
import { ToolPage, Panel } from "@/components/science/tool-page"
import { ElementDetail } from "@/components/science/element-detail"

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  const element = getElementBySymbol(symbol)
  if (!element) notFound()
  return <ToolPage eyebrow="Chemistry / periodic table" title={`${element.name} · ${element.symbol}`} description={`Element ${element.atomicNumber}. Inspect measured physical and chemical properties, electron configuration, and educational context.`}><ElementDetail element={element} /></ToolPage>
}
