// api/income.js
// GET /api/income — merge dividend + staking events per user
import { createProtectedHandler } from '../lib/apiHandler.js'
import { prisma } from '../lib/prisma.js'
import { decrypt } from '../lib/encryption.js'
import { getCache, setCache, invalidateCache } from '../lib/cache.js'
import { createHmac } from 'crypto'

// Exclusion keywords — mirrors src/utils/incomeContract.js (source of truth)
// If a transaction description matches any of these, it is NOT income
const INCOME_EXCLUSION_KEYWORDS = [
  'deposit', 'withdraw', 'redeem', 'unstake', 'unsubscribe',
  'subscribe', 'purchase', 'sell', 'swap', 'convert',
  'transfer_in', 'transfer_out',
]

// ─── DeGiro helpers ─────────────────────────────────────────────────────────
const DEGIRO_BASE = process.env.DEGIRO_BASE_URL || 'https://trader.degiro.nl'

async function degiroFetchJSON(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
  if (!res.ok) throw new Error(`DeGiro ${res.status}`)
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

async function fetchDegiroIncome(sessionId, intAccount) {
  const config = await degiroFetchJSON(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })
  const reportingUrl = config.reportingUrl || `${DEGIRO_BASE}/reporting/secure/`
  const now = new Date()
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(now.getFullYear() - 1)
  const pad = (n) => String(n).padStart(2, '0')
  const fromDate = `${pad(oneYearAgo.getDate())}/${pad(oneYearAgo.getMonth() + 1)}/${oneYearAgo.getFullYear()}`
  const toDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`
  const data = await degiroFetchJSON(
    `${reportingUrl}v4/accountoverview?fromDate=${fromDate}&toDate=${toDate}&intAccount=${intAccount}&sessionId=${sessionId}`
  )
  const cashMovements = data.cashMovements || []
  const dividends = cashMovements.filter((m) => m.type === 'DIVIDEND' || m.type === 'DIVIDEND_TAX')

  return dividends.map((d) => ({
    id: `degiro-div-${d.id || d.date}-${d.productId}`,
    date: d.date ? new Date(d.date).toISOString() : new Date().toISOString(),
    ticker: d.product || '',
    name: d.product || '',
    amount: Math.abs(parseFloat(d.change || 0)),
    currency: d.currency || 'EUR',
    type: d.type === 'DIVIDEND_TAX' ? 'Dividend Tax' : 'Dividend',
    source: 'degiro',
    broker: 'DeGiro',
  }))
}

// ─── Trading 212 helpers ────────────────────────────────────────────────────
const T212_LIVE = process.env.T212_BASE_URL || 'https://live.trading212.com/api/v0'

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
const BINANCE_BASE = process.env.BINANCE_BASE_URL || 'https://api.binance.com'

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

// Earn-related keywords in Binance's enInfo — mirrors src/services/binance/mapper.js
// Actual earn rewards are fetched via the dedicated rewardsRecord endpoint,
// so any assetDividend entry matching these is a principal movement (not yield).
const BINANCE_EARN_KEYWORDS = [
  'earn', 'savings', 'flexible', 'locked', 'staking',
  'lending', 'launchpool', 'simple earn',
]

async function fetchBinanceIncome(apiKey, apiSecret) {
  const events = []

  // Asset dividends (airdrops, referral bonuses — NOT earn principal movements)
  try {
    const data = await binanceFetch('/sapi/v1/asset/assetDividend', apiKey, apiSecret, {
      signed: true, params: { limit: 500 },
    })
    for (const d of (data.rows || [])) {
      const enInfo = (d.enInfo || '').toLowerCase()
      if (INCOME_EXCLUSION_KEYWORDS.some((k) => enInfo.includes(k))) continue
      if (BINANCE_EARN_KEYWORDS.some((k) => enInfo.includes(k))) continue
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

  // Paginate flexible + locked earn rewards across all reward types
  const REWARD_TYPES = ['BONUS', 'REALTIME', 'REWARDS']
  for (const path of [
    '/sapi/v1/simple-earn/flexible/history/rewardsRecord',
    '/sapi/v1/simple-earn/locked/history/rewardsRecord',
  ]) {
    for (const type of REWARD_TYPES) {
      try {
        let page = 1
        let fetched = 0
        while (true) {
          const data = await binanceFetch(path, apiKey, apiSecret, {
            signed: true, params: { size: 100, type, current: page },
          })
          const rows = data.rows || []
          for (const r of rows) {
            events.push({
              id: `binance-earn-reward-${r.asset}-${r.time}-${type}`,
              date: r.time ? new Date(r.time).toISOString() : new Date().toISOString(),
              ticker: r.asset || '',
              name: r.asset || '',
              amount: parseFloat(r.rewards || 0),
              currency: 'USD',
              type: 'Yield',
              source: 'binance',
              broker: 'Binance Earn',
            })
          }
          fetched += rows.length
          if (rows.length < 100 || fetched >= (data.total || 0)) break
          page++
        }
      } catch {}
    }
  }

  return events
}

// ─── Crypto.com helpers ─────────────────────────────────────────────────────
const CRYPTOCOM_BASE = process.env.CRYPTOCOM_BASE_URL || 'https://api.crypto.com/exchange/v1'

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

const CRYPTOCOM_REWARD_KEYWORDS = [
  'staking', 'stake', 'earn', 'reward', 'interest',
  'rebate', 'referral_bonus', 'supercharger', 'airdrop', 'distribution',
]

function isCryptocomReward(trade) {
  const desc = ((trade.description || '') + ' ' + (trade.journal_type || '') + ' ' + (trade.transaction_type || '')).toLowerCase()
  if (INCOME_EXCLUSION_KEYWORDS.some((k) => desc.includes(k))) return false
  return CRYPTOCOM_REWARD_KEYWORDS.some((k) => desc.includes(k))
}

function classifyCryptocomType() {
  return 'Yield'
}

async function fetchCryptocomIncome(apiKey, apiSecret) {
  let trades = []
  try {
    const result = await cryptocomFetch('private/get-trades', apiKey, apiSecret, { page_size: 200 })
    trades = result.data || []
  } catch {}

  return trades
    .filter(isCryptocomReward)
    .map((t) => ({
      id: `cryptocom-reward-${t.trade_id || t.order_id}-${t.create_time}`,
      date: t.create_time ? new Date(t.create_time).toISOString() : new Date().toISOString(),
      ticker: t.instrument_name || '',
      name: t.instrument_name || '',
      amount: Math.abs(parseFloat(t.traded_quantity || t.fees || 0)),
      currency: t.fee_currency || 'USD',
      type: classifyCryptocomType(t),
      source: 'cryptocom',
      broker: 'Crypto.com',
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
      const creds = JSON.parse(decrypt(conn.encryptedData))
      let events = []

      switch (conn.provider) {
        case 'degiro':
          events = await fetchDegiroIncome(creds.sessionId, creds.intAccount)
          break
        case 'trading212':
          events = await fetchT212Income(creds.apiKey, creds.apiSecret)
          break
        case 'binance':
          events = await fetchBinanceIncome(creds.apiKey, creds.apiSecret)
          break
        case 'cryptocom':
          events = await fetchCryptocomIncome(creds.apiKey, creds.apiSecret)
          break
        default:
          return
      }

      results.events.push(...events)
      results.sources.push(conn.provider)
    } catch (err) {
      if (conn.provider === 'degiro' && (err.message?.includes('401') || err.message?.includes('403'))) {
        try {
          await prisma.connection.update({
            where: { userId_provider: { userId, provider: 'degiro' } },
            data: { status: 'expired', lastError: 'Session expired — please re-login' },
          })
        } catch {}
      }
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
    useMockData: results.events.length === 0 && results.sources.length === 0,
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
