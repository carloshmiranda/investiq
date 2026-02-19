export const config = { runtime: 'edge' };

import { degiroGetPortfolio, edgeJson, edgeOptions } from '../_lib/degiro.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return edgeOptions();
  if (req.method !== 'GET') return edgeJson({ error: 'Method not allowed' }, 405);

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const intAccount = searchParams.get('intAccount');

  if (!sessionId || !intAccount) {
    return edgeJson({ error: 'sessionId and intAccount are required' }, 400);
  }

  try {
    const data = await degiroGetPortfolio(sessionId, Number(intAccount));
    return edgeJson(data);
  } catch (err) {
    if (err.message.includes('HTTP 401') || err.message.includes('HTTP 403')) {
      return edgeJson({ error: 'Session expired. Please reconnect.' }, 401);
    }
    return edgeJson({ error: 'Failed to fetch portfolio from DeGiro', debug: err.message }, 502);
  }
}
