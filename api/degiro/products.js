import { degiroGetProducts, setCORSHeaders, parseBody } from '../_lib/degiro.js';

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, intAccount } = req.query;
  const { productIds } = await parseBody(req);

  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' });
  }
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'productIds array is required' });
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
    const merged = Object.assign({}, ...results);
    return res.status(200).json(merged);
  } catch (err) {
    console.error('[degiro/products]', err.message);
    return res.status(502).json({
      error: 'Failed to fetch product details from DeGiro',
      message: err.message,
    });
  }
}
