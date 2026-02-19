/**
 * Frontend DeGiro auth service — calls /api/degiro/* proxy/serverless functions.
 * Never talks directly to DeGiro (CORS would block it anyway).
 */

const BASE = '/api/degiro';

/** Login with username + password. Returns session data or { requiresTOTP: true }. */
export async function login(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new DegiroError(data.error || 'Login failed', res.status, data.code);
  }

  return data; // { sessionId, intAccount, username, firstName } or { requiresTOTP: true }
}

/** TOTP (2FA) verification — called after login returns requiresTOTP: true */
export async function loginTOTP(username, password, oneTimePassword) {
  const res = await fetch(`${BASE}/totp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, oneTimePassword }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new DegiroError(data.error || 'TOTP verification failed', res.status, data.code);
  }

  return data; // { sessionId, intAccount, username, firstName }
}

export class DegiroError extends Error {
  constructor(message, httpStatus, code) {
    super(message);
    this.name = 'DegiroError';
    this.httpStatus = httpStatus;
    this.code = code;
    this.isSessionExpired = httpStatus === 401;
    this.isMaintenance = httpStatus === 502 || httpStatus === 503;
  }
}
