// api/connections/degiro.js
// GET/POST /api/connections/degiro — implemented in item 7.1
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  GET: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
  POST: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
