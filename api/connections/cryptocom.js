// api/connections/cryptocom.js
// GET/POST /api/connections/cryptocom — implemented in item 10.1
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  GET: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
  POST: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
