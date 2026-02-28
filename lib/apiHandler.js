import { requireAuth } from './authMiddleware.js'

const ALLOWED_ORIGINS = new Set([
  process.env.VITE_API_URL,
  'http://localhost:5173',
  'capacitor://localhost',
].filter(Boolean))

function corsHeaders(req, res) {
  const origin = req.headers.origin
  const allow = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : process.env.VITE_API_URL || 'http://localhost:5173'
  res.setHeader('Access-Control-Allow-Origin', allow)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-XSS-Protection', '0') // modern browsers use CSP instead
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
}

// Public handler — no auth required (health, auth routes)
export function createHandler(methods) {
  return async function handler(req, res) {
    corsHeaders(req, res)
    if (req.method === 'OPTIONS') return res.status(200).end()

    const fn = methods[req.method]
    if (!fn) return res.status(405).json({ error: 'Method not allowed' })

    try {
      await fn(req, res)
    } catch (err) {
      console.error(`[API Error] ${req.url}:`, err.message)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}

// Protected handler — verifies Bearer token, attaches req.userId before dispatch
export function createProtectedHandler(methods) {
  return async function handler(req, res) {
    corsHeaders(req, res)
    if (req.method === 'OPTIONS') return res.status(200).end()

    const authed = await requireAuth(req, res)
    if (!authed) return

    const fn = methods[req.method]
    if (!fn) return res.status(405).json({ error: 'Method not allowed' })

    try {
      await fn(req, res)
    } catch (err) {
      console.error(`[API Error] ${req.url}:`, err.message)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
