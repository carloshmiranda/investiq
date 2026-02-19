// lib/authMiddleware.js
// Verifies the Authorization: Bearer <token> header and attaches userId to req
// Implemented in item 1.3
import { verifyAccessToken } from './jwt.js'

export async function requireAuth(req, res) {
  const header = req.headers['authorization'] || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }

  try {
    const payload = await verifyAccessToken(token)
    req.userId = payload.sub
    return true
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
    return false
  }
}
