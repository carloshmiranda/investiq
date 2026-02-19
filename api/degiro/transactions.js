export const config = { runtime: 'edge' };

import { degiroGetTransactions, edgeJson, edgeOptions } from '../_lib/degiro.js';

function defaultDates() {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  const fmt = (d) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  return { fromDate: fmt(from), toDate: fmt(to) };
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return edgeOptions();
  if (req.method !== 'GET') return edgeJson({ error: 'Method not allowed' }, 405);

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const intAccount = searchParams.get('intAccount');

  if (!sessionId || !intAccount) {
    return edgeJson({ error: 'sessionId and intAccount are required' }, 400);
  }

  const defaults = defaultDates();
  const fromDate = searchParams.get('fromDate') || defaults.fromDate;
  const toDate = searchParams.get('toDate') || defaults.toDate;

  try {
    const data = await degiroGetTransactions(sessionId, Number(intAccount), fromDate, toDate);
    return edgeJson({ data });
  } catch (err) {
    return edgeJson({ error: 'Failed to fetch transactions from DeGiro', debug: err.message }, 502);
  }
}
