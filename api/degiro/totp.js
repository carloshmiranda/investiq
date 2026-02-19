export const config = { runtime: 'edge' };

import { degiroTOTP, degiroGetClient, DEGIRO_STATUS, edgeJson, edgeOptions } from '../_lib/degiro.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return edgeOptions();
  if (req.method !== 'POST') return edgeJson({ error: 'Method not allowed' }, 405);

  let username, password, oneTimePassword;
  try {
    ({ username, password, oneTimePassword } = await req.json());
  } catch {
    return edgeJson({ error: 'Invalid JSON body' }, 400);
  }

  if (!username || !password || !oneTimePassword) {
    return edgeJson({ error: 'username, password, and oneTimePassword are required' }, 400);
  }

  try {
    const result = await degiroTOTP(username, password, oneTimePassword);

    if (result.status !== DEGIRO_STATUS.SUCCESS || !result.sessionId) {
      return edgeJson({ error: 'Invalid TOTP code or credentials', code: result.status }, 401);
    }

    const client = await degiroGetClient(result.sessionId);

    return edgeJson({
      sessionId: result.sessionId,
      intAccount: client.intAccount,
      userId: client.id,
      username: client.username || username,
      firstName: client.firstContact?.firstName ?? null,
      lastName: client.firstContact?.lastName ?? null,
    });
  } catch (err) {
    return edgeJson({ error: 'TOTP verification failed', debug: err.message }, 502);
  }
}
