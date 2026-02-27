/**
 * Shared income classifier — single source of truth.
 * Classifies by the `type` field of the income record, NOT by broker source.
 *
 * Two categories:
 *   - dividends:    stock/ETF dividends and dividend tax
 *   - yield:        staking rewards, earn interest, airdrops, referral bonuses
 */

const DIVIDEND_KEYS = ['dividend', 'dividend tax'];

export function classifyIncome(record) {
  const type = (record.type || '').toLowerCase();
  if (DIVIDEND_KEYS.some((k) => type.includes(k))) return 'dividends';
  return 'yield';
}

export const INCOME_CATEGORIES = {
  dividends: { label: 'Dividends', color: '#10b981' },
  yield:     { label: 'Yield',     color: '#06b6d4' },
};
