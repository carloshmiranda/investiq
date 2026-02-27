import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import * as binanceApi from '../services/binance/api.js';
import {
  buildPriceMap, mapBalance, mapFlexibleEarn, mapLockedEarn,
  mapDividend, mapEarnReward, isDividendIncome,
} from '../services/binance/mapper.js';

const BinanceContext = createContext(null);

const INITIAL_STATE = {
  connected: false,
  syncing: false,
  error: null,
  holdings: [],
  dividends: [],
  assetCount: 0,
  totalValue: 0,
  lastSync: null,
  account: null,
};

export function BinanceProvider({ children }) {
  const { authAxios, user } = useAuth();
  const [state, setState] = useState(INITIAL_STATE);

  // Check connection status on mount
  useEffect(() => {
    if (!user) return;
    binanceApi.getStatus(authAxios)
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
    if (state.connected && state.holdings.length === 0 && !state.syncing) {
      sync();
    }
  }, [state.connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Connect with API key + secret (server-side validation + storage) ───────
  const connect = useCallback(async (apiKey, apiSecret) => {
    setState((prev) => ({ ...prev, error: null, syncing: true }));
    try {
      const result = await binanceApi.connect(authAxios, apiKey, apiSecret);

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
      const msg = err.response?.data?.error || err.message || 'Connection failed';
      setState((prev) => ({ ...prev, syncing: false, error: msg }));
      throw new Error(msg);
    }
  }, [authAxios]);

  // ── Sync portfolio (server-side data fetching, client-side mapping) ────────
  const sync = useCallback(async () => {
    if (!state.connected) return;
    setState((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      const [balances, earn, divData, prices] = await Promise.all([
        binanceApi.getBalances(authAxios),
        binanceApi.getEarn(authAxios),
        binanceApi.getDividends(authAxios),
        binanceApi.getPrices(authAxios),
      ]);

      const priceMap = buildPriceMap(prices);

      // Map spot balances (filter LD* tokens — they're earn wrappers)
      const spotHoldings = balances
        .filter((b) => !b.asset.startsWith('LD'))
        .map((b) => mapBalance(b, priceMap));

      // Map earn positions
      const flexHoldings = (earn.flexible || []).map((p) => mapFlexibleEarn(p, priceMap));
      const lockedHoldings = (earn.locked || []).map((p) => mapLockedEarn(p, priceMap));

      const holdings = [...spotHoldings, ...flexHoldings, ...lockedHoldings];
      const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

      // Map dividends + earn rewards (convert to USD), deduplicate by asset+date+amount
      const allIncome = [
        ...(divData.dividends || []).filter(isDividendIncome).map((d) => mapDividend(d, priceMap)),
        ...(divData.earnRewards || []).map((r) => mapEarnReward(r, priceMap)),
      ];
      const seen = new Set();
      const dividends = allIncome
        .filter((d) => {
          const key = `${d.ticker}-${d.date?.split('T')[0]}-${(d.rawAmount || d.amount).toFixed(8)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setState((prev) => ({
        ...prev,
        holdings,
        dividends,
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
        error: err.response?.data?.error || err.message || 'Sync failed',
      }));
    }
  }, [authAxios, state.connected]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try {
      await binanceApi.disconnect(authAxios);
    } catch { /* best effort */ }
    setState(INITIAL_STATE);
  }, [authAxios]);

  return (
    <BinanceContext.Provider value={{ ...state, connect, sync, disconnect }}>
      {children}
    </BinanceContext.Provider>
  );
}

export function useBinance() {
  const ctx = useContext(BinanceContext);
  if (!ctx) throw new Error('useBinance must be used within <BinanceProvider>');
  return ctx;
}
