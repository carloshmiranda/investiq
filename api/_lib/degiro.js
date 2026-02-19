// ============================================================
// InvestIQ — Shared DeGiro API client (Node.js / Vercel)
// Uses native fetch (Node 18+). Never called from the browser.
// ============================================================

export const DEGIRO_BASE = 'https://trader.degiro.nl';

export const DEGIRO_STATUS = {
  SUCCESS: 0,
  TOTP_NEEDED: 6,
  SESSION_EXPIRED: 3,
  AUTH_FAILED: 9,
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Rate limiting ─────────────────────────────────────────────────────────────
let lastRequestAt = 0;
async function rateLimit() {
  const now = Date.now();
  const wait = 500 - (now - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

// ── Safe response parser ──────────────────────────────────────────────────────
// Returns { ok, status, json, text } — never throws on non-JSON bodies
async function readResponse(res) {
  const text = await res.text();
  let json = null;
  let parseError = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    parseError = e.message;
  }
  return { ok: res.ok, status: res.status, json, text, parseError };
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function degiroFetch(url, options = {}) {
  await rateLimit();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://trader.degiro.nl',
      'Referer': 'https://trader.degiro.nl/login/en',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options.headers,
    },
  });
  return res;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

/** Step 1: login with username/password */
export async function degiroLogin(username, password) {
  let res;
  try {
    res = await degiroFetch(`${DEGIRO_BASE}/login/secure/login`, {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        isPassCodeReset: false,
        isRedirectToMobile: false,
      }),
    });
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr.message}`);
  }

  const { ok, status, json, text, parseError } = await readResponse(res);

  if (!ok) {
    if (parseError) {
      throw new Error(`DeGiro returned HTTP ${status} with non-JSON body: ${text.slice(0, 300)}`);
    }
    throw new Error(`DeGiro returned HTTP ${status}: ${json?.statusText ?? text.slice(0, 200)}`);
  }

  if (parseError || !json) {
    throw new Error(`DeGiro returned HTTP ${status} but body is not JSON. Got: ${text.slice(0, 300)}`);
  }

  return {
    status: json.status,
    statusText: json.statusText ?? '',
    sessionId: json.sessionId ?? null,
    requiresTOTP:
      json.status === DEGIRO_STATUS.TOTP_NEEDED ||
      String(json.statusText ?? '').toLowerCase().includes('totp'),
  };
}

/** Step 1b: TOTP (2FA) */
export async function degiroTOTP(username, password, oneTimePassword) {
  let res;
  try {
    res = await degiroFetch(`${DEGIRO_BASE}/login/secure/login/totp`, {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        isPassCodeReset: false,
        isRedirectToMobile: false,
        oneTimePassword,
      }),
    });
  } catch (networkErr) {
    throw new Error(`Network error: ${networkErr.message}`);
  }

  const { json, text, parseError, status } = await readResponse(res);
  if (parseError || !json) {
    throw new Error(`DeGiro TOTP returned non-JSON (HTTP ${status}): ${text.slice(0, 200)}`);
  }
  return { status: json.status, sessionId: json.sessionId ?? null };
}

/** Step 2: fetch intAccount from client endpoint */
export async function degiroGetClient(sessionId) {
  let res;
  try {
    res = await degiroFetch(
      `${DEGIRO_BASE}/pa/secure/client?sessionId=${encodeURIComponent(sessionId)}`
    );
  } catch (networkErr) {
    throw new Error(`Network error fetching client info: ${networkErr.message}`);
  }

  const { ok, status, json, text, parseError } = await readResponse(res);
  if (!ok) throw new Error(`Client endpoint returned HTTP ${status}`);
  if (parseError || !json) throw new Error(`Client endpoint non-JSON (HTTP ${status}): ${text.slice(0, 200)}`);
  if (!json.data) throw new Error(`Client response missing .data: ${JSON.stringify(json).slice(0, 200)}`);

  return json.data;
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export async function degiroGetPortfolio(sessionId, intAccount) {
  const url = `${DEGIRO_BASE}/trading/secure/v5/update/${intAccount};jsessionid=${encodeURIComponent(sessionId)}?portfolio=0`;
  const res = await degiroFetch(url);
  const { ok, status, json, text, parseError } = await readResponse(res);
  if (!ok) throw new Error(`Portfolio endpoint HTTP ${status}`);
  if (parseError || !json) throw new Error(`Portfolio non-JSON (HTTP ${status}): ${text.slice(0, 200)}`);
  return {
    portfolio: json.portfolio?.value ?? [],
    cashFunds: json.cashFunds?.value ?? [],
  };
}

export async function degiroGetProducts(sessionId, intAccount, productIds) {
  if (!productIds || productIds.length === 0) return {};
  const url = `${DEGIRO_BASE}/product_search/secure/v5/products/info?sessionId=${encodeURIComponent(sessionId)}&intAccount=${intAccount}`;
  const res = await degiroFetch(url, {
    method: 'POST',
    body: JSON.stringify(productIds.map(String)),
  });
  const { ok, status, json, text, parseError } = await readResponse(res);
  if (!ok) throw new Error(`Products endpoint HTTP ${status}`);
  if (parseError || !json) throw new Error(`Products non-JSON (HTTP ${status}): ${text.slice(0, 200)}`);
  return json.data ?? {};
}

export async function degiroGetDividends(sessionId, intAccount) {
  const url = `${DEGIRO_BASE}/reporting/secure/v3/ca/?intAccount=${intAccount}&sessionId=${encodeURIComponent(sessionId)}`;
  const res = await degiroFetch(url);
  const { ok, status, json, text, parseError } = await readResponse(res);
  if (!ok) throw new Error(`Dividends endpoint HTTP ${status}`);
  if (parseError || !json) throw new Error(`Dividends non-JSON (HTTP ${status}): ${text.slice(0, 200)}`);
  return json.data ?? [];
}

export async function degiroGetTransactions(sessionId, intAccount, fromDate, toDate) {
  const params = new URLSearchParams({
    fromDate, toDate,
    groupTransactionsByOrder: 'false',
    intAccount: String(intAccount),
    sessionId,
  });
  const url = `${DEGIRO_BASE}/reporting/secure/v4/transactions?${params}`;
  const res = await degiroFetch(url);
  const { ok, status, json, text, parseError } = await readResponse(res);
  if (!ok) throw new Error(`Transactions endpoint HTTP ${status}`);
  if (parseError || !json) throw new Error(`Transactions non-JSON (HTTP ${status}): ${text.slice(0, 200)}`);
  return json.data ?? [];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isSessionExpired(status) {
  return status === 401 || status === 403;
}

export async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
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

export function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
