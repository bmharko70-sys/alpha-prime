'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Atom, FlaskConical, Waves } from 'lucide-react'

const disciplines = [
  { label: 'CHEMISTRY', icon: FlaskConical },
  { label: 'PHYSICS', icon: Waves },
  { label: 'BIOLOGY', icon: Atom },
]

export function IntroExperience() {
  const [visible, setVisible] = useState(false)
  const [stage, setStage] = useState(0)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const seen = window.localStorage.getItem('academia-o1-intro-seen')
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReduced(prefersReduced)
    if (!seen) setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    if (reduced) {
      setStage(4)
      return
    }
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, 4)), 520)
    return () => window.clearInterval(timer)
  }, [visible, reduced])

  useEffect(() => {
    if (!visible) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [visible])

  if (!visible) return null

  const dismiss = () => {
    window.localStorage.setItem('academia-o1-intro-seen', 'true')
    setVisible(false)
  }

  const progress = Math.round((stage / 4) * 100)

  return (
    <div className="intro-experience fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#071018] text-slate-100" role="dialog" aria-label="Academia O1 initialization">
      <button type="button" onClick={dismiss} aria-label="Close introduction" className="absolute right-5 top-5 z-10 border border-slate-700 px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-slate-400 transition-colors hover:border-cyan-200/50 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">CLOSE</button>
      <div className="intro-grid absolute inset-0 opacity-60" />
      <div className="intro-orbit absolute left-1/2 top-1/2 size-[min(70vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15" />
      <div className="intro-orbit intro-orbit-delayed absolute left-1/2 top-1/2 size-[min(48vw,23rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/10" />
      <div className="relative flex w-full max-w-3xl flex-col items-center gap-10 px-6 text-center">
        <div className="flex items-center gap-3 text-xs font-medium tracking-[0.28em] text-cyan-200/70">
          <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_16px_4px_rgba(103,232,249,0.55)]" />
          ACADEMIA O1 / LABORATORY OS
        </div>
        <div className="relative flex size-32 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-200/[0.04] shadow-[0_0_70px_rgba(34,211,238,0.16)]">
          <div className="absolute inset-3 rounded-full border border-dashed border-amber-100/25 animate-spin [animation-duration:12s]" />
          <Atom className="size-12 text-cyan-200" strokeWidth={1.2} />
        </div>
        <div className="space-y-4">
          <div className="mx-auto mb-4 flex max-w-xs items-center gap-3" aria-label={`Initialization ${progress}%`}><div className="h-1 flex-1 overflow-hidden bg-slate-800"><div className="h-full bg-cyan-200 transition-[width] duration-500" style={{ width: `${progress}%` }} /></div><span className="font-mono text-[10px] text-cyan-200/70">{progress}%</span></div>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-slate-400">Initializing scientific workspace</p>
          <h1 className="font-mono text-3xl font-medium tracking-tight text-balance sm:text-5xl">Observe. Model. Understand.</h1>
          <p className="mx-auto max-w-lg text-sm leading-6 text-slate-400">A quiet instrument for exploring the structures and systems that make our world work.</p>
        </div>
        <div className="grid w-full max-w-xl grid-cols-3 gap-2 sm:gap-5">
          {disciplines.map(({ label, icon: Icon }, index) => (
            <div key={label} className={`intro-discipline flex flex-col items-center gap-3 border-t px-2 pt-4 transition-all duration-700 ${stage > index ? 'border-cyan-200/50 text-cyan-100' : 'border-slate-700/70 text-slate-600'}`}>
              <Icon className="size-4" strokeWidth={1.5} />
              <span className="font-mono text-[10px] tracking-[0.18em]">{label}</span>
              <span className="font-mono text-[9px] text-slate-500">{stage > index ? 'READY' : 'STANDBY'}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={dismiss} className="group inline-flex items-center gap-3 border border-cyan-100/20 px-5 py-3 font-mono text-xs tracking-[0.16em] text-cyan-100 transition-colors hover:border-cyan-100/60 hover:bg-cyan-100/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70">
          ENTER LABORATORY <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
        <button type="button" onClick={dismiss} className="font-mono text-[10px] tracking-[0.16em] text-slate-500 hover:text-slate-300">SKIP INTRO</button>
      </div>
    </div>
  )
}
