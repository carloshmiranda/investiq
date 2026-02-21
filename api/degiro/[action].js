import { createProtectedHandler } from '../../lib/apiHandler.js'

const DEGIRO_BASE = 'https://trader.degiro.nl'

// ─── Helper: extract JSESSIONID from set-cookie header ─────────────────────
function extractSessionId(setCookie) {
  if (!setCookie) return null
  // setCookie can be a string or array
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie]
  for (const c of cookies) {
    const match = c.match(/JSESSIONID=([^;]+)/)
    if (match) return match[1]
  }
  return null
}

// ─── Helper: proxy fetch to DeGiro with error handling ─────────────────────
async function degiroFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // For login endpoints, we need the raw response for cookies
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

// ─── Login flow: authenticate with DeGiro, get session + account info ──────
async function handleLogin(req, res, { withTOTP = false } = {}) {
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
    isRedirectToMobile: false,
    loginButtonUniversal: '',
    queryParams: { reason: 'session_expired' },
    ...(withTOTP ? { oneTimePassword } : {}),
  }

  // Step 1: Login to DeGiro
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginBody),
  })

  // Check for TOTP requirement (statusCode in response body)
  let loginData
  try { loginData = await loginRes.json() } catch { loginData = {} }

  if (loginData.statusCode === 6) {
    // TOTP required
    return res.json({ requiresTOTP: true })
  }

  if (!loginRes.ok) {
    const msg = loginData.message || loginData.statusText || 'DeGiro login failed'
    console.error('[DeGiro] Login failed:', msg)
    return res.status(loginRes.status === 401 ? 401 : 400).json({
      error: 'DeGiro login failed',
    })
  }

  // Extract session ID from cookies
  const setCookie = loginRes.headers.get('set-cookie')
  const sessionId = extractSessionId(setCookie)
  if (!sessionId) {
    return res.status(500).json({ error: 'Failed to extract session from DeGiro response' })
  }

  // Step 2: Get config (trading URL, etc.)
  const config = await degiroFetch(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })

  const paUrl = config.paUrl || `${DEGIRO_BASE}/pa/secure/`
  const tradingUrl = config.tradingUrl || `${DEGIRO_BASE}/trading/secure/`

  // Step 3: Get client info (intAccount, name, etc.)
  const clientInfo = await degiroFetch(
    `${paUrl}client?sessionId=${sessionId}`
  )

  const data = clientInfo.data || clientInfo
  const intAccount = data.intAccount
  const userId = data.id
  const firstName = data.firstContact?.firstName || data.displayName || username

  return res.json({
    sessionId,
    intAccount,
    userId,
    username,
    firstName,
    requiresTOTP: false,
  })
}

// ─── Portfolio: fetch positions + cash funds ───────────────────────────────
async function handlePortfolio(req, res) {
  const { sessionId, intAccount } = req.query
  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' })
  }

  // Get config first for tradingUrl
  const config = await degiroFetch(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })
  const tradingUrl = config.tradingUrl || `${DEGIRO_BASE}/trading/secure/`

  // Fetch portfolio data
  const data = await degiroFetch(
    `${tradingUrl}v5/update/${intAccount};jsessionid=${sessionId}?portfolio=0&cashFunds=0`
  )

  return res.json({
    portfolio: data.portfolio?.value || [],
    cashFunds: data.cashFunds?.value || [],
  })
}

// ─── Products: bulk fetch product details ──────────────────────────────────
async function handleProducts(req, res) {
  const { sessionId, intAccount } = req.query
  const { productIds } = req.body || {}
  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' })
  }
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'productIds array is required' })
  }

  // Get config for productSearchUrl
  const config = await degiroFetch(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })
  const productSearchUrl = config.productSearchUrl || `${DEGIRO_BASE}/product_search/secure/`

  const data = await degiroFetch(
    `${productSearchUrl}v5/products/info?intAccount=${intAccount}&sessionId=${sessionId}`,
    {
      method: 'POST',
      body: JSON.stringify(productIds.map(String)),
    }
  )

  return res.json(data.data || data)
}

// ─── Dividends: fetch account transactions filtered to dividends ───────────
async function handleDividends(req, res) {
  const { sessionId, intAccount } = req.query
  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' })
  }

  const config = await degiroFetch(`${DEGIRO_BASE}/login/secure/config`, {
    headers: { Cookie: `JSESSIONID=${sessionId};` },
  })
  const reportingUrl = config.reportingUrl || `${DEGIRO_BASE}/reporting/secure/`

  // Fetch account overview (dividends are in cashMovements)
  const now = new Date()
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(now.getFullYear() - 1)

  const fromDate = `${String(oneYearAgo.getDate()).padStart(2, '0')}/${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}/${oneYearAgo.getFullYear()}`
  const toDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`

  const data = await degiroFetch(
    `${reportingUrl}v4/accountoverview?fromDate=${fromDate}&toDate=${toDate}&intAccount=${intAccount}&sessionId=${sessionId}`
  )

  // Filter to dividend-type cash movements
  const cashMovements = data.cashMovements || []
  const dividends = cashMovements.filter(
    (m) => m.type === 'DIVIDEND' || m.type === 'DIVIDEND_TAX'
  )

  return res.json({ data: dividends })
}

// ─── Transactions: fetch transaction history ───────────────────────────────
async function handleTransactions(req, res) {
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

// ─── Route dispatcher ──────────────────────────────────────────────────────
export default createProtectedHandler({
  GET: async (req, res) => {
    const { action } = req.query
    switch (action) {
      case 'portfolio':    return handlePortfolio(req, res)
      case 'dividends':    return handleDividends(req, res)
      case 'transactions': return handleTransactions(req, res)
      default:
        return res.status(404).json({ error: `Unknown action: ${action}` })
    }
  },
  POST: async (req, res) => {
    const { action } = req.query
    switch (action) {
      case 'login':    return handleLogin(req, res, { withTOTP: false })
      case 'totp':     return handleLogin(req, res, { withTOTP: true })
      case 'products': return handleProducts(req, res)
      default:
        return res.status(404).json({ error: `Unknown action: ${action}` })
    }
  },
})
