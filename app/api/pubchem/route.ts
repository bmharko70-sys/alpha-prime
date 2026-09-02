import { NextRequest, NextResponse } from "next/server"
import { ELEMENTS } from "@/lib/science/data/elements"
import type { MoleculeData } from "@/lib/science/types"
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit"

const symbolByAtomicNumber = new Map(ELEMENTS.map((element) => [element.atomicNumber, element.symbol]))

export async function GET(request: NextRequest) {
  const limitResult = rateLimit(`pubchem:${getClientIp(request)}`, 30, 60_000)
  if (!limitResult.ok) return rateLimitResponse(limitResult)

  const query = request.nextUrl.searchParams.get("q")?.trim()
  if (!query || query.length > 80) return NextResponse.json({ error: "Enter a valid molecule name or formula." }, { status: 400 })
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/record/JSON?record_type=3d`
  try {
    const response = await fetch(url, { next: { revalidate: 86400 } })
    if (!response.ok) return NextResponse.json({ error: "No verified 3D structure was found for this search." }, { status: 404 })
    const record = await response.json()
    const compound = record?.PC_Compounds?.[0]
    const conformer = compound?.coords?.[0]?.conformers?.[0]
    const atomicNumbers = compound?.atoms?.element
    const xs = conformer?.x; const ys = conformer?.y; const zs = conformer?.z
    const atomCount = Array.isArray(atomicNumbers) ? atomicNumbers.length : 0
    const atoms = Array.from({ length: atomCount }, (_, index) => ({
      element: symbolByAtomicNumber.get(Number(atomicNumbers[index])),
      x: Number(xs?.[index]), y: Number(ys?.[index]), z: Number(zs?.[index]),
    }))
    const aid1 = compound?.bonds?.aid1; const aid2 = compound?.bonds?.aid2; const orders = compound?.bonds?.order
    const bonds = Array.isArray(aid1) && Array.isArray(aid2) && Array.isArray(orders) && aid1.length === aid2.length && aid1.length === orders.length
      ? aid1.map((a: number, index: number) => ({ a: Number(a) - 1, b: Number(aid2[index]) - 1, order: Number(orders[index]) })) : []
    if (!compound || !conformer || !atoms.length || atoms.some((atom) => !atom.element || ![atom.x, atom.y, atom.z].every(Number.isFinite)) || bonds.some((bond) => bond.a < 0 || bond.b < 0 || bond.a >= atoms.length || bond.b >= atoms.length || ![1, 2, 3].includes(bond.order))) return NextResponse.json({ error: "PubChem returned an incomplete or invalid 3D structure." }, { status: 422 })
    const molecule: MoleculeData = {
      name: query, formula: "Verified PubChem structure", molarMass: 0, geometry: "From experimental/conformer coordinates", bondAngle: null, polarity: "unknown", atoms, bonds, description: "3D coordinates and connectivity loaded from PubChem PUG REST.", source: "PubChem", sourceId: String(compound.id?.id?.cid ?? "unknown"),
    }
    return NextResponse.json(molecule)
  } catch { return NextResponse.json({ error: "The verified structure service is temporarily unavailable." }, { status: 503 }) }
}
