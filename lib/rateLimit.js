// lib/rateLimit.js
// In-memory sliding-window rate limiter for serverless functions
// Each Vercel instance maintains its own window — this provides per-instance protection.
// For production-grade distributed rate limiting, use Vercel KV or Upstash Redis.

const windows = new Map()

const CLEANUP_INTERVAL = 60_000 // clean stale entries every 60s
let lastCleanup = Date.now()

function cleanup(windowMs) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, timestamps] of windows) {
    const valid = timestamps.filter((t) => now - t < windowMs)
    if (valid.length === 0) windows.delete(key)
    else windows.set(key, valid)
  }
}

/**
 * Check rate limit for a given key.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 */
export function checkRateLimit(key, { maxAttempts = 5, windowMs = 60_000 } = {}) {
  const now = Date.now()
  cleanup(windowMs)

  const timestamps = (windows.get(key) || []).filter((t) => now - t < windowMs)

  if (timestamps.length >= maxAttempts) {
    const oldestInWindow = timestamps[0]
    const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000)
    windows.set(key, timestamps)
    return { allowed: false, retryAfter }
  }

  timestamps.push(now)
  windows.set(key, timestamps)
  return { allowed: true }
}

/**
 * Get client IP from request (Vercel provides x-forwarded-for).
 */
export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}
