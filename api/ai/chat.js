// api/ai/chat.js
// POST /api/ai/chat — implemented in item 12.2
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  POST: async (_req, res) => {
    res.status(501).json({ error: 'Not implemented yet' })
  },
})
