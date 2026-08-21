"use client"

import * as React from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { Button } from "@/components/ui/button"
import { RotateCcw, Pause, Play } from "lucide-react"
import { cn } from "@/lib/utils"

interface SceneShellProps {
  children: React.ReactNode
  className?: string
  /** Called when the user clicks "Reset view" — should reset camera/controls state. */
  onReset?: () => void
  paused?: boolean
  onTogglePaused?: () => void
  showPauseControl?: boolean
  cameraPosition?: [number, number, number]
  background?: string
  controlsRef?: React.RefObject<any>
  minDistance?: number
  maxDistance?: number
  ariaLabel: string
}

/**
 * Shared full-bleed 3D canvas shell used by every atomic/molecular/simulation
 * viewer in the app. Provides orbit controls, a reset-view button, an
 * optional pause/play control for animated scenes, and respects
 * prefers-reduced-motion by disabling auto-rotation.
 */
export function SceneShell({
  children,
  className,
  onReset,
  paused,
  onTogglePaused,
  showPauseControl = false,
  cameraPosition = [4, 3, 6],
  background = "transparent",
  controlsRef,
  minDistance = 2,
  maxDistance = 30,
  ariaLabel,
}: SceneShellProps) {
  const internalControlsRef = React.useRef<any>(null)
  const ref = controlsRef ?? internalControlsRef
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mq.matches)
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", listener)
    return () => mq.removeEventListener("change", listener)
  }, [])

  function handleReset() {
    ref.current?.reset?.()
    onReset?.()
  }

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("relative h-full w-full overflow-hidden rounded-lg bg-muted/30", className)}
    >
      <Canvas
        camera={{ position: cameraPosition, fov: 45 }}
        style={{ background }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <directionalLight position={[-5, -3, -5]} intensity={0.3} />
        {children}
        <OrbitControls
          ref={ref}
          enableDamping
          dampingFactor={0.15}
          minDistance={minDistance}
          maxDistance={maxDistance}
          autoRotate={false}
        />
      </Canvas>
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {showPauseControl && (
          <Button size="icon-sm" variant="secondary" onClick={onTogglePaused} aria-label={paused ? "Play animation" : "Pause animation"}>
            {paused ? <Play /> : <Pause />}
          </Button>
        )}
        <Button size="icon-sm" variant="secondary" onClick={handleReset} aria-label="Reset camera view">
          <RotateCcw />
        </Button>
      </div>
      {prefersReducedMotion && (
        <p className="absolute left-3 top-3 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground">
          Reduced motion: drag to rotate manually
        </p>
      )}
    </div>
  )
}
