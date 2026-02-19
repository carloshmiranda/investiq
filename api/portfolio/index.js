// api/portfolio/index.js
// GET /api/portfolio — implemented in item 11.1
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  GET: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
