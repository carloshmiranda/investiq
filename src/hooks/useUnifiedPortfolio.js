import { useMemo } from 'react';
import { useDegiro } from '../context/DegiroContext';
import { useTrading212 } from '../context/Trading212Context';
import { useBinance } from '../context/BinanceContext';
import { useCryptocom } from '../context/CryptocomContext';
import { useCurrency } from '../context/CurrencyContext';

const BROKER_COLORS = {
  degiro: { label: 'DeGiro', abbr: 'DG', color: '#ff6600' },
  trading212: { label: 'Trading 212', abbr: 'T2', color: '#2b6fea' },
  binance: { label: 'Binance', abbr: 'BN', color: '#f0b90b' },
  cryptocom: { label: 'Crypto.com', abbr: 'CC', color: '#002d74' },
};

function getMonthKey(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function useUnifiedPortfolio() {
  const degiro = useDegiro();
  const t212 = useTrading212();
  const binance = useBinance();
  const cryptocom = useCryptocom();
  const { rates } = useCurrency();

  return useMemo(() => {
    // ── Currency normalization — convert any currency to USD ────────────
    // rates = { USD: 1, EUR: 0.92, GBP: 0.79 } meaning 1 USD = X foreign
    const toUSD = (amount, fromCurrency) => {
      if (!fromCurrency || fromCurrency === 'USD') return amount;
      const rate = rates[fromCurrency];
      if (!rate || rate === 0) return amount; // unknown currency, pass through
      return amount / rate;
    };

    const normalizeHolding = (h) => {
      if (!h.currency || h.currency === 'USD') return h;
      return {
        ...h,
        price: toUSD(h.price, h.currency),
        value: toUSD(h.value, h.currency),
        costBasis: toUSD(h.costBasis, h.currency),
        breakEvenPrice: toUSD(h.breakEvenPrice, h.currency),
        unrealizedPnL: toUSD(h.unrealizedPnL, h.currency),
        originalCurrency: h.currency,
        currency: 'USD',
      };
    };

    // ── Merge holdings from all brokers ──────────────────────────────────
    const holdings = [
      ...degiro.positions,
      ...t212.positions,
      ...binance.holdings,
      ...cryptocom.holdings,
    ].map(normalizeHolding);

    // ── Merge dividends from all brokers, sorted date desc ───────────────
    const dividends = [
      ...degiro.dividends,
      ...t212.dividends,
      ...binance.dividends,
      ...(cryptocom.trades || []).filter((t) => t.type === 'Dividend' || t.type === 'Staking' || t.type === 'Earn'),
    ].map((d) => {
      if (!d.currency || d.currency === 'USD') return d;
      return { ...d, amount: toUSD(d.amount, d.currency), currency: 'USD' };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    // ── Core metrics ─────────────────────────────────────────────────────
    const totalValue = holdings.reduce((sum, h) => sum + (h.value || 0), 0);
    const annualIncome = holdings.reduce((sum, h) => sum + (h.annualIncome || 0), 0);
    const monthlyIncome = annualIncome / 12;
    const overallYield = totalValue > 0 ? (annualIncome / totalValue) * 100 : 0;

    // ── Income history — group dividends by month (last 12) ──────────────
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const monthBuckets = {};
    dividends.forEach((d) => {
      const dDate = new Date(d.date);
      if (dDate < twelveMonthsAgo) return;
      const key = getMonthKey(d.date);
      if (!monthBuckets[key]) {
        monthBuckets[key] = { month: key, dividends: 0, staking: 0, yield: 0, interest: 0, total: 0 };
      }
      const bucket = monthBuckets[key];
      const amt = d.amount || 0;
      const type = (d.type || '').toLowerCase();
      if (type.includes('stak')) {
        bucket.staking += amt;
      } else if (type.includes('yield') || type.includes('earn')) {
        bucket.yield += amt;
      } else if (type.includes('interest')) {
        bucket.interest += amt;
      } else {
        bucket.dividends += amt;
      }
      bucket.total += amt;
    });

    // Build ordered array for last 12 months (fill gaps with zeros)
    const incomeHistory = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      incomeHistory.push(monthBuckets[key] || { month: key, dividends: 0, staking: 0, yield: 0, interest: 0, total: 0 });
    }

    // ── Income projections — simple extrapolation from last 3 months ─────
    const last3 = incomeHistory.slice(-3);
    const avg3 = last3.reduce((s, m) => s + m.total, 0) / Math.max(last3.filter((m) => m.total > 0).length, 1);
    const hasEnoughHistory = last3.some((m) => m.total > 0);

    const incomeProjections = hasEnoughHistory
      ? Array.from({ length: 12 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() + 1 + i, 1);
          const month = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          return {
            month,
            conservative: Math.round(avg3 * (1 + 0.02 * i)),
            optimistic: Math.round(avg3 * (1 + 0.05 * i)),
          };
        })
      : [];

    // ── Upcoming payments — holdings with nextPayDate in the future ──────
    const todayStr = now.toISOString().slice(0, 10);
    const upcomingPayments = holdings
      .filter((h) => h.nextPayDate && h.nextPayDate !== 'N/A' && h.nextPayDate >= todayStr)
      .map((h) => ({
        date: h.nextPayDate,
        ticker: h.ticker,
        name: h.name,
        amount: h.annualIncome ? h.annualIncome / (h.frequency === 'Monthly' ? 1 : h.frequency === 'Weekly' ? 1 / 4.33 : h.frequency === 'Daily' ? 1 / 30 : 4) : 0,
        type: (h.type || '').includes('Stak') ? 'Staking' : (h.type || '').includes('Earn') ? 'Yield' : 'Dividend',
        frequency: h.frequency || 'N/A',
        source: h.source || h.broker,
      }))
      .filter((p) => p.amount > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // ── Health score — based on real data ────────────────────────────────
    const sectors = {};
    holdings.forEach((h) => {
      const sector = h.sector || h.type || 'Other';
      sectors[sector] = (sectors[sector] || 0) + (h.value || 0);
    });
    const sectorCount = Object.keys(sectors).length;
    const maxConcentration = totalValue > 0 ? Math.max(...Object.values(sectors)) / totalValue : 1;
    const diversificationScore = Math.min(100, sectorCount * 12 - maxConcentration * 50);

    const brokerSources = new Set(holdings.map((h) => h.source || h.broker).filter(Boolean));
    const brokerBonus = Math.min(20, brokerSources.size * 10);

    const avgYield = totalValue > 0
      ? holdings.reduce((s, h) => s + (h.yieldPercent || 0) * ((h.value || 0) / totalValue), 0)
      : 0;
    const yieldScore = Math.min(100, avgYield * 20);

    const safetyScore = 70; // Neutral default — real safety ratings not consistently available across brokers
    const healthOverall = holdings.length > 0
      ? Math.round((diversificationScore + brokerBonus) * 0.35 + safetyScore * 0.4 + yieldScore * 0.25)
      : 0;

    const healthScore = {
      overall: healthOverall,
      diversification: Math.round(Math.min(100, diversificationScore + brokerBonus)),
      safety: safetyScore,
      yield: Math.round(yieldScore),
      sectors,
    };

    // ── Connected brokers info ───────────────────────────────────────────
    const connectedBrokers = [];
    if (degiro.connected) connectedBrokers.push({ ...BROKER_COLORS.degiro, positions: degiro.positions.length });
    if (t212.connected) connectedBrokers.push({ ...BROKER_COLORS.trading212, positions: t212.positions.length });
    if (binance.connected) connectedBrokers.push({ ...BROKER_COLORS.binance, positions: binance.holdings.length });
    if (cryptocom.connected) connectedBrokers.push({ ...BROKER_COLORS.cryptocom, positions: cryptocom.holdings.length });

    const syncing = degiro.syncing || t212.syncing || binance.syncing || cryptocom.syncing;
    const connectedCount = connectedBrokers.length;
    const isEmpty = connectedCount === 0;

    // ── Allocation by type (for pie charts) ──────────────────────────────
    const allocationByType = {};
    holdings.forEach((h) => {
      const type = h.type || 'Other';
      allocationByType[type] = (allocationByType[type] || 0) + (h.value || 0);
    });

    // ── Source filters (dynamic) ─────────────────────────────────────────
    const sourceOptions = ['All', ...new Set(holdings.map((h) => h.source || h.broker).filter(Boolean))];

    return {
      holdings,
      dividends,
      totalValue,
      annualIncome,
      monthlyIncome,
      overallYield,
      incomeHistory,
      incomeProjections,
      upcomingPayments,
      healthScore,
      syncing,
      connectedCount,
      connectedBrokers,
      isEmpty,
      allocationByType,
      sectors,
      sourceOptions,
    };
  }, [
    degiro.positions, degiro.dividends, degiro.connected, degiro.syncing,
    t212.positions, t212.dividends, t212.connected, t212.syncing,
    binance.holdings, binance.dividends, binance.connected, binance.syncing,
    cryptocom.holdings, cryptocom.trades, cryptocom.connected, cryptocom.syncing,
    rates,
  ]);
}
