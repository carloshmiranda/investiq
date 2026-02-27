/**
 * Income Integration Contract
 *
 * Every broker integration MUST follow these rules for income records:
 *
 * 1. ONLY return actual yield/dividend payments received
 * 2. NEVER return: deposits into earn, redemptions, unstaking, swaps, trades
 * 3. Each record must have: { date, ticker, name, amount, currency, type, source }
 * 4. The `type` field must describe the income kind (e.g., 'Dividend', 'Staking Reward',
 *    'Earn Interest', 'Distribution') — NOT the holding mechanism
 * 5. The `amount` field must be the actual yield received, not the principal
 */

// Shared exclusion keywords — if a transaction description matches these,
// it is NOT income regardless of other keywords present
export const INCOME_EXCLUSIONS = [
  'deposit', 'withdraw', 'redeem', 'unstake', 'unsubscribe',
  'subscribe', 'purchase', 'sell', 'swap', 'convert',
  'transfer_in', 'transfer_out',
];

export function isExcludedFromIncome(description) {
  const desc = description.toLowerCase();
  return INCOME_EXCLUSIONS.some((k) => desc.includes(k));
}
