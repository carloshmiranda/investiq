// api/connections/trading212.js
// GET/POST /api/connections/trading212 — implemented in item 8.1
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  GET: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
  POST: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
