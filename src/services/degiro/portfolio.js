/**
 * Frontend DeGiro portfolio service
 */

import { DegiroError } from './auth.js';

const BASE = '/api/degiro';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new DegiroError(data.error || `Request failed`, res.status);
  }
  return data;
}

/** Fetch portfolio positions + cash funds */
export async function fetchPortfolio(sessionId, intAccount) {
  const params = new URLSearchParams({ sessionId, intAccount: String(intAccount) });
  return apiFetch(`${BASE}/portfolio?${params}`);
}

/** Fetch product details for an array of productIds */
export async function fetchProductDetails(sessionId, intAccount, productIds) {
  const params = new URLSearchParams({ sessionId, intAccount: String(intAccount) });
  return apiFetch(`${BASE}/products?${params}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productIds }),
  });
}

/** Fetch dividend / corporate actions history */
export async function fetchDividends(sessionId, intAccount) {
  const params = new URLSearchParams({ sessionId, intAccount: String(intAccount) });
  const res = await apiFetch(`${BASE}/dividends?${params}`);
  return res.data ?? [];
}

/** Fetch transaction history */
export async function fetchTransactions(sessionId, intAccount, fromDate, toDate) {
  const params = new URLSearchParams({
    sessionId,
    intAccount: String(intAccount),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  });
  const res = await apiFetch(`${BASE}/transactions?${params}`);
  return res.data ?? [];
}
