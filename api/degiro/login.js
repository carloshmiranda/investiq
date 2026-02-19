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

    // 2FA required — return flag so frontend can show TOTP field
    if (loginResult.requiresTOTP) {
      return res.status(200).json({ requiresTOTP: true });
    }

    if (loginResult.status !== DEGIRO_STATUS.SUCCESS) {
      const msg =
        loginResult.status === DEGIRO_STATUS.AUTH_FAILED
          ? 'Invalid username or password'
          : `DeGiro login error (status ${loginResult.status})`;
      return res.status(401).json({ error: msg, code: loginResult.status });
    }

    // Fetch account details
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
    console.error('[degiro/login]', err.message);
    return res.status(502).json({
      error: 'Could not reach DeGiro. They may be under maintenance.',
      message: err.message,
    });
  }
}
