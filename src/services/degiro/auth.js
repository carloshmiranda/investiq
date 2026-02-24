const BASE = '/api/degiro';
const DEGIRO_BASE = 'https://trader.degiro.nl';

export class DegiroError extends Error {
  constructor(message, httpStatus, code) {
    super(message);
    this.name = 'DegiroError';
    this.httpStatus = httpStatus;
    this.code = code;
    this.isSessionExpired = httpStatus === 401;
    this.isMaintenance = false;
  }
}

// Tier 1: Direct browser fetch to DeGiro (bypasses WAF if CORS allows it)
async function clientLogin(username, password, { withTOTP = false, oneTimePassword } = {}) {
  const loginUrl = withTOTP
    ? `${DEGIRO_BASE}/login/secure/login/totp`
    : `${DEGIRO_BASE}/login/secure/login`;

  const loginBody = {
    username,
    password,
    isPassCodeReset: false,
    isRedirectToMobile: false,
    queryParams: {},
    ...(withTOTP ? { oneTimePassword } : {}),
  };

  // This will throw TypeError if CORS preflight is blocked
  const loginRes = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(loginBody),
    credentials: 'omit',
  });

  const loginData = await loginRes.json();

  if (loginData.statusCode === 6) return { requiresTOTP: true };

  if (!loginRes.ok) {
    throw new DegiroError(loginData.message || loginData.statusText || 'Login failed', loginRes.status);
  }

  const sessionId = loginData.sessionId;
  if (!sessionId) throw new DegiroError('No session returned from DeGiro', 500);

  // Client-side login succeeded — config/clientInfo will be fetched server-side
  // via the store-session endpoint (browser can't set Cookie headers cross-origin)
  return { sessionId, username, _clientSide: true };
}

// Tier 2: Server-side login via authAxios (existing proxy flow)
async function serverLogin(authAxios, username, password, { withTOTP = false, oneTimePassword } = {}) {
  const url = withTOTP ? `${BASE}/totp` : `${BASE}/login`;
  const body = withTOTP
    ? { username, password, oneTimePassword }
    : { username, password };
  const { data } = await authAxios.post(url, body);
  return data;
}

export async function login(authAxios, username, password) {
  // Tier 1: try client-side direct fetch
  try {
    return await clientLogin(username, password);
  } catch (err) {
    // CORS block → TypeError; other failures also fall through
    console.warn('[DeGiro] Client-side login failed, trying server-side:', err.message);
  }

  // Tier 2: server-side proxy
  try {
    return await serverLogin(authAxios, username, password);
  } catch (err) {
    const data = err.response?.data || {};
    if (data.code === 'WAF_BLOCKED') {
      throw new DegiroError(
        'DeGiro blocked the connection. Use "Manual Session" to connect.',
        503,
        'WAF_BLOCKED'
      );
    }
    throw new DegiroError(
      data.debug || data.error || 'Login failed',
      err.response?.status || 500,
      data.code
    );
  }
}

export async function loginTOTP(authAxios, username, password, oneTimePassword) {
  // Tier 1: try client-side direct fetch
  try {
    return await clientLogin(username, password, { withTOTP: true, oneTimePassword });
  } catch (err) {
    console.warn('[DeGiro] Client-side TOTP failed, trying server-side:', err.message);
  }

  // Tier 2: server-side proxy
  try {
    return await serverLogin(authAxios, username, password, { withTOTP: true, oneTimePassword });
  } catch (err) {
    const data = err.response?.data || {};
    if (data.code === 'WAF_BLOCKED') {
      throw new DegiroError(
        'DeGiro blocked the connection. Use "Manual Session" to connect.',
        503,
        'WAF_BLOCKED'
      );
    }
    throw new DegiroError(
      data.debug || data.error || 'TOTP verification failed',
      err.response?.status || 500,
      data.code
    );
  }
}

// Store a session obtained client-side or manually via the backend
export async function storeSession(authAxios, sessionId, username) {
  try {
    const { data } = await authAxios.post(`${BASE}/store-session`, { sessionId, username });
    return data;
  } catch (err) {
    const data = err.response?.data || {};
    throw new DegiroError(
      data.error || data.debug || 'Failed to store session',
      err.response?.status || 500
    );
  }
}
