const BASE = '/api/degiro';

export async function login(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Prefer `debug` field (the raw server-side error) for diagnosing proxy issues
    const msg = data.debug || data.error || 'Login failed';
    throw new DegiroError(msg, res.status, data.code);
  }

  return data;
}

export async function loginTOTP(username, password, oneTimePassword) {
  const res = await fetch(`${BASE}/totp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, oneTimePassword }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.debug || data.error || 'TOTP verification failed';
    throw new DegiroError(msg, res.status, data.code);
  }

  return data;
}

export class DegiroError extends Error {
  constructor(message, httpStatus, code) {
    super(message);
    this.name = 'DegiroError';
    this.httpStatus = httpStatus;
    this.code = code;
    this.isSessionExpired = httpStatus === 401;
    // Only mark as "maintenance" if we explicitly cannot reach the host at all
    this.isMaintenance = false;
  }
}
