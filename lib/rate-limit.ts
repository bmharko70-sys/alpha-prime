import "server-only"

// Lightweight in-memory sliding-window rate limiter for a single server instance.
// This protects the Groq/AI and research routes from accidental hammering (retry loops,
// runaway scripts) without needing an external store. It is best-effort, not distributed —
// for multi-instance production traffic, swap this for Upstash Redis (@upstash/ratelimit).

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Periodically sweep expired buckets so the map doesn't grow unbounded.
let lastSweep = Date.now()
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Checks and increments a request count for `key` within a fixed time window.
 * @param key Unique identifier, e.g. `${routeName}:${ip}`
 * @param limit Max requests allowed per window
 * @param windowMs Window length in milliseconds
 */
export function rateLimit(key: string, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { ok: true, limit, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return { ok: true, limit, remaining: limit - existing.count, resetAt: existing.resetAt }
}

/** Best-effort client identifier from standard proxy headers, falling back to a shared bucket. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const real = request.headers.get("x-real-ip")
  if (real) return real.trim()
  return "unknown"
}

export function rateLimitResponse(result: RateLimitResult) {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  return Response.json(
    { error: "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  )
}
