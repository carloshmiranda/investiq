import { degiroGetDividends, setCORSHeaders } from '../_lib/degiro.js';

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, intAccount } = req.query;

  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' });
  }

  try {
    const data = await degiroGetDividends(sessionId, Number(intAccount));
    return res.status(200).json({ data });
  } catch (err) {
    console.error('[degiro/dividends]', err.message);

    // Dividend endpoint can fail outside market hours — return empty gracefully
    if (err.message.includes('503') || err.message.includes('maintenance')) {
      return res.status(200).json({ data: [], warning: 'DeGiro under maintenance' });
    }

    return res.status(502).json({
      error: 'Failed to fetch dividend history from DeGiro',
      message: err.message,
    });
  }
}
