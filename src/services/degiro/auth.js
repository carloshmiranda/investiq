const BASE = '/api/degiro';

export async function login(authAxios, username, password) {
  try {
    const { data } = await authAxios.post(`${BASE}/login`, { username, password });
    return data;
  } catch (err) {
    const data = err.response?.data || {};
    const msg = data.debug || data.error || 'Login failed';
    throw new DegiroError(msg, err.response?.status || 500, data.code);
  }
}

export async function loginTOTP(authAxios, username, password, oneTimePassword) {
  try {
    const { data } = await authAxios.post(`${BASE}/totp`, { username, password, oneTimePassword });
    return data;
  } catch (err) {
    const data = err.response?.data || {};
    const msg = data.debug || data.error || 'TOTP verification failed';
    throw new DegiroError(msg, err.response?.status || 500, data.code);
  }
}

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
