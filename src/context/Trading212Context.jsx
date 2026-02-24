import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as t212Api from '../services/trading212/api.js';
import { mapPosition, mapDividend, buildInstrumentMap } from '../services/trading212/mapper.js';

const Trading212Context = createContext(null);

const INITIAL_STATE = {
  connected: false,
  syncing: false,
  error: null,
  positions: [],
  dividends: [],
  positionCount: 0,
  lastSync: null,
  account: null,
};

export function Trading212Provider({ children }) {
  const { authAxios, user } = useAuth();
  const [state, setState] = useState(INITIAL_STATE);

  // Check connection status on mount and auto-sync if connected
  useEffect(() => {
    if (!user) return;
    t212Api.getStatus(authAxios)
      .then((status) => {
        if (status.connected) {
          setState((prev) => ({
            ...prev,
            connected: true,
            lastSync: status.lastSyncAt,
          }));
        }
      })
      .catch(() => { /* not connected */ });
  }, [authAxios, user]);

  // Auto-sync when connection state becomes true
  useEffect(() => {
    if (state.connected && state.positions.length === 0 && !state.syncing) {
      sync();
    }
  }, [state.connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Connect with API key ──────────────────────────────────────────────────
  const connect = useCallback(async (apiKey, apiSecret) => {
    setState((prev) => ({ ...prev, error: null, syncing: true }));
    try {
      const result = await t212Api.connect(authAxios, apiKey, apiSecret);
      setState((prev) => ({
        ...prev,
        connected: true,
        account: result.account,
        syncing: false,
        error: null,
      }));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.debug || err.response?.data?.error || 'Connection failed';
      setState((prev) => ({ ...prev, syncing: false, error: msg }));
      throw new Error(msg);
    }
  }, [authAxios]);

  // ── Sync portfolio ────────────────────────────────────────────────────────
  const sync = useCallback(async () => {
    if (!state.connected) return;
    setState((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      const [rawPositions, rawDividends, account, rawInstruments] = await Promise.all([
        t212Api.getPositions(authAxios),
        t212Api.getDividends(authAxios),
        t212Api.getAccount(authAxios),
        t212Api.getInstruments(authAxios).catch(() => []),
      ]);

      const instrumentMap = buildInstrumentMap(rawInstruments);
      const positions = rawPositions.map((p) => mapPosition(p, instrumentMap));
      const dividends = rawDividends.map((d) => mapDividend(d, instrumentMap));

      setState((prev) => ({
        ...prev,
        positions,
        dividends,
        positionCount: positions.length,
        lastSync: new Date().toISOString(),
        account: {
          totalValue: account.total,
          cash: account.free,
          invested: account.invested,
          result: account.ppl,
        },
        syncing: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        syncing: false,
        error: err.response?.data?.error || 'Sync failed',
      }));
    }
  }, [authAxios, state.connected]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try {
      await t212Api.disconnect(authAxios);
    } catch { /* best effort */ }
    setState(INITIAL_STATE);
  }, [authAxios]);

  return (
    <Trading212Context.Provider value={{ ...state, connect, sync, disconnect }}>
      {children}
    </Trading212Context.Provider>
  );
}

export function useTrading212() {
  const ctx = useContext(Trading212Context);
  if (!ctx) throw new Error('useTrading212 must be used within <Trading212Provider>');
  return ctx;
}
