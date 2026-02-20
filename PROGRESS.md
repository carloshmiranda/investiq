# InvestIQ Progress Tracker

## Status
🟡 In Progress
Architecture: Vercel Serverless Functions (/api) + Neon PostgreSQL via Vercel Marketplace (single repo)
Currency: USD/EUR/GBP switcher. Rates from open.exchangerate-api.com (free, no key).
Cached 1hr server-side. User preference stored in DB. Context-driven, zero page reloads.

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
- User currency preference stored in users table as a currencyCode field (default: 'USD')

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

- [x] 0.4 — Add currencyCode field (String, default 'USD') to User model in Prisma schema,
            run migration, update all auth endpoints to return currencyCode in user payload

- [x] 0.5 — Create /lib/exchangeRates.js on the server: fetch USD base rates from
            https://open.exchangerate-api.com/v6/latest/USD, cache result in module-level
            variable with 1hr TTL, export getRate(toCurrency) helper.
            Create GET /api/rates endpoint returning { USD: 1, EUR: x, GBP: x, updatedAt }.
            Create PATCH /api/user/currency endpoint (body: { currencyCode }) that validates
            input is one of ['USD','EUR','GBP'], updates users table, returns updated user.

### Auth System
- [x] 1.1 — POST /api/auth/register (bcrypt hash, create user, return JWT pair)
- [x] 1.2 — POST /api/auth/login (verify password, return access + refresh tokens),
        POST /api/auth/refresh, POST /api/auth/logout
- [x] 1.3 — JWT middleware (verify access token on all protected routes, attach userId)
- [x] 1.4 — Client: /register page (name, email, password, confirm password)
- [x] 1.5 — Client: /login page, JWT storage in memory + refresh token cookie
- [x] 1.6 — Client: auth context (useAuth hook), protected route redirect, silent token refresh
- [x] 1.7 — Client: /settings page (change name, email, password, active sessions, logout all)

### Mock Data & Core UI
- [x] 2.1 — Migrate existing mock data + all 6 pages into src/ structure

- [x] 2.2 — Create CurrencyContext (/src/context/CurrencyContext.jsx):
            loads rates from GET /api/rates on mount, refreshes every hour,
            stores { activeCurrency, setActiveCurrency, convert(amount), formatMoney(amount) }.
            convert(amount) multiplies by the active rate.
            formatMoney(amount) returns Intl.NumberFormat string with correct symbol and locale
            (en-US/USD, de-DE/EUR, en-GB/GBP).
            Persist activeCurrency to localStorage and sync with user's currencyCode in DB
            via PATCH /api/user/currency on every switch.
            Wrap App.jsx with <CurrencyProvider> inside <AuthProvider>.

- [x] 2.3 — Add currency switcher UI to Header component:
            A compact 3-button toggle (USD | EUR | GBP) in the top-right of the header,
            next to the user avatar/settings link.
            Active currency highlighted with the emerald accent (#10b981).
            Clicking switches instantly via setActiveCurrency from CurrencyContext.
            No page reload required — all values re-render reactively.

- [ ] 2.4 — Dashboard KPI cards, income sparkline, health score wired to mock data
- [ ] 2.5 — Holdings table, Income page charts, Calendar grid wired to mock data

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
| 2026-02-19 | 1.2 | POST /api/auth/login + refresh + logout live. Refresh token rotation (jti+iat prevents same-second collision). Replay of rotated/logged-out tokens correctly rejected. |
| 2026-02-19 | 1.3 | createProtectedHandler added to apiHandler.js. All non-auth routes now return 401 without Bearer token, 401 with invalid token, pass through to handler with valid token. |
| 2026-02-19 | 1.4 | Register.jsx upgraded: confirm password field, client-side validation (required fields, email format, min 8 chars, passwords match). API errors still surfaced from AuthContext. |
| 2026-02-19 | 1.5 | Login.jsx: client-side validation (required fields). AuthContext: withCredentials:true on all auth axios calls so httpOnly refresh cookie is sent. Created run.sh (vercel dev). |
| 2026-02-19 | 1.6 | AuthContext: isLoading starts true, useEffect on mount calls /api/auth/refresh to restore session. authAxios instance with request interceptor (Bearer token) + response interceptor (401→refresh+retry, on refresh failure clears auth). ProtectedRoute spins while isLoading, then redirects. |
| 2026-02-20 | 1.7 | Settings page: profile edit (name/email), password change (current+new+confirm), active sessions list with revoke/logout-all. Sidebar updated with Settings nav item + real user name/initials + sign-out button. AuthContext gained updateUser(). Backend API already existed at api/user/[action].js. |
| 2026-02-20 | 2.1 | All 6 pages already in src/pages/ (Dashboard, Income, Holdings, Calendar, Connections, AIInsights) with full Recharts integration. Mock data layer (mockPortfolio.js) provides stocks, crypto, income history, projections, upcoming payments, connections + computed helpers. All routes wired in App.jsx with ProtectedRoute + Layout. Build passes clean. |
| 2026-02-20 | Scope update | Added currency switcher feature (USD/EUR/GBP) to MVP. New backlog items: 0.4, 0.5, 2.2, 2.3. All downstream items renumbered. |
| 2026-02-20 | 0.4 | Added currencyCode (String, default 'USD') to User model. Migration applied to Neon DB. All auth endpoints (register, login, refresh) and user endpoints (profile GET/PUT) now return currencyCode in user payload. |
| 2026-02-20 | 0.5 | Exchange rate service: /lib/exchangeRates.js fetches USD-based rates from open.exchangerate-api.com, caches 1hr in module variable, exports getRate() and getAllRates(). GET /api/rates returns { USD, EUR, GBP, updatedAt }. PATCH /api/user/currency validates input against ['USD','EUR','GBP'], updates DB, returns user. Added PATCH to CORS allowed methods. |
| 2026-02-20 | 2.2 | CurrencyContext created: loads rates from GET /api/rates on mount, refreshes every hour, provides activeCurrency/setActiveCurrency/convert(amount)/formatMoney(amount). Syncs user preference from DB on login, persists to localStorage, patches DB on switch. App.jsx wrapped with CurrencyProvider inside AuthProvider. Build passes clean. |
| 2026-02-20 | 2.3 | Currency switcher added to Header: compact 3-button toggle ($ USD | € EUR | £ GBP) between income pill and date/time. Active currency highlighted with emerald accent. Clicking switches instantly via CurrencyContext — no reload. Header portfolio value and income pill now use formatMoney() for live currency conversion. Build passes clean. |
