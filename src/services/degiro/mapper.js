/**
 * Accrue — DeGiro data mapper
 * Converts raw DeGiro API responses to Accrue's unified holding/income formats.
 */

// ── Product type mapping ──────────────────────────────────────────────────────
const PRODUCT_TYPES = {
  1: 'Stock',
  131: 'ETF',
  3: 'Bond',
  2: 'Fund',
  535: 'ETF',
  13: 'Warrant',
};

function mapProductType(productTypeId) {
  return PRODUCT_TYPES[productTypeId] ?? 'Stock';
}

// ── Extract a named value from DeGiro's key/value array format ────────────────
function getVal(arr, name) {
  if (!Array.isArray(arr)) return undefined;
  return arr.find((v) => v.name === name)?.value;
}

// ── Map a single portfolio position to Accrue holding format ────────────────
export function mapPosition(position, productInfo = {}) {
  const productId = getVal(position.value, 'id');
  const size = getVal(position.value, 'size') ?? 0;
  const price = getVal(position.value, 'price') ?? 0;
  const value = getVal(position.value, 'value') ?? size * price;
  const breakEvenPrice = getVal(position.value, 'breakEvenPrice') ?? price;

  const info = productId ? (productInfo[String(productId)] ?? {}) : {};

  const currentPrice = info.closePrice ?? price;
  const yieldPercent = info.dividendYield ?? 0;
  const annualIncome = yieldPercent > 0 ? (currentPrice * size * yieldPercent) / 100 : 0;

  return {
    // Identifiers
    id: productId,
    source: 'degiro',
    broker: 'DeGiro',

    // Display
    ticker: info.symbol ?? `#${productId}`,
    name: info.name ?? 'Unknown Product',
    isin: info.isin ?? '',
    type: mapProductType(info.productTypeId),
    sector: 'Unknown',

    // Position
    quantity: size,
    price: currentPrice,
    value,
    currency: info.currency ?? 'EUR',

    // Income
    annualIncome,
    yieldPercent,
    frequency: 'Quarterly', // DeGiro doesn't expose this; use as default
    nextPayDate: 'N/A',

    // Risk
    safetyRating: 'B', // enriched separately
    logoColor: '#4b5563',

    // P&L
    breakEvenPrice,
    costBasis: size * breakEvenPrice,
    unrealizedPnL: value - size * breakEvenPrice,
    unrealizedPnLPct:
      breakEvenPrice > 0
        ? ((currentPrice - breakEvenPrice) / breakEvenPrice) * 100
        : 0,
  };
}

// ── Map DeGiro corporate action (dividend) to Accrue income format ──────────
export function mapDividend(ca) {
  return {
    date: ca.exDate ?? ca.paymentDate ?? new Date().toISOString().slice(0, 10),
    ticker: ca.product?.symbol ?? String(ca.productId ?? 'UNKNOWN'),
    name: ca.product?.name ?? 'DeGiro Dividend',
    amount: ca.netAmount ?? ca.grossAmount ?? 0,
    currency: ca.currency ?? 'EUR',
    type: 'Dividend',
    source: 'degiro',
  };
}

// ── Merge DeGiro holdings with mock data (dedup by ISIN or ticker) ────────────
export function mergeHoldings(mockHoldings, degiroHoldings) {
  const seen = new Set([
    ...mockHoldings.map((h) => h.ticker?.toUpperCase()),
    ...mockHoldings.map((h) => h.isin).filter(Boolean),
  ]);

  const unique = degiroHoldings.filter((h) => {
    if (seen.has(h.ticker?.toUpperCase())) return false;
    if (h.isin && seen.has(h.isin)) return false;
    return true;
  });

  return [...mockHoldings, ...unique];
}

// ── Merge DeGiro dividends into Accrue income history ───────────────────────
export function mergeDividendHistory(incomeHistory, degiroDividends) {
  // Group DeGiro dividends by month (same format as incomeHistory)
  const byMonth = {};
  degiroDividends.forEach((d) => {
    const date = new Date(d.date);
    const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // "Jan 2024"
    if (!byMonth[key]) byMonth[key] = 0;
    byMonth[key] += d.amount;
  });

  // Merge into history (add to existing months or append new months)
  return incomeHistory.map((month) => {
    const extra = byMonth[month.month] ?? 0;
    if (extra === 0) return month;
    return {
      ...month,
      dividends: month.dividends + extra,
      total: month.total + extra,
      _degiroAdded: extra,
    };
  });
}
