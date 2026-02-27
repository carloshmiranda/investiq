const BASE = '/api/binance';
const BINANCE_BASE = 'https://api.binance.com';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER-PROXIED CALLS (legacy — kept for fallback)
// ═══════════════════════════════════════════════════════════════════════════════

export async function connect(authAxios, apiKey, apiSecret) {
  const { data } = await authAxios.post(`${BASE}/connect`, { apiKey, apiSecret });
  return data;
}

export async function disconnect(authAxios) {
  const { data } = await authAxios.delete(`${BASE}/disconnect`);
  return data;
}

export async function getStatus(authAxios) {
  const { data } = await authAxios.get(`${BASE}/status`);
  return data;
}

export async function getBalances(authAxios) {
  const { data } = await authAxios.get(`${BASE}/balances`);
  return data.balances || [];
}

export async function getEarn(authAxios) {
  const { data } = await authAxios.get(`${BASE}/earn`);
  return data;
}

export async function getDividends(authAxios) {
  const { data } = await authAxios.get(`${BASE}/dividends`);
  return data;
}

export async function getPrices(authAxios) {
  const { data } = await authAxios.get(`${BASE}/prices`);
  return data.prices || [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT-SIDE DIRECT CALLS (bypass geo-blocked Vercel IP)
// ═══════════════════════════════════════════════════════════════════════════════

async function hmacSign(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function binanceFetchDirect(path, apiKey, apiSecret, { signed = false, params = {} } = {}) {
  const url = new URL(`${BINANCE_BASE}${path}`);
  if (signed) {
    params.timestamp = Date.now();
    params.recvWindow = 10000;
  }
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  if (signed) {
    qs.set('signature', await hmacSign(apiSecret, qs.toString()));
  }
  const qsStr = qs.toString();
  if (qsStr) url.search = qsStr;

  const res = await fetch(url.toString(), {
    headers: { 'X-MBX-APIKEY': apiKey },
  });

  if (res.status === 429 || res.status === 418) {
    throw Object.assign(new Error('Rate limited by Binance'), { status: 429 });
  }
  if (!res.ok) {
    let body;
    try { body = await res.json(); } catch { body = {}; }
    throw Object.assign(
      new Error(body.msg || `Binance returned ${res.status}`),
      { status: res.status, code: body.code },
    );
  }
  const text = await res.text();
  if (!text) return {};
  return JSON.parse(text);
}

// ── Client-side data functions ───────────────────────────────────────────────

export async function connectDirect(apiKey, apiSecret) {
  const account = await binanceFetchDirect('/api/v3/account', apiKey, apiSecret, { signed: true });
  const nonZero = (account.balances || []).filter(
    (b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0,
  );
  return {
    connected: true,
    account: {
      assetCount: nonZero.length,
      canTrade: account.canTrade,
      canWithdraw: account.canWithdraw,
      accountType: account.accountType,
    },
  };
}

export async function getBalancesDirect(apiKey, apiSecret) {
  const account = await binanceFetchDirect('/api/v3/account', apiKey, apiSecret, { signed: true });
  return (account.balances || [])
    .filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
    // LD* tokens are Binance Lending wrappers — already represented in earn positions
    .filter((b) => !b.asset.startsWith('LD'))
    .map((b) => ({
      asset: b.asset,
      free: parseFloat(b.free),
      locked: parseFloat(b.locked),
      total: parseFloat(b.free) + parseFloat(b.locked),
    }));
}

export async function getEarnDirect(apiKey, apiSecret) {
  let flexible = [];
  try {
    const d = await binanceFetchDirect('/sapi/v1/simple-earn/flexible/position', apiKey, apiSecret, { signed: true, params: { size: 100 } });
    flexible = d.rows || [];
  } catch { /* earn may not be enabled */ }
  let locked = [];
  try {
    const d = await binanceFetchDirect('/sapi/v1/simple-earn/locked/position', apiKey, apiSecret, { signed: true, params: { size: 100 } });
    locked = d.rows || [];
  } catch { /* earn may not be enabled */ }
  return { flexible, locked };
}

async function paginateEarnRewards(path, apiKey, apiSecret) {
  const all = [];
  let current = 1;
  while (true) {
    const d = await binanceFetchDirect(path, apiKey, apiSecret, {
      signed: true,
      params: { size: 100, type: 'REWARDS', current },
    });
    const rows = d.rows || [];
    all.push(...rows);
    if (rows.length < 100 || all.length >= d.total) break;
    current++;
  }
  return all;
}

export async function getDividendsDirect(apiKey, apiSecret) {
  let dividends = [];
  try {
    const d = await binanceFetchDirect('/sapi/v1/asset/assetDividend', apiKey, apiSecret, { signed: true, params: { limit: 500 } });
    dividends = d.rows || [];
  } catch { /* no dividends */ }

  let flexRewards = [];
  try {
    flexRewards = await paginateEarnRewards('/sapi/v1/simple-earn/flexible/history/rewardsRecord', apiKey, apiSecret);
  } catch { /* no flexible rewards */ }

  let lockedRewards = [];
  try {
    lockedRewards = await paginateEarnRewards('/sapi/v1/simple-earn/locked/history/rewardsRecord', apiKey, apiSecret);
  } catch { /* no locked rewards */ }

  return { dividends, earnRewards: [...flexRewards, ...lockedRewards] };
}

export async function getPricesDirect() {
  const res = await fetch(`${BINANCE_BASE}/api/v3/ticker/price`);
  if (!res.ok) throw new Error(`Binance prices returned ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ── Credential storage (server-side encrypted persistence) ───────────────────

export async function storeCredentials(authAxios, apiKey, apiSecret) {
  const { data } = await authAxios.post(`${BASE}/store-credentials`, { apiKey, apiSecret });
  return data;
}

export async function getCredentials(authAxios) {
  const { data } = await authAxios.get(`${BASE}/get-credentials`);
  return data;
}
