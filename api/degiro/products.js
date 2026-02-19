export const config = { runtime: 'edge' };

import { degiroGetProducts, edgeJson, edgeOptions } from '../_lib/degiro.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return edgeOptions();
  if (req.method !== 'POST') return edgeJson({ error: 'Method not allowed' }, 405);

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const intAccount = searchParams.get('intAccount');

  if (!sessionId || !intAccount) {
    return edgeJson({ error: 'sessionId and intAccount are required' }, 400);
  }

  let productIds;
  try {
    ({ productIds } = await req.json());
  } catch {
    return edgeJson({ error: 'Invalid JSON body' }, 400);
  }

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return edgeJson({ error: 'productIds array is required' }, 400);
  }

  // Batch in groups of 50 to avoid DeGiro request size limits
  const BATCH_SIZE = 50;
  const batches = [];
  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    batches.push(productIds.slice(i, i + BATCH_SIZE));
  }

  try {
    const results = await Promise.all(
      batches.map((batch) => degiroGetProducts(sessionId, Number(intAccount), batch))
    );
    return edgeJson(Object.assign({}, ...results));
  } catch (err) {
    return edgeJson({ error: 'Failed to fetch product details from DeGiro', debug: err.message }, 502);
  }
}
