import { NextRequest, NextResponse } from "next/server"
import { ELEMENTS } from "@/lib/science/data/elements"
import type { MoleculeData } from "@/lib/science/types"

const symbolByAtomicNumber = new Map(ELEMENTS.map((element) => [element.atomicNumber, element.symbol]))

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim()
  if (!query || query.length > 80) return NextResponse.json({ error: "Enter a valid molecule name or formula." }, { status: 400 })
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/record/JSON?record_type=3d`
  try {
    const response = await fetch(url, { next: { revalidate: 86400 } })
    if (!response.ok) return NextResponse.json({ error: "No verified 3D structure was found for this search." }, { status: 404 })
    const record = await response.json()
    const compound = record?.PC_Compounds?.[0]
    const conformer = compound?.coords?.[0]?.conformers?.[0]
    const atoms = compound?.atoms?.element?.map((atomicNumber: number, index: number) => ({
      element: symbolByAtomicNumber.get(atomicNumber),
      x: Number(conformer?.x?.[index]), y: Number(conformer?.y?.[index]), z: Number(conformer?.z?.[index]),
    }))
    const bonds = compound?.bonds?.aid1?.map((a: number, index: number) => ({ a: a - 1, b: compound.bonds.aid2[index] - 1, order: compound.bonds.order[index] }))
    if (!compound || !conformer || !atoms?.length || atoms.some((atom: { element?: string; x: number; y: number; z: number }) => !atom.element || ![atom.x, atom.y, atom.z].every(Number.isFinite)) || bonds?.some((bond: { a: number; b: number; order: number }) => bond.a < 0 || bond.b < 0 || ![1, 2, 3].includes(bond.order))) return NextResponse.json({ error: "PubChem returned an incomplete or invalid 3D structure." }, { status: 422 })
    const molecule: MoleculeData = {
      name: query, formula: "Verified PubChem structure", molarMass: 0, geometry: "From experimental/conformer coordinates", bondAngle: null, polarity: "unknown", atoms, bonds, description: "3D coordinates and connectivity loaded from PubChem PUG REST.", source: "PubChem", sourceId: String(compound.id?.id?.cid ?? "unknown"),
    }
    return NextResponse.json(molecule)
  } catch { return NextResponse.json({ error: "The verified structure service is temporarily unavailable." }, { status: 503 }) }
}
