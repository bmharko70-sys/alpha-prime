export const FIXED_DT = 1 / 120

export const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, finite(value, min)))
export const positive = (value: number, fallback = 1) => Math.max(Number.EPSILON, finite(value, fallback))
export const fmt = (value: number, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : "—"

export type Sample = { t: number; [key: string]: number }

export interface PendulumState { t:number; theta:number; omega:number; alpha:number; x:number; y:number; vx:number; vy:number; energy:number }
export const pendulumStep = (theta:number, omega:number, length:number, g:number, damping:number, dt=FIXED_DT) => {
  const alpha = -(positive(g) / positive(length)) * Math.sin(theta) - Math.max(0, finite(damping)) * omega
  const nextOmega = omega + alpha * dt
  return { theta: theta + nextOmega * dt, omega: nextOmega, alpha }
}
export const pendulumEnergy = (theta:number, omega:number, mass:number, length:number, g:number) => {
  const m=positive(mass), l=positive(length), gravity=positive(g)
  return m * gravity * l * (1 - Math.cos(theta)) + 0.5 * m * (l * omega) ** 2
}

export interface SpringState { t:number; x:number; v:number; a:number; ke:number; pe:number; energy:number }
export const springStep = (x:number, v:number, mass:number, k:number, damping:number, dt=FIXED_DT) => {
  const a = (-positive(k) * finite(x) - Math.max(0, finite(damping)) * finite(v)) / positive(mass)
  const nextV = finite(v) + a * dt
  return { x: finite(x) + nextV * dt, v: nextV, a }
}
export const springEnergy = (x:number, v:number, k:number, mass:number) => 0.5 * positive(k) * finite(x) ** 2 + 0.5 * positive(mass) * finite(v) ** 2

export const collision = (m1:number,v1:number,m2:number,v2:number,e:number) => {
  const a=positive(m1), b=positive(m2), restitution=clamp(e,0,1), impulse=((1+restitution)*b*(finite(v1)-finite(v2)))/(a+b)
  return { v1f: finite(v1)-impulse/a, v2f: finite(v2)+impulse/b }
}

export interface ProjectileState { t:number; x:number; y:number; vx:number; vy:number; ax:number; ay:number }
export const projectileStep = (state:ProjectileState, g:number, dt=FIXED_DT, air=0):ProjectileState => {
  const drag=Math.max(0, finite(air)), ax=-drag*state.vx, ay=-positive(g)-drag*state.vy
  const vx=state.vx+ax*dt, vy=state.vy+ay*dt
  return { t:state.t+dt, x:state.x+vx*dt, y:Math.max(0,state.y+vy*dt), vx,vy,ax,ay }
}
export const projectileRange=(v0:number,angleDeg:number,g:number,h0=0)=>{const a=angleDeg*Math.PI/180,vy=finite(v0)*Math.sin(a),vx=finite(v0)*Math.cos(a),flight=(vy+Math.sqrt(Math.max(0,vy*vy+2*positive(g)*Math.max(0,h0))))/positive(g);return vx*flight}
export const projectileMaxHeight=(v0:number,angleDeg:number,g:number,h0=0)=>Math.max(0,h0)+(finite(v0)*Math.sin(angleDeg*Math.PI/180))**2/(2*positive(g))

export const density=(mass:number,volume:number)=>positive(mass)/positive(volume)
export const buoyancy=(mass:number,volume:number,fluidDensity:number,g=9.81)=>{const m=positive(mass),v=positive(volume),fd=positive(fluidDensity),gravity=positive(g),objectDensity=density(m,v),weight=m*gravity,buoyantForce=fd*gravity*v;return {objectDensity,buoyantForce,weight,netForce:buoyantForce-weight,floats:objectDensity<fd}}
export const seriesPath=(samples:Sample[],key:string,width=560,height=150)=>{if(!samples.length)return "";const values=samples.map(s=>finite(s[key])),min=Math.min(...values),max=Math.max(...values),range=Math.max(max-min,1e-9);return samples.map((s,i)=>`${i?"L":"M"} ${(i/Math.max(samples.length-1,1)*width).toFixed(1)} ${(height-(((finite(s[key])-min)/range)*(height-12)+6)).toFixed(1)}`).join(" ")}

export const physicsConstants={g:9.81,waterDensity:1000}
export type LabId="pendulum"|"spring"|"collision"|"buoyancy"|"projectile"
export const labs:Array<{id:LabId;name:string;subtitle:string;symbol:string}>=[
 {id:"pendulum",name:"Pendulum",subtitle:"Nonlinear motion",symbol:"◌"},{id:"spring",name:"Spring & SHM",subtitle:"Oscillation and energy",symbol:"∿"},{id:"collision",name:"Collision",subtitle:"Momentum and impulse",symbol:"↔"},{id:"buoyancy",name:"Buoyancy",subtitle:"Archimedes principle",symbol:"↑"},{id:"projectile",name:"Projectile",subtitle:"Angled trajectory motion",symbol:"→"},]
export const materials=[{name:"Cork",density:240},{name:"Oak Wood",density:700},{name:"Aluminum",density:2700},{name:"Iron",density:7874},{name:"Copper",density:8960},{name:"Lead",density:11340}]

// Buoyancy domain models
export interface BuoyancyState { t:number; y:number; vy:number; ay:number; force:number; apparentWeight:number }
export const buoyancyStep = (y:number, vy:number, mass:number, volume:number, fluidDensity:number, g=9.81, dt=FIXED_DT, objectSize=Math.cbrt(positive(volume)), fluidSurface=1.2, fluidBottom=-1.8) => {
  const m=positive(mass), v=positive(volume), fd=positive(fluidDensity), gravity=positive(g), size=positive(objectSize)
  const bottom=finite(y)-size/2
  const submergedFraction=clamp((fluidSurface-bottom)/size,0,1)
  const submergedVolume=v*submergedFraction
  const weight=m*gravity, buoyantForce=fd*gravity*submergedVolume, netForce=buoyantForce-weight, ay=netForce/m
  const nextVy=finite(vy)+ay*dt
  const nextY=finite(y)+nextVy*dt
  const restingY=fluidSurface+size/2
  const groundedY=fluidBottom+size/2
  const clampedY=Math.max(groundedY,Math.min(restingY,nextY))
  return { y:clampedY, vy:(clampedY===nextY?nextVy:0), ay, force:netForce, apparentWeight:weight-buoyantForce, submergedFraction, submergedVolume }
}
export const objectFloats = (objectDensity:number, fluidDensity:number) => objectDensity < positive(fluidDensity)
export const displacedFluidMass = (volume:number, fluidDensity:number) => positive(volume)*positive(fluidDensity)

// Spring domain models
export interface HelicalSpringState { t:number; x:number; v:number; a:number; pe:number; ke:number }
export const hookesLaw = (displacement:number, k:number) => -positive(k)*finite(displacement)
export const oscillationPeriod = (k:number, mass:number) => 2*Math.PI*Math.sqrt(positive(mass)/positive(k))
export const oscillationFrequency = (k:number, mass:number) => 1/oscillationPeriod(k,mass)
export const seriesSpring = (k1:number, k2:number) => (positive(k1)*positive(k2))/(positive(k1)+positive(k2))
export const parallelSpring = (k1:number, k2:number) => positive(k1)+positive(k2)

// Geometry helpers
export const sphereVolume = (radius:number) => (4/3)*Math.PI*positive(radius)**3
export const cylinderVolume = (radius:number, height:number) => Math.PI*positive(radius)**2*positive(height)
export const boxVolume = (width:number, depth:number, height:number) => positive(width)*positive(depth)*positive(height)

// Data collection
export const collectSample = (t:number, state:Record<string, number>):Sample => ({ t, ...state })
export const computeStats = (samples:Sample[], key:string) => {
  if(!samples.length) return {min:0,max:0,mean:0,range:0}
  const values=samples.map(s=>finite(s[key]))
  const min=Math.min(...values), max=Math.max(...values)
  return {min,max,mean:values.reduce((a,b)=>a+b,0)/values.length,range:max-min}
}
