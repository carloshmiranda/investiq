// api/connections.js — consolidated handler for all broker routes
// Routes: /api/degiro/*, /api/trading212/*, /api/binance/*, /api/cryptocom/*
// Routing via vercel.json rewrites: provider=<broker>, action=<endpoint>
import { createProtectedHandler } from '../lib/apiHandler.js'
import { prisma } from '../lib/prisma.js'
import { encrypt, decrypt } from '../lib/encryption.js'
import { createHmac } from 'crypto'

// ═══════════════════════════════════════════════════════════════════════════════
// DEGIRO
// ═══════════════════════════════════════════════════════════════════════════════

const DEGIRO_BASE = process.env.DEGIRO_BASE_URL || 'https://trader.degiro.nl'

function extractSessionId(setCookie) {
  if (!setCookie) return null
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie]
  for (const c of cookies) {
    const match = c.match(/JSESSIONID=([^;]+)/)
    if (match) return match[1]
  }
  return null
}

async function degiroFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  if (options._returnRaw) return res
  if (!res.ok) {
    let body
    try { body = await res.json() } catch { body = {} }
    const err = new Error(body.message || body.statusText || `DeGiro returned ${res.status}`)
    err.status = res.status
    throw err
  }
  const text = await res.text()
  if (!text) return {}
  return JSON.parse(text)
}

async function degiroLogin(req, res, { withTOTP = false } = {}) {
  const { username, password, oneTimePassword } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' })
  }
  if (withTOTP && !oneTimePassword) {
    return res.status(400).json({ error: 'oneTimePassword is required' })
  }

  const loginUrl = withTOTP
    ? `${DEGIRO_BASE}/login/secure/login/totp`
    : `${DEGIRO_BASE}/login/secure/login`

  const loginBody = {
    username,
    password,
    isPassCodeReset: false,
    isRedirectToMobile: false,
    queryParams: {},
    ...(withTOTP ? { oneTimePassword } : {}),
  }

  // Browser-like headers to avoid Myra Security WAF bot detection
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://trader.degiro.nl',
      'Referer': 'https://trader.degiro.nl/login/s/default/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
    body: JSON.stringify(loginBody),
  })

  const loginText = await loginRes.text()
  const isHtml = loginText.trimStart().startsWith('<')
  console.error('[DeGiro Login] Status:', loginRes.status, isHtml ? '(HTML — likely WAF block)' : '(JSON)')
  if (!isHtml) console.error('[DeGiro Login] Response:', loginText.slice(0, 500))

  let loginData
  try { loginData = JSON.parse(loginText) } catch { loginData = {} }

  if (loginData.statusCode === 6) return res.json({ requiresTOTP: true })

  if (!loginRes.ok) {
    if (isHtml) {
      console.error('[DeGiro] WAF/captcha block detected (status', loginRes.status + ')')
      return res.status(503).json({
        error: 'DeGiro blocked the request (security captcha). Server-side login may not be supported.',
        code: 'WAF_BLOCKED',
        status: loginRes.status,
      })
    }
    const msg = loginData.message || loginData.statusText || 'DeGiro login failed'
    console.error('[DeGiro] Login failed:', msg)
    return res.status(loginRes.status === 401 ? 401 : 400).json({
      error: 'DeGiro login failed',
      debug: msg,
      status: loginRes.status,
    })
  }

  const sessionId = loginData.sessionId
    || extractSessionId(loginRes.headers.get('set-cookie'))
  if (!sessionId) {
    console.error('[DeGiro Login] No sessionId found in body or Set-Cookie header')
    return res.status(500).json({ error: 'Failed to extract session from DeGiro response' })
  }

  const config = await degiroFetch(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })
  const paUrl = config.paUrl || `${DEGIRO_BASE}/pa/secure/`
  const clientInfo = await degiroFetch(`${paUrl}client?sessionId=${sessionId}`)
  const data = clientInfo.data || clientInfo

  // Store session in DB for unified portfolio access
  const encryptedData = encrypt(JSON.stringify({
    sessionId,
    intAccount: data.intAccount,
    username,
    loginAt: new Date().toISOString(),
  }))
  await prisma.connection.upsert({
    where: { userId_provider: { userId: req.userId, provider: 'degiro' } },
    create: { userId: req.userId, provider: 'degiro', status: 'connected', encryptedData, lastSyncAt: new Date() },
    update: { status: 'connected', encryptedData, lastSyncAt: new Date(), lastError: null },
  })

  return res.json({
    sessionId, intAccount: data.intAccount, userId: data.id,
    username, firstName: data.firstContact?.firstName || data.displayName || username,
    requiresTOTP: false,
  })
}

async function degiroPortfolio(req, res) {
  const { sessionId, intAccount } = req.query
  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' })
  }
  const config = await degiroFetch(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })
  const tradingUrl = config.tradingUrl || `${DEGIRO_BASE}/trading/secure/`
  const data = await degiroFetch(
    `${tradingUrl}v5/update/${intAccount};jsessionid=${sessionId}?portfolio=0&cashFunds=0`
  )
  return res.json({ portfolio: data.portfolio?.value || [], cashFunds: data.cashFunds?.value || [] })
}

async function degiroProducts(req, res) {
  const { sessionId, intAccount } = req.query
  const { productIds } = req.body || {}
  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' })
  }
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'productIds array is required' })
  }
  const config = await degiroFetch(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })
  const productSearchUrl = config.productSearchUrl || `${DEGIRO_BASE}/product_search/secure/`
  const data = await degiroFetch(
    `${productSearchUrl}v5/products/info?intAccount=${intAccount}&sessionId=${sessionId}`,
    { method: 'POST', body: JSON.stringify(productIds.map(String)) }
  )
  return res.json(data.data || data)
}

async function degiroDividends(req, res) {
  const { sessionId, intAccount } = req.query
  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' })
  }
  const config = await degiroFetch(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })
  const reportingUrl = config.reportingUrl || `${DEGIRO_BASE}/reporting/secure/`
  const now = new Date()
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(now.getFullYear() - 1)
  const fromDate = `${String(oneYearAgo.getDate()).padStart(2, '0')}/${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}/${oneYearAgo.getFullYear()}`
  const toDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
  const data = await degiroFetch(
    `${reportingUrl}v4/accountoverview?fromDate=${fromDate}&toDate=${toDate}&intAccount=${intAccount}&sessionId=${sessionId}`
  )
  const cashMovements = data.cashMovements || []
  const dividends = cashMovements.filter((m) => m.type === 'DIVIDEND' || m.type === 'DIVIDEND_TAX')
  return res.json({ data: dividends })
}

async function degiroTransactions(req, res) {
  const { sessionId, intAccount, fromDate, toDate } = req.query
  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' })
  }
  const config = await degiroFetch(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })
  const reportingUrl = config.reportingUrl || `${DEGIRO_BASE}/reporting/secure/`
  const now = new Date()
  const defaultFrom = new Date(now)
  defaultFrom.setFullYear(now.getFullYear() - 1)
  const from = fromDate || `${String(defaultFrom.getDate()).padStart(2, '0')}/${String(defaultFrom.getMonth() + 1).padStart(2, '0')}/${defaultFrom.getFullYear()}`
  const to = toDate || `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`
  const data = await degiroFetch(
    `${reportingUrl}v4/transactions?fromDate=${from}&toDate=${to}&intAccount=${intAccount}&sessionId=${sessionId}`
  )
  return res.json({ data: data.data || [] })
}

async function degiroStoreSession(req, res) {
  const { sessionId, username } = req.body || {}
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' })
  }

  try {
    const config = await degiroFetch(`${DEGIRO_BASE}/login/secure/config`, {
      headers: { Cookie: `JSESSIONID=${sessionId};` },
    })
    const paUrl = config.paUrl || `${DEGIRO_BASE}/pa/secure/`
    const clientInfo = await degiroFetch(`${paUrl}client?sessionId=${sessionId}`)
    const data = clientInfo.data || clientInfo

    const encryptedData = encrypt(JSON.stringify({
      sessionId,
      intAccount: data.intAccount,
      username: username || 'unknown',
      loginAt: new Date().toISOString(),
    }))
    await prisma.connection.upsert({
      where: { userId_provider: { userId: req.userId, provider: 'degiro' } },
      create: { userId: req.userId, provider: 'degiro', status: 'connected', encryptedData, lastSyncAt: new Date() },
      update: { status: 'connected', encryptedData, lastSyncAt: new Date(), lastError: null },
    })

    return res.json({
      sessionId,
      intAccount: data.intAccount,
      userId: data.id,
      username: username || 'unknown',
      firstName: data.firstContact?.firstName || data.displayName || username || 'unknown',
      requiresTOTP: false,
    })
  } catch (err) {
    console.error('[DeGiro] store-session validation failed:', err.message)
    return res.status(400).json({
      error: 'Invalid or expired session. Make sure you are logged into DeGiro.',
      debug: err.message,
    })
  }
}

async function degiroDisconnect(req, res) {
  await prisma.connection.deleteMany({ where: { userId: req.userId, provider: 'degiro' } })
  return res.json({ disconnected: true })
}

async function degiroStatus(req, res) {
  const conn = await prisma.connection.findUnique({ where: { userId_provider: { userId: req.userId, provider: 'degiro' } } })
  if (!conn || conn.status !== 'connected') return res.json({ connected: false })
  return res.json({ connected: true, lastSyncAt: conn.lastSyncAt, lastError: conn.lastError })
}

async function degiroTest(req, res) {
  const start = Date.now()
  // Check if we have a stored session
  const conn = await prisma.connection.findUnique({ where: { userId_provider: { userId: req.userId, provider: 'degiro' } } })
  if (!conn || conn.status !== 'connected') {
    // Just test reachability without auth
    try {
      const testRes = await fetch(`${DEGIRO_BASE}/login/secure/config`, { method: 'GET' })
      return res.json({ provider: 'degiro', reachable: testRes.ok, status: testRes.status, latency: Date.now() - start, authenticated: false })
    } catch (err) {
      return res.json({ provider: 'degiro', reachable: false, error: err.message, latency: Date.now() - start })
    }
  }
  // Test with stored session
  try {
    const { sessionId } = JSON.parse(decrypt(conn.encryptedData))
    const testRes = await fetch(`${DEGIRO_BASE}/login/secure/config`, {
      headers: { Cookie: `JSESSIONID=${sessionId};` },
    })
    const latency = Date.now() - start
    if (testRes.ok) {
      return res.json({ provider: 'degiro', reachable: true, status: 200, latency, authenticated: true })
    }
    // Session expired — mark connection
    if (testRes.status === 401) {
      await prisma.connection.update({
        where: { userId_provider: { userId: req.userId, provider: 'degiro' } },
        data: { status: 'expired', lastError: 'Session expired — please re-login' },
      })
    }
    return res.json({ provider: 'degiro', reachable: false, status: testRes.status, latency, authenticated: false, sessionExpired: testRes.status === 401 })
  } catch (err) {
    return res.json({ provider: 'degiro', reachable: false, error: err.message, latency: Date.now() - start })
  }
}

function handleDegiro(req, res, action) {
  switch (action) {
    case 'login':          return degiroLogin(req, res, { withTOTP: false })
    case 'totp':           return degiroLogin(req, res, { withTOTP: true })
    case 'store-session':  return degiroStoreSession(req, res)
    case 'disconnect':     return degiroDisconnect(req, res)
    case 'status':       return degiroStatus(req, res)
    case 'portfolio':    return degiroPortfolio(req, res)
    case 'products':     return degiroProducts(req, res)
    case 'dividends':    return degiroDividends(req, res)
    case 'transactions': return degiroTransactions(req, res)
    case 'test':         return degiroTest(req, res)
    default: return res.status(404).json({ error: `Unknown degiro action: ${action}` })
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADING 212
// ═══════════════════════════════════════════════════════════════════════════════

const T212_LIVE = process.env.T212_BASE_URL || 'https://live.trading212.com/api/v0'

function t212AuthHeader(apiKey, apiSecret) {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
}

async function t212Fetch(path, apiKey, apiSecret, options = {}) {
  const url = `${T212_LIVE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': t212AuthHeader(apiKey, apiSecret), 'Content-Type': 'application/json', ...options.headers },
  })
  if (res.status === 429) {
    const retryAfter = res.headers.get('x-ratelimit-reset')
    throw Object.assign(new Error('Rate limited by Trading 212'), { status: 429, retryAfter })
  }
  if (!res.ok) {
    let body
    try { body = await res.json() } catch { body = {} }
    throw Object.assign(new Error(body.message || body.error || `Trading 212 returned ${res.status}`), { status: res.status })
  }
  const text = await res.text()
  if (!text) return {}
  return JSON.parse(text)
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

async function getT212Credentials(userId) {
  const conn = await prisma.connection.findUnique({
    where: { userId_provider: { userId, provider: 'trading212' } },
  })
  if (!conn || conn.status !== 'connected') return null
  const { apiKey, apiSecret } = JSON.parse(decrypt(conn.encryptedData))
  return { apiKey, apiSecret }
}

async function handleT212(req, res, action) {
  if (action === 'test') {
    const start = Date.now()
    const creds = await getT212Credentials(req.userId)
    if (!creds) return res.json({ provider: 'trading212', reachable: false, error: 'Not connected', latency: 0 })
    try {
      await t212Fetch('/equity/account/info', creds.apiKey, creds.apiSecret)
      return res.json({ provider: 'trading212', reachable: true, status: 200, latency: Date.now() - start })
    } catch (err) {
      return res.json({ provider: 'trading212', reachable: false, error: err.message, latency: Date.now() - start })
    }
  }
  if (action === 'connect' && req.method === 'POST') {
    const { apiKey, apiSecret } = req.body || {}
    if (!apiKey || !apiSecret) return res.status(400).json({ error: 'apiKey and apiSecret are required' })
    let account
    try {
      account = await t212Fetch('/equity/account/summary', apiKey, apiSecret)
    } catch (err) {
      console.error('[Trading 212] Connect validation failed:', err.message)
      return res.status(err.status === 401 ? 401 : 400).json({ error: 'Invalid Trading 212 credentials' })
    }
    const encryptedData = encrypt(JSON.stringify({ apiKey, apiSecret }))
    await prisma.connection.upsert({
      where: { userId_provider: { userId: req.userId, provider: 'trading212' } },
      create: { userId: req.userId, provider: 'trading212', status: 'connected', encryptedData, lastSyncAt: new Date() },
      update: { status: 'connected', encryptedData, lastSyncAt: new Date(), lastError: null },
    })
    return res.json({ connected: true, account: { totalValue: account.total, cash: account.free, invested: account.invested, result: account.ppl } })
  }
  if (action === 'disconnect' && req.method === 'DELETE') {
    await prisma.connection.deleteMany({ where: { userId: req.userId, provider: 'trading212' } })
    return res.json({ disconnected: true })
  }
  if (action === 'status') {
    const conn = await prisma.connection.findUnique({ where: { userId_provider: { userId: req.userId, provider: 'trading212' } } })
    if (!conn || conn.status !== 'connected') return res.json({ connected: false })
    return res.json({ connected: true, lastSyncAt: conn.lastSyncAt, lastError: conn.lastError })
  }
  if (action === 'positions') {
    const creds = await getT212Credentials(req.userId)
    if (!creds) return res.status(400).json({ error: 'Trading 212 not connected' })
    const positions = await t212Fetch('/equity/positions', creds.apiKey, creds.apiSecret)
    return res.json({ positions: Array.isArray(positions) ? positions : [] })
  }
  if (action === 'dividends') {
    const creds = await getT212Credentials(req.userId)
    if (!creds) return res.status(400).json({ error: 'Trading 212 not connected' })
    const dividends = await t212Paginate('/equity/history/dividends', creds.apiKey, creds.apiSecret)
    return res.json({ data: dividends })
  }
  if (action === 'account') {
    const creds = await getT212Credentials(req.userId)
    if (!creds) return res.status(400).json({ error: 'Trading 212 not connected' })
    const account = await t212Fetch('/equity/account/summary', creds.apiKey, creds.apiSecret)
    return res.json(account)
  }
  if (action === 'instruments') {
    const creds = await getT212Credentials(req.userId)
    if (!creds) return res.status(400).json({ error: 'Trading 212 not connected' })
    const instruments = await t212Fetch('/equity/metadata/instruments', creds.apiKey, creds.apiSecret)
    return res.json({ instruments: Array.isArray(instruments) ? instruments : [] })
  }
  return res.status(404).json({ error: `Unknown trading212 action: ${action}` })
}

// ═══════════════════════════════════════════════════════════════════════════════
// BINANCE
// ═══════════════════════════════════════════════════════════════════════════════

const BINANCE_BASE = process.env.BINANCE_BASE_URL || 'https://api.binance.com'

function binanceSign(queryString, secret) {
  return createHmac('sha256', secret).update(queryString).digest('hex')
}

async function binanceFetch(path, apiKey, apiSecret, { signed = false, params = {} } = {}) {
  const url = new URL(`${BINANCE_BASE}${path}`)
  if (signed) { params.timestamp = Date.now(); params.recvWindow = 10000 }
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) { if (v !== undefined && v !== null) qs.set(k, String(v)) }
  if (signed) qs.set('signature', binanceSign(qs.toString(), apiSecret))
  const qsStr = qs.toString()
  if (qsStr) url.search = qsStr
  const res = await fetch(url.toString(), { headers: { 'X-MBX-APIKEY': apiKey } })
  if (res.status === 429 || res.status === 418) {
    throw Object.assign(new Error('Rate limited by Binance'), { status: 429, retryAfter: res.headers.get('retry-after') })
  }
  if (!res.ok) {
    let body
    try { body = await res.json() } catch { body = {} }
    throw Object.assign(new Error(body.msg || `Binance returned ${res.status}`), { status: res.status, code: body.code })
  }
  const text = await res.text()
  if (!text) return {}
  return JSON.parse(text)
}

async function getBinanceCredentials(userId) {
  const conn = await prisma.connection.findUnique({
    where: { userId_provider: { userId, provider: 'binance' } },
  })
  if (!conn || conn.status !== 'connected') return null
  const { apiKey, apiSecret } = JSON.parse(decrypt(conn.encryptedData))
  return { apiKey, apiSecret }
}

async function handleBinance(req, res, action) {
  if (action === 'test') {
    const start = Date.now()
    const creds = await getBinanceCredentials(req.userId)
    if (!creds) return res.json({ provider: 'binance', reachable: false, error: 'Not connected', latency: 0 })
    try {
      await binanceFetch('/api/v3/account', creds.apiKey, creds.apiSecret, { signed: true })
      return res.json({ provider: 'binance', reachable: true, status: 200, latency: Date.now() - start })
    } catch (err) {
      return res.json({ provider: 'binance', reachable: false, error: err.message, latency: Date.now() - start })
    }
  }
  // Store credentials after client-side validation (no Binance API call)
  if (action === 'store-credentials' && req.method === 'POST') {
    const { apiKey, apiSecret } = req.body || {}
    if (!apiKey || !apiSecret) return res.status(400).json({ error: 'apiKey and apiSecret are required' })
    const encryptedData = encrypt(JSON.stringify({ apiKey, apiSecret }))
    await prisma.connection.upsert({
      where: { userId_provider: { userId: req.userId, provider: 'binance' } },
      create: { userId: req.userId, provider: 'binance', status: 'connected', encryptedData, lastSyncAt: new Date() },
      update: { status: 'connected', encryptedData, lastSyncAt: new Date(), lastError: null },
    })
    return res.json({ connected: true })
  }
  // Return decrypted credentials to authenticated user (for client-side API calls)
  if (action === 'get-credentials') {
    const creds = await getBinanceCredentials(req.userId)
    if (!creds) return res.status(404).json({ error: 'Binance not connected' })
    return res.json({ apiKey: creds.apiKey, apiSecret: creds.apiSecret })
  }
  if (action === 'connect' && req.method === 'POST') {
    const { apiKey, apiSecret } = req.body || {}
    if (!apiKey || !apiSecret) return res.status(400).json({ error: 'apiKey and apiSecret are required' })
    let account
    try {
      account = await binanceFetch('/api/v3/account', apiKey, apiSecret, { signed: true })
    } catch (err) {
      console.error('[Binance] Connect validation failed:', err.message)
      return res.status(err.status === 401 || err.code === -2015 ? 401 : 400).json({ error: 'Invalid Binance credentials' })
    }
    const encryptedData = encrypt(JSON.stringify({ apiKey, apiSecret }))
    await prisma.connection.upsert({
      where: { userId_provider: { userId: req.userId, provider: 'binance' } },
      create: { userId: req.userId, provider: 'binance', status: 'connected', encryptedData, lastSyncAt: new Date() },
      update: { status: 'connected', encryptedData, lastSyncAt: new Date(), lastError: null },
    })
    const nonZero = (account.balances || []).filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
    return res.json({ connected: true, account: { assetCount: nonZero.length, canTrade: account.canTrade, canWithdraw: account.canWithdraw, accountType: account.accountType } })
  }
  if (action === 'disconnect' && req.method === 'DELETE') {
    await prisma.connection.deleteMany({ where: { userId: req.userId, provider: 'binance' } })
    return res.json({ disconnected: true })
  }
  if (action === 'status') {
    const conn = await prisma.connection.findUnique({ where: { userId_provider: { userId: req.userId, provider: 'binance' } } })
    if (!conn || conn.status !== 'connected') return res.json({ connected: false })
    return res.json({ connected: true, lastSyncAt: conn.lastSyncAt, lastError: conn.lastError })
  }

  const creds = await getBinanceCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Binance not connected' })

  if (action === 'balances') {
    const account = await binanceFetch('/api/v3/account', creds.apiKey, creds.apiSecret, { signed: true })
    const balances = (account.balances || [])
      .filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .filter((b) => !b.asset.startsWith('LD')) // LD* are Binance Lending wrappers — duplicates of earn positions
      .map((b) => ({ asset: b.asset, free: parseFloat(b.free), locked: parseFloat(b.locked), total: parseFloat(b.free) + parseFloat(b.locked) }))
    return res.json({ balances })
  }
  if (action === 'earn') {
    let flexible = []
    try { const d = await binanceFetch('/sapi/v1/simple-earn/flexible/position', creds.apiKey, creds.apiSecret, { signed: true, params: { size: 100 } }); flexible = d.rows || [] } catch {}
    let locked = []
    try { const d = await binanceFetch('/sapi/v1/simple-earn/locked/position', creds.apiKey, creds.apiSecret, { signed: true, params: { size: 100 } }); locked = d.rows || [] } catch {}
    return res.json({ flexible, locked })
  }
  if (action === 'dividends') {
    let dividends = []
    try { const d = await binanceFetch('/sapi/v1/asset/assetDividend', creds.apiKey, creds.apiSecret, { signed: true, params: { limit: 500 } }); dividends = d.rows || [] } catch {}

    // Paginate flexible + locked earn rewards across all reward types
    const REWARD_TYPES = ['BONUS', 'REALTIME', 'REWARDS']
    const earnRewards = []
    for (const path of ['/sapi/v1/simple-earn/flexible/history/rewardsRecord', '/sapi/v1/simple-earn/locked/history/rewardsRecord']) {
      for (const type of REWARD_TYPES) {
        try {
          let page = 1
          while (true) {
            const d = await binanceFetch(path, creds.apiKey, creds.apiSecret, { signed: true, params: { size: 100, type, current: page } })
            const rows = d.rows || []
            earnRewards.push(...rows)
            if (rows.length < 100 || earnRewards.length >= (d.total || 0)) break
            page++
          }
        } catch {}
      }
    }

    return res.json({ dividends, earnRewards })
  }
  if (action === 'prices') {
    const prices = await binanceFetch('/api/v3/ticker/price', creds.apiKey, creds.apiSecret)
    return res.json({ prices: Array.isArray(prices) ? prices : [] })
  }
  return res.status(404).json({ error: `Unknown binance action: ${action}` })
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRYPTO.COM
// ═══════════════════════════════════════════════════════════════════════════════

const CRYPTOCOM_BASE = process.env.CRYPTOCOM_BASE_URL || 'https://api.crypto.com/exchange/v1'

function cryptocomBuildParamString(params) {
  if (!params || Object.keys(params).length === 0) return ''
  return Object.keys(params).sort().map((key) => `${key}${params[key]}`).join('')
}

function cryptocomSignRequest(method, id, apiKey, apiSecret, params, nonce) {
  const paramString = cryptocomBuildParamString(params)
  const payload = `${method}${id}${apiKey}${paramString}${nonce}`
  return createHmac('sha256', apiSecret).update(payload).digest('hex')
}

async function cryptocomFetch(method, apiKey, apiSecret, params = {}) {
  const id = Date.now()
  const nonce = Date.now()
  const sig = cryptocomSignRequest(method, id, apiKey, apiSecret, params, nonce)
  const body = { id, method, api_key: apiKey, params, sig, nonce }
  const res = await fetch(`${CRYPTOCOM_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 429) throw Object.assign(new Error('Rate limited by Crypto.com'), { status: 429 })
  if (!res.ok) {
    let data
    try { data = await res.json() } catch { data = {} }
    throw Object.assign(new Error(data.message || `Crypto.com returned ${res.status}`), { status: res.status, code: data.code })
  }
  const data = await res.json()
  if (data.code !== 0) throw Object.assign(new Error(data.message || `Crypto.com error code ${data.code}`), { status: 400, code: data.code })
  return data.result || {}
}

async function getCryptocomCredentials(userId) {
  const conn = await prisma.connection.findUnique({
    where: { userId_provider: { userId, provider: 'cryptocom' } },
  })
  if (!conn || conn.status !== 'connected') return null
  const { apiKey, apiSecret } = JSON.parse(decrypt(conn.encryptedData))
  return { apiKey, apiSecret }
}

async function handleCryptocom(req, res, action) {
  if (action === 'test') {
    const start = Date.now()
    const creds = await getCryptocomCredentials(req.userId)
    if (!creds) return res.json({ provider: 'cryptocom', reachable: false, error: 'Not connected', latency: 0 })
    try {
      await cryptocomFetch('private/user-balance', creds.apiKey, creds.apiSecret)
      return res.json({ provider: 'cryptocom', reachable: true, status: 200, latency: Date.now() - start })
    } catch (err) {
      return res.json({ provider: 'cryptocom', reachable: false, error: err.message, latency: Date.now() - start })
    }
  }
  if (action === 'connect' && req.method === 'POST') {
    const { apiKey, apiSecret } = req.body || {}
    if (!apiKey || !apiSecret) return res.status(400).json({ error: 'apiKey and apiSecret are required' })
    try {
      await cryptocomFetch('private/user-balance', apiKey, apiSecret)
    } catch (err) {
      console.error('[Crypto.com] Connect validation failed:', err.message)
      const isAuth = err.code === 10002 || err.code === 10007 || err.status === 401
      return res.status(isAuth ? 401 : 400).json({ error: 'Invalid Crypto.com credentials' })
    }
    const encryptedData = encrypt(JSON.stringify({ apiKey, apiSecret }))
    await prisma.connection.upsert({
      where: { userId_provider: { userId: req.userId, provider: 'cryptocom' } },
      create: { userId: req.userId, provider: 'cryptocom', status: 'connected', encryptedData, lastSyncAt: new Date() },
      update: { status: 'connected', encryptedData, lastSyncAt: new Date(), lastError: null },
    })
    const balance = await cryptocomFetch('private/user-balance', apiKey, apiSecret)
    const positions = (balance.data || []).filter((b) => parseFloat(b.available || 0) > 0 || parseFloat(b.staked || 0) > 0)
    return res.json({ connected: true, account: { assetCount: positions.length } })
  }
  if (action === 'disconnect' && req.method === 'DELETE') {
    await prisma.connection.deleteMany({ where: { userId: req.userId, provider: 'cryptocom' } })
    return res.json({ disconnected: true })
  }
  if (action === 'status') {
    const conn = await prisma.connection.findUnique({ where: { userId_provider: { userId: req.userId, provider: 'cryptocom' } } })
    if (!conn || conn.status !== 'connected') return res.json({ connected: false })
    return res.json({ connected: true, lastSyncAt: conn.lastSyncAt, lastError: conn.lastError })
  }
  if (action === 'prices') {
    const tickerRes = await fetch('https://api.crypto.com/exchange/v1/public/get-tickers')
    if (!tickerRes.ok) throw new Error(`Crypto.com ticker API returned ${tickerRes.status}`)
    const tickerData = await tickerRes.json()
    if (tickerData.code !== 0) throw new Error(`Crypto.com ticker error code ${tickerData.code}`)
    const prices = (tickerData.result?.data || [])
      .filter((t) => t.i && t.i.endsWith('_USD'))
      .map((t) => ({ symbol: t.i.replace('_USD', ''), price: parseFloat(t.a || 0) }))
    return res.json({ prices })
  }

  const creds = await getCryptocomCredentials(req.userId)
  if (!creds) return res.status(400).json({ error: 'Crypto.com not connected' })

  if (action === 'balances') {
    const result = await cryptocomFetch('private/user-balance', creds.apiKey, creds.apiSecret)
    const balances = (result.data || [])
      .filter((b) => parseFloat(b.available || 0) > 0 || parseFloat(b.staked || 0) > 0)
      .map((b) => ({ currency: b.currency, available: parseFloat(b.available || 0), staked: parseFloat(b.staked || 0), total: parseFloat(b.available || 0) + parseFloat(b.staked || 0) }))
    return res.json({ balances })
  }
  if (action === 'history') {
    let trades = []
    try { const result = await cryptocomFetch('private/get-trades', creds.apiKey, creds.apiSecret, { page_size: 200 }); trades = result.data || [] } catch {}
    return res.json({ trades })
  }
  return res.status(404).json({ error: `Unknown cryptocom action: ${action}` })
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPATCH — routes by provider and action
// ═══════════════════════════════════════════════════════════════════════════════

function dispatch(req, res) {
  const { provider, action } = req.query
  switch (provider) {
    case 'degiro':      return handleDegiro(req, res, action)
    case 'trading212':  return handleT212(req, res, action)
    case 'binance':     return handleBinance(req, res, action)
    case 'cryptocom':   return handleCryptocom(req, res, action)
    default:            return res.status(404).json({ error: `Unknown provider: ${provider}` })
  }
}

export default createProtectedHandler({
  GET:    (req, res) => dispatch(req, res),
  POST:   (req, res) => dispatch(req, res),
  DELETE: (req, res) => dispatch(req, res),
})
