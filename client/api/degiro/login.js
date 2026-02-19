export const config = { runtime: 'edge' };

import { degiroLogin, degiroGetClient, DEGIRO_STATUS, edgeJson, edgeOptions } from '../_lib/degiro.js';

export default async function handler(req) {
  if (req.method === 'OPTIONS') return edgeOptions();
  if (req.method !== 'POST') return edgeJson({ error: 'Method not allowed' }, 405);

  let username, password;
  try {
    ({ username, password } = await req.json());
  } catch {
    return edgeJson({ error: 'Invalid JSON body' }, 400);
  }

  if (!username || !password) {
    return edgeJson({ error: 'username and password are required' }, 400);
  }

  try {
    const loginResult = await degiroLogin(username, password);

    if (loginResult.requiresTOTP) {
      return edgeJson({ requiresTOTP: true });
    }

    if (loginResult.status !== DEGIRO_STATUS.SUCCESS) {
      const msg =
        loginResult.status === DEGIRO_STATUS.AUTH_FAILED
          ? 'Invalid username or password'
          : `DeGiro rejected login (status ${loginResult.status}: ${loginResult.statusText})`;
      return edgeJson({ error: msg, code: loginResult.status }, 401);
    }

    const client = await degiroGetClient(loginResult.sessionId);

    return edgeJson({
      sessionId: loginResult.sessionId,
      intAccount: client.intAccount,
      userId: client.id,
      username: client.username || username,
      firstName: client.firstContact?.firstName ?? null,
      lastName: client.firstContact?.lastName ?? null,
      email: client.email ?? null,
    });

  } catch (err) {
    const isAuthError = err.message.includes('HTTP 401') || err.message.includes('HTTP 403');
    const isNetwork = err.message.startsWith('Network error');

    return edgeJson({
      error: isAuthError
        ? 'Invalid username or password'
        : isNetwork
          ? `Cannot reach DeGiro: ${err.message}`
          : err.message,
      debug: err.message,
    }, isAuthError ? 401 : 502);
  }
}
