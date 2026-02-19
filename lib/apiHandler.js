// lib/apiHandler.js
// Wraps a Vercel serverless function with CORS headers and error handling

export function createHandler(methods) {
  return async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', process.env.VITE_API_URL || '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')

    if (req.method === 'OPTIONS') return res.status(200).end()

    const fn = methods[req.method]
    if (!fn) return res.status(405).json({ error: 'Method not allowed' })

    try {
      await fn(req, res)
    } catch (err) {
      console.error(`[API Error] ${req.url}:`, err.message)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
