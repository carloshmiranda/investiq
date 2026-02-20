// api/income/index.js
// GET /api/income — merge dividend + staking events per user
import { createProtectedHandler } from '../../lib/apiHandler.js'
import { prisma } from '../../lib/prisma.js'
import { decrypt } from '../../lib/encryption.js'
import { getCache, setCache, invalidateCache } from '../../lib/cache.js'
import { createHmac } from 'crypto'

// ─── Trading 212 helpers ────────────────────────────────────────────────────
const T212_LIVE = 'https://live.trading212.com/api/v0'

async function t212Fetch(path, apiKey, apiSecret) {
  const encoded = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  const res = await fetch(`${T212_LIVE}${path}`, {
    headers: { 'Authorization': `Basic ${encoded}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`T212 ${res.status}`)
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

async function t212Paginate(basePath, apiKey, apiSecret, limit = 50) {
  const items = []
  let cursor = null
  let hasMore = true
  while (hasMore) {
    const params = new URLSearchParams({ limit: String(limit) })
    if (cursor) params.set('cursor', cursor)
    const data = await t212Fetch(`${basePath}?${params}`, apiKey, apiSecret)
    if (data.items && Array.isArray(data.items)) items.push(...data.items)
    if (data.nextPagePath) {
      const url = new URL(data.nextPagePath, T212_LIVE)
      cursor = url.searchParams.get('cursor')
    } else {
      hasMore = false
    }
  }
  return items
}

async function fetchT212Income(apiKey, apiSecret) {
  const dividends = await t212Paginate('/equity/history/dividends', apiKey, apiSecret)
  return dividends.map((d) => ({
    id: `t212-div-${d.reference || d.ticker}-${d.paidOn}`,
    date: d.paidOn || d.date || new Date().toISOString(),
    ticker: d.ticker || '',
    name: d.ticker || '',
    amount: parseFloat(d.amount || 0),
    currency: 'USD',
    type: 'Dividend',
    source: 'trading212',
    broker: 'Trading 212',
  }))
}

// ─── Binance helpers ────────────────────────────────────────────────────────
const BINANCE_BASE = 'https://api.binance.com'

function binanceSign(qs, secret) {
  return createHmac('sha256', secret).update(qs).digest('hex')
}

async function binanceFetch(path, apiKey, apiSecret, { signed = false, params = {} } = {}) {
  const url = new URL(`${BINANCE_BASE}${path}`)
  if (signed) { params.timestamp = Date.now(); params.recvWindow = 10000 }
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) { if (v != null) qs.set(k, String(v)) }
  if (signed) qs.set('signature', binanceSign(qs.toString(), apiSecret))
  if (qs.toString()) url.search = qs.toString()
  const res = await fetch(url.toString(), { headers: { 'X-MBX-APIKEY': apiKey } })
  if (!res.ok) throw new Error(`Binance ${res.status}`)
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

async function fetchBinanceIncome(apiKey, apiSecret) {
  const events = []

  // Asset dividends (airdrops, staking rewards)
  try {
    const data = await binanceFetch('/sapi/v1/asset/assetDividend', apiKey, apiSecret, {
      signed: true, params: { limit: 500 },
    })
    for (const d of (data.rows || [])) {
      events.push({
        id: `binance-div-${d.id || d.tranId}`,
        date: d.divTime ? new Date(d.divTime).toISOString() : new Date().toISOString(),
        ticker: d.asset || '',
        name: d.asset || '',
        amount: parseFloat(d.amount || 0),
        currency: 'USD',
        type: d.enInfo || 'Distribution',
        source: 'binance',
        broker: 'Binance',
      })
    }
  } catch {}

  // Simple Earn flexible rewards
  try {
    const data = await binanceFetch('/sapi/v1/simple-earn/flexible/history/rewardsRecord', apiKey, apiSecret, {
      signed: true, params: { size: 100, type: 'REWARDS' },
    })
    for (const r of (data.rows || [])) {
      events.push({
        id: `binance-earn-reward-${r.asset}-${r.time}`,
        date: r.time ? new Date(r.time).toISOString() : new Date().toISOString(),
        ticker: r.asset || '',
        name: r.asset || '',
        amount: parseFloat(r.rewards || 0),
        currency: 'USD',
        type: 'Staking Reward',
        source: 'binance',
        broker: 'Binance Earn',
      })
    }
  } catch {}

  return events
}

// ─── Crypto.com helpers ─────────────────────────────────────────────────────
const CRYPTOCOM_BASE = 'https://api.crypto.com/exchange/v1'

function cryptocomSign(method, id, apiKey, apiSecret, params, nonce) {
  const paramStr = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('')
  return createHmac('sha256', apiSecret).update(`${method}${id}${apiKey}${paramStr}${nonce}`).digest('hex')
}

async function cryptocomFetch(method, apiKey, apiSecret, params = {}) {
  const id = Date.now(); const nonce = Date.now()
  const sig = cryptocomSign(method, id, apiKey, apiSecret, params, nonce)
  const res = await fetch(`${CRYPTOCOM_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, method, api_key: apiKey, params, sig, nonce }),
  })
  if (!res.ok) throw new Error(`Crypto.com ${res.status}`)
  const data = await res.json()
  if (data.code !== 0) throw new Error(`Crypto.com error ${data.code}`)
  return data.result || {}
}

async function fetchCryptocomIncome(apiKey, apiSecret) {
  let trades = []
  try {
    const result = await cryptocomFetch('private/get-trades', apiKey, apiSecret, { page_size: 200 })
    trades = result.data || []
  } catch {}

  return trades.map((t) => ({
    id: `cryptocom-trade-${t.trade_id || t.order_id}-${t.create_time}`,
    date: t.create_time ? new Date(t.create_time).toISOString() : new Date().toISOString(),
    ticker: t.instrument_name || '',
    name: t.instrument_name || '',
    amount: parseFloat(t.fees || 0),
    currency: t.fee_currency || 'USD',
    type: 'Trade',
    source: 'cryptocom',
    broker: 'Crypto.com',
    side: t.side,
    quantity: parseFloat(t.traded_quantity || 0),
    price: parseFloat(t.traded_price || 0),
  }))
}

// ─── Fetch fresh income data from all providers ────────────────────────────
async function fetchFreshIncome(userId) {
  const connections = await prisma.connection.findMany({
    where: { userId, status: 'connected' },
    select: { provider: true, encryptedData: true },
  })

  const results = { events: [], errors: [], sources: [] }

  const fetchers = connections.map(async (conn) => {
    try {
      const { apiKey, apiSecret } = JSON.parse(decrypt(conn.encryptedData))
      let events = []

      switch (conn.provider) {
        case 'trading212':
          events = await fetchT212Income(apiKey, apiSecret)
          break
        case 'binance':
          events = await fetchBinanceIncome(apiKey, apiSecret)
          break
        case 'cryptocom':
          events = await fetchCryptocomIncome(apiKey, apiSecret)
          break
        default:
          return
      }

      results.events.push(...events)
      results.sources.push(conn.provider)
    } catch (err) {
      results.errors.push({ provider: conn.provider, error: err.message })
    }
  })

  await Promise.all(fetchers)

  results.events.sort((a, b) => new Date(b.date) - new Date(a.date))
  const totalIncome = results.events.reduce((sum, e) => sum + (e.amount || 0), 0)

  return {
    events: results.events,
    totalIncome,
    sources: results.sources,
    errors: results.errors,
    count: results.events.length,
    fetchedAt: new Date().toISOString(),
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────
export default createProtectedHandler({
  GET: async (req, res) => {
    const refresh = req.query.refresh === 'true'

    if (!refresh) {
      const cached = await getCache(req.userId, 'income')
      if (cached) {
        return res.json({ ...cached, cached: true })
      }
    }

    const data = await fetchFreshIncome(req.userId)

    if (data.errors.length === 0) {
      await setCache(req.userId, 'income', data)
    }

    return res.json({ ...data, cached: false })
  },
  POST: async (req, res) => {
    await invalidateCache(req.userId, 'income')
    return res.json({ invalidated: true })
  },
})
