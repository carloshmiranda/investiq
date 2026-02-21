// api/portfolio.js — GET /api/portfolio — merge all connected sources per user
import { createProtectedHandler } from '../lib/apiHandler.js'
import { prisma } from '../lib/prisma.js'
import { decrypt } from '../lib/encryption.js'
import { getCache, setCache, invalidateCache } from '../lib/cache.js'
import { createHmac } from 'crypto'

// ─── DeGiro helpers ─────────────────────────────────────────────────────────
const DEGIRO_BASE = process.env.DEGIRO_BASE_URL || 'https://trader.degiro.nl'

async function degiroFetchJSON(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
  if (!res.ok) throw new Error(`DeGiro ${res.status}`)
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

async function fetchDegiroHoldings(sessionId, intAccount) {
  const config = await degiroFetchJSON(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })
  const tradingUrl = config.tradingUrl || `${DEGIRO_BASE}/trading/secure/`
  const data = await degiroFetchJSON(
    `${tradingUrl}v5/update/${intAccount};jsessionid=${sessionId}?portfolio=0&cashFunds=0`
  )

  const portfolio = data.portfolio?.value || []
  const productPositions = portfolio.filter(
    (p) => p.value?.find((v) => v.name === 'positionType')?.value === 'PRODUCT'
  )

  const productIds = productPositions
    .map((p) => p.value?.find((v) => v.name === 'id')?.value)
    .filter(Boolean)

  let productInfo = {}
  if (productIds.length > 0) {
    const productSearchUrl = config.productSearchUrl || `${DEGIRO_BASE}/product_search/secure/`
    const pData = await degiroFetchJSON(
      `${productSearchUrl}v5/products/info?intAccount=${intAccount}&sessionId=${sessionId}`,
      { method: 'POST', body: JSON.stringify(productIds.map(String)) }
    )
    productInfo = pData.data || pData
  }

  return productPositions.map((pos) => {
    const vals = {}
    for (const v of (pos.value || [])) vals[v.name] = v.value
    const product = productInfo[String(vals.id)] || {}
    const qty = vals.size || 0
    const price = vals.price || 0
    const value = qty * price
    return {
      id: `degiro-${vals.id}`,
      source: 'degiro',
      broker: 'DeGiro',
      ticker: product.symbol || product.isin || `ID-${vals.id}`,
      name: product.name || product.symbol || `Product ${vals.id}`,
      type: product.productType === 'STOCK' ? 'Stock' : product.productType === 'ETF' ? 'ETF' : (product.productType || 'Stock'),
      sector: product.category || 'Equities',
      quantity: qty,
      price,
      value,
      currency: product.currency || 'EUR',
      costBasis: vals.breakEvenPrice ? qty * vals.breakEvenPrice : 0,
      unrealizedPnL: vals.todayPlBase || 0,
      unrealizedPnLPct: vals.breakEvenPrice && vals.breakEvenPrice > 0 ? ((price - vals.breakEvenPrice) / vals.breakEvenPrice) * 100 : 0,
      logoColor: '#ff6600',
    }
  })
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

async function fetchT212Holdings(apiKey, apiSecret) {
  const positions = await t212Fetch('/equity/positions', apiKey, apiSecret)
  if (!Array.isArray(positions)) return []
  return positions.map((p) => ({
    id: `t212-${p.ticker}`,
    source: 'trading212',
    broker: 'Trading 212',
    ticker: p.ticker,
    name: p.ticker,
    type: p.type === 'CRYPTO' ? 'Crypto' : 'Stock',
    sector: p.type === 'CRYPTO' ? 'Cryptocurrency' : 'Equities',
    quantity: p.quantity || 0,
    price: p.currentPrice || 0,
    value: (p.quantity || 0) * (p.currentPrice || 0),
    currency: 'USD',
    costBasis: (p.quantity || 0) * (p.averagePrice || 0),
    unrealizedPnL: p.ppl || 0,
    unrealizedPnLPct: p.averagePrice ? ((p.currentPrice - p.averagePrice) / p.averagePrice) * 100 : 0,
    logoColor: '#1545d0',
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

async function fetchBinanceHoldings(apiKey, apiSecret) {
  const [account, pricesArr] = await Promise.all([
    binanceFetch('/api/v3/account', apiKey, apiSecret, { signed: true }),
    binanceFetch('/api/v3/ticker/price', apiKey, apiSecret),
  ])

  const priceMap = {}
  for (const p of (Array.isArray(pricesArr) ? pricesArr : [])) {
    priceMap[p.symbol] = parseFloat(p.price) || 0
  }

  const stablecoins = ['USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'DAI']
  function getPrice(asset) {
    if (stablecoins.includes(asset)) return 1
    for (const quote of ['USDT', 'USDC', 'BUSD', 'FDUSD']) {
      if (priceMap[asset + quote]) return priceMap[asset + quote]
    }
    return 0
  }

  const balances = (account.balances || [])
    .filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)

  let flexRows = [], lockedRows = []
  try {
    const d = await binanceFetch('/sapi/v1/simple-earn/flexible/position', apiKey, apiSecret, { signed: true, params: { size: 100 } })
    flexRows = d.rows || []
  } catch {}
  try {
    const d = await binanceFetch('/sapi/v1/simple-earn/locked/position', apiKey, apiSecret, { signed: true, params: { size: 100 } })
    lockedRows = d.rows || []
  } catch {}

  const holdings = []

  for (const b of balances) {
    const total = parseFloat(b.free) + parseFloat(b.locked)
    const price = getPrice(b.asset)
    holdings.push({
      id: `binance-${b.asset}`, source: 'binance', broker: 'Binance',
      ticker: b.asset, name: b.asset, type: 'Crypto', sector: 'Cryptocurrency',
      quantity: total, price, value: total * price, currency: 'USD', logoColor: '#f0b90b',
    })
  }

  for (const f of flexRows) {
    const price = getPrice(f.asset)
    const qty = parseFloat(f.totalAmount || 0)
    holdings.push({
      id: `binance-earn-flex-${f.asset}`, source: 'binance', broker: 'Binance Earn',
      ticker: f.asset, name: `${f.asset} (Flexible)`, type: 'Crypto', sector: 'Staking',
      quantity: qty, price, value: qty * price, currency: 'USD', earnType: 'flexible', logoColor: '#f0b90b',
    })
  }

  for (const l of lockedRows) {
    const price = getPrice(l.asset)
    const qty = parseFloat(l.amount || 0)
    holdings.push({
      id: `binance-earn-locked-${l.asset}-${l.positionId}`, source: 'binance', broker: 'Binance Earn',
      ticker: l.asset, name: `${l.asset} (Locked)`, type: 'Crypto', sector: 'Staking',
      quantity: qty, price, value: qty * price, currency: 'USD', earnType: 'locked', logoColor: '#f0b90b',
    })
  }

  return holdings
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

async function fetchCryptocomHoldings(apiKey, apiSecret) {
  const [balanceResult, tickerRes] = await Promise.all([
    cryptocomFetch('private/user-balance', apiKey, apiSecret),
    fetch('https://api.crypto.com/exchange/v1/public/get-tickers').then((r) => r.json()),
  ])

  const priceMap = {}
  for (const t of (tickerRes.result?.data || [])) {
    if (t.i && t.i.endsWith('_USD')) {
      priceMap[t.i.replace('_USD', '')] = parseFloat(t.a || 0)
    }
  }
  const stablecoins = ['USD', 'USDT', 'USDC', 'TUSD', 'DAI', 'BUSD']
  function getPrice(c) { return stablecoins.includes(c) ? 1 : (priceMap[c] || 0) }

  const holdings = []
  for (const b of (balanceResult.data || [])) {
    const available = parseFloat(b.available || 0)
    const staked = parseFloat(b.staked || 0)
    if (available <= 0 && staked <= 0) continue

    if (available > 0) {
      const price = getPrice(b.currency)
      holdings.push({
        id: `cryptocom-${b.currency}`, source: 'cryptocom', broker: 'Crypto.com',
        ticker: b.currency, name: b.currency, type: 'Crypto', sector: 'Cryptocurrency',
        quantity: available, price, value: available * price, currency: 'USD', logoColor: '#002d74',
      })
    }

    if (staked > 0) {
      const price = getPrice(b.currency)
      holdings.push({
        id: `cryptocom-stake-${b.currency}`, source: 'cryptocom', broker: 'Crypto.com Earn',
        ticker: b.currency, name: `${b.currency} (Staked)`, type: 'Crypto', sector: 'Staking',
        quantity: staked, price, value: staked * price, currency: 'USD', earnType: 'staking', logoColor: '#002d74',
      })
    }
  }

  return holdings
}

// ─── Fetch fresh portfolio data from all providers ─────────────────────────
async function fetchFreshPortfolio(userId) {
  const connections = await prisma.connection.findMany({
    where: { userId, status: 'connected' },
    select: { provider: true, encryptedData: true },
  })

  const results = { holdings: [], errors: [], sources: [] }

  const fetchers = connections.map(async (conn) => {
    try {
      const creds = JSON.parse(decrypt(conn.encryptedData))
      let holdings = []

      switch (conn.provider) {
        case 'degiro':
          holdings = await fetchDegiroHoldings(creds.sessionId, creds.intAccount)
          break
        case 'trading212':
          holdings = await fetchT212Holdings(creds.apiKey, creds.apiSecret)
          break
        case 'binance':
          holdings = await fetchBinanceHoldings(creds.apiKey, creds.apiSecret)
          break
        case 'cryptocom':
          holdings = await fetchCryptocomHoldings(creds.apiKey, creds.apiSecret)
          break
        default:
          return
      }

      results.holdings.push(...holdings)
      results.sources.push(conn.provider)
    } catch (err) {
      // Detect DeGiro session expiry and mark connection
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

  const totalValue = results.holdings.reduce((sum, h) => sum + (h.value || 0), 0)

  return {
    holdings: results.holdings,
    totalValue,
    sources: results.sources,
    errors: results.errors,
    count: results.holdings.length,
    fetchedAt: new Date().toISOString(),
    useMockData: results.holdings.length === 0 && results.sources.length === 0,
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────
export default createProtectedHandler({
  GET: async (req, res) => {
    const refresh = req.query.refresh === 'true'

    if (!refresh) {
      const cached = await getCache(req.userId, 'portfolio')
      if (cached) {
        return res.json({ ...cached, cached: true })
      }
    }

    const data = await fetchFreshPortfolio(req.userId)

    if (data.errors.length === 0) {
      await setCache(req.userId, 'portfolio', data)
    }

    return res.json({ ...data, cached: false })
  },
  POST: async (req, res) => {
    await invalidateCache(req.userId, 'portfolio')
    return res.json({ invalidated: true })
  },
})
