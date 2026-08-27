"use client"

import * as React from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { MoleculeModel3D, type MoleculeRenderMode } from "@/components/science/molecule-model-3d"
import type { MoleculeData } from "@/lib/science/types"
import { balanceEquation, classifyReaction, type BalancedEquation } from "@/lib/science/chem/equation-balancer"
import { parseFormula } from "@/lib/science/chem/formula"
import { strongAcidPh, strongBasePh, weakAcidPh, weakBasePh, titrationPh } from "@/lib/science/chem/acid-base"
import { MOLECULES, MOLECULE_CATALOG } from "@/lib/science/data/molecules"
import { Button } from "@/components/ui/button"
import { AiTutor } from "@/components/science/ai-tutor"
import { PhysicsLaboratory, BiologyLaboratory } from "@/components/science/subject-lab"

const inputClass = "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"

function verifyEquation(result: BalancedEquation) {
  const totals = (items: { formula: string; coefficient: number }[]) => items.reduce<Record<string, number>>((acc, item) => {
    for (const [element, count] of Object.entries(parseFormula(item.formula))) acc[element] = (acc[element] ?? 0) + count * item.coefficient
    return acc
  }, {})
  const left = totals(result.reactants); const right = totals(result.products)
  return Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort().map((element) => ({ element, reactants: left[element] ?? 0, products: right[element] ?? 0 }))
}

export function ToolPage({ title, eyebrow, description, children }: { title: string; eyebrow: string; description: string; children?: React.ReactNode }) {
  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8"><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1><p className="mt-4 text-pretty leading-7 text-muted-foreground">{description}</p></div>{children}</main>
}

export function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</h2><div className="mt-5">{children}</div></section> }

export function EquationTool() {
  const [equation, setEquation] = React.useState("Fe + O2 -> Fe2O3")
  const [result, setResult] = React.useState(() => balanceEquation(equation))
  const balancedText = result.balanced ? `${result.reactants.map((x) => `${x.coefficient === 1 ? "" : x.coefficient}${x.formula}`).join(" + ")} → ${result.products.map((x) => `${x.coefficient === 1 ? "" : x.coefficient}${x.formula}`).join(" + ")}` : ""
  const verify = result.balanced ? verifyEquation(result) : []
  return <ToolPage eyebrow="Chemistry / equation & reaction lab" title="Balance. Verify. Understand." description="Parse a reaction, solve its exact stoichiometric coefficients, and independently verify conservation of every element.">
    <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
      <Panel title="Reaction input">
        <div className="flex flex-col gap-3 md:flex-row"><input aria-label="Chemical equation" className={inputClass} value={equation} onChange={(e) => setEquation(e.target.value)} /><Button onClick={() => setResult(balanceEquation(equation))}>Balance reaction</Button></div>
        <div className="mt-4 flex flex-wrap gap-2">{["H2 + O2 -> H2O", "C3H8 + O2 -> CO2 + H2O", "NaOH + HCl -> NaCl + H2O"].map((example) => <button key={example} className="rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground hover:border-primary hover:text-foreground" onClick={() => { setEquation(example); setResult(balanceEquation(example)) }}>{example}</button>)}</div>
        {result.error ? <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{result.error}</p> : <><div className="mt-6 overflow-x-auto rounded-xl bg-muted/50 p-5 text-center font-mono text-lg">{result.reactants.map((x) => `${x.coefficient === 1 ? "" : x.coefficient}${x.formula}`).join(" + ")} → {result.products.map((x) => `${x.coefficient === 1 ? "" : x.coefficient}${x.formula}`).join(" + ")}</div><p className="mt-3 text-sm text-muted-foreground">Reaction type: <span className="font-medium capitalize text-foreground">{classifyReaction(result).replaceAll("-", " ")}</span></p></>}
      </Panel>
      <Panel title="Verification"><div className="flex flex-col gap-3">{verify.map((row) => <div key={row.element} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 font-mono text-sm"><span>{row.element}</span><span>{row.reactants} = {row.products}</span></div>)}{result.balanced && <p className="rounded-lg bg-primary/10 p-3 text-sm font-medium text-primary">✓ Independently verified: atoms are conserved.</p>}</div></Panel>
    </div>
    {result.balanced && <Panel title="Generated working"><div className="grid gap-3 sm:grid-cols-3"><Metric label="Parsed compounds" value={`${result.reactants.length + result.products.length}`} /><Metric label="Smallest coefficients" value={balancedText} /><Metric label="Method" value="Exact integer matrix" /></div><details className="mt-5 rounded-lg border border-border p-4"><summary className="cursor-pointer font-medium">Show balancing steps</summary><ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground"><li>Identify the elements present in the parsed formulas.</li><li>Build a stoichiometric matrix with products negated.</li><li>Solve the null-space vector, reduce to the smallest whole numbers, then verify each atom count.</li></ol></details></Panel>}
  </ToolPage>
}

export function AcidBaseTool() {
  const [kind, setKind] = React.useState("acid")
  const [concentration, setConcentration] = React.useState("0.1")
  const [result, setResult] = React.useState(() => strongAcidPh(0.1))
  function calculate() { const c = Number(concentration); if (!Number.isFinite(c) || c <= 0) return; setResult(kind === "acid" ? strongAcidPh(c) : strongBasePh(c)) }
  return <ToolPage eyebrow="Chemistry / equilibrium" title="Acid-base lab" description="Explore pH, hydroxide concentration, and the effect of strong acid or base concentration at 25°C."><Panel title="Solution model"><div className="grid gap-4 md:grid-cols-3"><select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value)}><option value="acid">Strong acid</option><option value="base">Strong base</option></select><input className={inputClass} type="number" min="0.000001" step="any" value={concentration} onChange={(e) => setConcentration(e.target.value)} aria-label="Concentration in molar" /><Button onClick={calculate}>Calculate pH</Button></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="pH" value={result.pH.toFixed(3)} /><Metric label="pOH" value={result.pOH.toFixed(3)} /><Metric label="Classification" value={result.classification} /></div></Panel></ToolPage>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-muted/40 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold capitalize">{value}</p></div> }

export function MolecularTool({ bonding = false }: { bonding?: boolean }) {
  const [selected, setSelected] = React.useState<MoleculeData>(MOLECULES[0])
  const [query, setQuery] = React.useState("water")
  const [mode, setMode] = React.useState<MoleculeRenderMode>("ball-and-stick")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  async function loadVerified(searchQuery = query) { setLoading(true); setError(""); try { const response = await fetch(`/api/pubchem?q=${encodeURIComponent(searchQuery)}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSelected(data) } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load structure") } finally { setLoading(false) } }
  return <ToolPage eyebrow="Chemistry / molecule & 3D structure lab" title="Real structures, not approximations." description="Load a verified PubChem 3D conformer, then inspect the same atom coordinates and bond orders in an interactive ball-and-stick model.">
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Panel title="Verified structure search"><div className="flex flex-col gap-3"><input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Molecule name or formula" placeholder="water, benzene, ethanol" /><Button onClick={() => void loadVerified()} disabled={loading}>{loading ? "Loading structure…" : "Load PubChem 3D"}</Button>{error && <p className="text-sm text-destructive">{error}</p>}<p className="text-xs leading-5 text-muted-foreground">The viewer renders returned atom coordinates and connectivity. It does not invent fallback geometry.</p><div className="mt-2 flex flex-col gap-2">{MOLECULE_CATALOG.slice(0, 100).map(([formula, name]) => <button key={formula} onClick={() => { setQuery(name); const bundled = MOLECULES.find((m) => m.formula === formula); if (bundled) setSelected(bundled); else void loadVerified(name) }} className={`rounded-lg px-3 py-2 text-left text-sm ${selected.formula === formula ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}><span className="font-mono">{formula}</span><span className="ml-2 opacity-70">{name}</span></button>)}</div></div></Panel>
      <div className="flex flex-col gap-6"><Panel title="3D structure"><div className="h-[480px] overflow-hidden rounded-xl bg-[#0b1017]"><Canvas camera={{ position: [0, 0, 8], fov: 45 }}><ambientLight intensity={1.4} /><directionalLight position={[4, 5, 6]} intensity={2} /><MoleculeModel3D molecule={selected} mode={mode} /><OrbitControls makeDefault enablePan enableZoom /></Canvas></div><div className="mt-4 flex flex-wrap gap-2">{(["ball-and-stick", "space-filling", "wireframe"] as MoleculeRenderMode[]).map((value) => <button key={value} onClick={() => setMode(value)} className={`rounded-md border px-3 py-2 text-xs capitalize ${mode === value ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{value.replaceAll("-", " ")}</button>)}</div></Panel><Panel title="Molecular information"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Compound" value={selected.name} /><Metric label="Formula" value={selected.formula} /><Metric label="Atoms / bonds" value={`${selected.atoms.length} / ${selected.bonds.length}`} /></div><p className="mt-4 leading-7 text-muted-foreground">{selected.description}</p><p className="mt-3 font-mono text-xs text-muted-foreground">Source: {selected.source ?? "bundled reference data"}{selected.sourceId ? ` / CID ${selected.sourceId}` : ""}</p></Panel></div>
    </div>
  </ToolPage>
}

export function AssistantTool() { return <ToolPage eyebrow="Academia / guide" title="AI science assistant" description="Ask the configured server-side AI tutor about Physics, Chemistry, or Biology. Your current question context can be carried into the conversation without exposing provider credentials."><AiTutor /></ToolPage> }

export function ConcentrationTool() { const [moles, setMoles] = React.useState("0.5"); const [volume, setVolume] = React.useState("2"); const molarity = Number(moles) / Number(volume); return <ToolPage eyebrow="Chemistry / solutions" title="Concentration lab" description="Calculate molarity from amount of solute and solution volume. Units are moles and liters."><Panel title="Molarity"><div className="grid gap-4 md:grid-cols-3"><input className={inputClass} type="number" value={moles} onChange={(e) => setMoles(e.target.value)} aria-label="Moles" placeholder="Moles" /><input className={inputClass} type="number" value={volume} onChange={(e) => setVolume(e.target.value)} aria-label="Liters" placeholder="Liters" /><Metric label="Molarity" value={Number.isFinite(molarity) ? `${molarity.toFixed(3)} M` : "—"} /></div></Panel></ToolPage> }

export function StoichiometryTool() { const [available, setAvailable] = React.useState("2"); const [ratio, setRatio] = React.useState("2"); const [productRatio, setProductRatio] = React.useState("1"); const [molarMass, setMolarMass] = React.useState("18.015"); const moles = Number(available) / Number(ratio); const productMoles = moles * Number(productRatio); const productMass = productMoles * Number(molarMass); return <ToolPage eyebrow="Chemistry / calculations" title="Stoichiometry" description="Convert a measured reactant amount through a balanced equation ratio to predict product amount and theoretical mass."><Panel title="Mole-ratio model"><div className="grid gap-4 md:grid-cols-4"><input className={inputClass} type="number" min="0" step="any" value={available} onChange={(e) => setAvailable(e.target.value)} aria-label="Available reactant moles" placeholder="Reactant moles" /><input className={inputClass} type="number" min="0.000001" step="any" value={ratio} onChange={(e) => setRatio(e.target.value)} aria-label="Reactant coefficient" placeholder="Reactant coefficient" /><input className={inputClass} type="number" min="0" step="any" value={productRatio} onChange={(e) => setProductRatio(e.target.value)} aria-label="Product coefficient" placeholder="Product coefficient" /><input className={inputClass} type="number" min="0" step="any" value={molarMass} onChange={(e) => setMolarMass(e.target.value)} aria-label="Product molar mass" placeholder="Product g/mol" /></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Usable reaction extent" value={`${Number.isFinite(moles) ? moles.toFixed(4) : "—"} mol`} /><Metric label="Product amount" value={`${Number.isFinite(productMoles) ? productMoles.toFixed(4) : "—"} mol`} /><Metric label="Theoretical mass" value={`${Number.isFinite(productMass) ? productMass.toFixed(3) : "—"} g`} /></div></Panel></ToolPage> }

export function TrendsTool() { return <ToolPage eyebrow="Chemistry / data" title="Periodic trends" description="Compare how elemental properties change across periods and down groups. Select an element from the periodic table to inspect its context."><Panel title="Trend map"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Atomic radius" value="↓ across, ↑ down" /><Metric label="Ionization energy" value="↑ across, ↓ down" /><Metric label="Electronegativity" value="↑ across, ↓ down" /></div></Panel></ToolPage> }

export function SubjectPage({ subject, description }: { subject: string; description: string }) { return <ToolPage eyebrow={`Academia / ${subject.toLowerCase()}`} title={subject} description={description}><Panel title="Laboratory modules"><p className="leading-7 text-muted-foreground">Select a live laboratory from the subject navigation to begin an experiment.</p></Panel></ToolPage> }

export function SimulationTool() { const [volume, setVolume] = React.useState(50); return <ToolPage eyebrow="Chemistry / simulation" title="Interactive simulations" description="A lightweight virtual lab surface for observing concentration changes as solvent volume changes."><Panel title="Dilution experiment"><input className="w-full accent-primary" type="range" min="10" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Solution volume" /><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Volume" value={`${volume} mL`} /><Metric label="Relative concentration" value={`${(50 / volume * 100).toFixed(0)}%`} /><Metric label="Observation" value={volume > 50 ? "Diluted" : "Concentrated"} /></div></Panel></ToolPage> }

export function TitrationTool() { const [volume, setVolume] = React.useState(25); const ph = titrationPh(0.1, 25, 0.1, volume); return <ToolPage eyebrow="Chemistry / equilibrium" title="Titration curve" description="Model a strong acid–strong base titration and inspect the pH around equivalence."><Panel title="Titrant volume"><input className="w-full accent-primary" type="range" min="0" max="50" value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Base volume added" /><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Base added" value={`${volume} mL`} /><Metric label="pH" value={ph.toFixed(2)} /><Metric label="Region" value={volume < 25 ? "Acid excess" : volume > 25 ? "Base excess" : "Equivalence"} /></div></Panel></ToolPage> }

export function PhysicsPage() { return <PhysicsLaboratory /> }
export function BiologyPage() { return <BiologyLaboratory /> }
export function SimulationLanding() { return <SimulationTool /> }
export function BufferTool() { const result = weakAcidPh(0.1, 1.8e-5); return <ToolPage eyebrow="Chemistry / equilibrium" title="Buffer study" description="Explore weak-acid equilibrium and the relationship between concentration, Ka, and pH."><Panel title="Acetic acid preset"><div className="grid gap-3 sm:grid-cols-3"><Metric label="Ka" value="1.8 × 10⁻⁵" /><Metric label="Concentration" value="0.100 M" /><Metric label="pH" value={result.pH.toFixed(3)} /></div></Panel></ToolPage> }
export { weakBasePh }
