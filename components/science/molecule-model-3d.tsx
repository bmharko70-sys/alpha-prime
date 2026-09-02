"use client"

import * as React from "react"
import * as THREE from "three"
import type { MoleculeData } from "@/lib/science/types"
import { getElementBySymbol } from "@/lib/science/data/elements"

export type MoleculeRenderMode = "ball-and-stick" | "space-filling" | "wireframe"

// Real (approximate) CPK color convention + van der Waals radius scale
// factors so space-filling models are visually distinguishable and
// scientifically conventional, not arbitrary.
const CPK_COLORS: Record<string, string> = {
  H: "#f5f5f5",
  C: "#3a3a3a",
  N: "#3060e0",
  O: "#e03030",
  F: "#40c040",
  Cl: "#40c040",
  Br: "#8b2500",
  I: "#8f00d0",
  S: "#d0c020",
  P: "#e08000",
  Na: "#8060d0",
  K: "#8060d0",
  Ca: "#808080",
  Fe: "#c06000",
}

function colorFor(symbol: string) {
  return CPK_COLORS[symbol] ?? "#5b9bd5"
}

function vdwRadiusScale(symbol: string) {
  // Rough relative atomic size for rendering scale, not exact van der Waals radii.
  const scales: Record<string, number> = { H: 0.55, C: 0.85, N: 0.8, O: 0.75, F: 0.7, Cl: 0.95, S: 0.95, P: 0.95 }
  return scales[symbol] ?? 0.85
}

interface MoleculeModel3DProps {
  molecule: MoleculeData
  mode: MoleculeRenderMode
}

export function MoleculeModel3D({ molecule, mode }: MoleculeModel3DProps) {
  // Keep the source indices stable. PubChem bond endpoints refer to the original
  // atom array, so filtering atoms before resolving bonds can silently connect
  // the wrong atoms when a record contains one invalid coordinate.
  const validAtomIndices = new Set<number>()
  const atoms = molecule.atoms.map((atom, index) => {
    if ([atom.x, atom.y, atom.z].every(Number.isFinite)) validAtomIndices.add(index)
    return atom
  })
  const bonds = molecule.bonds.filter((bond) => {
    return Boolean(
      Number.isInteger(bond.a) &&
        Number.isInteger(bond.b) &&
        validAtomIndices.has(bond.a) &&
        validAtomIndices.has(bond.b) &&
        [1, 2, 3].includes(bond.order),
    )
  })

  return (
    <group>
      {atoms.map((atom, i) => {
        if (!validAtomIndices.has(i)) return null
        const radius = mode === "space-filling" ? vdwRadiusScale(atom.element) * 0.85 : mode === "wireframe" ? 0.08 : vdwRadiusScale(atom.element) * 0.32
        return (
          <mesh key={i} position={[atom.x, atom.y, atom.z]}>
            <sphereGeometry args={[radius, 32, 32]} />
            <meshStandardMaterial
              color={colorFor(atom.element)}
              roughness={0.4}
              metalness={0.05}
              wireframe={mode === "wireframe"}
            />
          </mesh>
        )
      })}
      {mode !== "space-filling" &&
        bonds.map((bond, i) => (
          <Bond
            key={i}
            from={atoms[bond.a]}
            to={atoms[bond.b]}
            order={bond.order}
            wireframe={mode === "wireframe"}
          />
        ))}
    </group>
  )
}

function Bond({
  from,
  to,
  order,
  wireframe,
}: {
  from: { x: number; y: number; z: number }
  to: { x: number; y: number; z: number }
  order: 1 | 2 | 3
  wireframe: boolean
}) {
  const start = new THREE.Vector3(from.x, from.y, from.z)
  const end = new THREE.Vector3(to.x, to.y, to.z)
  const mid = start.clone().add(end).multiplyScalar(0.5)
  const direction = end.clone().sub(start)
  const length = direction.length()
  const valid = Number.isFinite(length) && length > 0.0001

  const quaternion = React.useMemo(() => {
    const q = new THREE.Quaternion()
    if (valid) q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
    return q
  }, [direction, valid])

  if (!valid) return null

  // Render multiple parallel cylinders offset perpendicular to the bond
  // axis for double/triple bonds — a standard ball-and-stick convention.
  const offsets = order === 1 ? [0] : order === 2 ? [-0.09, 0.09] : [-0.14, 0, 0.14]
  const perpendicular = React.useMemo(() => {
    const arbitrary = Math.abs(direction.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    return direction.clone().cross(arbitrary).normalize()
  }, [direction])

  return (
    <>
      {offsets.map((offset, i) => {
        const offsetPos = mid.clone().add(perpendicular.clone().multiplyScalar(offset))
        return (
          <mesh key={i} position={offsetPos} quaternion={quaternion}>
            <cylinderGeometry args={[0.05, 0.05, length, 12]} />
            <meshStandardMaterial color="#b8c2cc" roughness={0.5} wireframe={wireframe} />
          </mesh>
        )
      })}
    </>
  )
}

export function moleculeLegend(molecule: MoleculeData) {
  const symbols = Array.from(new Set(molecule.atoms.map((a) => a.element)))
  return symbols.map((symbol) => ({
    symbol,
    color: colorFor(symbol),
    name: getElementBySymbol(symbol)?.name ?? symbol,
  }))
}
