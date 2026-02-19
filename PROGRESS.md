# InvestIQ Progress Tracker

## Status
🟡 In Progress

## Live URLs
- Frontend: https://investiq-nine.vercel.app
- Backend API: (set up on Railway — see item 0.1 notes)

## GitHub Repo
https://github.com/carloshmiranda/investiq

## Database
- Provider: Railway PostgreSQL
- Connection string: stored in Railway env vars (never in git)

## Completed ✅
- [x] 0.1 — Monorepo restructured (client/ + server/), Express server scaffolded,
        Prisma schema created. Vercel root dir must be updated to `client/` in dashboard.
        Railway: create project, deploy from server/, add PostgreSQL plugin.

## Backlog (in order — do one at a time)

### Foundation & Infrastructure
- [x] 0.1 — Create monorepo (client/ + server/), scaffold Vite + React in /client,
        scaffold Express + Prisma in /server, push to GitHub,
        connect /client to Vercel (update root dir) and /server to Railway
- [ ] 0.2 — Set up PostgreSQL on Railway, run first Prisma migration
        (users, connections, portfolio_cache, sessions tables)
- [ ] 0.3 — Client: add /login and /register routes to React Router,
        protected route wrapper, auth context skeleton

### Auth System
- [ ] 1.1 — Server: POST /auth/register (bcrypt hash, create user, return JWT pair)
- [ ] 1.2 — Server: POST /auth/login (verify password, return access + refresh tokens),
        POST /auth/refresh, POST /auth/logout
- [ ] 1.3 — Server: JWT middleware (verify access token on all protected routes, attach userId)
- [ ] 1.4 — Client: /register page (name, email, password, confirm password)
- [ ] 1.5 — Client: /login page, JWT storage in memory + refresh token cookie
- [ ] 1.6 — Client: auth context (useAuth hook), protected route redirect, silent token refresh
- [ ] 1.7 — Client: /settings page (change name, email, password, active sessions, logout all)

### Mock Data & Core UI
- [ ] 2.1 — Migrate existing mock data + all 6 pages into new client/ structure
- [ ] 2.2 — Dashboard KPI cards, income sparkline, health score wired to mock data
- [ ] 2.3 — Holdings table, Income page charts, Calendar grid wired to mock data

### DeGiro Integration (server-side, authenticated per user)
- [ ] 7.1 — Server: DeGiro auth service (migrate from Vercel edge functions)
- [ ] 7.2 — Server: DeGiro portfolio + products fetch, store session encrypted in DB
- [ ] 7.3 — Server: DeGiro dividends fetch, mapped to income events
- [ ] 7.4 — Client: DeGiro connect modal calls new server endpoints (auth required)

### Trading 212 Integration
- [ ] 8.1 — Server: Trading 212 client (API key auth, rate limiter)
- [ ] 8.2 — Server: T212 portfolio + dividend history fetch + mapper
- [ ] 8.3 — Server: store T212 API key encrypted in DB per user
- [ ] 8.4 — Client: T212 connect modal

### Binance Integration
- [ ] 9.1 — Server: Binance client (HMAC-SHA256 signing)
- [ ] 9.2 — Server: spot balances + staking + Simple Earn + dividend history
- [ ] 9.3 — Server: store key + secret encrypted per user
- [ ] 9.4 — Client: Binance connect modal

### Crypto.com Integration
- [ ] 10.1 — Server: Crypto.com client (signed POST requests)
- [ ] 10.2 — Server: spot + staking balances + reward history
- [ ] 10.3 — Server: store key + secret encrypted per user
- [ ] 10.4 — Client: Crypto.com connect modal

### Data Unification
- [ ] 11.1 — Server: GET /api/portfolio — merge all connected sources per user
- [ ] 11.2 — Server: GET /api/income — merge dividend + staking events per user
- [ ] 11.3 — Server: portfolio cache layer (TTL 1hr, invalidate on manual sync)

### AI Insights
- [ ] 12.1 — Client: chat UI + suggested prompts
- [ ] 12.2 — Server: POST /api/ai/chat — Claude claude-sonnet-4-6, portfolio context injected

### Polish
- [ ] 13.1 — Loading skeletons, error boundaries, empty states
- [ ] 13.2 — Responsive audit, production smoke test

## Session Log
| Date | Item | Notes |
|------|------|-------|
| 2026-02-19 | 0.1 | Monorepo restructure: client/ + server/ scaffold. Vercel root dir needs manual update to `client/`. Railway setup needed for server/. |
