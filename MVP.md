# Accrue MVP Definition

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
- Neon PostgreSQL (installed via Vercel Marketplace — free tier, scales to zero, never pauses)
- Prisma ORM (connects to Neon via DATABASE_URL + DATABASE_URL_UNPOOLED)
- JWT authentication (access token + refresh token via jose library)
- bcrypt for password hashing
- Everything deployed on Vercel — one project, one pipeline, one billing account

### Infrastructure
- GitHub → Vercel (full stack auto-deploy on push to main)
- Neon DB managed from Vercel dashboard (Storage tab) — no separate service

## Color System
- Background: #0a0f1e
- Surface: #111827 / #1f2937
- Income/gains: #10b981 (emerald)
- Crypto: #06b6d4 (cyan)
- Alerts: #f59e0b (amber)
- Danger: #ef4444 (red)
- Text: #f9fafb / #d1d5db

### Currency Support
- Default currency: USD
- Supported: USD ($), EUR (€), GBP (£)
- Currency preference stored per user in DB (users table)
- All monetary values across every page, card, chart, and table
  convert in real-time when the user switches currency
- Exchange rates fetched from Open Exchange Rates free API
  (https://open.exchangerate-api.com/v6/latest/USD — no API key required)
- Rates cached for 1 hour in a module-level variable (no DB needed)
- Currency switcher visible in the Header component on every page

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
- [x] Register + login flow works with JWT
- [x] All 6 main pages render without errors
- [x] Mock data flows through every chart and table for new users
- [x] DeGiro connects and loads real positions + dividends
- [x] Trading 212 connects and loads real positions + dividends
- [x] Binance connects and loads spot balances + staking rewards + trade history
- [x] Crypto.com connects and loads spot balances + staking rewards
- [x] Each user sees only their own data
- [x] API keys encrypted at rest in DB
- [x] GitHub → Vercel pipeline live (frontend + serverless API in one project)
- [x] Neon PostgreSQL connected (via Vercel Marketplace) and Prisma migrations running
- [x] App works on desktop and tablet
- [x] No console errors in production
- [x] Currency switcher works across all pages (USD / EUR / GBP)
- [x] Rates auto-refresh every hour
- [x] User currency preference persists across sessions

---

## Post-MVP: UI Design Polish

Audit performed 2026-02-24 using frontend-design skill.
Connections page is the current quality benchmark (redesigned with shared primitives, staggered animations, brand accents).

### Priority 1 — High impact, low effort
- [x] 14.1 — Background atmosphere (global): add radial gradient to body in `src/index.css`, optional CSS noise overlay
- [x] 14.2 — Staggered card-reveal animations (all pages): apply existing `.card-reveal` class to Dashboard, Income, Holdings, Calendar, AIInsights

### Priority 2 — Medium impact
- [ ] 15.1 — Login/Register redesign: gradient mesh bg, staggered entrance, logo glow, asymmetric desktop layout
- [ ] 15.2 — Settings page alignment: fix heading font, card rounding, add section labels
- [ ] 15.3 — Extract PageHeader component: consistent `text-3xl font-display font-bold` + subtitle across all pages
- [ ] 15.4 — Header polish: gradient bottom fade, portfolio value pill, animate or remove notification dot

### Priority 3 — Polish
- [ ] 16.1 — AI chat bubble distinction: emerald accent line on AI messages, replace `bg-navy-700/80`
- [ ] 16.2 — Holdings table breathing room: row padding, alternating stripes, header tracking, hover accent
- [ ] 16.3 — Sidebar active state: thicker indicator or background pill, glass-card tooltip on collapse
- [ ] 16.4 — Dashboard KpiCard accent bars: left brand accent bar using `accentColor` prop
