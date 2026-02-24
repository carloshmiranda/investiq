/**
 * Build a lookup map from T212 instruments metadata.
 * Key: T212 ticker (e.g. "AAPL_US_EQ"), Value: instrument info
 */
export function buildInstrumentMap(instruments) {
  const map = {};
  for (const inst of instruments) {
    if (inst.ticker) {
      map[inst.ticker] = inst;
    }
  }
  return map;
}

/**
 * Extract a clean display ticker from T212's composite format.
 * e.g. "AAPL_US_EQ" → "AAPL", "VUSA_EQ_L" → "VUSA", "SIE_EQ_DE" → "SIE"
 */
function cleanTicker(t212Ticker) {
  if (!t212Ticker) return '??';
  return t212Ticker.split('_')[0];
}

/**
 * Map Trading 212 position to InvestIQ holding format.
 * @param {object} pos - Raw T212 position
 * @param {object} instrumentMap - Lookup from buildInstrumentMap()
 */
export function mapPosition(pos, instrumentMap = {}) {
  const inst = instrumentMap[pos.ticker] || {};
  const displayTicker = inst.shortName || cleanTicker(pos.ticker);
  const currencyCode = inst.currencyCode || 'USD';

  const value = pos.currentPrice * pos.quantity;
  const costBasis = pos.averagePrice * pos.quantity;
  const pnl = pos.ppl || (value - costBasis);

  return {
    id: `t212-${pos.ticker}`,
    source: 'trading212',
    broker: 'Trading 212',
    ticker: displayTicker,
    t212Ticker: pos.ticker,
    name: inst.name || displayTicker,
    isin: inst.isin || pos.figi || '',
    type: inst.type || 'Stock',
    sector: 'Unknown',
    quantity: pos.quantity,
    price: pos.currentPrice,
    value,
    currency: currencyCode,
    annualIncome: 0,
    yieldPercent: 0,
    frequency: 'Unknown',
    nextPayDate: 'N/A',
    safetyRating: null,
    logoColor: '#1a56db',
    breakEvenPrice: pos.averagePrice,
    costBasis,
    unrealizedPnL: pnl,
    unrealizedPnLPct: costBasis > 0 ? (pnl / costBasis) * 100 : 0,
  };
}

/**
 * Map Trading 212 dividend to InvestIQ income event
 * @param {object} div - Raw T212 dividend
 * @param {object} instrumentMap - Lookup from buildInstrumentMap()
 */
export function mapDividend(div, instrumentMap = {}) {
  const inst = instrumentMap[div.ticker] || {};
  const displayTicker = inst.shortName || cleanTicker(div.ticker);

  return {
    date: div.paidOn || div.reference,
    ticker: displayTicker,
    t212Ticker: div.ticker,
    name: inst.name || displayTicker,
    amount: div.amount || 0,
    currency: div.currency || inst.currencyCode || 'USD',
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
