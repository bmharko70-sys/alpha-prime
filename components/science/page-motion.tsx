"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

export type MotionSubject = "system" | "physics" | "chemistry" | "biology" | "ai"

function subjectForPath(pathname: string): MotionSubject {
  if (pathname.startsWith("/physics")) return "physics"
  if (pathname.startsWith("/biology")) return "biology"
  if (pathname.startsWith("/assistant")) return "ai"
  if (pathname.startsWith("/chemistry")) return "chemistry"
  return "system"
}

export function PageMotion({ subject }: { subject?: MotionSubject }) {
  const pathname = usePathname()
  const active = subject ?? subjectForPath(pathname)

  return (
    <div className={`page-motion page-motion-${active}`} aria-hidden="true">
      <div className="page-motion-grid" />
      <div className="page-motion-field page-motion-field-one" />
      <div className="page-motion-field page-motion-field-two" />
      <div className="page-motion-node node-one" />
      <div className="page-motion-node node-two" />
      <div className="page-motion-node node-three" />
      <div className="page-motion-node node-four" />
      <div className="page-motion-line line-one" />
      <div className="page-motion-line line-two" />
      <div className="page-motion-line line-three" />
    </div>
  )
}

export function RouteTransitionVeil() {
  const pathname = usePathname()
  const [visible, setVisible] = React.useState(false)
  const previous = React.useRef(pathname)

  React.useEffect(() => {
    if (previous.current === pathname) return
    previous.current = pathname
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 260)
    return () => window.clearTimeout(timer)
  }, [pathname])

  return <div className={`route-transition-veil ${visible ? "route-transition-veil-visible" : ""}`} aria-hidden="true" />
}
