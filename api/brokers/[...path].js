// api/brokers/[...path].js
// Catch-all proxy for all broker APIs
// path[0] = broker name (degiro | trading212), rest = broker-specific route
// Implemented in items 7.1 and 8.1
import { createHandler } from '../../lib/apiHandler.js'

export default createHandler({
  GET: async (req, res) => {
    const [broker, ...rest] = req.query.path || []
    res.status(501).json({ error: `Not implemented yet: ${broker}/${rest.join('/')}` })
  },
  POST: async (req, res) => {
    const [broker, ...rest] = req.query.path || []
    res.status(501).json({ error: `Not implemented yet: ${broker}/${rest.join('/')}` })
  },
})
