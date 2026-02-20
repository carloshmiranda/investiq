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
function getUsdPrice(asset, priceMap) {
  const stables = ['USDT', 'USDC', 'BUSD', 'FDUSD', 'TUSD', 'DAI'];
  if (stables.includes(asset) || asset === 'USD') return 1;

  for (const quote of ['USDT', 'USDC', 'BUSD', 'FDUSD']) {
    const key = `${asset}${quote}`;
    if (priceMap[key]) return priceMap[key];
  }
  return 0;
}

/**
 * Map a Binance spot balance to InvestIQ holding format.
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
 * Map a flexible Simple Earn position to InvestIQ holding format.
 */
export function mapFlexibleEarn(pos, priceMap) {
  const asset = pos.asset;
  const amount = parseFloat(pos.totalAmount || 0);
  const price = getUsdPrice(asset, priceMap);

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
    value: amount * price,
    currency: 'USD',
    annualIncome: 0,
    yieldPercent: parseFloat(pos.latestAnnualPercentageRate || 0) * 100,
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
 * Map a locked Simple Earn position to InvestIQ holding format.
 */
export function mapLockedEarn(pos, priceMap) {
  const asset = pos.asset;
  const amount = parseFloat(pos.amount || 0);
  const price = getUsdPrice(asset, priceMap);

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
    value: amount * price,
    currency: 'USD',
    annualIncome: 0,
    yieldPercent: parseFloat(pos.apy || 0) * 100,
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
 * Map Binance asset dividend record to InvestIQ income event.
 */
export function mapDividend(div) {
  return {
    date: new Date(div.divTime).toISOString(),
    ticker: div.asset,
    name: div.asset,
    amount: parseFloat(div.amount),
    currency: 'USD',
    type: div.enInfo || 'Distribution',
    source: 'binance',
  };
}

/**
 * Map Binance Simple Earn reward to InvestIQ income event.
 */
export function mapEarnReward(reward) {
  return {
    date: new Date(reward.time).toISOString(),
    ticker: reward.asset,
    name: reward.asset,
    amount: parseFloat(reward.rewards || 0),
    currency: 'USD',
    type: 'Staking Reward',
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
