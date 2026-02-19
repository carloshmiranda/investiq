// api/auth/login.js
// POST /api/auth/login — implemented in item 1.2
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  POST: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
