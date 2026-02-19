# InvestIQ Progress Tracker

## Status
🟡 In Progress
Architecture: Vercel Serverless Functions (/api) + Neon PostgreSQL via Vercel Marketplace (single repo)

## Live URLs
- Frontend: https://investiq-nine.vercel.app
- API: served from Vercel Serverless Functions under /api
- Database: Neon PostgreSQL via Vercel Marketplace (managed at vercel.com/storage)

## GitHub Repo
https://github.com/carloshmiranda/investiq

## Database
- Provider: Neon PostgreSQL (free tier, scales to zero, never pauses)
- Installed via Vercel Marketplace — managed from vercel.com/storage
- Connection strings: injected automatically as DATABASE_URL + DATABASE_URL_UNPOOLED (never in git)

## Completed ✅
- [x] 0.1 — Monorepo restructured (client/ + server/), Express server scaffolded,
        Prisma schema created. **Superseded by architecture migration to Vercel Serverless + Supabase.**

## Backlog (in order — do one at a time)

### Foundation & Infrastructure
- [x] 0.1 — Create GitHub repo (single repo, not monorepo), init Vite + React + TailwindCSS,
            add /api folder with a health check function (GET /api/health returns {ok:true}),
            push to GitHub, connect to Vercel, confirm both frontend and /api/health are live

- [x] 0.2 — Install Neon via Vercel Marketplace, pull env vars with `vercel env pull .env`,
            set up Prisma schema (users, connections, portfolio_cache, sessions),
            run first migration against Neon DB, confirm Prisma can query from a test
            /api/db-check serverless function then delete it

- [x] 0.3 — Client: add /login and /register routes to React Router,
        protected route wrapper, auth context skeleton

### Auth System
- [x] 1.1 — POST /api/auth/register (bcrypt hash, create user, return JWT pair)
- [ ] 1.2 — POST /api/auth/login (verify password, return access + refresh tokens),
        POST /api/auth/refresh, POST /api/auth/logout
- [ ] 1.3 — JWT middleware (verify access token on all protected routes, attach userId)
- [ ] 1.4 — Client: /register page (name, email, password, confirm password)
- [ ] 1.5 — Client: /login page, JWT storage in memory + refresh token cookie
- [ ] 1.6 — Client: auth context (useAuth hook), protected route redirect, silent token refresh
- [ ] 1.7 — Client: /settings page (change name, email, password, active sessions, logout all)

### Mock Data & Core UI
- [ ] 2.1 — Migrate existing mock data + all 6 pages into src/ structure
- [ ] 2.2 — Dashboard KPI cards, income sparkline, health score wired to mock data
- [ ] 2.3 — Holdings table, Income page charts, Calendar grid wired to mock data

### DeGiro Integration (serverless, authenticated per user)
- [ ] 7.1 — DeGiro auth service (migrate from old edge functions to /api/brokers/degiro/)
- [ ] 7.2 — DeGiro portfolio + products fetch, store session encrypted in DB
- [ ] 7.3 — DeGiro dividends fetch, mapped to income events
- [ ] 7.4 — Client: DeGiro connect modal calls new serverless endpoints (auth required)

### Trading 212 Integration
- [ ] 8.1 — Trading 212 client (API key auth, rate limiter)
- [ ] 8.2 — T212 portfolio + dividend history fetch + mapper
- [ ] 8.3 — Store T212 API key encrypted in DB per user
- [ ] 8.4 — Client: T212 connect modal

### Binance Integration
- [ ] 9.1 — Binance client (HMAC-SHA256 signing)
- [ ] 9.2 — Spot balances + staking + Simple Earn + dividend history
- [ ] 9.3 — Store key + secret encrypted per user
- [ ] 9.4 — Client: Binance connect modal

### Crypto.com Integration
- [ ] 10.1 — Crypto.com client (signed POST requests)
- [ ] 10.2 — Spot + staking balances + reward history
- [ ] 10.3 — Store key + secret encrypted per user
- [ ] 10.4 — Client: Crypto.com connect modal

### Data Unification
- [ ] 11.1 — GET /api/portfolio — merge all connected sources per user
- [ ] 11.2 — GET /api/income — merge dividend + staking events per user
- [ ] 11.3 — Portfolio cache layer (TTL 1hr, invalidate on manual sync)

### AI Insights
- [ ] 12.1 — Client: chat UI + suggested prompts
- [ ] 12.2 — POST /api/ai/chat — Claude claude-sonnet-4-6, portfolio context injected

### Polish
- [ ] 13.1 — Loading skeletons, error boundaries, empty states
- [ ] 13.2 — Responsive audit, production smoke test

## Session Log
| Date | Item | Notes |
|------|------|-------|
| 2026-02-19 | 0.1 | Monorepo restructure: client/ + server/ scaffold. Vercel root dir needs manual update to `client/`. Railway setup needed for server/. |
| 2026-02-19 | Architecture migration | Replaced Railway+Express with Vercel Serverless Functions + Supabase. Folder structure flattened to single repo. vercel.json updated. |
| 2026-02-19 | Fix: Vercel function limit | Consolidated 14 → 7 serverless functions to stay within Hobby plan (12 max). auth/[action].js, connections/[provider].js, brokers/[...path].js. |
| 2026-02-19 | 0.1 | GitHub repo live, Vite+React+Tailwind built, /api/health returns {ok:true} in production. Frontend live at https://investiq-nine.vercel.app. |
| 2026-02-19 | 0.2 | Neon DB set up via Vercel Marketplace. Prisma schema migrated. 4 tables created: users, connections, portfolio_cache, sessions. DATABASE_URL injected automatically by Vercel. /api/db-check confirmed {ok:true,userCount:0} then deleted. |
| 2026-02-19 | 0.3 | AuthContext (login/register/logout, in-memory token), ProtectedRoute, Login and Register pages. All protected routes redirect to /login when unauthenticated. |
| 2026-02-19 | 1.1 | POST /api/auth/register live. bcrypt hash, Neon insert, jose JWT pair, httpOnly refresh cookie. Fixed vercel.json — removed /api rewrite that blocked serverless functions. |
