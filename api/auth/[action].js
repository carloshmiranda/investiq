// api/auth/[action].js
// Handles: POST /api/auth/register | login | refresh | logout
// [action] routes implemented in items 1.1 and 1.2
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  POST: async (req, res) => {
    const { action } = req.query
    res.status(501).json({ error: `Not implemented yet: ${action}` })
  },
})
