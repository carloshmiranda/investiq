# InvestIQ — Personal Investment Intelligence Platform

A full-stack fintech SPA for tracking and forecasting income from stocks, crypto, and DeFi in one unified dashboard.

## Features

- **Dashboard** — Portfolio summary, income charts, health score, upcoming payments
- **Income Intelligence** — Timeline, 12-month forecasts, DRIP simulator, 5/10/20yr projections
- **Holdings Terminal** — Unified sortable table (stocks + crypto), CSV export, safety ratings
- **Dividend Calendar** — Monthly calendar view with payment tracking
- **Connections** — Broker/exchange/wallet integration cards (IBKR, Alpaca, Coinbase, Binance, MetaMask, Phantom, Plaid)
- **AI Insights** — Chat interface with portfolio-aware AI advisor, news sentiment feed

## Tech Stack

- React 18 + Vite
- TailwindCSS (dark fintech theme)
- Recharts (all charts)
- React Router v6
- Axios

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
npm run build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_ANTHROPIC_API_KEY` | Anthropic Claude API key for AI Insights |
| `VITE_PLAID_CLIENT_ID` | Plaid client ID for bank/broker connections |
| `VITE_ALPACA_KEY` | Alpaca API key for broker data |
| `VITE_COINBASE_KEY` | Coinbase Advanced Trade API key |
| `VITE_BINANCE_KEY` | Binance API key (read-only) |
| `VITE_IBKR_CLIENT_ID` | Interactive Brokers Web API client ID |

## Adding Real Broker Connections

### Interactive Brokers (IBKR)
Enable the IBKR Web API in TWS/Gateway, generate a Client Portal API token, and call `/v1/api/portfolio` REST endpoints.

### Alpaca
Create API keys at alpaca.markets (read-only), set `VITE_ALPACA_KEY` + `VITE_ALPACA_SECRET`, call `https://paper-api.alpaca.markets`.

### Coinbase Advanced Trade
Create API keys with "View" permissions at coinbase.com/settings/api, use the REST API at `https://api.coinbase.com/api/v3`.

### MetaMask / On-Chain Wallets
User enters wallet address → use `ethers.js` + Alchemy RPC to fetch balances. Query Lido Finance subgraph for staking yield data.

### Plaid
Get credentials at dashboard.plaid.com, use Plaid Link for OAuth, request the `investments` product for dividend/holdings data.

### Claude AI (Real Integration)
```js
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY });
const msg = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: prompt }],
});
```

## Deployment

```bash
npm i -g vercel
vercel --prod
```

The `vercel.json` includes SPA rewrite rules for all routes.

## Project Structure

```
src/
├── components/   Shared UI (Layout, Sidebar, Header, KpiCard)
├── data/         Mock portfolio data layer
├── pages/        Route pages (Dashboard, Income, Holdings, Calendar, Connections, AIInsights)
├── utils/        Formatters and helpers
└── App.jsx       Router setup
```
