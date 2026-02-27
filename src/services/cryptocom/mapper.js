import { isExcludedFromIncome } from '../../utils/incomeContract.js';

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
 * Map a Crypto.com balance to Accrue holding format.
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
 * Detect if a Crypto.com transaction is an income event (staking, earn, reward).
 */
const REWARD_TYPES = [
  'staking', 'stake', 'reward', 'earn', 'interest',
  'rebate', 'referral_bonus', 'supercharger',
];

function isRewardTransaction(trade) {
  const desc = ((trade.description || '') + ' ' + (trade.journal_type || '') + ' ' + (trade.transaction_type || '')).toLowerCase();
  if (isExcludedFromIncome(desc)) return false;
  return REWARD_TYPES.some((t) => desc.includes(t));
}

function classifyRewardType() {
  return 'Yield';
}

/**
 * Map a Crypto.com reward/earn/staking transaction to Accrue income event.
 */
export function mapReward(trade, priceMap) {
  const currency = trade.currency || trade.fee_currency || '';
  const amount = Math.abs(parseFloat(trade.amount || trade.native_amount || 0));
  const price = priceMap ? getUsdPrice(currency, priceMap) : 1;
  return {
    date: new Date(trade.create_time || trade.update_time || trade.timestamp).toISOString(),
    ticker: currency,
    name: currency,
    amount: amount * price,
    currency: 'USD',
    type: classifyRewardType(trade),
    source: 'cryptocom',
  };
}

/**
 * Map a Crypto.com trade to Accrue trade event.
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
 * Separate raw transactions into trades and rewards.
 */
export function separateTransactions(rawTrades, priceMap) {
  const trades = [];
  const rewards = [];
  for (const t of rawTrades) {
    if (isRewardTransaction(t)) {
      rewards.push(mapReward(t, priceMap));
    } else {
      trades.push(mapTrade(t));
    }
  }
  return { trades, rewards };
}

/**
 * Merge holdings — deduplicate by id.
 */
export function mergeHoldings(existing, cryptocomHoldings) {
  const existingIds = new Set(existing.map((h) => h.id));
  const unique = cryptocomHoldings.filter((h) => !existingIds.has(h.id));
  return [...existing, ...unique];
}
