// api/connections/[provider].js
// Handles: GET/POST /api/connections/degiro | trading212 | binance | cryptocom
// [provider] routes implemented in items 7.1, 8.1, 9.1, 10.1
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  GET: async (req, res) => {
    const { provider } = req.query
    res.status(501).json({ error: `Not implemented yet: ${provider}` })
  },
  POST: async (req, res) => {
    const { provider } = req.query
    res.status(501).json({ error: `Not implemented yet: ${provider}` })
  },
})
