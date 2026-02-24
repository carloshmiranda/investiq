import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as binanceApi from '../services/binance/api.js';
import {
  buildPriceMap, mapBalance, mapFlexibleEarn, mapLockedEarn,
  mapDividend, mapEarnReward,
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
  const credsRef = useRef(null);

  // Check connection status on mount and restore credentials
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
          // Restore credentials for client-side API calls
          binanceApi.getCredentials(authAxios)
            .then((creds) => {
              if (creds.apiKey && creds.apiSecret) {
                credsRef.current = { apiKey: creds.apiKey, apiSecret: creds.apiSecret };
              }
            })
            .catch(() => { /* credentials not available */ });
        }
      })
      .catch(() => { /* not connected */ });
  }, [authAxios, user]);

  // ── Connect with API key + secret (client-side validation) ────────────────
  const connect = useCallback(async (apiKey, apiSecret) => {
    setState((prev) => ({ ...prev, error: null, syncing: true }));
    try {
      // Validate directly against Binance from the browser
      const result = await binanceApi.connectDirect(apiKey, apiSecret);

      // Store encrypted credentials server-side (no re-validation)
      await binanceApi.storeCredentials(authAxios, apiKey, apiSecret);

      // Keep creds in memory for sync calls
      credsRef.current = { apiKey, apiSecret };

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
      const msg = err.message || 'Connection failed';
      setState((prev) => ({ ...prev, syncing: false, error: msg }));
      throw new Error(msg);
    }
  }, [authAxios]);

  // ── Sync portfolio (client-side data fetching) ────────────────────────────
  const sync = useCallback(async () => {
    if (!state.connected) return;
    const creds = credsRef.current;
    if (!creds) {
      setState((prev) => ({ ...prev, error: 'No credentials available. Please reconnect.' }));
      return;
    }
    setState((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      const [balances, earn, divData, prices] = await Promise.all([
        binanceApi.getBalancesDirect(creds.apiKey, creds.apiSecret),
        binanceApi.getEarnDirect(creds.apiKey, creds.apiSecret),
        binanceApi.getDividendsDirect(creds.apiKey, creds.apiSecret),
        binanceApi.getPricesDirect(),
      ]);

      const priceMap = buildPriceMap(prices);

      // Map spot balances
      const spotHoldings = balances.map((b) => mapBalance(b, priceMap));

      // Map earn positions
      const flexHoldings = (earn.flexible || []).map((p) => mapFlexibleEarn(p, priceMap));
      const lockedHoldings = (earn.locked || []).map((p) => mapLockedEarn(p, priceMap));

      const holdings = [...spotHoldings, ...flexHoldings, ...lockedHoldings];
      const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

      // Map dividends + earn rewards
      const dividends = [
        ...(divData.dividends || []).map(mapDividend),
        ...(divData.earnRewards || []).map(mapEarnReward),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

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
        error: err.message || 'Sync failed',
      }));
    }
  }, [state.connected]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try {
      await binanceApi.disconnect(authAxios);
    } catch { /* best effort */ }
    credsRef.current = null;
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
