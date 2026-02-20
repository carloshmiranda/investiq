/**
 * Build a price map from Crypto.com ticker data.
 * Returns { BTC: 65000, ETH: 3500, ... }
 */
export function buildPriceMap(prices) {
  const map = {};
  for (const p of prices) {
    map[p.symbol] = parseFloat(p.price) || 0;
  }
  return map;
}

/**
 * Get USD price for an asset. Stablecoins resolve to 1.
 */
export function getUsdPrice(currency, priceMap) {
  const stablecoins = ['USD', 'USDT', 'USDC', 'TUSD', 'DAI', 'BUSD'];
  if (stablecoins.includes(currency)) return 1;
  return priceMap[currency] || 0;
}

/**
 * Map a Crypto.com balance to InvestIQ holding format.
 */
export function mapBalance(balance, priceMap) {
  const price = getUsdPrice(balance.currency, priceMap);
  const quantity = balance.available || balance.total || 0;
  return {
    id: `cryptocom-${balance.currency}`,
    source: 'cryptocom',
    broker: 'Crypto.com',
    ticker: balance.currency,
    name: balance.currency,
    isin: '',
    type: 'Crypto',
    sector: 'Cryptocurrency',
    quantity,
    price,
    value: quantity * price,
    currency: 'USD',
    annualIncome: 0,
    yieldPercent: 0,
    frequency: 'Unknown',
    nextPayDate: 'N/A',
    safetyRating: 'C',
    logoColor: '#002d74',
    breakEvenPrice: 0,
    costBasis: 0,
    unrealizedPnL: 0,
    unrealizedPnLPct: 0,
    available: balance.available,
    staked: balance.staked,
  };
}

/**
 * Map a staking balance (staked > 0) to a separate earn holding.
 */
export function mapStakingPosition(balance, priceMap) {
  if (balance.staked <= 0) return null;

  const price = getUsdPrice(balance.currency, priceMap);
  return {
    id: `cryptocom-stake-${balance.currency}`,
    source: 'cryptocom',
    broker: 'Crypto.com Earn',
    ticker: balance.currency,
    name: `${balance.currency} (Staked)`,
    isin: '',
    type: 'Crypto',
    sector: 'Staking',
    quantity: balance.staked,
    price,
    value: balance.staked * price,
    currency: 'USD',
    annualIncome: 0,
    yieldPercent: 0,
    frequency: 'Daily',
    nextPayDate: 'N/A',
    safetyRating: 'C',
    logoColor: '#002d74',
    breakEvenPrice: 0,
    costBasis: 0,
    unrealizedPnL: 0,
    unrealizedPnLPct: 0,
    earnType: 'staking',
  };
}

/**
 * Map a Crypto.com trade to InvestIQ income event.
 */
export function mapTrade(trade) {
  return {
    date: new Date(trade.create_time || trade.update_time).toISOString(),
    ticker: trade.instrument_name || '',
    name: trade.instrument_name || '',
    amount: parseFloat(trade.fees || 0),
    currency: trade.fee_currency || 'USD',
    type: 'Trade',
    source: 'cryptocom',
    side: trade.side,
    quantity: parseFloat(trade.traded_quantity || 0),
    price: parseFloat(trade.traded_price || 0),
  };
}

/**
 * Merge holdings — deduplicate by id.
 */
export function mergeHoldings(existing, cryptocomHoldings) {
  const existingIds = new Set(existing.map((h) => h.id));
  const unique = cryptocomHoldings.filter((h) => !existingIds.has(h.id));
  return [...existing, ...unique];
}
