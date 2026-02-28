import { isExcludedFromIncome } from '../../utils/incomeContract.js';

/**
 * Build a price lookup map from Binance ticker prices.
 * Returns { BTCUSDT: 65000.12, ETHUSDT: 3200.50, ... }
 */
export function buildPriceMap(prices) {
  const map = {};
  for (const p of prices) {
    map[p.symbol] = parseFloat(p.price);
  }
  return map;
}

/**
 * Get USD value for an asset using price map.
 * Tries ASSETUSDT, ASSETBUSD, ASSETUSDC; stablecoins return 1:1.
 */
export function getUsdPrice(asset, priceMap) {
  const stables = ['USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'DAI'];
  if (stables.includes(asset) || asset === 'USD') return 1;

  // Try direct lookup, then strip LD/B prefixes (Binance Lending/Staking wrappers)
  const variants = [asset];
  if (asset.startsWith('LD')) variants.push(asset.slice(2));
  if (asset === 'BETH') variants.push('ETH');

  for (const a of variants) {
    for (const quote of ['USDT', 'USDC', 'BUSD', 'FDUSD']) {
      const key = `${a}${quote}`;
      if (priceMap[key]) return priceMap[key];
    }
  }
  return 0;
}

/**
 * Map a Binance spot balance to Flolio holding format.
 */
export function mapBalance(balance, priceMap) {
  const price = getUsdPrice(balance.asset, priceMap);
  const value = balance.total * price;

  return {
    id: `binance-${balance.asset}`,
    source: 'binance',
    broker: 'Binance',
    ticker: balance.asset,
    name: balance.asset,
    isin: '',
    type: 'Crypto',
    sector: 'Cryptocurrency',
    quantity: balance.total,
    price,
    value,
    currency: 'USD',
    annualIncome: 0,
    yieldPercent: 0,
    frequency: 'Unknown',
    nextPayDate: 'N/A',
    safetyRating: 'C',
    logoColor: '#f0b90b',
    breakEvenPrice: 0,
    costBasis: 0,
    unrealizedPnL: 0,
    unrealizedPnLPct: 0,
    free: balance.free,
    locked: balance.locked,
  };
}

/**
 * Map a flexible Simple Earn position to Flolio holding format.
 */
export function mapFlexibleEarn(pos, priceMap) {
  const asset = pos.asset;
  const amount = parseFloat(pos.totalAmount || 0);
  const price = getUsdPrice(asset, priceMap);
  const value = amount * price;
  const yieldPercent = parseFloat(pos.latestAnnualPercentageRate || 0) * 100;

  return {
    id: `binance-earn-flex-${asset}`,
    source: 'binance',
    broker: 'Binance Earn',
    ticker: asset,
    name: `${asset} (Flexible)`,
    isin: '',
    type: 'Crypto',
    sector: 'Staking',
    quantity: amount,
    price,
    value,
    currency: 'USD',
    annualIncome: value * (yieldPercent / 100),
    yieldPercent,
    frequency: 'Daily',
    nextPayDate: 'N/A',
    safetyRating: 'C',
    logoColor: '#f0b90b',
    breakEvenPrice: 0,
    costBasis: 0,
    unrealizedPnL: 0,
    unrealizedPnLPct: 0,
    earnType: 'flexible',
  };
}

/**
 * Map a locked Simple Earn position to Flolio holding format.
 */
export function mapLockedEarn(pos, priceMap) {
  const asset = pos.asset;
  const amount = parseFloat(pos.amount || 0);
  const price = getUsdPrice(asset, priceMap);
  const value = amount * price;
  const yieldPercent = parseFloat(pos.apy || 0) * 100;

  return {
    id: `binance-earn-locked-${asset}-${pos.positionId || ''}`,
    source: 'binance',
    broker: 'Binance Earn',
    ticker: asset,
    name: `${asset} (Locked)`,
    isin: '',
    type: 'Crypto',
    sector: 'Staking',
    quantity: amount,
    price,
    value,
    currency: 'USD',
    annualIncome: value * (yieldPercent / 100),
    yieldPercent,
    frequency: 'Daily',
    nextPayDate: 'N/A',
    safetyRating: 'C',
    logoColor: '#f0b90b',
    breakEvenPrice: 0,
    costBasis: 0,
    unrealizedPnL: 0,
    unrealizedPnLPct: 0,
    earnType: 'locked',
  };
}

/**
 * Returns true if a Binance asset dividend record is actual income.
 * Only excludes principal movements (deposit, redeem, subscribe, etc.)
 * via the shared INCOME_EXCLUSIONS list. Earn interest distributions
 * (e.g. "Simple Earn Flexible Interest") are valid income.
 */
export function isDividendIncome(div) {
  const desc = (div.enInfo || '').toLowerCase();
  return !isExcludedFromIncome(desc);
}

/**
 * Map Binance asset dividend record to Flolio income event.
 * If priceMap is provided, converts token amount to USD value.
 */
export function mapDividend(div, priceMap) {
  const rawAmount = parseFloat(div.amount);
  const price = priceMap ? getUsdPrice(div.asset, priceMap) : 1;
  return {
    date: new Date(div.divTime).toISOString(),
    ticker: div.asset,
    name: div.asset,
    amount: rawAmount * price,
    rawAmount,
    currency: 'USD',
    type: div.enInfo || 'Distribution',
    source: 'binance',
  };
}

/**
 * Map Binance Simple Earn reward to Flolio income event.
 * If priceMap is provided, converts token amount to USD value.
 */
export function mapEarnReward(reward, priceMap) {
  const rawAmount = parseFloat(reward.rewards || 0);
  const price = priceMap ? getUsdPrice(reward.asset, priceMap) : 1;
  return {
    date: new Date(reward.time).toISOString(),
    ticker: reward.asset,
    name: reward.asset,
    amount: rawAmount * price,
    rawAmount,
    currency: 'USD',
    type: 'Yield',
    source: 'binance',
  };
}

/**
 * Merge holdings — deduplicate by id.
 */
export function mergeHoldings(existing, binanceHoldings) {
  const existingIds = new Set(existing.map((h) => h.id));
  const unique = binanceHoldings.filter((h) => !existingIds.has(h.id));
  return [...existing, ...unique];
}
