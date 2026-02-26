/**
 * Shared income classifier — single source of truth.
 * Classifies by the `type` field of the income record, NOT by broker source.
 */

const KEYWORD_MAP = [
  { keys: ['dividend', 'dividend tax'], category: 'dividends' },
  { keys: ['staking', 'stake', 'supercharger', 'validator'], category: 'stakingRewards' },
  { keys: ['earn', 'yield', 'interest', 'savings'], category: 'yieldInterest' },
  { keys: ['distribution', 'airdrop', 'referral', 'rebate'], category: 'distributions' },
];

export function classifyIncome(record) {
  const type = (record.type || '').toLowerCase();

  for (const { keys, category } of KEYWORD_MAP) {
    if (keys.some((k) => type.includes(k))) return category;
  }

  return 'distributions'; // safe default for unknown income
}

export const INCOME_CATEGORIES = {
  dividends:      { label: 'Dividends',        color: '#10b981' },
  stakingRewards: { label: 'Staking Rewards',   color: '#06b6d4' },
  yieldInterest:  { label: 'Yield & Interest',  color: '#f59e0b' },
  distributions:  { label: 'Distributions',     color: '#8b5cf6' },
};
