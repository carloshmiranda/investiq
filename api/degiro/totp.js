import { degiroTOTP, degiroGetClient, DEGIRO_STATUS, parseBody, setCORSHeaders } from '../_lib/degiro.js';

export default async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password, oneTimePassword } = await parseBody(req);

  if (!username || !password || !oneTimePassword) {
    return res.status(400).json({ error: 'username, password, and oneTimePassword are required' });
  }

  try {
    const result = await degiroTOTP(username, password, oneTimePassword);

    if (result.status !== DEGIRO_STATUS.SUCCESS || !result.sessionId) {
      return res.status(401).json({
        error: 'Invalid TOTP code or credentials',
        code: result.status,
      });
    }

    const client = await degiroGetClient(result.sessionId);

    return res.status(200).json({
      sessionId: result.sessionId,
      intAccount: client.intAccount,
      userId: client.id,
      username: client.username || username,
      firstName: client.firstContact?.firstName ?? null,
      lastName: client.firstContact?.lastName ?? null,
    });
  } catch (err) {
    console.error('[degiro/totp]', err.message);
    return res.status(502).json({
      error: 'TOTP verification failed',
      message: err.message,
    });
  }
}
