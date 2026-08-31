"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Global error:", error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "oklch(0.16 0.01 240)",
          color: "oklch(0.94 0.005 240)",
          fontFamily: "ui-monospace, SFMono-Regular, monospace",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            border: "1px solid oklch(0.4 0.14 25 / 0.35)",
            borderRadius: 16,
            padding: "32px 28px",
            background: "oklch(0.19 0.012 240)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "oklch(0.7 0.18 25)",
              margin: 0,
            }}
          >
            Critical fault
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: "10px 0 0", lineHeight: 1.3 }}>
            The application failed to load.
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "oklch(0.72 0.01 240)", margin: "10px 0 0" }}>
            An unrecoverable error occurred outside of any single page. Restarting the app usually resolves this.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid oklch(0.5 0.02 240)",
              background: "oklch(0.94 0.005 240)",
              color: "oklch(0.16 0.01 240)",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Restart application
          </button>
        </div>
      </body>
    </html>
  )
}
