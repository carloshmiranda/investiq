import { createProtectedHandler } from '../../lib/apiHandler.js'
import { prisma } from '../../lib/prisma.js'
import { encrypt, decrypt } from '../../lib/encryption.js'
import { createHmac } from 'crypto'

const CRYPTOCOM_BASE = 'https://api.crypto.com/exchange/v1'

// ─── Helper: build sorted param string for signing ──────────────────────────
function buildParamString(params) {
  if (!params || Object.keys(params).length === 0) return ''
  return Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join('')
}

// ─── Helper: HMAC-SHA256 signature ──────────────────────────────────────────
function signRequest(method, id, apiKey, apiSecret, params, nonce) {
  const paramString = buildParamString(params)
  const payload = `${method}${id}${apiKey}${paramString}${nonce}`
  return createHmac('sha256', apiSecret).update(payload).digest('hex')
}

// ─── Helper: POST to Crypto.com private API ─────────────────────────────────
async function cryptocomFetch(method, apiKey, apiSecret, params = {}) {
  const id = Date.now()
  const nonce = Date.now()
  const sig = signRequest(method, id, apiKey, apiSecret, params, nonce)

  const body = {
    id,
    method,
    api_key: apiKey,
    params,
    sig,
    nonce,
  }

  const res = await fetch(`${CRYPTOCOM_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (res.status === 429) {
    throw Object.assign(new Error('Rate limited by Crypto.com'), { status: 429 })
  }

  if (!res.ok) {
    let data
    try { data = await res.json() } catch { data = {} }
    throw Object.assign(
      new Error(data.message || `Crypto.com returned ${res.status}`),
      { status: res.status, code: data.code }
    )
  }

  const data = await res.json()

  // Crypto.com returns code 0 on success
  if (data.code !== 0) {
    throw Object.assign(
      new Error(data.message || `Crypto.com error code ${data.code}`),
      { status: 400, code: data.code }
    )
  }

  return data.result || {}
}

// ─── Helper: get decrypted Crypto.com credentials from DB ───────────────────
async function getCredentials(userId) {
  const conn = await prisma.connection.findUnique({
    where: { userId_provider: { userId, provider: 'cryptocom' } },
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

  // Validate by fetching account balance
  let balance
  try {
    balance = await cryptocomFetch('private/user-balance', apiKey, apiSecret)
  } catch (err) {
    const isAuth = err.code === 10002 || err.code === 10007 || err.status === 401
    return res.status(isAuth ? 401 : 400).json({
      error: 'Invalid Crypto.com credentials',
      debug: err.message,
    })
  }

  // Store encrypted credentials
  const encryptedData = encrypt(JSON.stringify({ apiKey, apiSecret }))
  await prisma.connection.upsert({
    where: { userId_provider: { userId: req.userId, provider: 'cryptocom' } },
    create: {
      userId: req.userId,
      provider: 'cryptocom',
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

  // Count non-zero balances
  const positions = (balance.data || []).filter(
    (b) => parseFloat(b.available || 0) > 0 || parseFloat(b.staked || 0) > 0
  )

  return res.json({
    connected: true,
    account: { assetCount: positions.length },
  })
}

// ─── Disconnect ─────────────────────────────────────────────────────────────
async function handleDisconnect(req, res) {
  await prisma.connection.deleteMany({
    where: { userId: req.userId, provider: 'cryptocom' },
  })
  return res.json({ disconnected: true })
}

// ─── Status ─────────────────────────────────────────────────────────────────
async function handleStatus(req, res) {
  const conn = await prisma.connection.findUnique({
    where: { userId_provider: { userId: req.userId, provider: 'cryptocom' } },
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

// ─── Balances: fetch spot + staking balances ────────────────────────────────
async function handleBalances(req, res) {
  const creds = await getCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Crypto.com not connected' })

  const result = await cryptocomFetch('private/user-balance', creds.apiKey, creds.apiSecret)
  const balances = (result.data || [])
    .filter((b) => parseFloat(b.available || 0) > 0 || parseFloat(b.staked || 0) > 0)
    .map((b) => ({
      currency: b.currency,
      available: parseFloat(b.available || 0),
      staked: parseFloat(b.staked || 0),
      total: parseFloat(b.available || 0) + parseFloat(b.staked || 0),
    }))

  return res.json({ balances })
}

// ─── Staking: fetch staking positions via user-balance (staked field) ────────
// Crypto.com includes staked amounts in user-balance — no separate endpoint needed.
// This is handled in handleBalances above.

// ─── Order/Trade history (for reward detection) ─────────────────────────────
async function handleHistory(req, res) {
  const creds = await getCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Crypto.com not connected' })

  let trades = []
  try {
    const result = await cryptocomFetch('private/get-trades', creds.apiKey, creds.apiSecret, {
      page_size: 200,
    })
    trades = result.data || []
  } catch { /* may not have trade history */ }

  return res.json({ trades })
}

// ─── Prices: fetch ticker prices (public endpoint, no auth needed) ──────────
async function handlePrices(req, res) {
  const tickerRes = await fetch('https://api.crypto.com/exchange/v1/public/get-tickers')
  if (!tickerRes.ok) {
    throw new Error(`Crypto.com ticker API returned ${tickerRes.status}`)
  }
  const tickerData = await tickerRes.json()
  if (tickerData.code !== 0) {
    throw new Error(`Crypto.com ticker error code ${tickerData.code}`)
  }

  // Build price map: { BTC: 65000, ETH: 3500, ... } in USD
  const prices = (tickerData.result?.data || [])
    .filter((t) => t.i && t.i.endsWith('_USD'))
    .map((t) => ({
      symbol: t.i.replace('_USD', ''),
      price: parseFloat(t.a || 0), // 'a' = best ask / last traded price
    }))

  return res.json({ prices })
}

// ─── Route dispatcher ───────────────────────────────────────────────────────
export default createProtectedHandler({
  GET: async (req, res) => {
    const { action } = req.query
    switch (action) {
      case 'status':   return handleStatus(req, res)
      case 'balances': return handleBalances(req, res)
      case 'history':  return handleHistory(req, res)
      case 'prices':   return handlePrices(req, res)
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
