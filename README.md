# Accrue — Watch Your Passive Income Grow

A full-stack fintech SPA for tracking and forecasting passive income from stocks, crypto, and DeFi in one unified dashboard.

## Features

- **Dashboard** — Portfolio summary, income charts, health score, upcoming payments
- **Income Intelligence** — Timeline, 12-month forecasts, DRIP simulator, 5/10/20yr projections
- **Holdings Terminal** — Unified sortable table (stocks + crypto), CSV export, safety ratings
- **Dividend Calendar** — Monthly calendar view with payment tracking
- **Connections** — Live broker integrations (DeGiro, Trading 212, Binance, Crypto.com)
- **AI Insights** — Chat interface with portfolio-aware AI advisor (Claude, quota-managed)
- **Billing** — Stripe-powered subscription management
- **Light/Dark Theme** — Full theme toggle with warm ivory light mode

## Tech Stack

- React 19 + Vite 7
- TailwindCSS (dark fintech theme + light "Warm Ivory Editorial" theme)
- Recharts (all charts)
- React Router v6
- Axios
- Prisma (PostgreSQL)
- Vercel Hobby deployment (12 serverless function limit)
- Stripe (billing)

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
npm run build
```

## Architecture

### Serverless Functions (9/12 used)

| File                | Routes handled                                      |
|---------------------|-----------------------------------------------------|
| `api/health.js`     | `GET /api/health`                                   |
| `api/rates.js`      | `GET /api/rates`                                    |
| `api/auth.js`       | `/api/auth/*` (register, login, refresh, logout)    |
|                     | `/api/user/*` (profile, password, sessions, currency)|
| `api/portfolio.js`  | `GET/POST /api/portfolio`                           |
| `api/income.js`     | `GET/POST /api/income`                              |
| `api/connections.js` | `/api/degiro/*`, `/api/trading212/*`, `/api/binance/*`, `/api/cryptocom/*` |
| `api/brokers.js`    | `/api/brokers/*` (reserved for future proxy routes) |
| `api/ai.js`         | `POST /api/ai/chat` (quota enforced, usage tracked) |
| `api/billing.js`    | `/api/billing/*` (checkout, portal, status, webhook)|

### Design System

- Deep black base (`#050505`), glassmorphism cards with `white/6%` borders
- Primary accent: Purple `#7C5CFC`
- Fonts: Cal Sans (display), Inter (body), DM Mono (data/numbers)
- Shared CSS: `.glass-card`, `.card-reveal`, `.card-accent`, `.gradient-text`

## Project Structure

```
src/
├── components/   Shared UI (Layout, Sidebar, Header, KpiCard, PageHeader)
├── context/      React contexts (Auth, Theme, Currency, Debug, broker providers)
├── hooks/        Custom hooks (useUnifiedPortfolio, useBinanceData, etc.)
├── lib/          Utilities (formatters, exchange rates, broker adapters)
├── pages/        Route pages (Dashboard, Income, Holdings, Calendar, Connections, AIInsights, Settings, Billing)
└── App.jsx       Router setup

api/              Vercel serverless functions (9 files)
lib/              Server-side shared code (apiHandler, auth middleware, Prisma, JWT, rate limiting)
prisma/           Schema and migrations
```

## Deployment

```bash
npm i -g vercel
vercel --prod
```

The `vercel.json` includes SPA rewrite rules and API route mappings.

## Roadmap

- [ ] **Capacitor iOS shell** — Native iOS wrapper for TestFlight/App Store (planned, not yet implemented)
- [ ] Android support (deferred)
- [ ] Native plugins (biometrics, haptics, push notifications)
