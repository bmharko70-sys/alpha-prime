'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Atom, FlaskConical, Waves } from 'lucide-react'
import { BootLog } from '@/components/motion/boot-log'
import { usePointerParallax } from '@/components/motion/use-pointer-parallax'

const disciplines = [
  { label: 'CHEMISTRY', icon: FlaskConical },
  { label: 'PHYSICS', icon: Waves },
  { label: 'BIOLOGY', icon: Atom },
]

const bootLines = [
  'Calibrating periodic dataset',
  'Loading molecular render engine',
  'Syncing simulation kernels',
  'Establishing assistant link',
]

const PARTICLE_COUNT = 22

export function IntroExperience() {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [stage, setStage] = useState(0)
  const [reduced, setReduced] = useState(false)
  const { ref: sceneRef, offset } = usePointerParallax<HTMLDivElement>()

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        delay: `${(i % 9) * 0.45}s`,
        duration: `${3.6 + (i % 5) * 0.6}s`,
      })),
    [],
  )

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReduced(prefersReduced)
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    if (reduced) {
      setStage(4)
      return
    }
    const timer = window.setInterval(() => setStage((current) => Math.min(current + 1, 4)), 480)
    return () => window.clearInterval(timer)
  }, [visible, reduced])

  useEffect(() => {
    if (!visible) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [visible])

  if (!visible) return null

  const dismiss = () => {
    if (reduced) {
      setVisible(false)
      return
    }
    setClosing(true)
    window.setTimeout(() => setVisible(false), 460)
  }

  const progress = Math.round((stage / 4) * 100)
  const systemsOnline = stage >= 4

  return (
    <div
      ref={sceneRef}
      className={`intro-experience fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#071018] text-slate-100 ${closing ? 'intro-exit' : ''}`}
      role="dialog"
      aria-label="Academia O1 initialization"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close introduction"
        className="absolute right-5 top-5 z-10 border border-slate-700 px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-slate-400 transition-colors hover:border-cyan-200/50 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
      >
        CLOSE
      </button>

      <div className="intro-grid absolute inset-0 opacity-60" />
      {!reduced && <div className="intro-scanline absolute inset-x-0 top-0" aria-hidden />}
      {!reduced && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {particles.map((p, i) => (
            <span
              key={i}
              className="intro-particle"
              style={{ left: p.left, top: p.top, animationDelay: p.delay, animationDuration: p.duration }}
            />
          ))}
        </div>
      )}
      <div
        className="intro-orbit absolute left-1/2 top-1/2 size-[min(70vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/15 transition-transform duration-300 ease-out"
        style={{ transform: `translate(calc(-50% + ${offset.x * 14}px), calc(-50% + ${offset.y * 14}px))` }}
      />
      <div
        className="intro-orbit intro-orbit-delayed absolute left-1/2 top-1/2 size-[min(48vw,23rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-200/10 transition-transform duration-300 ease-out"
        style={{ transform: `translate(calc(-50% + ${offset.x * -22}px), calc(-50% + ${offset.y * -22}px))` }}
      />

      <div className="relative flex w-full max-w-3xl flex-col items-center gap-10 px-6 text-center">
        <div className="flex items-center gap-3 text-xs font-medium tracking-[0.28em] text-cyan-200/70">
          <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_16px_4px_rgba(103,232,249,0.55)] status-breathe" />
          ACADEMIA O1 / LABORATORY OS
        </div>

        <div
          className="relative flex size-32 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-200/[0.04] shadow-[0_0_70px_rgba(34,211,238,0.16)] transition-transform duration-300 ease-out"
          style={{ transform: `translate(${offset.x * 8}px, ${offset.y * 8}px)` }}
        >
          {!reduced && !systemsOnline && <div className="intro-radar" aria-hidden />}
          <div className="absolute inset-3 rounded-full border border-dashed border-amber-100/25 animate-spin [animation-duration:12s]" />
          <div className="absolute inset-0 rounded-full border border-cyan-200/10 animate-spin [animation-duration:8s] [animation-direction:reverse]" />
          <Atom
            className={`size-12 transition-colors duration-500 ${systemsOnline ? 'text-amber-100' : 'text-cyan-200'}`}
            strokeWidth={1.2}
          />
        </div>

        <div className="space-y-4">
          <div className="mx-auto mb-4 flex max-w-xs items-center gap-3" aria-label={`Initialization ${progress}%`}>
            <div className="h-1 flex-1 overflow-hidden bg-slate-800">
              <div className="h-full bg-cyan-200 transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span key={progress} className="intro-counter font-mono text-[10px] text-cyan-200/70">
              {progress}%
            </span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-slate-400">
            {systemsOnline ? 'Systems online' : 'Initializing scientific workspace'}
          </p>
          <h1 className={`intro-title-glitch font-mono text-3xl font-medium tracking-tight text-balance sm:text-5xl ${systemsOnline ? '' : ''}`}>
            Observe. Model. Understand.
          </h1>
          <div
            className="intro-flash-line mx-auto h-px w-40 bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent"
            aria-hidden
          />
          <p className="mx-auto max-w-lg text-sm leading-6 text-slate-400">
            A quiet instrument for exploring the structures and systems that make our world work.
          </p>
        </div>

        <BootLog lines={bootLines} className="mx-auto w-full max-w-xs" />

        <div className="grid w-full max-w-xl grid-cols-3 gap-2 sm:gap-5">
          {disciplines.map(({ label, icon: Icon }, index) => {
            const active = stage > index
            const justActivated = stage === index + 1
            return (
              <div
                key={label}
                className={`intro-discipline flex flex-col items-center gap-3 border-t px-2 pt-4 transition-all duration-700 ${
                  active ? 'border-cyan-200/50 text-cyan-100' : 'border-slate-700/70 text-slate-600'
                } ${justActivated && !reduced ? 'intro-module-flash' : ''}`}
              >
                <Icon className="size-4" strokeWidth={1.5} />
                <span className="font-mono text-[10px] tracking-[0.18em]">{label}</span>
                <span className="font-mono text-[9px] text-slate-500">{active ? 'READY' : 'STANDBY'}</span>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="group press-feedback inline-flex items-center gap-3 border border-cyan-100/20 px-5 py-3 font-mono text-xs tracking-[0.16em] text-cyan-100 transition-colors hover:border-cyan-100/60 hover:bg-cyan-100/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
        >
          ENTER LABORATORY <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </button>
        <button type="button" onClick={dismiss} className="font-mono text-[10px] tracking-[0.16em] text-slate-500 hover:text-slate-300">
          SKIP INTRO
        </button>
      </div>
    </div>
  )
}
