// api/auth/refresh.js
// POST /api/auth/refresh — implemented in item 1.2
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  POST: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
