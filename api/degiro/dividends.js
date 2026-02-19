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
    // Dividend history is supplementary — never block the sync over it.
    // Return empty data with a warning so the frontend can still render.
    return edgeJson({ data: [], warning: err.message });
  }
}
