// api/brokers/trading212/[...path].js
// Catch-all proxy for Trading 212 broker API — implemented in item 8.1
// Handles all /api/brokers/trading212/* routes server-side
import { createHandler } from '../../../lib/apiHandler.js'

export default createHandler({
  GET: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
  POST: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
