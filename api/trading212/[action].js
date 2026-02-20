import { createProtectedHandler } from '../../lib/apiHandler.js'
import { prisma } from '../../lib/prisma.js'
import { encrypt, decrypt } from '../../lib/encryption.js'

const T212_LIVE = 'https://live.trading212.com/api/v0'

// ─── Helper: build auth header from API key + secret ───────────────────────
function authHeader(apiKey, apiSecret) {
  const encoded = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  return `Basic ${encoded}`
}

// ─── Helper: fetch from T212 API with rate-limit awareness ─────────────────
async function t212Fetch(path, apiKey, apiSecret, options = {}) {
  const url = `${T212_LIVE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': authHeader(apiKey, apiSecret),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 429) {
    const retryAfter = res.headers.get('x-ratelimit-reset')
    throw Object.assign(new Error('Rate limited by Trading 212'), { status: 429, retryAfter })
  }

  if (!res.ok) {
    let body
    try { body = await res.json() } catch { body = {} }
    throw Object.assign(
      new Error(body.message || body.error || `Trading 212 returned ${res.status}`),
      { status: res.status }
    )
  }

  const text = await res.text()
  if (!text) return {}
  return JSON.parse(text)
}

// ─── Helper: paginate through T212 cursor-based endpoints ──────────────────
async function t212Paginate(basePath, apiKey, apiSecret, limit = 50) {
  const items = []
  let cursor = null
  let hasMore = true

  while (hasMore) {
    const params = new URLSearchParams({ limit: String(limit) })
    if (cursor) params.set('cursor', cursor)
    const path = `${basePath}?${params}`

    const data = await t212Fetch(path, apiKey, apiSecret)
    if (data.items && Array.isArray(data.items)) {
      items.push(...data.items)
    }

    if (data.nextPagePath) {
      // nextPagePath is the full path with cursor
      const url = new URL(data.nextPagePath, T212_LIVE)
      cursor = url.searchParams.get('cursor')
    } else {
      hasMore = false
    }
  }

  return items
}

// ─── Helper: get decrypted T212 credentials from DB ────────────────────────
async function getCredentials(userId) {
  const conn = await prisma.connection.findUnique({
    where: { userId_provider: { userId, provider: 'trading212' } },
  })
  if (!conn || conn.status !== 'connected') return null
  const { apiKey, apiSecret } = JSON.parse(decrypt(conn.encryptedData))
  return { apiKey, apiSecret }
}

// ─── Connect: validate API key and store encrypted ─────────────────────────
async function handleConnect(req, res) {
  const { apiKey, apiSecret } = req.body || {}
  if (!apiKey || !apiSecret) {
    return res.status(400).json({ error: 'apiKey and apiSecret are required' })
  }

  // Validate by fetching account summary
  let account
  try {
    account = await t212Fetch('/equity/account/summary', apiKey, apiSecret)
  } catch (err) {
    return res.status(err.status === 401 ? 401 : 400).json({
      error: 'Invalid Trading 212 credentials',
      debug: err.message,
    })
  }

  // Store encrypted credentials in DB
  const encryptedData = encrypt(JSON.stringify({ apiKey, apiSecret }))
  await prisma.connection.upsert({
    where: { userId_provider: { userId: req.userId, provider: 'trading212' } },
    create: {
      userId: req.userId,
      provider: 'trading212',
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

  return res.json({
    connected: true,
    account: {
      totalValue: account.total,
      cash: account.free,
      invested: account.invested,
      result: account.ppl,
    },
  })
}

// ─── Disconnect: remove stored credentials ─────────────────────────────────
async function handleDisconnect(req, res) {
  await prisma.connection.deleteMany({
    where: { userId: req.userId, provider: 'trading212' },
  })
  return res.json({ disconnected: true })
}

// ─── Status: check connection ──────────────────────────────────────────────
async function handleStatus(req, res) {
  const conn = await prisma.connection.findUnique({
    where: { userId_provider: { userId: req.userId, provider: 'trading212' } },
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

// ─── Positions: fetch portfolio positions ──────────────────────────────────
async function handlePositions(req, res) {
  const creds = await getCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Trading 212 not connected' })

  const positions = await t212Fetch('/equity/positions', creds.apiKey, creds.apiSecret)
  return res.json({ positions: Array.isArray(positions) ? positions : [] })
}

// ─── Dividends: fetch dividend history (paginated) ─────────────────────────
async function handleDividends(req, res) {
  const creds = await getCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Trading 212 not connected' })

  const dividends = await t212Paginate('/equity/history/dividends', creds.apiKey, creds.apiSecret)
  return res.json({ data: dividends })
}

// ─── Account: fetch account summary ────────────────────────────────────────
async function handleAccount(req, res) {
  const creds = await getCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Trading 212 not connected' })

  const account = await t212Fetch('/equity/account/summary', creds.apiKey, creds.apiSecret)
  return res.json(account)
}

// ─── Route dispatcher ──────────────────────────────────────────────────────
export default createProtectedHandler({
  GET: async (req, res) => {
    const { action } = req.query
    switch (action) {
      case 'status':    return handleStatus(req, res)
      case 'positions': return handlePositions(req, res)
      case 'dividends': return handleDividends(req, res)
      case 'account':   return handleAccount(req, res)
      default:
        return res.status(404).json({ error: `Unknown action: ${action}` })
    }
  },
  POST: async (req, res) => {
    const { action } = req.query
    switch (action) {
      case 'connect':    return handleConnect(req, res)
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
