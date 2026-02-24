/**
 * Extract a clean display ticker from T212's composite format.
 * "AAPL_US_EQ" → "AAPL", "VUSA_EQ_L" → "VUSA", "SIE_EQ_DE" → "SIE"
 */
function cleanTicker(t212Ticker) {
  if (!t212Ticker) return t212Ticker;
  return t212Ticker.split('_')[0];
}

/**
 * Map Trading 212 position to InvestIQ holding format.
 * T212 API nests instrument data: pos.instrument.{ticker, name, isin, currency}
 */
export function mapPosition(pos) {
  const inst = pos.instrument || {};
  const rawTicker = inst.ticker || pos.ticker;
  const ticker = cleanTicker(rawTicker) || 'UNKNOWN';
  const name = inst.name || ticker;
  const currency = inst.currency || 'USD';
  const isin = inst.isin || '';

  const quantity = pos.quantity || 0;
  const price = pos.currentPrice || 0;
  const value = price * quantity;
  const avgPrice = pos.averagePricePaid ?? pos.averagePrice ?? 0;
  const costBasis = avgPrice * quantity;

  // walletImpact is the new PnL field; fall back to ppl or manual calc
  let pnl = value - costBasis;
  if (typeof pos.walletImpact === 'number') {
    pnl = pos.walletImpact;
  } else if (typeof pos.ppl === 'number') {
    pnl = pos.ppl;
  }

  return {
    id: `t212-${rawTicker}`,
    source: 'trading212',
    broker: 'Trading 212',
    ticker,
    t212Ticker: rawTicker,
    name,
    isin,
    type: 'Stock',
    sector: 'Unknown',
    quantity,
    price,
    value,
    currency,
    annualIncome: 0,
    yieldPercent: 0,
    frequency: 'Unknown',
    nextPayDate: 'N/A',
    safetyRating: null,
    logoColor: '#1a56db',
    breakEvenPrice: avgPrice,
    costBasis,
    unrealizedPnL: pnl,
    unrealizedPnLPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
  };
}

/**
 * Map Trading 212 dividend to InvestIQ income event.
 */
export function mapDividend(div) {
  const ticker = cleanTicker(div.ticker) || div.ticker || 'UNKNOWN';

  return {
    date: div.paidOn || div.reference,
    ticker,
    t212Ticker: div.ticker,
    name: ticker,
    amount: div.amount || 0,
    currency: div.currency || 'USD',
    type: 'Dividend',
    source: 'trading212',
  };
}
