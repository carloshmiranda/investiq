# InvestIQ MVP Definition

## What it is
A multi-user personal investment dashboard that unifies stocks, crypto exchanges,
and wallets into one interface per user, tracking and forecasting passive income
(dividends, staking, yields). Each user has their own account, credentials, and
isolated dataset — no data bleeds between users.

## Inspired by
Funvest.com — clean, data-rich, investor-first terminal aesthetic.

## Tech Stack
### Frontend
- React 18 + Vite
- TailwindCSS (dark fintech theme)
- Recharts
- React Router v6

### Backend
- Vercel Serverless Functions (API routes under /api — no Express server needed)
- Supabase (PostgreSQL — free tier, no expiry, 500MB)
- Prisma ORM (connects to Supabase Postgres)
- JWT authentication (access token + refresh token via jose library)
- bcrypt for password hashing
- Everything deployed on Vercel — one project, one pipeline

### Infrastructure
- GitHub → Vercel (full stack auto-deploy on push to main)
- Supabase for DB (managed separately, connection string in Vercel env vars)

## Color System
- Background: #0a0f1e
- Surface: #111827 / #1f2937
- Income/gains: #10b981 (emerald)
- Crypto: #06b6d4 (cyan)
- Alerts: #f59e0b (amber)
- Danger: #ef4444 (red)
- Text: #f9fafb / #d1d5db

## Pages
- /login + /register — auth pages
- /dashboard — portfolio summary, KPI cards, mini calendar, health score
- /income — charts, projections, DRIP simulator, 20yr forecast
- /holdings — unified table (stocks + crypto), sortable, filterable, CSV export
- /calendar — dividend & staking calendar, next 30 days sidebar
- /connections — all broker/exchange connection cards per user
- /ai-insights — Claude AI chat, insight cards, news sentiment feed
- /settings — profile, password change, session management

## Integrations
### Stock Brokers
1. DeGiro (unofficial API, session cookie auth, server-side proxy)
2. Trading 212 (official API, API key, server-side proxy)

### Crypto Exchanges
3. Binance (official REST API, API key + secret, HMAC-SHA256 signed requests)
4. Crypto.com (official REST API v2, API key + secret, signed requests)

### Wallets (Phase 2, not MVP blocker)
- MetaMask / any EVM wallet (read-only, via public RPC)
- Phantom / Solana wallet (read-only, via Solana RPC)

## Multi-User Architecture
- Every user has their own row in `users` table
- Every connection (broker/exchange) is stored in `connections` table linked to userId
- API keys and session tokens are encrypted at rest using AES-256-GCM before DB storage
- All backend routes are protected: JWT middleware validates user identity on every request
- Data fetched from brokers/exchanges is cached per user in `portfolio_cache` table
- No user can access another user's data — all queries are scoped by userId

## MVP is reached when
- [ ] Register + login flow works with JWT
- [ ] All 6 main pages render without errors
- [ ] Mock data flows through every chart and table for new users
- [ ] DeGiro connects and loads real positions + dividends
- [ ] Trading 212 connects and loads real positions + dividends
- [ ] Binance connects and loads spot balances + staking rewards + trade history
- [ ] Crypto.com connects and loads spot balances + staking rewards
- [ ] Each user sees only their own data
- [ ] API keys encrypted at rest in DB
- [ ] GitHub → Vercel pipeline live (frontend + serverless API in one project)
- [ ] Supabase PostgreSQL connected and Prisma migrations running
- [ ] App works on desktop and tablet
- [ ] No console errors in production
