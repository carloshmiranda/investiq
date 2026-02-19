// api/connections/binance.js
// GET/POST /api/connections/binance — implemented in item 9.1
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  GET: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
  POST: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
