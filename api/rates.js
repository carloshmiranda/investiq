import { createHandler } from '../lib/apiHandler.js'
import { getAllRates } from '../lib/exchangeRates.js'

export default createHandler({
  GET: async (_req, res) => {
    const rates = await getAllRates()
    return res.status(200).json(rates)
  },
})
