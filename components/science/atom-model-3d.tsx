"use client"

import * as React from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import * as THREE from "three"
import type { ElementData } from "@/lib/science/types"
import { CATEGORY_COLOR_VAR } from "@/lib/science/data/elements"

interface AtomModel3DProps {
  element: ElementData
  paused?: boolean
}

/**
 * A schematic Bohr-style 3D atom model: a nucleus sized by mass number and
 * `element.electronsPerShell` real electron counts distributed on concentric,
 * independently-tilted orbital rings so shells with many electrons don't
 * visually overlap. This is a pedagogical Bohr model, not an orbital/electron
 * cloud simulation — appropriate for K-12/intro chemistry visualization.
 */
export function AtomModel3D({ element, paused }: AtomModel3DProps) {
  const categoryColorVar = CATEGORY_COLOR_VAR[element.category]
  const [color, setColor] = React.useState("#5b9bd5")

  React.useEffect(() => {
    const resolved = getComputedStyle(document.documentElement).getPropertyValue(
      categoryColorVar.replace("var(", "").replace(")", "")
    )
    if (resolved) setColor(resolved.trim())
  }, [categoryColorVar])

  const nucleusRadius = 0.35 + Math.min(element.atomicMass, 300) / 600

  return (
    <group>
      <Nucleus radius={nucleusRadius} protons={element.atomicNumber} neutrons={Math.max(0, Math.round(element.atomicMass) - element.atomicNumber)} color={color} />
      {element.electronsPerShell.map((count, shellIndex) => (
        <ElectronShell
          key={shellIndex}
          shellIndex={shellIndex}
          electronCount={count}
          radius={nucleusRadius + 1.1 + shellIndex * 0.9}
          paused={paused}
          color={color}
        />
      ))}
      <Text position={[0, -nucleusRadius - 0.6, 0]} fontSize={0.32} color={color} anchorX="center" anchorY="top">
        {element.symbol}
      </Text>
    </group>
  )
}

function Nucleus({ radius, color }: { radius: number; protons: number; neutrons: number; color: string }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} emissive={color} emissiveIntensity={0.15} />
    </mesh>
  )
}

function ElectronShell({
  shellIndex,
  electronCount,
  radius,
  paused,
  color,
}: {
  shellIndex: number
  electronCount: number
  radius: number
  paused?: boolean
  color: string
}) {
  const groupRef = React.useRef<THREE.Group>(null)
  const tilt = (shellIndex % 3) * 0.5 - 0.5 // vary tilt per shell so rings are visually distinct
  const speed = 0.15 / (shellIndex + 1)

  useFrame((_, delta) => {
    if (paused || !groupRef.current) return
    groupRef.current.rotation.y += delta * speed
  })

  const ringPoints = React.useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
    }
    return points
  }, [radius])

  return (
    <group rotation={[tilt, 0, 0]}>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(ringPoints.flatMap((p) => [p.x, p.y, p.z])), 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} opacity={0.35} transparent />
      </line>
      <group ref={groupRef}>
        {Array.from({ length: electronCount }).map((_, i) => {
          const angle = (i / electronCount) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshStandardMaterial color="#e8eef5" emissive="#8fb8e8" emissiveIntensity={0.6} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}
