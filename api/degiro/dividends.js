export const config = { runtime: 'edge' };

import { degiroGetDividends, edgeJson, edgeOptions } from '../_lib/degiro.js';

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
    const data = await degiroGetDividends(sessionId, Number(intAccount));
    return edgeJson({ data });
  } catch (err) {
    // Dividend endpoint can return 503 outside market hours — return empty gracefully
    if (err.message.includes('503')) {
      return edgeJson({ data: [], warning: 'DeGiro dividend endpoint temporarily unavailable' });
    }
    return edgeJson({ error: 'Failed to fetch dividend history from DeGiro', debug: err.message }, 502);
  }
}
