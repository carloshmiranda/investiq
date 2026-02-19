export const config = { runtime: 'edge' };

import { DEGIRO_BASE, edgeJson, edgeOptions } from '../_lib/degiro.js';

/**
 * GET /api/degiro/health
 * Diagnostic endpoint — checks if trader.degiro.nl is reachable from this server,
 * and reports what the login endpoint returns (status code, content-type, body preview).
 * Safe to call without credentials.
 */
export default async function handler(req) {
  if (req.method === 'OPTIONS') return edgeOptions();

  const checks = {};

  // 1. DNS / basic connectivity: HEAD the homepage
  try {
    const start = Date.now();
    const r = await fetch(`${DEGIRO_BASE}/`, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    checks.homepage = {
      ok: true,
      status: r.status,
      latencyMs: Date.now() - start,
    };
  } catch (e) {
    checks.homepage = { ok: false, error: e.message };
  }

  // 2. POST to login endpoint with empty body — check what format it returns
  try {
    const start = Date.now();
    const r = await fetch(`${DEGIRO_BASE}/login/secure/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://trader.degiro.nl',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      body: JSON.stringify({ username: 'healthcheck', password: 'healthcheck', isPassCodeReset: false, isRedirectToMobile: false }),
      signal: AbortSignal.timeout(8000),
    });
    const contentType = r.headers.get('content-type') ?? 'unknown';
    const body = await r.text();
    let bodyJson = null;
    try { bodyJson = JSON.parse(body); } catch {}

    checks.loginEndpoint = {
      ok: true,
      status: r.status,
      contentType,
      latencyMs: Date.now() - start,
      isJson: bodyJson !== null,
      bodyPreview: body.slice(0, 500),
      degiroStatus: bodyJson?.status ?? null,
      degiroStatusText: bodyJson?.statusText ?? null,
    };
  } catch (e) {
    checks.loginEndpoint = { ok: false, error: e.message };
  }

  // 3. Runtime info
  checks.runtime = {
    runtime: 'edge',
    hasFetch: typeof fetch !== 'undefined',
    timestamp: new Date().toISOString(),
  };

  const allOk = Object.values(checks).every((c) => c.ok !== false);
  return edgeJson({ allOk, checks }, allOk ? 200 : 502);
}
