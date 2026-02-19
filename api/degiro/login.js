import { degiroLogin, degiroGetClient, DEGIRO_STATUS, parseBody, setCORSHeaders } from '../_lib/degiro.js';

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = await parseBody(req);
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const loginResult = await degiroLogin(username, password);

    if (loginResult.requiresTOTP) {
      return res.status(200).json({ requiresTOTP: true });
    }

    if (loginResult.status !== DEGIRO_STATUS.SUCCESS) {
      const msg =
        loginResult.status === DEGIRO_STATUS.AUTH_FAILED
          ? 'Invalid username or password'
          : `DeGiro rejected login (status ${loginResult.status}: ${loginResult.statusText})`;
      return res.status(401).json({ error: msg, code: loginResult.status });
    }

    const client = await degiroGetClient(loginResult.sessionId);

    return res.status(200).json({
      sessionId: loginResult.sessionId,
      intAccount: client.intAccount,
      userId: client.id,
      username: client.username || username,
      firstName: client.firstContact?.firstName ?? null,
      lastName: client.firstContact?.lastName ?? null,
      email: client.email ?? null,
    });

  } catch (err) {
    console.error('[degiro/login] ERROR:', err.message);

    // Surface the actual error message — never swallow it
    const isAuthError = err.message.includes('HTTP 401') || err.message.includes('HTTP 403');
    const isNetwork = err.message.startsWith('Network error');

    return res.status(isAuthError ? 401 : 502).json({
      error: isAuthError
        ? 'Invalid username or password'
        : isNetwork
          ? `Cannot reach DeGiro: ${err.message}`
          : err.message,          // <-- actual error, not a generic string
      debug: err.message,
    });
  }
}
