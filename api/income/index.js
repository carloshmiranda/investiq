// api/income/index.js
// GET /api/income — implemented in item 11.2
import { createProtectedHandler } from '../../lib/apiHandler.js'

export default createProtectedHandler({
  GET: async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
