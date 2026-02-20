// Exchange rate cache — fetches from open.exchangerate-api.com (free, no key)
// Caches in module-level variable with 1hr TTL

const SUPPORTED = ['USD', 'EUR', 'GBP']
const TTL_MS = 60 * 60 * 1000 // 1 hour

let cache = null // { rates: { EUR: x, GBP: x }, updatedAt: Date, expiresAt: number }

async function fetchRates() {
  const now = Date.now()
  if (cache && now < cache.expiresAt) return cache

  const res = await fetch('https://open.exchangerate-api.com/v6/latest/USD')
  if (!res.ok) {
    // If fetch fails and we have stale cache, use it
    if (cache) return cache
    throw new Error(`Exchange rate API returned ${res.status}`)
  }

  const data = await res.json()
  const rates = {
    USD: 1,
    EUR: data.rates.EUR,
    GBP: data.rates.GBP,
  }

  cache = {
    rates,
    updatedAt: new Date().toISOString(),
    expiresAt: now + TTL_MS,
  }

  return cache
}

export async function getRate(toCurrency) {
  const { rates } = await fetchRates()
  return rates[toCurrency] ?? 1
}

export async function getAllRates() {
  const { rates, updatedAt } = await fetchRates()
  return { ...rates, updatedAt }
}

export { SUPPORTED }
