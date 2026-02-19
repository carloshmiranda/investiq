// ============================================================
// InvestIQ — Shared DeGiro API client (Node.js / Vercel)
// Uses native fetch (Node 18+). Never called from the browser.
// ============================================================

export const DEGIRO_BASE = 'https://trader.degiro.nl';

// Status codes returned by DeGiro
export const DEGIRO_STATUS = {
  SUCCESS: 0,
  TOTP_NEEDED: 6,
  SESSION_EXPIRED: 3,
  AUTH_FAILED: 9,
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Rate limit queue (per-process, not cross-serverless-invocations) ──────────
let lastRequestAt = 0;
async function rateLimit() {
  const now = Date.now();
  const wait = 500 - (now - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function degiroFetch(url, options = {}) {
  await rateLimit();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; InvestIQ/1.0)',
      ...options.headers,
    },
  });
  return res;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

/** Step 1: login with username/password */
export async function degiroLogin(username, password) {
  const res = await degiroFetch(`${DEGIRO_BASE}/login/secure/login`, {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      isPassCodeReset: false,
      isRedirectToMobile: false,
      queryParams: {},
    }),
  });

  if (!res.ok && res.status !== 200) {
    throw new Error(`DeGiro returned HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    status: data.status,
    statusText: data.statusText ?? '',
    sessionId: data.sessionId ?? null,
    requiresTOTP: data.status === DEGIRO_STATUS.TOTP_NEEDED ||
      String(data.statusText).toLowerCase().includes('totp'),
  };
}

/** Step 1b: TOTP login (2FA) */
export async function degiroTOTP(username, password, oneTimePassword) {
  const res = await degiroFetch(`${DEGIRO_BASE}/login/secure/login/totp`, {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      isPassCodeReset: false,
      isRedirectToMobile: false,
      oneTimePassword,
      queryParams: {},
    }),
  });

  const data = await res.json();
  return {
    status: data.status,
    sessionId: data.sessionId ?? null,
  };
}

/** Step 2: fetch intAccount + userId from client endpoint */
export async function degiroGetClient(sessionId) {
  const res = await degiroFetch(
    `${DEGIRO_BASE}/pa/secure/client?sessionId=${encodeURIComponent(sessionId)}`
  );

  if (!res.ok) throw new Error(`Client endpoint returned ${res.status}`);
  const data = await res.json();

  if (!data.data) throw new Error('Unexpected client response from DeGiro');
  return data.data; // { intAccount, id, username, firstContact: { firstName, lastName }, ... }
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

/** Fetch live portfolio positions and cash funds */
export async function degiroGetPortfolio(sessionId, intAccount) {
  const url =
    `${DEGIRO_BASE}/trading/secure/v5/update/${intAccount};jsessionid=${encodeURIComponent(sessionId)}?portfolio=0`;

  const res = await degiroFetch(url);
  if (!res.ok) throw new Error(`Portfolio endpoint returned ${res.status}`);

  const data = await res.json();
  return {
    portfolio: data.portfolio?.value ?? [],
    cashFunds: data.cashFunds?.value ?? [],
  };
}

/** Fetch detailed product info for an array of productIds */
export async function degiroGetProducts(sessionId, intAccount, productIds) {
  if (!productIds || productIds.length === 0) return {};

  const url =
    `${DEGIRO_BASE}/product_search/secure/v5/products/info?sessionId=${encodeURIComponent(sessionId)}&intAccount=${intAccount}`;

  const res = await degiroFetch(url, {
    method: 'POST',
    body: JSON.stringify(productIds.map(String)),
  });

  if (!res.ok) throw new Error(`Products endpoint returned ${res.status}`);
  const data = await res.json();
  return data.data ?? {};
}

/** Fetch dividend and corporate actions history */
export async function degiroGetDividends(sessionId, intAccount) {
  const url =
    `${DEGIRO_BASE}/reporting/secure/v3/ca/?intAccount=${intAccount}&sessionId=${encodeURIComponent(sessionId)}`;

  const res = await degiroFetch(url);
  if (!res.ok) throw new Error(`Dividends endpoint returned ${res.status}`);

  const data = await res.json();
  return data.data ?? [];
}

/** Fetch transaction history between two dates (format: DD/MM/YYYY) */
export async function degiroGetTransactions(sessionId, intAccount, fromDate, toDate) {
  const params = new URLSearchParams({
    fromDate,
    toDate,
    groupTransactionsByOrder: 'false',
    intAccount: String(intAccount),
    sessionId,
  });

  const url = `${DEGIRO_BASE}/reporting/secure/v4/transactions?${params}`;
  const res = await degiroFetch(url);
  if (!res.ok) throw new Error(`Transactions endpoint returned ${res.status}`);

  const data = await res.json();
  return data.data ?? [];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Check if an HTTP response indicates an expired session */
export function isSessionExpired(status, body) {
  if (status === 401 || status === 403) return true;
  if (body?.status === DEGIRO_STATUS.SESSION_EXPIRED) return true;
  return false;
}

/** Parse CORS-safe JSON body from Vercel req */
export async function parseBody(req) {
  // Vercel automatically parses JSON bodies when Content-Type is application/json
  if (req.body && typeof req.body === 'object') return req.body;
  // Fallback: read stream
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

/** Standard CORS headers for all API responses */
export function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
