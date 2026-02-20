/**
 * Map Trading 212 position to InvestIQ holding format
 */
export function mapPosition(pos) {
  const value = pos.currentPrice * pos.quantity;
  const costBasis = pos.averagePrice * pos.quantity;
  const pnl = pos.ppl || (value - costBasis);

  return {
    id: `t212-${pos.ticker}`,
    source: 'trading212',
    broker: 'Trading 212',
    ticker: pos.ticker,
    name: pos.ticker, // T212 doesn't return full name in positions
    isin: pos.figi || '',
    type: 'Stock', // T212 doesn't differentiate in positions endpoint
    sector: 'Unknown',
    quantity: pos.quantity,
    price: pos.currentPrice,
    value,
    currency: pos.frontend || 'USD',
    annualIncome: 0, // Not available from positions endpoint
    yieldPercent: 0,
    frequency: 'Unknown',
    nextPayDate: 'N/A',
    safetyRating: 'B',
    logoColor: '#1a56db',
    breakEvenPrice: pos.averagePrice,
    costBasis,
    unrealizedPnL: pnl,
    unrealizedPnLPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
  };
}

/**
 * Map Trading 212 dividend to InvestIQ income event
 */
export function mapDividend(div) {
  return {
    date: div.paidOn || div.reference,
    ticker: div.ticker,
    name: div.ticker,
    amount: div.amount || 0,
    currency: div.currency || 'USD',
    type: 'Dividend',
    source: 'trading212',
  };
}

/**
 * Merge mock holdings with T212 holdings (deduplicate by ticker)
 */
export function mergeHoldings(mockHoldings, t212Holdings) {
  const mockTickers = new Set(mockHoldings.map((h) => h.ticker.toUpperCase()));
  const unique = t212Holdings.filter((h) => !mockTickers.has(h.ticker.toUpperCase()));
  return [...mockHoldings, ...unique];
}
