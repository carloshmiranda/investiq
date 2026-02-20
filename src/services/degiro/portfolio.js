import { DegiroError } from './auth.js';

const BASE = '/api/degiro';

async function apiGet(authAxios, url) {
  try {
    const { data } = await authAxios.get(url);
    return data;
  } catch (err) {
    const msg = err.response?.data?.error || 'Request failed';
    throw new DegiroError(msg, err.response?.status || 500);
  }
}

async function apiPost(authAxios, url, body) {
  try {
    const { data } = await authAxios.post(url, body);
    return data;
  } catch (err) {
    const msg = err.response?.data?.error || 'Request failed';
    throw new DegiroError(msg, err.response?.status || 500);
  }
}

/** Fetch portfolio positions + cash funds */
export async function fetchPortfolio(authAxios, sessionId, intAccount) {
  const params = new URLSearchParams({ sessionId, intAccount: String(intAccount) });
  return apiGet(authAxios, `${BASE}/portfolio?${params}`);
}

/** Fetch product details for an array of productIds */
export async function fetchProductDetails(authAxios, sessionId, intAccount, productIds) {
  const params = new URLSearchParams({ sessionId, intAccount: String(intAccount) });
  return apiPost(authAxios, `${BASE}/products?${params}`, { productIds });
}

/** Fetch dividend / corporate actions history */
export async function fetchDividends(authAxios, sessionId, intAccount) {
  const params = new URLSearchParams({ sessionId, intAccount: String(intAccount) });
  const res = await apiGet(authAxios, `${BASE}/dividends?${params}`);
  return res.data ?? [];
}

/** Fetch transaction history */
export async function fetchTransactions(authAxios, sessionId, intAccount, fromDate, toDate) {
  const params = new URLSearchParams({
    sessionId,
    intAccount: String(intAccount),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  });
  const res = await apiGet(authAxios, `${BASE}/transactions?${params}`);
  return res.data ?? [];
}
