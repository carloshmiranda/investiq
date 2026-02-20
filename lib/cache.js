// lib/cache.js
// Portfolio cache layer — TTL 1hr, stored in portfolio_cache table
import { prisma } from './prisma.js'

const DEFAULT_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Get cached data for a user + cache key.
 * Returns null if cache miss or expired.
 */
export async function getCache(userId, cacheKey) {
  const entry = await prisma.portfolioCache.findUnique({
    where: { userId_cacheKey: { userId, cacheKey } },
  })
  if (!entry) return null
  if (new Date() > new Date(entry.expiresAt)) return null
  return entry.data
}

/**
 * Set cached data for a user + cache key with TTL.
 */
export async function setCache(userId, cacheKey, data, ttlMs = DEFAULT_TTL_MS) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMs)

  await prisma.portfolioCache.upsert({
    where: { userId_cacheKey: { userId, cacheKey } },
    create: { userId, cacheKey, data, cachedAt: now, expiresAt },
    update: { data, cachedAt: now, expiresAt },
  })
}

/**
 * Invalidate cache for a user (all keys or specific key).
 */
export async function invalidateCache(userId, cacheKey = null) {
  if (cacheKey) {
    await prisma.portfolioCache.deleteMany({
      where: { userId, cacheKey },
    })
  } else {
    await prisma.portfolioCache.deleteMany({
      where: { userId },
    })
  }
}
