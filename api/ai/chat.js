// api/ai/chat.js
// POST /api/ai/chat — implemented in item 12.2
import { createProtectedHandler } from '../../lib/apiHandler.js'

export default createProtectedHandler({
  POST: async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
