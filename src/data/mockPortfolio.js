// ============================================================
// InvestIQ — Mock Portfolio Data Layer
// ============================================================

export const stocks = [
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    type: 'Stock',
    sector: 'Technology',
    shares: 45,
    price: 189.84,
    annualDividend: 0.96,
    yieldPercent: 0.51,
    frequency: 'Quarterly',
    nextExDate: '2024-02-09',
    nextPayDate: '2024-02-15',
    safetyRating: 'A',
    logoColor: '#555555',
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    type: 'Stock',
    sector: 'Technology',
    shares: 30,
    price: 415.33,
    annualDividend: 3.00,
    yieldPercent: 0.72,
    frequency: 'Quarterly',
    nextExDate: '2024-02-14',
    nextPayDate: '2024-03-14',
    safetyRating: 'A',
    logoColor: '#00a4ef',
  },
  {
    ticker: 'O',
    name: 'Realty Income Corp.',
    type: 'REIT',
    sector: 'Real Estate',
    shares: 120,
    price: 53.47,
    annualDividend: 3.072,
    yieldPercent: 5.75,
    frequency: 'Monthly',
    nextExDate: '2024-01-31',
    nextPayDate: '2024-02-15',
    safetyRating: 'A',
    logoColor: '#e31837',
  },
  {
    ticker: 'JEPQ',
    name: 'JPMorgan Nasdaq Equity Premium',
    type: 'ETF',
    sector: 'Options Income',
    shares: 200,
    price: 55.21,
    annualDividend: 5.82,
    yieldPercent: 10.54,
    frequency: 'Monthly',
    nextExDate: '2024-02-01',
    nextPayDate: '2024-02-06',
    safetyRating: 'B',
    logoColor: '#003087',
  },
  {
    ticker: 'VYM',
    name: 'Vanguard High Dividend Yield ETF',
    type: 'ETF',
    sector: 'Broad Market',
    shares: 85,
    price: 118.52,
    annualDividend: 3.44,
    yieldPercent: 2.90,
    frequency: 'Quarterly',
    nextExDate: '2024-03-19',
    nextPayDate: '2024-03-28',
    safetyRating: 'A',
    logoColor: '#c40000',
  },
  {
    ticker: 'KO',
    name: 'Coca-Cola Co.',
    type: 'Stock',
    sector: 'Consumer Staples',
    shares: 100,
    price: 59.91,
    annualDividend: 1.94,
    yieldPercent: 3.24,
    frequency: 'Quarterly',
    nextExDate: '2024-03-14',
    nextPayDate: '2024-04-01',
    safetyRating: 'A',
    logoColor: '#f40009',
  },
  {
    ticker: 'T',
    name: 'AT&T Inc.',
    type: 'Stock',
    sector: 'Telecom',
    shares: 300,
    price: 16.99,
    annualDividend: 1.11,
    yieldPercent: 6.53,
    frequency: 'Quarterly',
    nextExDate: '2024-01-09',
    nextPayDate: '2024-02-01',
    safetyRating: 'C',
    logoColor: '#00a8e0',
  },
  {
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    type: 'Stock',
    sector: 'Healthcare',
    shares: 40,
    price: 158.76,
    annualDividend: 4.76,
    yieldPercent: 3.00,
    frequency: 'Quarterly',
    nextExDate: '2024-02-26',
    nextPayDate: '2024-03-05',
    safetyRating: 'A',
    logoColor: '#ca0000',
  },
  {
    ticker: 'PG',
    name: 'Procter & Gamble Co.',
    type: 'Stock',
    sector: 'Consumer Staples',
    shares: 35,
    price: 162.04,
    annualDividend: 3.76,
    yieldPercent: 2.32,
    frequency: 'Quarterly',
    nextExDate: '2024-01-18',
    nextPayDate: '2024-02-15',
    safetyRating: 'A',
    logoColor: '#003da5',
  },
  {
    ticker: 'SCHD',
    name: 'Schwab US Dividend Equity ETF',
    type: 'ETF',
    sector: 'Dividend',
    shares: 150,
    price: 75.89,
    annualDividend: 2.62,
    yieldPercent: 3.45,
    frequency: 'Quarterly',
    nextExDate: '2024-03-19',
    nextPayDate: '2024-03-25',
    safetyRating: 'A',
    logoColor: '#0057a8',
  },
];

export const cryptoAssets = [
  {
    ticker: 'ETH',
    name: 'Ethereum',
    type: 'Crypto',
    amount: 4.5,
    price: 3421.50,
    stakingAPY: 4.2,
    stakingProvider: 'Lido Finance',
    nextRewardDate: '2024-02-02',
    rewardFrequency: 'Daily',
    safetyRating: 'B',
    logoColor: '#627eea',
  },
  {
    ticker: 'SOL',
    name: 'Solana',
    type: 'Crypto',
    amount: 32.0,
    price: 98.45,
    stakingAPY: 6.8,
    stakingProvider: 'Native Staking',
    nextRewardDate: '2024-02-01',
    rewardFrequency: 'Daily',
    safetyRating: 'B',
    logoColor: '#9945ff',
  },
  {
    ticker: 'USDC',
    name: 'USD Coin',
    type: 'Stablecoin',
    amount: 15000,
    price: 1.00,
    stakingAPY: 5.1,
    stakingProvider: 'Aave v3',
    nextRewardDate: '2024-02-01',
    rewardFrequency: 'Daily',
    safetyRating: 'B',
    logoColor: '#2775ca',
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin',
    type: 'Crypto',
    amount: 0.35,
    price: 51234.00,
    stakingAPY: 0,
    stakingProvider: null,
    nextRewardDate: null,
    rewardFrequency: null,
    safetyRating: 'A',
    logoColor: '#f7931a',
  },
  {
    ticker: 'LINK',
    name: 'Chainlink',
    type: 'Crypto',
    amount: 180,
    price: 17.82,
    stakingAPY: 3.2,
    stakingProvider: 'Chainlink Staking v0.2',
    nextRewardDate: '2024-02-05',
    rewardFrequency: 'Weekly',
    safetyRating: 'C',
    logoColor: '#375bd2',
  },
];

export const wallets = [
  {
    id: 'metamask-1',
    name: 'MetaMask — Main',
    network: 'Ethereum Mainnet',
    type: 'MetaMask',
    address: '0x742d...4b2f',
    fullAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a4b2f',
    balance: 4.5,
    balanceUSD: 15396.75,
    assets: [
      { ticker: 'ETH', amount: 4.5, valueUSD: 15396.75 },
      { ticker: 'USDC', amount: 5000, valueUSD: 5000 },
      { ticker: 'LINK', amount: 180, valueUSD: 3207.60 },
    ],
    connected: true,
    lastSync: '2024-01-31T18:30:00Z',
  },
  {
    id: 'phantom-1',
    name: 'Phantom — SOL',
    network: 'Solana Mainnet',
    type: 'Phantom',
    address: '7Xkm...9pQr',
    fullAddress: '7XkmNBzrSEP9pQrM1Wf9XkmNBzrSEP9pQrM1Wf9',
    balance: 32.0,
    balanceUSD: 3150.40,
    assets: [
      { ticker: 'SOL', amount: 32.0, valueUSD: 3150.40 },
      { ticker: 'USDC', amount: 10000, valueUSD: 10000 },
    ],
    connected: true,
    lastSync: '2024-01-31T18:28:00Z',
  },
];

// Monthly income history (last 12 months)
export const incomeHistory = [
  { month: 'Feb 2023', dividends: 312.40, staking: 89.20, yield: 63.75, interest: 12.50, total: 477.85 },
  { month: 'Mar 2023', dividends: 445.60, staking: 92.10, yield: 65.20, interest: 13.00, total: 615.90 },
  { month: 'Apr 2023', dividends: 298.30, staking: 95.40, yield: 68.90, interest: 14.25, total: 476.85 },
  { month: 'May 2023', dividends: 320.80, staking: 98.70, yield: 71.40, interest: 15.50, total: 506.40 },
  { month: 'Jun 2023', dividends: 478.20, staking: 102.30, yield: 74.10, interest: 16.00, total: 670.60 },
  { month: 'Jul 2023', dividends: 285.60, staking: 108.50, yield: 76.80, interest: 18.25, total: 489.15 },
  { month: 'Aug 2023', dividends: 310.40, staking: 115.20, yield: 79.50, interest: 19.00, total: 524.10 },
  { month: 'Sep 2023', dividends: 502.70, staking: 121.80, yield: 82.20, interest: 20.50, total: 727.20 },
  { month: 'Oct 2023', dividends: 298.90, staking: 128.40, yield: 85.00, interest: 22.75, total: 535.05 },
  { month: 'Nov 2023', dividends: 325.60, staking: 135.10, yield: 87.80, interest: 24.00, total: 572.50 },
  { month: 'Dec 2023', dividends: 531.20, staking: 142.60, yield: 90.60, interest: 25.50, total: 789.90 },
  { month: 'Jan 2024', dividends: 287.40, staking: 149.30, yield: 93.50, interest: 27.25, total: 557.45 },
];

// Projected income (next 12 months) — conservative vs optimistic
export const incomeProjections = [
  { month: 'Feb 2024', conservative: 520, optimistic: 580 },
  { month: 'Mar 2024', conservative: 648, optimistic: 720 },
  { month: 'Apr 2024', conservative: 505, optimistic: 560 },
  { month: 'May 2024', conservative: 535, optimistic: 595 },
  { month: 'Jun 2024', conservative: 695, optimistic: 780 },
  { month: 'Jul 2024', conservative: 515, optimistic: 575 },
  { month: 'Aug 2024', conservative: 548, optimistic: 610 },
  { month: 'Sep 2024', conservative: 758, optimistic: 850 },
  { month: 'Oct 2024', conservative: 563, optimistic: 628 },
  { month: 'Nov 2024', conservative: 598, optimistic: 668 },
  { month: 'Dec 2024', conservative: 820, optimistic: 920 },
  { month: 'Jan 2025', conservative: 578, optimistic: 645 },
];

// Upcoming payments (next 30 days)
export const upcomingPayments = [
  { date: '2024-02-01', ticker: 'T', name: 'AT&T Inc.', amount: 83.25, type: 'Dividend', frequency: 'Quarterly' },
  { date: '2024-02-01', ticker: 'SOL', name: 'Solana Staking', amount: 18.40, type: 'Staking', frequency: 'Daily' },
  { date: '2024-02-02', ticker: 'ETH', name: 'Ethereum Staking', amount: 22.80, type: 'Staking', frequency: 'Daily' },
  { date: '2024-02-05', ticker: 'O', name: 'Realty Income', amount: 30.72, type: 'Dividend', frequency: 'Monthly' },
  { date: '2024-02-06', ticker: 'JEPQ', name: 'JPMorgan Nasdaq', amount: 97.00, type: 'Dividend', frequency: 'Monthly' },
  { date: '2024-02-06', ticker: 'LINK', name: 'Chainlink Staking', amount: 10.20, type: 'Staking', frequency: 'Weekly' },
  { date: '2024-02-09', ticker: 'USDC', name: 'Aave USDC Yield', amount: 63.75, type: 'Yield', frequency: 'Daily' },
  { date: '2024-02-14', ticker: 'MSFT', name: 'Microsoft Corp.', amount: 22.50, type: 'Dividend', frequency: 'Quarterly' },
  { date: '2024-02-15', ticker: 'AAPL', name: 'Apple Inc.', amount: 10.80, type: 'Dividend', frequency: 'Quarterly' },
  { date: '2024-02-15', ticker: 'PG', name: 'Procter & Gamble', amount: 32.90, type: 'Dividend', frequency: 'Quarterly' },
  { date: '2024-02-21', ticker: 'LINK', name: 'Chainlink Staking', amount: 10.20, type: 'Staking', frequency: 'Weekly' },
  { date: '2024-02-28', ticker: 'O', name: 'Realty Income', amount: 30.72, type: 'Dividend', frequency: 'Monthly' },
];

// Broker/Exchange connections
export const connections = [
  { id: 'ibkr', name: 'Interactive Brokers', type: 'broker', logo: 'IB', connected: true, accounts: 2, totalValue: 142500 },
  { id: 'alpaca', name: 'Alpaca', type: 'broker', logo: 'AL', connected: false, accounts: 0, totalValue: 0 },
  { id: 'coinbase', name: 'Coinbase', type: 'exchange', logo: 'CB', connected: true, accounts: 1, totalValue: 18900 },
  { id: 'binance', name: 'Binance', type: 'exchange', logo: 'BN', connected: false, accounts: 0, totalValue: 0 },
  { id: 'metamask', name: 'MetaMask', type: 'wallet', logo: 'MM', connected: true, accounts: 1, totalValue: 23604 },
  { id: 'ledger', name: 'Ledger', type: 'hardware', logo: 'LE', connected: false, accounts: 0, totalValue: 0 },
  { id: 'phantom', name: 'Phantom', type: 'wallet', logo: 'PH', connected: true, accounts: 1, totalValue: 13150 },
  { id: 'plaid', name: 'Plaid (Brokerage)', type: 'aggregator', logo: 'PL', connected: false, accounts: 0, totalValue: 0 },
];

// ============================================================
// Computed helpers
// ============================================================

export function getPortfolioSummary() {
  const stockValue = stocks.reduce((sum, s) => sum + s.shares * s.price, 0);
  const cryptoValue = cryptoAssets.reduce((sum, c) => sum + c.amount * c.price, 0);
  const totalValue = stockValue + cryptoValue;

  const annualStockIncome = stocks.reduce((sum, s) => sum + s.shares * s.annualDividend, 0);
  const annualCryptoIncome = cryptoAssets.reduce((sum, c) => {
    if (c.stakingAPY > 0) return sum + (c.amount * c.price * c.stakingAPY) / 100;
    return sum;
  }, 0);
  const annualIncome = annualStockIncome + annualCryptoIncome;
  const monthlyIncome = annualIncome / 12;

  const ytdIncome = incomeHistory.slice(-1).reduce((sum, m) => sum + m.total, 0);
  const ytdProjected = incomeProjections[0]?.conservative ?? 0;

  return {
    totalValue,
    stockValue,
    cryptoValue,
    annualIncome,
    monthlyIncome,
    ytdIncome,
    ytdProjected,
    overallYield: (annualIncome / totalValue) * 100,
  };
}

export function getAllHoldings() {
  const stockHoldings = stocks.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    type: s.type,
    sector: s.sector,
    quantity: s.shares,
    price: s.price,
    value: s.shares * s.price,
    annualIncome: s.shares * s.annualDividend,
    yieldPercent: s.yieldPercent,
    frequency: s.frequency,
    nextPayDate: s.nextPayDate,
    safetyRating: s.safetyRating,
    logoColor: s.logoColor,
  }));

  const cryptoHoldings = cryptoAssets.map((c) => ({
    ticker: c.ticker,
    name: c.name,
    type: c.type,
    sector: 'Crypto',
    quantity: c.amount,
    price: c.price,
    value: c.amount * c.price,
    annualIncome: c.stakingAPY > 0 ? (c.amount * c.price * c.stakingAPY) / 100 : 0,
    yieldPercent: c.stakingAPY,
    frequency: c.rewardFrequency ?? 'N/A',
    nextPayDate: c.nextRewardDate ?? 'N/A',
    safetyRating: c.safetyRating,
    logoColor: c.logoColor,
    stakingProvider: c.stakingProvider,
  }));

  return [...stockHoldings, ...cryptoHoldings];
}

export function getPortfolioHealthScore() {
  const holdings = getAllHoldings();
  const totalValue = holdings.reduce((s, h) => s + h.value, 0);

  // Diversification: spread across sectors
  const sectors = {};
  holdings.forEach((h) => {
    sectors[h.sector] = (sectors[h.sector] ?? 0) + h.value;
  });
  const sectorCount = Object.keys(sectors).length;
  const maxSectorConcentration = Math.max(...Object.values(sectors)) / totalValue;
  const diversificationScore = Math.min(100, sectorCount * 12 - maxSectorConcentration * 50);

  // Safety: weighted average rating
  const ratingMap = { A: 5, B: 4, C: 3, D: 2, F: 1 };
  const weightedRating = holdings.reduce((s, h) => s + (ratingMap[h.safetyRating] ?? 3) * h.value, 0) / totalValue;
  const safetyScore = (weightedRating / 5) * 100;

  // Yield adequacy
  const avgYield = holdings.reduce((s, h) => s + h.yieldPercent * (h.value / totalValue), 0);
  const yieldScore = Math.min(100, avgYield * 20);

  const overall = Math.round((diversificationScore * 0.35 + safetyScore * 0.4 + yieldScore * 0.25));

  return {
    overall,
    diversification: Math.round(diversificationScore),
    safety: Math.round(safetyScore),
    yield: Math.round(yieldScore),
    sectors,
  };
}
