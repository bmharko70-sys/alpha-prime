"use client"

import * as React from "react"
import { BuoyancyLaboratory } from "@/components/science/buoyancy-lab"
import { Canvas, useFrame } from "@react-three/fiber"
import { Line, OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/science/tool-page"
import { Reveal } from "@/components/motion/reveal"
import {
  FIXED_DT,
  collision,
  fmt,
  hookesLaw,
  labs,
  materials,
  parallelSpring,
  pendulumEnergy,
  pendulumStep,
  physicsConstants,
  projectileMaxHeight,
  projectileRange,
  projectileStep,
  springEnergy,
  springStep,
  type LabId,
  type ProjectileState,
} from "@/lib/science/physics/models"

const inputClass = "h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
type Params = Record<string, number>

function Field({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 0.1,
  unit,
}: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number; unit?: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="font-mono text-[10px] text-primary">{unit}</span>
      </span>
      <input
        aria-label={label}
        className={inputClass}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function Readout({ label, value, unit = "" }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-2.5">
      <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm">
        {value} <span className="text-[10px] text-muted-foreground">{unit}</span>
      </p>
    </div>
  )
}

function SpringMesh({ length }: { length: number }) {
  const points = React.useMemo(
    () => Array.from({ length: 65 }, (_, i) => new THREE.Vector3((i / 64) * length, Math.sin((i / 64) * Math.PI * 14) * 0.13, 0)),
    [length],
  )
  return <Line points={points} color="#fbbf24" lineWidth={3} />
}

type SimState = {
  t: number
  theta: number
  omega: number
  x: number
  v: number
  b1x: number
  b1v: number
  b2x: number
  b2v: number
  collided: boolean
  proj: ProjectileState
  launched: boolean
}

function makeInitial(lab: LabId, params: Params): SimState {
  return {
    t: 0,
    theta: params.angle ?? 0.55,
    omega: 0,
    x: params.x ?? 0.5,
    v: 0,
    b1x: -1.8,
    b1v: params.v1 ?? 2,
    b2x: 0.6,
    b2v: params.v2 ?? -0.6,
    collided: false,
    proj: { t: 0, x: 0, y: params.h0 ?? 0, vx: 0, vy: 0, ax: 0, ay: 0 },
    launched: false,
  }
}

function NonBuoyancyScene({
  lab,
  params,
  running,
  onState,
}: { lab: LabId; params: Params; running: boolean; onState: (s: Params) => void }) {
  const ref = React.useRef<SimState>(makeInitial(lab, params))
  const last = React.useRef(0)
  const groupRef = React.useRef<THREE.Group>(null)
  const ballRef = React.useRef<THREE.Mesh>(null)

  React.useEffect(() => {
    ref.current = makeInitial(lab, params)
    last.current = 0
    if (lab === "pendulum") onState({ t: 0, theta: ref.current.theta, omega: 0, energy: pendulumEnergy(ref.current.theta, 0, params.mass, params.length, params.g) })
    else if (lab === "spring") onState({ t: 0, x: ref.current.x, v: 0, force: hookesLaw(ref.current.x, params.k), energy: springEnergy(ref.current.x, 0, params.k, params.mass) })
    else if (lab === "collision") onState({ t: 0, v1: params.v1, v2: params.v2, v1f: params.v1, v2f: params.v2, momentumBefore: (params.m1 ?? 1) * (params.v1 ?? 0) + (params.m2 ?? 1) * (params.v2 ?? 0) })
    else onState({ t: 0, x: 0, y: params.h0 ?? 0, range: projectileRange(params.v0, params.angleDeg, params.g, params.h0), maxHeight: projectileMaxHeight(params.v0, params.angleDeg, params.g, params.h0) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lab, params.mass, params.length, params.angle, params.g, params.damping, params.k, params.x, params.m1, params.m2, params.v1, params.v2, params.restitution, params.v0, params.angleDeg, params.h0])

  useFrame((_, delta) => {
    if (!running) return
    last.current = Math.min(last.current + delta, 0.2)
    while (last.current >= FIXED_DT) {
      last.current -= FIXED_DT
      const s = ref.current
      s.t += FIXED_DT
      if (lab === "pendulum") {
        const n = pendulumStep(s.theta, s.omega, params.length, params.g, params.damping, FIXED_DT)
        s.theta = n.theta
        s.omega = n.omega
        onState({ t: s.t, theta: s.theta, omega: s.omega, energy: pendulumEnergy(s.theta, s.omega, params.mass, params.length, params.g) })
      } else if (lab === "spring") {
        const n = springStep(s.x, s.v, params.mass, params.k, params.damping, FIXED_DT)
        s.x = n.x
        s.v = n.v
        onState({ t: s.t, x: s.x, v: s.v, force: hookesLaw(s.x, params.k), energy: springEnergy(s.x, s.v, params.k, params.mass) })
      } else if (lab === "collision") {
        s.b1x += s.b1v * FIXED_DT
        s.b2x += s.b2v * FIXED_DT
        const r1 = 0.28, r2 = 0.28
        if (!s.collided && s.b2x - s.b1x <= r1 + r2 && s.b1v > s.b2v) {
          const result = collision(params.m1, s.b1v, params.m2, s.b2v, params.restitution)
          s.b1v = result.v1f
          s.b2v = result.v2f
          s.collided = true
        }
        const momentumAfter = params.m1 * s.b1v + params.m2 * s.b2v
        onState({ t: s.t, v1f: s.b1v, v2f: s.b2v, momentumAfter, collided: s.collided ? 1 : 0 })
      } else {
        if (s.launched && s.proj.y >= 0) {
          s.proj = projectileStep(s.proj, params.g, FIXED_DT, params.air)
          onState({ t: s.proj.t, x: s.proj.x, y: s.proj.y, vx: s.proj.vx, vy: s.proj.vy })
        }
      }
    }
  })

  useFrame(() => {
    const s = ref.current
    if (lab === "pendulum" && groupRef.current) groupRef.current.rotation.z = s.theta
    if (lab === "spring" && ballRef.current) ballRef.current.position.x = 2.35 + s.x * 1.4
    if (lab === "collision" && ballRef.current && groupRef.current) {
      ballRef.current.position.x = s.b1x
      groupRef.current.position.x = s.b2x
    }
    if (lab === "projectile" && ballRef.current) {
      ballRef.current.position.x = s.proj.x * 0.55 - 2.2
      ballRef.current.position.y = s.proj.y * 0.55 - 0.4
    }
  })

  React.useEffect(() => {
    if (lab === "projectile" && running) {
      const s = ref.current
      const angle = (params.angleDeg * Math.PI) / 180
      s.proj = { t: 0, x: 0, y: params.h0 ?? 0, vx: params.v0 * Math.cos(angle), vy: params.v0 * Math.sin(angle), ax: 0, ay: 0 }
      s.launched = true
    }
  }, [lab, running, params.v0, params.angleDeg, params.h0])

  if (lab === "spring")
    return (
      <>
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 4]} intensity={2} />
        <mesh position={[-2.35, 0, 0]}>
          <boxGeometry args={[0.25, 2.2, 0.8]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
        <group position={[-2.2, 0, 0]}>
          <SpringMesh length={2.35 + ref.current.x * 1.4} />
        </group>
        <mesh ref={ballRef} position={[2.35 + ref.current.x * 1.4, 0, 0]}>
          <boxGeometry args={[0.55, 0.55, 0.55]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.4} />
        </mesh>
        <OrbitControls enablePan={false} enableZoom={false} />
      </>
    )

  if (lab === "collision")
    return (
      <>
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 4]} intensity={2} />
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[6, 0.06, 0.9]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh ref={ballRef} position={[ref.current.b1x, -0.22, 0]}>
          <sphereGeometry args={[0.28, 24, 16]} />
          <meshStandardMaterial color="#22d3ee" metalness={0.35} />
        </mesh>
        <group ref={groupRef} position={[ref.current.b2x, 0, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <sphereGeometry args={[0.28, 24, 16]} />
            <meshStandardMaterial color="#fb7185" metalness={0.35} />
          </mesh>
        </group>
        <OrbitControls enablePan={false} enableZoom={false} />
      </>
    )

  if (lab === "projectile")
    return (
      <>
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 4]} intensity={2} />
        <mesh position={[0, -0.68, 0]}>
          <boxGeometry args={[6, 0.06, 0.9]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <Line points={Array.from({ length: 40 }, (_, i) => new THREE.Vector3(i * 0.15 - 2.2, Math.sin(i * 0.3) * 0.02 - 0.68, 0))} color="#475569" lineWidth={1} />
        <mesh ref={ballRef} position={[-2.2, -0.4, 0]}>
          <sphereGeometry args={[0.2, 24, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.4} />
        </mesh>
        <OrbitControls enablePan={false} enableZoom={false} />
      </>
    )

  const x = params.length * Math.sin(ref.current.theta)
  const y = 2 - params.length * Math.cos(ref.current.theta)
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[2.6, 0.14, 0.5]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <Line points={[[0, 2, 0], [x, y, 0]]} color="#e2e8f0" lineWidth={2} />
      <mesh position={[x, y, 0]}>
        <sphereGeometry args={[0.25, 24, 16]} />
        <meshStandardMaterial color="#22d3ee" metalness={0.35} />
      </mesh>
      <OrbitControls enablePan={false} enableZoom={false} />
    </>
  )
}

const defaults: Params = {
  mass: 2,
  length: 1,
  angle: 0.55,
  damping: 0.08,
  k: 18,
  x: 0.5,
  m1: 2,
  m2: 1,
  v1: 2,
  v2: -0.6,
  restitution: 0.85,
  v0: 8,
  angleDeg: 45,
  h0: 0,
  air: 0,
  g: 9.81,
}

function Controls({ lab, p, setP }: { lab: LabId; p: Params; setP: (k: string, n: number) => void }) {
  if (lab === "pendulum")
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Length" unit="m" value={p.length} min={0.2} step={0.1} onChange={(n) => setP("length", n)} />
        <Field label="Mass" unit="kg" value={p.mass} min={0.1} step={0.1} onChange={(n) => setP("mass", n)} />
        <Field label="Damping" unit="1/s" value={p.damping} min={0} step={0.01} onChange={(n) => setP("damping", n)} />
        <Field label="Initial angle" unit="rad" value={p.angle} min={-0.9} max={0.9} step={0.05} onChange={(n) => setP("angle", n)} />
      </div>
    )
  if (lab === "spring")
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mass" unit="kg" value={p.mass} min={0.1} step={0.1} onChange={(n) => setP("mass", n)} />
        <Field label="Spring constant" unit="N/m" value={p.k} min={0.1} step={1} onChange={(n) => setP("k", n)} />
        <Field label="Damping" unit="kg/s" value={p.damping} min={0} step={0.01} onChange={(n) => setP("damping", n)} />
        <Field label="Initial displacement" unit="m" value={p.x} min={-0.9} max={0.9} step={0.05} onChange={(n) => setP("x", n)} />
      </div>
    )
  if (lab === "collision")
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Mass 1" unit="kg" value={p.m1} min={0.1} step={0.1} onChange={(n) => setP("m1", n)} />
        <Field label="Mass 2" unit="kg" value={p.m2} min={0.1} step={0.1} onChange={(n) => setP("m2", n)} />
        <Field label="Velocity 1" unit="m/s" value={p.v1} min={-10} max={10} step={0.1} onChange={(n) => setP("v1", n)} />
        <Field label="Velocity 2" unit="m/s" value={p.v2} min={-10} max={10} step={0.1} onChange={(n) => setP("v2", n)} />
        <Field label="Restitution" unit="0–1" value={p.restitution} min={0} max={1} step={0.05} onChange={(n) => setP("restitution", n)} />
      </div>
    )
  if (lab === "projectile")
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Launch speed" unit="m/s" value={p.v0} min={0.5} step={0.5} onChange={(n) => setP("v0", n)} />
        <Field label="Launch angle" unit="deg" value={p.angleDeg} min={0} max={90} step={1} onChange={(n) => setP("angleDeg", n)} />
        <Field label="Initial height" unit="m" value={p.h0} min={0} step={0.5} onChange={(n) => setP("h0", n)} />
        <Field label="Air resistance" unit="k" value={p.air} min={0} max={1} step={0.02} onChange={(n) => setP("air", n)} />
      </div>
    )
  return null
}

function Readouts({ lab, state, params }: { lab: LabId; state: Params; params: Params }) {
  if (lab === "pendulum")
    return (
      <div className="grid grid-cols-2 gap-2">
        <Readout label="Angle" value={fmt(state.theta ?? 0)} unit="rad" />
        <Readout label="Angular velocity" value={fmt(state.omega ?? 0)} unit="rad/s" />
        <Readout label="Mechanical energy" value={fmt(state.energy ?? 0)} unit="J" />
        <Readout label="Elapsed time" value={fmt(state.t ?? 0, 1)} unit="s" />
      </div>
    )
  if (lab === "spring") {
    const period = 2 * Math.PI * Math.sqrt(params.mass / Math.max(params.k, 1e-6))
    return (
      <div className="grid grid-cols-2 gap-2">
        <Readout label="Displacement" value={fmt(state.x ?? 0)} unit="m" />
        <Readout label="Velocity" value={fmt(state.v ?? 0)} unit="m/s" />
        <Readout label="Restoring force" value={fmt(state.force ?? 0)} unit="N" />
        <Readout label="Period" value={fmt(period)} unit="s" />
      </div>
    )
  }
  if (lab === "collision") {
    const before = params.m1 * params.v1 + params.m2 * params.v2
    return (
      <div className="grid grid-cols-2 gap-2">
        <Readout label="Velocity 1" value={fmt(state.v1f ?? params.v1)} unit="m/s" />
        <Readout label="Velocity 2" value={fmt(state.v2f ?? params.v2)} unit="m/s" />
        <Readout label="Momentum before" value={fmt(before)} unit="kg·m/s" />
        <Readout label="Momentum after" value={fmt(state.momentumAfter ?? before)} unit="kg·m/s" />
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <Readout label="Range" value={fmt(projectileRange(params.v0, params.angleDeg, params.g, params.h0))} unit="m" />
      <Readout label="Max height" value={fmt(projectileMaxHeight(params.v0, params.angleDeg, params.g, params.h0))} unit="m" />
      <Readout label="Position x" value={fmt(state.x ?? 0)} unit="m" />
      <Readout label="Position y" value={fmt(state.y ?? params.h0 ?? 0)} unit="m" />
    </div>
  )
}

export function PhysicsLaboratory() {
  const [active, setActive] = React.useState<LabId>("pendulum")
  const [running, setRunning] = React.useState(false)
  const [params, setParams] = React.useState<Params>(defaults)
  const [state, setState] = React.useState<Params>({})

  const lab = labs.find((x) => x.id === active)!
  const setP = (k: string, n: number) => setParams((p) => ({ ...p, [k]: Number.isFinite(n) ? n : 0 }))
  const select = (id: LabId) => {
    setActive(id)
    setRunning(false)
    setState({})
  }
  const reset = () => {
    setRunning(false)
    setState({})
    setParams({ ...defaults })
  }

  if (active === "buoyancy") {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-8 md:px-8">
        <Reveal immediate>
          <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">Academia / mechanics</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Physics laboratory</h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            An instrumented workspace for testing idealized models. Every readout is derived from the same fixed-timestep
            simulation that drives the scene.
          </p>
        </Reveal>
        <LabTabs active={active} select={select} />
        <BuoyancyLaboratory />
      </div>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-8 md:px-8">
      <Reveal immediate>
        <p className="font-mono text-xs uppercase tracking-[.18em] text-primary">Academia / mechanics</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Physics laboratory</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          An instrumented workspace for testing idealized models. Every readout is derived from the same fixed-timestep
          simulation that drives the scene.
        </p>
      </Reveal>
      <LabTabs active={active} select={select} />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel title={lab.name}>
          <div className="relative h-[420px] overflow-hidden rounded-lg border border-border bg-slate-950">
            <Canvas camera={{ position: [0, 0.4, 6], fov: 42 }}>
              <NonBuoyancyScene lab={active} params={params} running={running} onState={setState} />
            </Canvas>
            <div className="absolute left-4 top-4 rounded-md border border-border bg-background/85 px-3 py-2 font-mono text-xs backdrop-blur">
              <span className="text-primary">{lab.subtitle}</span>
              <span className="ml-2 text-muted-foreground">t = {fmt(state.t ?? 0, 1)}s</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button className="press-feedback" onClick={() => setRunning((r) => !r)}>
              {running ? "Pause" : "Run"}
            </Button>
            <Button className="press-feedback" variant="outline" onClick={reset}>
              Reset
            </Button>
          </div>
        </Panel>
        <div className="flex flex-col gap-5">
          <Panel title="Parameters">
            <Controls lab={active} p={params} setP={setP} />
          </Panel>
          <Panel title="Live readouts">
            <Readouts lab={active} state={state} params={params} />
          </Panel>
        </div>
      </div>
    </main>
  )
}

function LabTabs({ active, select }: { active: LabId; select: (id: LabId) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5" role="tablist" aria-label="Physics experiments">
      {labs.map((x) => (
        <button
          role="tab"
          aria-selected={active === x.id}
          key={x.id}
          onClick={() => select(x.id)}
          className={`press-feedback min-h-16 rounded-lg border p-3 text-left transition-all ${active === x.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}
        >
          <span className="font-mono text-lg text-primary">{x.symbol}</span>
          <span className="ml-2 text-sm font-medium">{x.name}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{x.subtitle}</span>
        </button>
      ))}
    </div>
  )
}

export function BiologyLaboratory() {
  return <div />
}
export function ChemistryLaboratory() {
  return <div />
}
export function MathematicsLaboratory() {
  return <div />
}
export function LanguageLaboratory() {
  return <div />
}
export function EconomicsLaboratory() {
  return <div />
}
export function SubjectLaboratory({ subject }: { subject: string }) {
  return subject === "physics" ? <PhysicsLaboratory /> : <PhysicsLaboratory />
}

export { materials, physicsConstants }
export type { LabId }
export const PhysicsLab = PhysicsLaboratory
export const subjectLab = SubjectLaboratory
export const constants = physicsConstants
export const labMaterials = materials
export const labIds = labs
export const collisionModel = collision
export const parallelSpringModel = parallelSpring
export default PhysicsLaboratory
export { PhysicsLaboratory as PhysicsSubjectLab }
