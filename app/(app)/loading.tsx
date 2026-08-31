export default function AppLoading() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-16" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Calibrating module…</p>
        <span className="sr-only">Loading</span>
      </div>
    </main>
  )
}
