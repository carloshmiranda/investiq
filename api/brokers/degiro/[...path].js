// api/brokers/degiro/[...path].js
// Catch-all proxy for DeGiro broker API — implemented in item 7.1
// Handles all /api/brokers/degiro/* routes server-side
import { createHandler } from '../../../lib/apiHandler.js'

export default createHandler({
  GET: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
  POST: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
