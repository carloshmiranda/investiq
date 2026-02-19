// api/portfolio/index.js
// GET /api/portfolio — implemented in item 11.1
import { createProtectedHandler } from '../../lib/apiHandler.js'

export default createProtectedHandler({
  GET: async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
