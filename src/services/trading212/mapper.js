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
 */
export function mapPosition(pos) {
  const ticker = cleanTicker(pos.ticker) || pos.ticker || 'UNKNOWN';
  const value = (pos.currentPrice || 0) * (pos.quantity || 0);
  const costBasis = (pos.averagePrice || 0) * (pos.quantity || 0);
  const pnl = pos.ppl || (value - costBasis);

  return {
    id: `t212-${pos.ticker}`,
    source: 'trading212',
    broker: 'Trading 212',
    ticker,
    t212Ticker: pos.ticker,
    name: ticker,
    isin: pos.figi || '',
    type: 'Stock',
    sector: 'Unknown',
    quantity: pos.quantity || 0,
    price: pos.currentPrice || 0,
    value,
    currency: 'USD',
    annualIncome: 0,
    yieldPercent: 0,
    frequency: 'Unknown',
    nextPayDate: 'N/A',
    safetyRating: null,
    logoColor: '#1a56db',
    breakEvenPrice: pos.averagePrice || 0,
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

/**
 * Enrich already-mapped positions with instrument metadata.
 * Call this after initial sync to add names/types/currency without blocking.
 */
export function enrichPositions(positions, instruments) {
  const instMap = {};
  for (const inst of instruments) {
    if (inst.ticker) instMap[inst.ticker] = inst;
  }

  return positions.map((pos) => {
    const inst = instMap[pos.t212Ticker];
    if (!inst) return pos;
    return {
      ...pos,
      name: inst.name || pos.ticker,
      type: inst.type || pos.type,
      isin: inst.isin || pos.isin,
      currency: inst.currencyCode || pos.currency,
    };
  });
}

/**
 * Enrich already-mapped dividends with instrument metadata.
 */
export function enrichDividends(dividends, instruments) {
  const instMap = {};
  for (const inst of instruments) {
    if (inst.ticker) instMap[inst.ticker] = inst;
  }

  return dividends.map((div) => {
    const inst = instMap[div.t212Ticker];
    if (!inst) return div;
    return {
      ...div,
      name: inst.name || div.ticker,
    };
  });
}

/**
 * Merge mock holdings with T212 holdings (deduplicate by ticker)
 */
export function mergeHoldings(mockHoldings, t212Holdings) {
  const mockTickers = new Set(mockHoldings.map((h) => h.ticker.toUpperCase()));
  const unique = t212Holdings.filter((h) => !mockTickers.has(h.ticker.toUpperCase()));
  return [...mockHoldings, ...unique];
}
