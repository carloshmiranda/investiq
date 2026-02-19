import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { login as apiLogin, loginTOTP as apiLoginTOTP, DegiroError } from '../services/degiro/auth.js';
import { fetchPortfolio, fetchProductDetails, fetchDividends } from '../services/degiro/portfolio.js';
import { mapPosition, mapDividend } from '../services/degiro/mapper.js';

const DegiroContext = createContext(null);

const INITIAL_STATE = {
  connected: false,
  syncing: false,
  error: null,
  sessionId: null,
  intAccount: null,
  userId: null,
  username: null,
  firstName: null,
  positions: [],
  dividends: [],
  cashFunds: [],
  positionCount: 0,
  lastSync: null,
};

export function DegiroProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);
  // Keep sessionId/intAccount in a ref too so callbacks always have latest values
  const sessionRef = useRef({ sessionId: null, intAccount: null });

  // ── Internal: sync portfolio after login ────────────────────────────────────
  const syncPortfolio = useCallback(async (sessionId, intAccount) => {
    setState((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      // 1. Fetch raw positions and cash
      const portfolioData = await fetchPortfolio(sessionId, intAccount);

      // 2. Extract PRODUCT positions only (not cashFunds which appear as positions too)
      // DeGiro uses nested {name, value} arrays — positionType is NOT a top-level property
      const productPositions = portfolioData.portfolio.filter(
        (p) => p.value?.find((v) => v.name === 'positionType')?.value === 'PRODUCT'
      );

      // 3. Fetch product details in bulk
      const productIds = productPositions
        .map((p) => p.value?.find((v) => v.name === 'id')?.value)
        .filter(Boolean);

      let productInfo = {};
      if (productIds.length > 0) {
        productInfo = await fetchProductDetails(sessionId, intAccount, productIds);
      }

      // 4. Map to InvestIQ format
      const positions = productPositions.map((p) => mapPosition(p, productInfo));

      // 5. Fetch dividend history
      let dividends = [];
      try {
        const rawDividends = await fetchDividends(sessionId, intAccount);
        dividends = rawDividends.map(mapDividend);
      } catch {
        // Dividends endpoint can fail silently (maintenance, permissions)
        dividends = [];
      }

      setState((prev) => ({
        ...prev,
        positions,
        dividends,
        cashFunds: portfolioData.cashFunds,
        positionCount: positions.length,
        lastSync: new Date().toISOString(),
        syncing: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        syncing: false,
        error: err instanceof DegiroError ? err.message : 'Portfolio sync failed',
        // If session expired, disconnect
        ...(err instanceof DegiroError && err.isSessionExpired
          ? { connected: false, sessionId: null, intAccount: null }
          : {}),
      }));
    }
  }, []);

  // ── connect: login + initial sync ──────────────────────────────────────────
  const connect = useCallback(async (username, password) => {
    setState((prev) => ({ ...prev, error: null }));
    const result = await apiLogin(username, password);

    if (result.requiresTOTP) {
      return { requiresTOTP: true };
    }

    sessionRef.current = { sessionId: result.sessionId, intAccount: result.intAccount };
    setState((prev) => ({
      ...prev,
      connected: true,
      sessionId: result.sessionId,
      intAccount: result.intAccount,
      userId: result.userId,
      username: result.username,
      firstName: result.firstName,
      error: null,
    }));

    await syncPortfolio(result.sessionId, result.intAccount);
    return { success: true };
  }, [syncPortfolio]);

  // ── connectTOTP: complete 2FA login ─────────────────────────────────────────
  const connectTOTP = useCallback(async (username, password, totp) => {
    setState((prev) => ({ ...prev, error: null }));
    const result = await apiLoginTOTP(username, password, totp);

    sessionRef.current = { sessionId: result.sessionId, intAccount: result.intAccount };
    setState((prev) => ({
      ...prev,
      connected: true,
      sessionId: result.sessionId,
      intAccount: result.intAccount,
      userId: result.userId,
      username: result.username,
      firstName: result.firstName,
      error: null,
    }));

    await syncPortfolio(result.sessionId, result.intAccount);
    return { success: true };
  }, [syncPortfolio]);

  // ── sync: manual refresh ────────────────────────────────────────────────────
  const sync = useCallback(() => {
    const { sessionId, intAccount } = sessionRef.current;
    if (!sessionId || !intAccount) return Promise.resolve();
    return syncPortfolio(sessionId, intAccount);
  }, [syncPortfolio]);

  // ── disconnect ──────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    sessionRef.current = { sessionId: null, intAccount: null };
    setState(INITIAL_STATE);
  }, []);

  return (
    <DegiroContext.Provider value={{ ...state, connect, connectTOTP, sync, disconnect }}>
      {children}
    </DegiroContext.Provider>
  );
}

export function useDegiro() {
  const ctx = useContext(DegiroContext);
  if (!ctx) throw new Error('useDegiro must be used within <DegiroProvider>');
  return ctx;
}
