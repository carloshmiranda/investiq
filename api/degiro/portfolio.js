import { degiroGetPortfolio, setCORSHeaders, isSessionExpired } from '../_lib/degiro.js';

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, intAccount } = req.query;

  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' });
  }

  try {
    const data = await degiroGetPortfolio(sessionId, Number(intAccount));
    return res.status(200).json(data);
  } catch (err) {
    console.error('[degiro/portfolio]', err.message);

    if (isSessionExpired(err.statusCode, null)) {
      return res.status(401).json({ error: 'Session expired. Please reconnect.' });
    }

    return res.status(502).json({
      error: 'Failed to fetch portfolio from DeGiro',
      message: err.message,
    });
  }
}
