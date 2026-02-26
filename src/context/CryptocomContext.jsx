import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as cryptocomApi from '../services/cryptocom/api.js';
import { buildPriceMap, mapBalance, mapStakingPosition, separateTransactions } from '../services/cryptocom/mapper.js';

const CryptocomContext = createContext(null);

const INITIAL_STATE = {
  connected: false,
  syncing: false,
  error: null,
  holdings: [],
  trades: [],
  dividends: [],
  assetCount: 0,
  totalValue: 0,
  lastSync: null,
  account: null,
};

export function CryptocomProvider({ children }) {
  const { authAxios, user } = useAuth();
  const [state, setState] = useState(INITIAL_STATE);

  // Check connection status on mount
  useEffect(() => {
    if (!user) return;
    cryptocomApi.getStatus(authAxios)
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

  // ── Connect with API key + secret ─────────────────────────────────────────
  const connect = useCallback(async (apiKey, apiSecret) => {
    setState((prev) => ({ ...prev, error: null, syncing: true }));
    try {
      const result = await cryptocomApi.connect(authAxios, apiKey, apiSecret);
      setState((prev) => ({
        ...prev,
        connected: true,
        account: result.account,
        assetCount: result.account?.assetCount || 0,
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
      const [balances, rawTrades, prices] = await Promise.all([
        cryptocomApi.getBalances(authAxios),
        cryptocomApi.getHistory(authAxios),
        cryptocomApi.getPrices(authAxios),
      ]);

      // Build price map for USD valuation
      const priceMap = buildPriceMap(prices);

      // Map spot balances (only available portion, excluding staked)
      const spotHoldings = balances.map((b) => mapBalance(b, priceMap));

      // Map staking positions (from staked field)
      const stakingHoldings = balances
        .map((b) => mapStakingPosition(b, priceMap))
        .filter(Boolean);

      const holdings = [...spotHoldings, ...stakingHoldings];
      const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
      const { trades, rewards } = separateTransactions(rawTrades, priceMap);

      setState((prev) => ({
        ...prev,
        holdings,
        trades,
        dividends: rewards,
        assetCount: holdings.length,
        totalValue,
        lastSync: new Date().toISOString(),
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
      await cryptocomApi.disconnect(authAxios);
    } catch { /* best effort */ }
    setState(INITIAL_STATE);
  }, [authAxios]);

  return (
    <CryptocomContext.Provider value={{ ...state, connect, sync, disconnect }}>
      {children}
    </CryptocomContext.Provider>
  );
}

export function useCryptocom() {
  const ctx = useContext(CryptocomContext);
  if (!ctx) throw new Error('useCryptocom must be used within <CryptocomProvider>');
  return ctx;
}
