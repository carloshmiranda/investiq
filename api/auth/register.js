// api/auth/register.js
// POST /api/auth/register — implemented in item 1.1
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  POST: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
