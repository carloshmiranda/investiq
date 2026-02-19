/**
 * InvestIQ — Express dev proxy server (local development only)
 * Mirrors the Vercel serverless function routes so the Vite dev server
 * can proxy /api/* requests here during development.
 *
 * In production, Vercel handles /api/* via the api/ serverless functions.
 * This file is NOT deployed to Vercel.
 */

import express from 'express';
import cors from 'cors';
import {
  degiroLogin, degiroTOTP, degiroGetClient,
  degiroGetPortfolio, degiroGetProducts,
  degiroGetDividends, degiroGetTransactions,
  DEGIRO_STATUS,
} from '../api/_lib/degiro.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', server: 'InvestIQ Dev Proxy', port: PORT });
});

// ── POST /api/degiro/login ────────────────────────────────────────────────────
app.post('/api/degiro/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const loginResult = await degiroLogin(username, password);

    if (loginResult.requiresTOTP) {
      return res.json({ requiresTOTP: true });
    }

    if (loginResult.status !== DEGIRO_STATUS.SUCCESS) {
      const msg = loginResult.status === DEGIRO_STATUS.AUTH_FAILED
        ? 'Invalid username or password'
        : `DeGiro login error (status ${loginResult.status})`;
      return res.status(401).json({ error: msg, code: loginResult.status });
    }

    const client = await degiroGetClient(loginResult.sessionId);

    return res.json({
      sessionId: loginResult.sessionId,
      intAccount: client.intAccount,
      userId: client.id,
      username: client.username || username,
      firstName: client.firstContact?.firstName ?? null,
      lastName: client.firstContact?.lastName ?? null,
      email: client.email ?? null,
    });
  } catch (err) {
    console.error('[/api/degiro/login]', err.message);
    return res.status(502).json({
      error: 'Could not reach DeGiro. They may be under maintenance.',
      message: err.message,
    });
  }
});

// ── POST /api/degiro/totp ─────────────────────────────────────────────────────
app.post('/api/degiro/totp', async (req, res) => {
  const { username, password, oneTimePassword } = req.body;
  if (!username || !password || !oneTimePassword) {
    return res.status(400).json({ error: 'username, password, and oneTimePassword are required' });
  }

  try {
    const result = await degiroTOTP(username, password, oneTimePassword);
    if (result.status !== DEGIRO_STATUS.SUCCESS || !result.sessionId) {
      return res.status(401).json({ error: 'Invalid TOTP code', code: result.status });
    }

    const client = await degiroGetClient(result.sessionId);
    return res.json({
      sessionId: result.sessionId,
      intAccount: client.intAccount,
      userId: client.id,
      username: client.username || username,
      firstName: client.firstContact?.firstName ?? null,
      lastName: client.firstContact?.lastName ?? null,
    });
  } catch (err) {
    console.error('[/api/degiro/totp]', err.message);
    return res.status(502).json({ error: 'TOTP verification failed', message: err.message });
  }
});

// ── GET /api/degiro/portfolio ─────────────────────────────────────────────────
app.get('/api/degiro/portfolio', async (req, res) => {
  const { sessionId, intAccount } = req.query;
  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' });
  }

  try {
    const data = await degiroGetPortfolio(sessionId, Number(intAccount));
    return res.json(data);
  } catch (err) {
    console.error('[/api/degiro/portfolio]', err.message);
    if (err.message.includes('401') || err.message.includes('403')) {
      return res.status(401).json({ error: 'Session expired. Please reconnect.' });
    }
    return res.status(502).json({ error: 'Failed to fetch portfolio', message: err.message });
  }
});

// ── POST /api/degiro/products ─────────────────────────────────────────────────
app.post('/api/degiro/products', async (req, res) => {
  const { sessionId, intAccount } = req.query;
  const { productIds } = req.body;

  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' });
  }
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: 'productIds array is required' });
  }

  try {
    // Batch in 50s
    const BATCH = 50;
    const results = [];
    for (let i = 0; i < productIds.length; i += BATCH) {
      results.push(await degiroGetProducts(sessionId, Number(intAccount), productIds.slice(i, i + BATCH)));
    }
    return res.json(Object.assign({}, ...results));
  } catch (err) {
    console.error('[/api/degiro/products]', err.message);
    return res.status(502).json({ error: 'Failed to fetch product details', message: err.message });
  }
});

// ── GET /api/degiro/dividends ─────────────────────────────────────────────────
app.get('/api/degiro/dividends', async (req, res) => {
  const { sessionId, intAccount } = req.query;
  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' });
  }

  try {
    const data = await degiroGetDividends(sessionId, Number(intAccount));
    return res.json({ data });
  } catch (err) {
    console.error('[/api/degiro/dividends]', err.message);
    if (err.message.includes('503')) {
      return res.json({ data: [], warning: 'DeGiro under maintenance' });
    }
    return res.status(502).json({ error: 'Failed to fetch dividends', message: err.message });
  }
});

// ── GET /api/degiro/transactions ──────────────────────────────────────────────
app.get('/api/degiro/transactions', async (req, res) => {
  const { sessionId, intAccount, fromDate, toDate } = req.query;
  if (!sessionId || !intAccount) {
    return res.status(400).json({ error: 'sessionId and intAccount are required' });
  }

  // Default: last 12 months
  const now = new Date();
  const past = new Date(); past.setFullYear(past.getFullYear() - 1);
  const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

  try {
    const data = await degiroGetTransactions(
      sessionId, Number(intAccount),
      fromDate || fmt(past),
      toDate || fmt(now)
    );
    return res.json({ data });
  } catch (err) {
    console.error('[/api/degiro/transactions]', err.message);
    return res.status(502).json({ error: 'Failed to fetch transactions', message: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 InvestIQ Dev Proxy running on http://localhost:${PORT}`);
  console.log(`   Proxying DeGiro API requests → https://trader.degiro.nl\n`);
});
