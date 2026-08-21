'use client'

import Link from 'next/link'
import { ArrowDownRight, ArrowRight, Atom, Bot, Dna, FlaskConical, Grid3x3, Radio, Scale, Sparkles, TestTubes, Waves } from 'lucide-react'
import { ScientificAtmosphere } from '@/components/scientific-atmosphere'

const disciplines = [
  { title: 'Chemistry', code: 'CHEM-01', href: '/chemistry', icon: FlaskConical, status: 'ACTIVE', description: 'Matter, reaction, structure', accent: 'text-cyan-200' },
  { title: 'Physics', code: 'PHYS-02', href: '/physics', icon: Waves, status: 'BUILDING', description: 'Motion, energy, field', accent: 'text-amber-100' },
  { title: 'Biology', code: 'BIO-03', href: '/biology', icon: Dna, status: 'BUILDING', description: 'Life, cell, system', accent: 'text-emerald-200' },
]

const tools = [
  { title: 'Periodic Table', meta: '118 ELEMENTS / LIVE DATA', href: '/chemistry/periodic-table', icon: Grid3x3 },
  { title: 'Molecular Viewer', meta: '3D STRUCTURES / INTERACTIVE', href: '/chemistry/molecular-viewer', icon: Atom },
  { title: 'Equation Balancer', meta: 'LINEAR ALGEBRA / EXACT', href: '/chemistry/equation-balancer', icon: Scale },
  { title: 'Acid–Base Lab', meta: 'PH / TITRATION CURVES', href: '/chemistry/acid-base', icon: TestTubes },
]

export default function HomePage() {
  return (
    <main className="relative min-h-full overflow-hidden bg-[#0b141c] text-slate-100">
      <ScientificAtmosphere />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-20 px-6 py-14 sm:px-10 lg:gap-28 lg:px-16 lg:py-20">
        <section className="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.26em] text-cyan-200/70"><span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_3px_rgba(103,232,249,0.55)]" /> SYSTEM ONLINE / OBSERVATION MODE</div>
            <h1 className="max-w-4xl font-mono text-4xl font-medium leading-[1.08] tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">The universe is a system.<br /><span className="text-cyan-200">Start exploring.</span></h1>
            <p className="max-w-xl text-base leading-7 text-slate-400">Academia O1 is an interactive scientific laboratory for seeing the hidden structure inside matter, motion, and life.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/chemistry" className="group inline-flex items-center gap-3 bg-cyan-200 px-5 py-3 font-mono text-xs tracking-[0.14em] text-[#071018] transition-transform hover:-translate-y-0.5">OPEN CHEMISTRY LAB <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></Link>
              <Link href="/assistant" className="inline-flex items-center gap-2 border border-slate-700 px-5 py-3 font-mono text-xs tracking-[0.14em] text-slate-300 hover:border-cyan-200/50 hover:text-cyan-100"><Bot className="size-4" /> ASK THE ASSISTANT</Link>
            </div>
          </div>
          <div className="hidden border-l border-slate-700/70 pl-8 font-mono text-xs text-slate-500 lg:block">
            <div className="mb-8 flex items-center justify-between border-b border-slate-800 pb-3 text-[10px] tracking-[0.2em]"><span>LABORATORY STATUS</span><Radio className="size-3 text-cyan-200" /></div>
            <div className="space-y-5"><p className="flex justify-between"><span>DATA LAYER</span><span className="text-cyan-200">CONNECTED</span></p><p className="flex justify-between"><span>MODEL ENGINE</span><span className="text-cyan-200">READY</span></p><p className="flex justify-between"><span>LAST CALIBRATION</span><span>JUST NOW</span></p></div>
            <div className="mt-12 flex items-center gap-2 text-cyan-200/70"><Sparkles className="size-3" /> REAL DATA. WORKING MODELS. NO SHORTCUTS.</div>
          </div>
        </section>

        <section className="space-y-7">
          <div className="flex items-end justify-between border-b border-slate-800 pb-4"><div><p className="font-mono text-[10px] tracking-[0.22em] text-slate-500">01 / DISCIPLINES</p><h2 className="mt-2 font-mono text-xl tracking-tight">Choose a system to observe</h2></div><ArrowDownRight className="size-5 text-slate-600" /></div>
          <div className="grid gap-px overflow-hidden border border-slate-800 bg-slate-800 md:grid-cols-3">
            {disciplines.map(({ title, code, href, icon: Icon, status, description, accent }) => <Link key={href} href={href} className="group bg-[#0b141c] p-6 transition-colors hover:bg-[#101f2a] sm:p-8"><div className="flex items-start justify-between"><Icon className={`size-6 ${accent}`} strokeWidth={1.3} /><span className="font-mono text-[9px] tracking-[0.18em] text-slate-600">{code}</span></div><div className="mt-14 flex items-end justify-between"><div><h3 className="font-mono text-lg">{title}</h3><p className="mt-2 text-sm text-slate-500">{description}</p><p className={`mt-5 font-mono text-[10px] tracking-[0.16em] ${status === 'ACTIVE' ? 'text-cyan-200' : 'text-slate-600'}`}>{status}</p></div><ArrowRight className="size-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-200" /></div></Link>)}
          </div>
        </section>

        <section className="space-y-7">
          <div className="flex items-end justify-between border-b border-slate-800 pb-4"><div><p className="font-mono text-[10px] tracking-[0.22em] text-slate-500">02 / INSTRUMENTS</p><h2 className="mt-2 font-mono text-xl tracking-tight">Featured laboratory tools</h2></div><Link href="/chemistry" className="hidden font-mono text-[10px] tracking-[0.16em] text-cyan-200 hover:text-cyan-100 sm:block">VIEW ALL TOOLS →</Link></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{tools.map(({ title, meta, href, icon: Icon }) => <Link key={href} href={href} className="group border border-slate-800 bg-[#0d1922]/80 p-5 hover:border-cyan-200/40"><Icon className="size-5 text-cyan-200/70" strokeWidth={1.3} /><h3 className="mt-10 font-mono text-sm">{title}</h3><p className="mt-2 font-mono text-[9px] tracking-[0.1em] text-slate-600">{meta}</p></Link>)}</div>
        </section>

        <section className="flex flex-col gap-6 border border-cyan-200/20 bg-cyan-200/[0.035] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div className="flex items-start gap-4"><div className="flex size-10 shrink-0 items-center justify-center border border-cyan-200/30 text-cyan-200"><Bot className="size-5" /></div><div><p className="font-mono text-sm">Need a research partner?</p><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Ask the assistant to look up elements, balance equations, compute pH, and explain the result with verified tool calls.</p></div></div><Link href="/assistant" className="inline-flex shrink-0 items-center gap-2 font-mono text-xs tracking-[0.14em] text-cyan-200 hover:text-white">START A SESSION <ArrowRight className="size-4" /></Link></section>
      </div>
    </main>
  )
}
