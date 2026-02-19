import { requireAuth } from './authMiddleware.js'

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.VITE_API_URL || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
}

// Public handler — no auth required (health, auth routes)
export function createHandler(methods) {
  return async function handler(req, res) {
    corsHeaders(res)
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
    corsHeaders(res)
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
