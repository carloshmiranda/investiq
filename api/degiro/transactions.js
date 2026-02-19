import { degiroGetTransactions, setCORSHeaders } from '../_lib/degiro.js';

// Default: last 12 months
function defaultDates() {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  const fmt = (d) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return { fromDate: fmt(from), toDate: fmt(to) };
}

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, intAccount } = req.query;
  const defaults = defaultDates();
  const fromDate = req.query.fromDate || defaults.fromDate;
  const toDate = req.query.toDate || defaults.toDate;

  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' });
  }

  try {
    const data = await degiroGetTransactions(sessionId, Number(intAccount), fromDate, toDate);
    return res.status(200).json({ data });
  } catch (err) {
    console.error('[degiro/transactions]', err.message);
    return res.status(502).json({
      error: 'Failed to fetch transactions from DeGiro',
      message: err.message,
    });
  }
}
