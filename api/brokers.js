// api/brokers.js — reserved for future broker proxy routes (CORS bypass)
// /api/brokers/degiro/*     → proxy to trader.degiro.nl
// /api/brokers/trading212/* → proxy to live.trading212.com
import { createProtectedHandler } from '../lib/apiHandler.js'

export default createProtectedHandler({
  GET: async (req, res) => {
    res.status(501).json({ error: 'Broker proxy not yet implemented' })
  },
  POST: async (req, res) => {
    res.status(501).json({ error: 'Broker proxy not yet implemented' })
  },
})
