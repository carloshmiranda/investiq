import { createProtectedHandler } from '../../lib/apiHandler.js'
import { prisma } from '../../lib/prisma.js'
import { encrypt, decrypt } from '../../lib/encryption.js'
import { createHmac } from 'crypto'

const BINANCE_BASE = 'https://api.binance.com'

// ─── Helper: HMAC-SHA256 signature ──────────────────────────────────────────
function sign(queryString, secret) {
  return createHmac('sha256', secret).update(queryString).digest('hex')
}

// ─── Helper: fetch from Binance API ─────────────────────────────────────────
async function binanceFetch(path, apiKey, apiSecret, { signed = false, params = {} } = {}) {
  const url = new URL(`${BINANCE_BASE}${path}`)

  if (signed) {
    params.timestamp = Date.now()
    params.recvWindow = 10000
  }

  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.set(k, String(v))
  }

  if (signed) {
    const signature = sign(qs.toString(), apiSecret)
    qs.set('signature', signature)
  }

  const qsStr = qs.toString()
  if (qsStr) url.search = qsStr

  const res = await fetch(url.toString(), {
    headers: { 'X-MBX-APIKEY': apiKey },
  })

  if (res.status === 429 || res.status === 418) {
    const retryAfter = res.headers.get('retry-after')
    throw Object.assign(new Error('Rate limited by Binance'), { status: 429, retryAfter })
  }

  if (!res.ok) {
    let body
    try { body = await res.json() } catch { body = {} }
    throw Object.assign(
      new Error(body.msg || `Binance returned ${res.status}`),
      { status: res.status, code: body.code }
    )
  }

  const text = await res.text()
  if (!text) return {}
  return JSON.parse(text)
}

// ─── Helper: get decrypted Binance credentials from DB ──────────────────────
async function getCredentials(userId) {
  const conn = await prisma.connection.findUnique({
    where: { userId_provider: { userId, provider: 'binance' } },
  })
  if (!conn || conn.status !== 'connected') return null
  const { apiKey, apiSecret } = JSON.parse(decrypt(conn.encryptedData))
  return { apiKey, apiSecret }
}

// ─── Connect: validate API key and store encrypted ──────────────────────────
async function handleConnect(req, res) {
  const { apiKey, apiSecret } = req.body || {}
  if (!apiKey || !apiSecret) {
    return res.status(400).json({ error: 'apiKey and apiSecret are required' })
  }

  // Validate by fetching account info
  let account
  try {
    account = await binanceFetch('/api/v3/account', apiKey, apiSecret, { signed: true })
  } catch (err) {
    return res.status(err.status === 401 || err.code === -2015 ? 401 : 400).json({
      error: 'Invalid Binance credentials',
      debug: err.message,
    })
  }

  // Store encrypted credentials
  const encryptedData = encrypt(JSON.stringify({ apiKey, apiSecret }))
  await prisma.connection.upsert({
    where: { userId_provider: { userId: req.userId, provider: 'binance' } },
    create: {
      userId: req.userId,
      provider: 'binance',
      status: 'connected',
      encryptedData,
      lastSyncAt: new Date(),
    },
    update: {
      status: 'connected',
      encryptedData,
      lastSyncAt: new Date(),
      lastError: null,
    },
  })

  // Summarize balances
  const nonZero = (account.balances || []).filter(
    (b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
  )

  return res.json({
    connected: true,
    account: {
      assetCount: nonZero.length,
      canTrade: account.canTrade,
      canWithdraw: account.canWithdraw,
      accountType: account.accountType,
    },
  })
}

// ─── Disconnect ─────────────────────────────────────────────────────────────
async function handleDisconnect(req, res) {
  await prisma.connection.deleteMany({
    where: { userId: req.userId, provider: 'binance' },
  })
  return res.json({ disconnected: true })
}

// ─── Status ─────────────────────────────────────────────────────────────────
async function handleStatus(req, res) {
  const conn = await prisma.connection.findUnique({
    where: { userId_provider: { userId: req.userId, provider: 'binance' } },
  })
  if (!conn || conn.status !== 'connected') {
    return res.json({ connected: false })
  }
  return res.json({
    connected: true,
    lastSyncAt: conn.lastSyncAt,
    lastError: conn.lastError,
  })
}

// ─── Balances: fetch spot balances ──────────────────────────────────────────
async function handleBalances(req, res) {
  const creds = await getCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Binance not connected' })

  const account = await binanceFetch('/api/v3/account', creds.apiKey, creds.apiSecret, { signed: true })
  const balances = (account.balances || [])
    .filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
    .map((b) => ({
      asset: b.asset,
      free: parseFloat(b.free),
      locked: parseFloat(b.locked),
      total: parseFloat(b.free) + parseFloat(b.locked),
    }))

  return res.json({ balances })
}

// ─── Simple Earn: fetch flexible + locked positions ─────────────────────────
async function handleEarn(req, res) {
  const creds = await getCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Binance not connected' })

  // Fetch flexible (Simple Earn) positions
  let flexible = []
  try {
    const data = await binanceFetch('/sapi/v1/simple-earn/flexible/position', creds.apiKey, creds.apiSecret, {
      signed: true, params: { size: 100 },
    })
    flexible = data.rows || []
  } catch { /* endpoint may not be available on all accounts */ }

  // Fetch locked (Simple Earn) positions
  let locked = []
  try {
    const data = await binanceFetch('/sapi/v1/simple-earn/locked/position', creds.apiKey, creds.apiSecret, {
      signed: true, params: { size: 100 },
    })
    locked = data.rows || []
  } catch { /* endpoint may not be available on all accounts */ }

  return res.json({ flexible, locked })
}

// ─── Dividends / distribution history ───────────────────────────────────────
async function handleDividends(req, res) {
  const creds = await getCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Binance not connected' })

  // Asset dividend record (airdrops, staking rewards, etc.)
  let dividends = []
  try {
    const data = await binanceFetch('/sapi/v1/asset/assetDividend', creds.apiKey, creds.apiSecret, {
      signed: true, params: { limit: 500 },
    })
    dividends = data.rows || []
  } catch { /* may not be available */ }

  // Simple Earn reward history (flexible)
  let earnRewards = []
  try {
    const data = await binanceFetch('/sapi/v1/simple-earn/flexible/history/rewardsRecord', creds.apiKey, creds.apiSecret, {
      signed: true, params: { size: 100, type: 'REWARDS' },
    })
    earnRewards = data.rows || []
  } catch { /* may not be available */ }

  return res.json({ dividends, earnRewards })
}

// ─── Prices: fetch current prices for portfolio valuation ───────────────────
async function handlePrices(req, res) {
  const creds = await getCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Binance not connected' })

  // Get all ticker prices (no signature needed but key is)
  const prices = await binanceFetch('/api/v3/ticker/price', creds.apiKey, creds.apiSecret)
  return res.json({ prices: Array.isArray(prices) ? prices : [] })
}

// ─── Route dispatcher ───────────────────────────────────────────────────────
export default createProtectedHandler({
  GET: async (req, res) => {
    const { action } = req.query
    switch (action) {
      case 'status':    return handleStatus(req, res)
      case 'balances':  return handleBalances(req, res)
      case 'earn':      return handleEarn(req, res)
      case 'dividends': return handleDividends(req, res)
      case 'prices':    return handlePrices(req, res)
      default:
        return res.status(404).json({ error: `Unknown action: ${action}` })
    }
  },
  POST: async (req, res) => {
    const { action } = req.query
    switch (action) {
      case 'connect': return handleConnect(req, res)
      default:
        return res.status(404).json({ error: `Unknown action: ${action}` })
    }
  },
  DELETE: async (req, res) => {
    const { action } = req.query
    switch (action) {
      case 'disconnect': return handleDisconnect(req, res)
      default:
        return res.status(404).json({ error: `Unknown action: ${action}` })
    }
  },
})
