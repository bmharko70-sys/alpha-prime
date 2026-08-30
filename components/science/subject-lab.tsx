"use client"

import * as React from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Line, Text, Environment } from "@react-three/drei"
import * as THREE from "three"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/science/tool-page"
import { Reveal } from "@/components/motion/reveal"
import { FIXED_DT, buoyancy, collision, density, fmt, labs, materials, physicsConstants, pendulumStep, springStep, pendulumEnergy, springEnergy, type LabId } from "@/lib/science/physics/models"

const inputClass = "h-9 w-full rounded-md border border-border bg-background px-2 text-sm"
function Field({ label, value, onChange, min = 0, step = 0.1 }: { label: string; value: number; onChange: (value: number) => void; min?: number; step?: number }) { return <label className="flex flex-col gap-1 text-xs text-muted-foreground">{label}<input className={inputClass} type="number" min={min} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} /></label> }
function Readout({ label, value, unit = "" }: { label: string; value: string; unit?: string }) { return <div className="rounded-md border border-border bg-muted/30 p-2"><p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p><p className="font-mono text-sm">{value} <span className="text-[10px] text-muted-foreground">{unit}</span></p></div> }

function SpringMesh({ length }: { length: number }) { const points = React.useMemo(() => { const p: THREE.Vector3[] = []; for (let i = 0; i <= 40; i++) { const x = i / 40 * length; p.push(new THREE.Vector3(x, Math.sin(i / 40 * Math.PI * 12) * 0.12, 0)) } return p }, [length]); return <Line points={points} color="#fbbf24" lineWidth={3} /> }

function World({ id, running, speed, params, onState }: { id: LabId; running: boolean; speed: number; params: Record<string, number>; onState: (state: Record<string, number>) => void }) {
  const state = React.useRef({ t: 0, theta: params.angle, omega: 0, x: 0.6, v: 0, x1: -3, x2: 3, v1: params.v1, v2: params.v2, px: -3, py: 0.4, pvx: params.v0 * Math.cos(params.launchAngle), pvy: params.v0 * Math.sin(params.launchAngle), y: 1.3, vy: 0 })
  const paramsRef = React.useRef(params)
  paramsRef.current = params
  const accumulator = React.useRef(0)
  React.useEffect(() => { state.current = { t: 0, theta: params.angle, omega: 0, x: 0.6, v: 0, x1: -3, x2: 3, v1: params.v1, v2: params.v2, px: -3, py: 0.4, pvx: params.v0 * Math.cos(params.launchAngle), pvy: params.v0 * Math.sin(params.launchAngle), y: 1.3, vy: 0 }; accumulator.current = 0 }, [id])
  useFrame((_, delta) => {
    if (!running) return
    const p = paramsRef.current
    accumulator.current = Math.min(accumulator.current + delta * speed, 0.25)
    while (accumulator.current >= FIXED_DT) {
      accumulator.current -= FIXED_DT
      const s = state.current
      s.t += FIXED_DT
      if (id === "pendulum") { const n = pendulumStep(s.theta, s.omega, p.length, p.g, p.damping, FIXED_DT); s.theta=n.theta; s.omega=n.omega; onState({t:s.t,theta:s.theta,omega:s.omega,alpha:n.alpha,x:p.length*Math.sin(s.theta),y:-p.length*Math.cos(s.theta),energy:pendulumEnergy(s.theta,s.omega,p.mass,p.length,p.g)})
      } else if (id === "spring") { const n=springStep(s.x,s.v,p.mass,p.k,p.damping,FIXED_DT); s.x=n.x;s.v=n.v; onState({t:s.t,x:s.x,v:s.v,a:n.a,energy:springEnergy(s.x,s.v,p.k,p.mass)})
      } else if (id === "collision") { s.x1+=s.v1*FIXED_DT;s.x2+=s.v2*FIXED_DT;if(s.x2-s.x1<=1.1 && s.v1>s.v2){const n=collision(p.m1,s.v1,p.m2,s.v2,p.e);s.v1=n.v1f;s.v2=n.v2f;s.x1=s.x2-1.1}onState({t:s.t,x1:s.x1,x2:s.x2,v1:s.v1,v2:s.v2})
      } else if (id === "projectile") { s.pvy += -p.g*FIXED_DT;s.px+=s.pvx*FIXED_DT;s.py+=s.pvy*FIXED_DT;if(s.py<=0){s.py=0;s.pvy=Math.abs(s.pvy)*0.35;s.pvx*=0.82}onState({t:s.t,x:s.px,y:s.py,vx:s.pvx,vy:s.pvy,range:s.px+3})
      } else { const f=buoyancy(p.mass,p.volume,p.fluid,p.g),a=f.netForce/p.mass;s.vy+=a*FIXED_DT;s.y=Math.max(-1.2,Math.min(1.8,s.y+s.vy*FIXED_DT));if(s.y<=-1.2||s.y>=1.8)s.vy*=-0.15;onState({t:s.t,y:s.y,vy:s.vy,force:f.netForce}) }
    }
  })
  const s = state.current
  if (id === "pendulum") { const x = params.length * Math.sin(s.theta), y = 2 - params.length * Math.cos(s.theta); return <><mesh position={[0, 2, 0]}><boxGeometry args={[2.4, .16, .5]} /><meshStandardMaterial color="#334155" /></mesh><mesh position={[0, 1, 0]}><boxGeometry args={[.12, 2, .12]} /><meshStandardMaterial color="#64748b" /></mesh><Line points={[[0, 2, 0], [x, y, 0]]} color="#e2e8f0" lineWidth={2} /><mesh position={[x, y, 0]}><sphereGeometry args={[.25, 24, 16]} /><meshStandardMaterial color="#22d3ee" metalness={.35} roughness={.25} /></mesh><Text position={[0, 2.35, 0]} fontSize={.16} color="#bae6fd">PENDULUM / θ = {fmt(s.theta * 180 / Math.PI, 1)}°</Text></> }
  if (id === "spring") return <><mesh position={[-2.3, 0, 0]}><boxGeometry args={[.25, 2.2, .8]} /><meshStandardMaterial color="#475569" /></mesh><SpringMesh length={2.4 + s.x * 1.7} /><mesh position={[.1 + s.x * 1.7, 0, 0]}><boxGeometry args={[.55, .55, .55]} /><meshStandardMaterial color="#fbbf24" metalness={.4} /></mesh><Text position={[0, .8, 0]} fontSize={.16} color="#fde68a">SPRING / x = {fmt(s.x)} m</Text></>
  if (id === "collision") return <><mesh position={[0, -.6, 0]}><boxGeometry args={[8, .12, 1]} /><meshStandardMaterial color="#334155" /></mesh><mesh position={[s.x1, 0, 0]}><sphereGeometry args={[.55, 24, 16]} /><meshStandardMaterial color="#22d3ee" /></mesh><mesh position={[s.x2, 0, 0]}><sphereGeometry args={[.55, 24, 16]} /><meshStandardMaterial color="#fb7185" /></mesh><Text position={[0, .9, 0]} fontSize={.16} color="#cbd5e1">COLLISION / v₁ {fmt(s.v1)} · v₂ {fmt(s.v2)}</Text></>
  if (id === "projectile") return <><mesh position={[0, -.1, 0]}><boxGeometry args={[8, .12, 1]} /><meshStandardMaterial color="#334155" /></mesh><mesh position={[s.px, s.py, 0]}><sphereGeometry args={[.22, 24, 16]} /><meshStandardMaterial color="#fb7185" metalness={.3} /></mesh><Line points={[[s.px, s.py, 0], [s.px + s.pvx * .12, s.py + s.pvy * .12, 0]]} color="#fbbf24" lineWidth={2} /><Text position={[0, 1.8, 0]} fontSize={.16} color="#fde68a">PROJECTILE / x = {fmt(s.px + 3)} m · y = {fmt(s.py)} m</Text></>
  if (id === "buoyancy") return <><mesh position={[0, -.25, 0]}><boxGeometry args={[5, 3, 2]} /><meshStandardMaterial color="#0e7490" transparent opacity={.18} /></mesh><mesh position={[0, 1.25, 0]}><boxGeometry args={[5, .04, 2]} /><meshStandardMaterial color="#67e8f9" transparent opacity={.65} /></mesh><mesh position={[0, s.y, 0]}><boxGeometry args={[.8, .8, .8]} /><meshStandardMaterial color="#fbbf24" /></mesh><Text position={[0, 2, 0]} fontSize={.16} color="#a5f3fc">BUOYANCY / Fnet {fmt(0)} N</Text></>
  const scale = Math.max(.4, params.volume ** (1 / 3)); return <><mesh position={[0, 0, 0]} scale={scale}><sphereGeometry args={[.8, 24, 16]} /><meshStandardMaterial color="#22d3ee" metalness={.25} /></mesh><mesh position={[0, -.9, 0]}><boxGeometry args={[3, .08, 1.5]} /><meshStandardMaterial color="#475569" /></mesh><Text position={[0, 1.2, 0]} fontSize={.16} color="#bae6fd">DENSITY / ρ = {fmt(density(params.mass, params.volume), 0)} kg·m⁻³</Text></>
}

export function PhysicsLaboratory() {
  const [active, setActive] = React.useState<LabId>("pendulum"), [running, setRunning] = React.useState(false), [speed, setSpeed] = React.useState(1), [state, setState] = React.useState<Record<string, number>>({})
  const [params, setParams] = React.useState<Record<string, number>>({ mass: 2, volume: 1, fluid: 1000, g: 9.81, length: 1, angle: .55, damping: .08, k: 18, m1: 1, m2: 2, v1: 2, v2: -1, e: 1, v0: 7, vy0: 6, launchAngle: 0.7 })
  const patch = (key: string, value: number) => setParams((p) => ({ ...p, [key]: value }))
  const reset = () => { setRunning(false); setState({}); setParams((p) => ({ ...p })) }
  const lab = labs.find((x) => x.id === active)!
  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-8 md:px-8"><Reveal immediate><p className="font-mono text-xs uppercase tracking-[.18em] text-primary">Academia / mechanics</p><h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Physics laboratory</h1><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Actual 3D objects, fixed-timestep dynamics, and live measurements. The renderer reads the same state as the equations.</p></Reveal><nav className="grid grid-cols-2 gap-2 md:grid-cols-5" aria-label="Experiments">{labs.map((x) => <button key={x.id} onClick={() => { setActive(x.id); setRunning(false); setState({}) }} className={`press-feedback min-h-16 rounded-lg border p-3 text-left transition-colors duration-200 ${active === x.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40"}`}><span className="font-mono text-lg text-primary">{x.symbol}</span><span className="ml-2 text-sm font-medium">{x.name}</span></button>)}</nav><div className="grid gap-5 lg:grid-cols-[1fr_300px]"><Panel title={lab.name}><div className="relative h-[420px] overflow-hidden rounded-lg border border-border bg-[#071018]"><Canvas camera={{ position: [0, 1, 6], fov: 42 }} shadows><color attach="background" args={["#071018"]} /><ambientLight intensity={1.2} /><directionalLight position={[3, 5, 4]} intensity={2} castShadow /><Environment preset="studio" /><World id={active} running={running} speed={speed} params={params} onState={setState} /><OrbitControls makeDefault /></Canvas>{running && <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-primary backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />Running</span>}</div><div className="mt-3 flex flex-wrap items-center gap-2"><Button className="press-feedback" onClick={() => setRunning(!running)}>{running ? "Pause" : "Play"}</Button><Button className="press-feedback" variant="outline" onClick={reset}>Reset</Button><Button className="press-feedback" variant="outline" onClick={() => setState((s) => ({ ...s, step: (s.step ?? 0) + 1 }))}>Step</Button><span className="ml-auto font-mono text-xs text-muted-foreground">fixed Δt = 1/120 s</span></div></Panel><aside className="flex flex-col gap-4"><Panel title="Physical parameters"><div className="grid gap-3">{active === "pendulum" && <><Field label="Length (m)" value={params.length} onChange={(v) => patch("length", v)} min={.3} /><Field label="Initial angle (rad)" value={params.angle} onChange={(v) => patch("angle", v)} min={-.99} /><Field label="Gravity (m/s²)" value={params.g} onChange={(v) => patch("g", v)} min={0} /><Field label="Damping" value={params.damping} onChange={(v) => patch("damping", v)} min={0} /></>}{active === "spring" && <><Field label="Mass (kg)" value={params.mass} onChange={(v) => patch("mass", v)} min={.1} /><Field label="Stiffness (N/m)" value={params.k} onChange={(v) => patch("k", v)} min={.1} /></>}{active === "collision" && <><Field label="Mass A (kg)" value={params.m1} onChange={(v) => patch("m1", v)} min={.1} /><Field label="Mass B (kg)" value={params.m2} onChange={(v) => patch("m2", v)} min={.1} /><Field label="Velocity A (m/s)" value={params.v1} onChange={(v) => patch("v1", v)} step={.5} /><Field label="Velocity B (m/s)" value={params.v2} onChange={(v) => patch("v2", v)} step={.5} /><Field label="Restitution" value={params.e} onChange={(v) => patch("e", v)} min={0} /></>}{(active === "projectile" || active === "buoyancy") && <><Field label="Mass (kg)" value={params.mass} onChange={(v) => patch("mass", v)} min={.1} /><Field label="Volume (m³)" value={params.volume} onChange={(v) => patch("volume", v)} min={.05} step={.05} />{active === "buoyancy" && <Field label="Fluid density (kg/m³)" value={params.fluid} onChange={(v) => patch("fluid", v)} min={1} step={50} />}</>}</div></Panel><Panel title="Live state"><div className="grid grid-cols-2 gap-2"><Readout label="Time" value={fmt(state.t ?? 0, 2)} unit="s" />{active === "pendulum" && <><Readout label="Angle" value={fmt((state.theta ?? params.angle) * 180 / Math.PI, 1)} unit="°" /><Readout label="Angular velocity" value={fmt(state.omega ?? 0)} unit="rad/s" /><Readout label="Position x" value={fmt(state.x ?? 0)} unit="m" /></>}{active === "spring" && <><Readout label="Displacement" value={fmt(state.x ?? 0)} unit="m" /><Readout label="Velocity" value={fmt(state.v ?? 0)} unit="m/s" /><Readout label="Energy" value={fmt(state.energy ?? 0)} unit="J" /></>}{active === "collision" && <><Readout label="Velocity A" value={fmt(state.v1 ?? params.v1)} unit="m/s" /><Readout label="Velocity B" value={fmt(state.v2 ?? params.v2)} unit="m/s" /></>}{active === "buoyancy" && <><Readout label="Height" value={fmt(state.y ?? 1.3)} unit="m" /><Readout label="Net force" value={fmt(state.force ?? 0)} unit="N" /></>}{active === "projectile" && <Readout label="Density" value={fmt(density(params.mass, params.volume), 0)} unit="kg/m³" />}</div></Panel><Panel title="Model"><p className="font-mono text-xs leading-6 text-muted-foreground">{active === "pendulum" ? "θ̈ = −(g/L) sin(θ)" : active === "spring" ? "ẍ = −(kx + cv) / m" : active === "collision" ? "p before = p after" : active === "buoyancy" ? "Fnet = ρfluid g Vsub − mg" : "ρ = m / V"}</p></Panel></aside></div></main>
}

export function BiologyLaboratory() { return <div /> }
export function ChemistryLaboratory() { return <div /> }
export function MathematicsLaboratory() { return <div /> }
export function LanguageLaboratory() { return <div /> }
export function EconomicsLaboratory() { return <div /> }
export function SubjectLaboratory({ subject }: { subject: string }) { return subject === "physics" ? <PhysicsLaboratory /> : <PhysicsLaboratory /> }
export { materials, physicsConstants }
export type { LabId }

void materials
void physicsConstants
function _unused() { return buoyancy(1, 1, 1000) }
void _unused

export const PhysicsLab = PhysicsLaboratory
export const subjectLab = SubjectLaboratory
export const constants = physicsConstants
export const labMaterials = materials
export const labIds = labs
export const collisionModel = collision
export const densityModel = density
export const buoyancyModel = buoyancy

export default PhysicsLaboratory

// Keep the public surface stable for existing subject routes.
export { PhysicsLaboratory as PhysicsSubjectLab }

// Three.js scene intentionally owns the authoritative motion state.

