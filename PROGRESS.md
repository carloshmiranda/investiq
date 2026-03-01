# Accrue Progress Tracker

## CRITICAL: READ THIS FIRST, EVERY SESSION

Before writing a single line of code:

1. Read PROGRESS.md to understand what is done and what is next
2. Read MVP.md to remember the final goal
3. Find the FIRST UNCHECKED item in the backlog
4. Execute it fully
5. Commit, push, update PROGRESS.md
6. WITHOUT STOPPING — move to the next unchecked item
7. Repeat until context is 90-95% full, all items done, or a blocker is hit

## Autonomous Execution Contract

**Rule 1 — Keep going until context is full**
Complete backlog items sequentially without stopping between them.
After each item: commit, push, update PROGRESS.md, then immediately
start the next unchecked item. Only stop when ONE of these is true:
  a) All backlog items are complete (MVP reached)
  b) You estimate your context window is 90-95% full — finish the
     current item cleanly, commit, push, write "STOPPING: context near
     limit" in PROGRESS.md session log, then exit
  c) A MANUAL STEP REQUIRED browser action is needed — print
     instructions and stop
  d) BLOCKED after 3 failed fix attempts — document and stop

Never stop just because an item is done. Always look at the next one.

## ENDING A SESSION (Claude Code does this autonomously)

After EACH completed item:
```
git add .
git commit -m "feat: [item id] [description]"
git push
# update PROGRESS.md item to ✅ and add session log row
git add PROGRESS.md
git commit -m "chore: update progress tracker"
git push
# immediately start next item — do NOT stop
```

On final stop (context limit / blocker / manual step / MVP complete):
```
# Add to PROGRESS.md session log:
# "STOPPING: [reason] — resume with ./run.sh"
git add PROGRESS.md
git commit -m "chore: session end - [reason]"
git push
```

## Status
🟢 MVP COMPLETE
Architecture: Vercel Serverless Functions (/api) + Neon PostgreSQL via Vercel Marketplace (single repo)
Currency: USD/EUR/GBP switcher. Rates from open.exchangerate-api.com (free, no key).
Cached 1hr server-side. User preference stored in DB. Context-driven, zero page reloads.

## Live URLs
- Frontend: https://accrue-io.vercel.app
- API: served from Vercel Serverless Functions under /api
- Database: Neon PostgreSQL via Vercel Marketplace (managed at vercel.com/storage)

## GitHub Repo
https://github.com/carloshmiranda/accrue

## Database
- Provider: Neon PostgreSQL (free tier, scales to zero, never pauses)
- Installed via Vercel Marketplace — managed from vercel.com/storage
- Connection strings: injected automatically as DATABASE_URL + DATABASE_URL_UNPOOLED (never in git)
- User currency preference stored in users table as a currencyCode field (default: 'USD')

## Completed ✅
- [x] 0.1 — Monorepo restructured (client/ + server/), Express server scaffolded,
        Prisma schema created. **Superseded by architecture migration to Vercel Serverless + Supabase.**

## Backlog (in order — keep going until context is full)

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

- [x] 2.4 — Dashboard KPI cards, income sparkline, health score wired to mock data
- [x] 2.5 — Holdings table, Income page charts, Calendar grid wired to mock data

### DeGiro Integration (serverless, authenticated per user)
- [x] 7.1 — DeGiro auth service (migrate from old edge functions to /api/brokers/degiro/)
- [x] 7.2 — DeGiro portfolio + products fetch, store session encrypted in DB
- [x] 7.3 — DeGiro dividends fetch, mapped to income events
- [x] 7.4 — Client: DeGiro connect modal calls new serverless endpoints (auth required)

### Trading 212 Integration
- [x] 8.1 — Trading 212 client (API key auth, rate limiter)
- [x] 8.2 — T212 portfolio + dividend history fetch + mapper
- [x] 8.3 — Store T212 API key encrypted in DB per user
- [x] 8.4 — Client: T212 connect modal

### Binance Integration
- [x] 9.1 — Binance client (HMAC-SHA256 signing)
- [x] 9.2 — Spot balances + staking + Simple Earn + dividend history
- [x] 9.3 — Store key + secret encrypted per user
- [x] 9.4 — Client: Binance connect modal

### Crypto.com Integration
- [x] 10.1 — Crypto.com client (signed POST requests)
- [x] 10.2 — Spot + staking balances + reward history
- [x] 10.3 — Store key + secret encrypted per user
- [x] 10.4 — Client: Crypto.com connect modal

### Data Unification
- [x] 11.1 — GET /api/portfolio — merge all connected sources per user
- [x] 11.2 — GET /api/income — merge dividend + staking events per user
- [x] 11.3 — Portfolio cache layer (TTL 1hr, invalidate on manual sync)

### AI Insights
- [x] 12.1 — Client: chat UI + suggested prompts
- [x] 12.2 — POST /api/ai/chat — Claude claude-sonnet-4-6, portfolio context injected

### Polish
- [x] 13.1 — Loading skeletons, error boundaries, empty states
- [x] 13.2 — Responsive audit, production smoke test

### UI Design Polish — Priority 1 (high impact, low effort)
- [x] 14.1 — Background atmosphere (global): radial gradient on body (`src/index.css`), optional CSS noise overlay
- [x] 14.2 — Staggered card-reveal animations: apply `.card-reveal` to Dashboard, Income, Holdings, Calendar, AIInsights

### UI Design Polish — Priority 2 (medium impact)
- [x] 15.1 — Login/Register redesign: asymmetric desktop layout (left branding panel + right form), staggered `landing-fade-up` animations, logo glow, feature list (Login) / stats row (Register), `rounded-2xl` cards, mobile-first single column preserved
- [x] 15.2 — Settings page alignment: Card `h2` now `text-[13px] font-semibold` with `pb-3 border-b border-white/[0.06]` separator under each card title
- [x] 15.3 — Extract PageHeader component: already existed and was in use — marked complete
- [x] 15.4 — Header polish: gradient bottom fade added (`h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent` absolute div above content row)

### UI Design Polish — Priority 3 (polish)
- [x] 16.1 — AI chat bubble distinction: raised left border opacity from `/40` → `/70` on both AI message bubbles and typing indicator
- [x] 16.2 — Holdings table hover fix: row now always has `border-l-2 border-l-transparent`; hover sets `hover:border-l-[#7C5CFC]/50` — no layout shift
- [x] 16.3 — Sidebar active state: active nav item now uses `font-semibold` for stronger text weight distinction
- [x] 16.4 — Dashboard KpiCard accent bars: already implemented via `card-accent` CSS class + `--accent` variable — marked complete

### QA Bugs — Critical (found 2026-02-28, live site review)
- [x] 17.1 — Dashboard KPI cards exclude Binance on first render: added `syncing` indicator badge; KPIs update reactively as brokers resolve.
- [x] 17.2 — Dashboard "Income Last 6 Months" chart always empty: Dashboard was reading old bucket keys (`stockDividends`, `stakingRewards`). Fixed to use current `dividends`/`yield` keys from `classifyIncome`.
- [x] 17.3 — Connections page: Trading 212 Portfolio shows "NaN €": added `Number.isFinite()` guard — shows "—" when `account.totalValue` is NaN.
- [x] 17.4 — Connections page: "Tracked Value" KPI only includes Binance: now computes T212 value from positions array and sums all connected sources.
- [x] 17.5 — Billing page: "AI Usage This Month" shows "Unable to load usage data.": replaced error text with graceful zero state (0 queries, full progress bar width=0%).
- [x] 17.6 — Calendar: Daily staking/yield events not appearing: `useUnifiedPortfolio` now generates synthetic `tomorrowStr` nextPayDate for `frequency: 'Daily'` holdings with `annualIncome > 0`, and computes per-payment as `annualIncome / 365`.
- [x] 17.7 — Portfolio Health: Diversification sub-score negative: clamped to `Math.max(0, Math.min(100, ...))` in both `diversification` and `healthOverall` calculations.
- [x] 17.8 — Annual income inconsistent across pages: renamed "Annual Income" → "Projected Income" across Holdings (KPI card, column header, footer, CSV export) to clarify it is yield-based projection, not received income.
- [x] 17.9 — Dashboard "Allocation by Type" shows "Unknown": T212 mapper now sets `sector: null` (was `'Unknown'`); `useUnifiedPortfolio` sector fallback updated to `(h.sector && h.sector !== 'Unknown') ? h.sector : (h.type || 'Other')`; zero-value entries filtered from sectorData.

### QA UX Issues — Medium (found 2026-02-28, live site review)
- [x] 18.1 — Holdings filter bar: two adjacent "All" buttons: added "Source:" and "Type:" inline labels before each filter button group, with a `|` separator between them.
- [x] 18.2 — Holdings "Frequency" column shows "Unknown" for T212: T212 mapper now sets `frequency: null`; Holdings renders `—` for falsy/N/A values.
- [x] 18.3 — Holdings "Safety" column no tooltip: added `tooltip` property to column definitions; column headers now render an `ⓘ` icon with hover tooltip for columns that have one (Safety + Projected Income).
- [x] 18.4 — AI Insights: Suggested Questions duplicated: removed the right-panel "Quick Questions" card entirely; pill suggestions in chat area are the single entry point.
- [x] 18.5 — AI Insights: Large dead space in chat area: moved suggested question pills inside the messages scroll area so they appear directly below the welcome message instead of floating at the bottom.
- [x] 18.6 — Dashboard empty states need actionable copy: both "No income data" and "No upcoming payments" empty states now include a `<Link to="/connections">` CTA button.
- [x] 18.7 — Billing page dead space below pricing cards: added "Why upgrade?" section with three feature highlights (Unlimited AI, CSV Export, Auto Sync) that always render regardless of plan.

### Light Theme Fixes — Broken (found 2026-02-28, live site review)
- [x] L1 — Progress bar tracks render jet black in light mode: `bg-[#1f2937]` (Dashboard health/broker bars) now overrides to `#e5e7eb` in light; `bg-white/5` track override bumped from `0.025→0.05` opacity (Billing progress bars).
- [x] L2 — Sidebar separation: resolved by G4 — sidebar now uses `blur(16px) saturate(180%)` glass + `rgba(248,247,244,0.85)` warm-ivory bg in light mode, clearly distinct from page content behind it.
- [x] L3 — KPI card accent bars: light mode `.card-accent::before` now `opacity: 1` + `box-shadow: 0 0 10px 2px var(--accent)` — bars glow vividly against the white glass card in light theme.
- [x] L4 — Income chart gradients: bar bottom stopOpacity bumped 0.7→0.85 in Income.jsx + Dashboard.jsx (vivid on light bg). Area chart bottom stops bumped 0.01-0.02→0.08-0.12 (DRIP + forecast fills now visible on white).
- [x] L5 — Currency switcher buttons styled for dark mode only: added `.currency-switcher` class to header container; light mode CSS: `rgba(0,0,0,0.02)` bg, button `border-left` dividers (`rgba(0,0,0,0.07)`), hover `rgba(0,0,0,0.05)`. Active state text/bg handled by existing overrides.

### Glassmorphism / iOS Glass System (found 2026-02-28, design direction)
- [x] G1 — Cards: true frosted glass: dark mode `.glass-card` updated to `rgba(255,255,255,0.04)` bg + `blur(16px) saturate(180%)` + `border rgba(255,255,255,0.08)` + layered shadow. Light mode upgraded to `rgba(255,255,255,0.70)` + `blur(12px) saturate(180%)` + inner top highlight `inset 0 1px 0 rgba(255,255,255,0.9)`.
- [x] G2 — Cards: layered soft shadows for depth: dark 3-layer stack (contact 0 1px 3px/0.2 + mid 0 4px 24px/0.35 + far 0 12px 40px/0.18); hover expands to 0 2px 6px + 0 8px 32px + 0 20px 60px. Light: equivalent 3 layers at lower opacity (0.06/0.07/0.04); hover 0 2px 4px + 0 8px 24px + 0 20px 48px. Panels float.
- [x] G3 — Header frosted glass: upgraded from `backdrop-blur-md` (12px) to `blur(20px) saturate(180%)` via inline style. `bg-[#080808]/60` (was /90) lets gradient through in dark. Light mode: `rgba(248,247,244,0.78)` warm-ivory translucent background.
- [x] G4 — Sidebar glass panel: `bg-[#080808]/75` + `blur(16px) saturate(180%)` inline style (was /95 backdrop-blur-md). Dark mode: background gradients bleed through. Light mode: `rgba(248,247,244,0.85)` warm-ivory glass. Also resolves L2.
- [x] G5 — Background: ambient color glow in light mode: `[data-theme=light] body` background-image expanded from 2 gradients to 4 — purple top (0.07), emerald right (0.04), purple bottom-left (0.035), cyan bottom-right (0.025). Warm ivory now has atmospheric depth matching dark mode.
- [x] G6 — KPI cards: ambient glow behind accent color: per-accent hover `box-shadow` added for all 4 accent variants (emerald/cyan/amber/purple). Dark: `0 0 40px rgba(accent,0.09)` — subtle halo. Light: `0 0 36px rgba(accent,0.14)` — vivid on ivory. Targets `.glass-card.border-{color}-500/20:hover` in index.css.
- [x] G7 — Modals and overlays: glass backdrop + glass card: ModalShell overlay changed `bg-black/70 backdrop-blur-sm` → `bg-black/50` + inline `blur(12px)` frosted scrim. Modal card replaced `glass-card border…shadow-2xl` with new `.modal-glass` class: `blur(24px) saturate(200%)`, stronger border, `0 8px 40px rgba(0,0,0,0.5)` shadow. Light mode `.modal-glass`: `rgba(255,255,255,0.82)` fill.
- [x] G8 — Input fields: glass style: all input types get global `backdrop-filter: blur(8px) saturate(130%)`. Light mode inputs upgraded from `rgba(0,0,0,0.025)` → `rgba(255,255,255,0.72)` + `blur(12px) saturate(150%)` — true glass surface; focus: `rgba(255,255,255,0.85)`. Textarea receives identical treatment.

### Dark Theme Refinements (found 2026-02-28, live site review)
- [x] D1 — Portfolio Health donut: sector pie section now always renders `min-h-[140px]` container. When `sectorData` is empty (loading/no data), shows a donut-ring skeleton shimmer in place of blank space.
- [x] D2 — Sidebar logo zone: updated logo section border from `border-white/5` → `border-white/[0.08]` for stronger dark mode anchor. Light mode: `border-right-color rgba(0,0,0,0.08)` + `box-shadow: 2px 0 16px rgba(0,0,0,0.05)` for natural panel separation.

### Landing Page (found 2026-02-28, live site review)
- [x] P1 — Landing page: browser mockup product preview: `AppPreview()` section added between Hero and Features. CSS-drawn browser chrome (macOS traffic lights + URL bar) with `rotateX(5°)` perspective tilt + purple ambient glow underneath. Dashboard content: 4 KPI mini-cards with accent border-left, 12-bar income chart, holdings progress bars. Wired into `Landing()` render.
- [x] P2 — Landing page: glass stat block added to hero: frosted glass card (blur(20px), rgba(255,255,255,0.05) bg) showing "€11,534 portfolio · +8.3% yield · €96/mo · 24 holdings · 4 brokers" with emerald yield badge and purple corner glow. Positioned between CTA buttons and social proof row.
- [x] P3 — Landing pricing synced with Billing: replaced single beta "$0 all-features" card with two-tier Free ($0, 5 AI queries, no CSV/auto-sync/full-history) + Pro ($8/mo, $80/yr, unlimited AI + CSV + auto sync + full history + priority support) — exact match to Billing page.
- [x] P4 — Landing trust section: added `TrustBar` between About and Pricing — broker logo strip (DeGiro · Trading 212 · Binance · Crypto.com with brand colors) + 3 security callouts (AES-256 Encrypted, Read-Only API Access, Private By Default) in glass-border cards.

### Rebrand: Accrue → Flolio (2026-02-28)
- [x] R1 — Global rebrand to "Flolio". Find and replace every user-visible instance of "Accrue" with "Flolio" across the codebase. Specific targets:
  - `index.html`: `<title>`, meta description, OG title/description tags
  - `src/pages/Landing.jsx`: hero headline, product name references, any "Accrue" in copy
  - `src/components/` (Sidebar, Header, Layout): logo text, any brand name strings
  - `src/pages/Login.jsx`, `Register.jsx`: any "Accrue" in headings or copy
  - `src/pages/Billing.jsx`: plan names, any product references
  - `README.md`: header and all references
  - `package.json`: update `"name"` field if set to "accrue" or "investiq"
  - Do NOT rename Tailwind utility classes, git history, env var names, or Vercel/Neon config keys — these are infrastructure, not brand
  - After replacing: run `grep -r "Accrue" src/` and `grep "Accrue" index.html` to confirm clean. Build must pass.
  - **flolio.app has been purchased by Carlos. R2 and R3 can proceed immediately.**
- [x] R2 — Add flolio.app as custom domain via Vercel CLI: run `vercel domains add flolio.app`. Then run `vercel domains ls` to confirm and print the DNS records Carlos needs to set at his registrar (A record / CNAME). Commit nothing — this is a Vercel project setting only.
- [x] R3 — Rename GitHub repo: run `gh repo rename flolio --yes` (GitHub CLI). Then update the local git remote: `git remote set-url origin https://github.com/carloshmiranda/flolio.git`. Verify with `git remote -v`. GitHub auto-redirects the old URL so existing Vercel git integration stays live.

### SEO Technical Foundations (SEO audit — 2026-02-28)
- [x] SEO1 — Dynamic `<head>` management: install `react-helmet-async`, wrap `main.jsx` root in `<HelmetProvider>`. Add `<Helmet>` to: `Landing.jsx` (title: "Flolio — Track Dividends & Staking Rewards in One Dashboard", meta description targeting "passive income tracker multi-broker", OG title/description/type/url, Twitter card tags, canonical `https://flolio.app/`). `Blog.jsx` (title: "Flolio Blog — Passive Income & Dividend Investing", description, canonical `https://flolio.app/blog`). `BlogPost.jsx` (dynamic `post.title` as title, `post.description` as meta description, canonical `https://flolio.app/blog/${post.slug}`, `og:type: article`, `article:published_time: post.date`). Login/Register pages get minimal `noindex` meta to prevent auth pages appearing in search. **IMPORTANT — also add this Google Search Console verification tag to `index.html` `<head>` (static HTML, not via Helmet):** `<meta name="google-site-verification" content="kslLgcPHXtyjbULz5MiHhsT_jdLdREDp3rDhZkMRSuU" />` — this verifies flolio.app ownership in GSC so Carlos can submit the sitemap once DNS propagates.
- [ ] SEO2 — Create `/public/robots.txt`: Allow `/`, `/blog`, `/blog/*`. Disallow all authenticated app routes (`/dashboard`, `/holdings`, `/income`, `/calendar`, `/connections`, `/billing`, `/settings`, `/ai`). Add `Sitemap: https://flolio.app/sitemap.xml` directive.
- [ ] SEO3 — Generate `/public/sitemap.xml` statically: include landing (`/`), blog index (`/blog`), and one `<url>` entry per post in `src/blog/posts/` with `<loc>`, `<lastmod>` from frontmatter date, `<changefreq>monthly`, `<priority>`. Write a small Node build script (`scripts/generate-sitemap.js`) that reads frontmatter from posts and outputs the XML, run via `npm run build:sitemap` pre-build hook in `package.json`.
- [ ] SEO4 — Fix viewport meta in `index.html`: remove `maximum-scale=1.0` and `user-scalable=no`. New value: `width=device-width, initial-scale=1.0, viewport-fit=cover`. Also add `<meta name="theme-color" content="#7C5CFC">` and `<meta name="color-scheme" content="dark light">`.
- [ ] SEO5 — Replace Vite favicon: create `/public/favicon.svg` — Flolio "F" lettermark in brand purple `#7C5CFC` on `#0a0a0f` dark background, clean 32×32 viewBox. Add `/public/favicon.ico` (convert from SVG via sharp or use a 32×32 PNG renamed). Update `index.html` icon link to `/favicon.svg`. Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` (180×180 version).
- [ ] SEO6 — JSON-LD structured data: in `Landing.jsx` add `<script type="application/ld+json">` with `SoftwareApplication` schema (`name: Flolio`, `applicationCategory: FinanceApplication`, `operatingSystem: Web`, `offers: {price: 0}`). In `BlogPost.jsx` add `Article` schema (`headline: post.title`, `description: post.description`, `datePublished: post.date`, `author: {name: "Flolio Team"}`, `publisher: {name: "Flolio", logo: "https://flolio.app/favicon.svg"}`).
- [ ] SEO7 — Author bylines on blog posts: add `author` field to all 3 existing post frontmatter files (value: `"Flolio Team"`). In `BlogPost.jsx` render a small author chip below the article title: avatar placeholder circle (initials "FT" in purple), author name, and bio line "The Flolio team writes about passive income, dividend investing, and multi-broker portfolio management." Styled in the existing glass/prose aesthetic.
- [ ] SEO8 — Fix broker-specific language in `track-your-portfolio-across-brokers.md`: reframe the meta description and opening paragraph to use "multiple brokers and exchanges" as the framing, with specific names as illustrative examples only. Align with broker-agnostic positioning.
- [ ] SEO9 — Internal linking: (a) add 2–3 contextual `<Link>` cross-links between the 3 existing articles in their markdown body. (b) Add a "From the Blog" section to `Landing.jsx` between Features and Pricing — 3 latest posts as glass cards (title, description, read time, arrow link). Uses the existing `posts` export from `src/blog/index.js`, no new data fetch needed.

### AI Abstraction — Remove LLM-specific references (UX/UI review — 2026-02-28)
- [ ] AI1 — Remove all visible references to "Claude" and specific model names from the UI. Three locations in `src/pages/AIInsights.jsx`:
  - Line 82: welcome message copy "powered by Claude" → "your Flolio AI advisor"
  - Line 147: `<PageHeader>` subtitle "Your intelligent investment advisor powered by Claude" → "Your intelligent investment advisor"
  - Line 180: visible model badge rendering `claude-sonnet-4-6` — remove entirely. Users do not need to see the underlying model name; this leaks implementation detail and ties the brand to a specific provider.
- [ ] AI2 — Abstract the model in `api/ai.js` so it can be swapped via env var without a code change: replace `const MODEL = 'claude-sonnet-4-6'` with `const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6'`. Add `AI_MODEL` to Vercel env vars (value: `claude-sonnet-4-6`). Also rename internal variable `claudeMessages` → `aiMessages` for consistency. The Anthropic API URL, headers, and key name (`ANTHROPIC_API_KEY`) are infrastructure — leave those as-is since they're not user-facing and would require a larger refactor if the provider changes.

### Responsive Layout — Split-Screen Fix (UX/UI report — 2026-02-28)
- [x] RWD1 — App overflows horizontally at intermediate viewport widths (approx 700–1100px) with no scrollbar — content is clipped and unreachable. Reproducible by using split-screen on a wide monitor. Root cause is likely: (1) the sidebar + main content column layout has a fixed min-width that exceeds the available space, and/or (2) `overflow-x` is not set to `hidden` on the root/body so the browser doesn't clip but also doesn't scroll. Fix strategy: audit `src/components/Layout.jsx` (or equivalent shell) and `index.css` for any hardcoded `min-width`, `width`, or `flex` values that don't shrink below ~900px. Ensure the sidebar collapses to its mobile drawer state at the breakpoint where it would otherwise cause overflow (likely needs `lg:` prefix on sidebar visibility rather than `md:`). Add `overflow-x: hidden` to `html, body` in `index.css` as a safety net. Test at 700px, 800px, 900px, 1024px, 1280px widths. The mobile drawer sidebar (already implemented for small screens) should activate at whatever breakpoint the layout would otherwise overflow.

### Landing AppPreview Fidelity (UX/UI review — 2026-02-28)
AppPreview() in Landing.jsx is a CSS mock of the dashboard. It currently misrepresents the real app in 6 ways — fix all to match actual Dashboard.jsx faithfully.

- [ ] PV1 — KPI labels: update the 4 KPI cards to match real Dashboard labels exactly: "Total Portfolio Value" (emerald, €11,534) | "Annual Passive Income" (cyan, €564/yr) | "Portfolio Yield" (amber, 4.9%) | "Holdings" (purple, 24 assets). Change value formats to match — annual income not monthly.
- [ ] PV2 — Stacked income chart: replace single-series green bars with 3-series stacked bars matching the real Recharts chart — Dividends (emerald `#10b981`), Staking (cyan `#06b6d4`), Yield (amber `#f59e0b`). Each bar segment should stack visually. The multi-colour chart is a key product differentiator and the preview undersells it.
- [ ] PV3 — Replace right panel: remove "Top Holdings" progress bars (this section doesn't exist on the Dashboard). Replace col-span-2 right panel with a simplified Portfolio Health widget: a circular SVG ring gauge (score "82", emerald stroke, same style as HealthGauge component) above 3 sector rows (Equities 61%, Crypto 34%, REIT 5%) with coloured dots. This matches what users will actually see.
- [ ] PV4 — Card glassmorphism: upgrade preview cards from `rgba(255,255,255,0.025)` to `rgba(255,255,255,0.04)` bg + `backdrop-filter: blur(12px) saturate(160%)` + `border: 1px solid rgba(255,255,255,0.08)` + `box-shadow: 0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.3)`. The preview dashboard bg should also be `rgba(7,7,11,0.92)` not solid `#07070b`.
- [ ] PV5 — Ambient atmosphere inside chrome: add a subtle radial gradient inside the browser content area — `background: radial-gradient(ellipse at 20% 0%, rgba(124,92,252,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(6,182,212,0.05) 0%, transparent 60%), #07070b` — to replicate the real app's atmospheric depth.
- [ ] PV6 — Broker badges row: add a row between KPI cards and the chart/health panel showing "Live data from:" followed by 3 coloured broker badges: "T212" (cyan `#1199fa`), "DEGIRO" (emerald `#10b981`), "BNB" (amber `#f0b90b`). Match the exact style of the real connected brokers bar — `text-[8px] font-bold px-1.5 py-0.5 rounded border` with `background: color + '15'`, `color: color`, `borderColor: color + '33'`.

### Blog & Newsletter Infrastructure (CMO growth — 2026-02-28)
- [x] B1 — Build /blog route in Vercel: React Router entry at `/blog` and `/blog/:slug`. Articles stored as `.md` files in `/src/blog/posts/`. Use `gray-matter` for frontmatter (title, date, description, slug, readTime). Use `react-markdown` + `remark-gfm` for rendering. Blog index page: card grid with title, description, date, read time. Single article page: full-width readable prose layout. Apply Flolio's glass card aesthetic throughout. No new serverless functions needed — fully static.
- [ ] B2 — Email capture on landing page: Add a simple email input + "Get the Digest" button to Landing.jsx (between TrustBar and Pricing, or in the Hero area). On submit, call POST /api/newsletter/subscribe which validates the email and stores it in a new `newsletter_subscribers` table (email, createdAt, confirmed). Use Resend SDK to send a welcome email. Add `newsletter_subscribers` to Prisma schema and run migration. Resend free tier handles 3,000 emails/month — add RESEND_API_KEY to Vercel env vars.

## Session Log
| Date | Item | Notes |
|------|------|-------|
| 2026-02-19 | 0.1 | Monorepo restructure: client/ + server/ scaffold. Vercel root dir needs manual update to `client/`. Railway setup needed for server/. |
| 2026-02-19 | Architecture migration | Replaced Railway+Express with Vercel Serverless Functions + Supabase. Folder structure flattened to single repo. vercel.json updated. |
| 2026-02-19 | Fix: Vercel function limit | Consolidated 14 → 7 serverless functions to stay within Hobby plan (12 max). auth/[action].js, connections/[provider].js, brokers/[...path].js. |
| 2026-02-19 | 0.1 | GitHub repo live, Vite+React+Tailwind built, /api/health returns {ok:true} in production. Frontend live at https://accrue-io.vercel.app. |
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
| 2026-02-20 | 2.4 | Dashboard fully wired to CurrencyContext: all 4 KPI cards (total value, annual income, monthly income, YTD received), income bar chart (6-month history with converted Y-axis and tooltips), sector allocation pie chart, upcoming payments, and top movers all use formatMoney/formatLocal/convert from useCurrency(). Added formatLocal() to CurrencyContext for formatting pre-converted amounts. Enhanced formatMoney() to accept decimals param. Cleaned up unused imports. Build passes clean. |
| 2026-02-20 | run.sh update | Multi-item sessions enabled. Context monitoring at 90%. Claude runs until near limit then stops and resumes next session. |
| 2026-02-20 | 2.5 | Holdings table, Income page (KPIs, timeline chart, forecast chart, DRIP simulator, breakdown bars), and Calendar (month total, day detail, sidebar, summary) all wired to CurrencyContext. Replaced all hardcoded USD formatCurrency calls with formatMoney/formatLocal/convert. Chart Y-axes and tooltips convert reactively. Build passes clean. |
| 2026-02-20 | 7.1-7.4 | DeGiro integration complete. Backend: /api/degiro/[action].js serverless function handles login, totp, portfolio, products, dividends, transactions — proxies to trader.degiro.nl with JSESSIONID extraction, config resolution, account info fetch. Frontend: degiro services (auth.js, portfolio.js) and DegiroContext updated to use authAxios from AuthContext for JWT-authenticated requests. Client connect modal already existed in Connections page. Build passes clean. |
| 2026-02-20 | 8.1-8.4 | Trading 212 integration complete. Backend: /api/trading212/[action].js — connect (validates API key against T212 account summary, stores AES-256-GCM encrypted key+secret in connections table), disconnect, status, positions, dividends (cursor-paginated), account. Frontend: Trading212Context (connect/sync/disconnect with auto-status-check on mount), services (api.js), mapper (mapPosition/mapDividend/mergeHoldings), Trading212Modal + Trading212Card in Connections page. CurrencyContext wired throughout. Build passes clean. |
| 2026-02-20 | 9.1-9.4 | Binance integration complete. Backend: /api/binance/[action].js — HMAC-SHA256 signed requests, connect (validates via /api/v3/account), disconnect, status, balances (spot), earn (flexible+locked Simple Earn), dividends (asset distributions + earn rewards), prices (ticker map for USD valuation). API key+secret stored AES-256-GCM encrypted. Frontend: BinanceContext (connect/sync/disconnect), services (api.js), mapper (spot balances, earn positions, dividends/rewards with price lookup), BinanceModal + BinanceCard in Connections page. Brand color #f0b90b. Build passes clean. |
| 2026-02-20 | 10.1-10.4 | Crypto.com integration complete. Backend: /api/cryptocom/[action].js — HMAC-SHA256 signed POST requests to Exchange v1 API. Connect (validates via private/user-balance), disconnect, status, balances (spot+staking from user-balance), history (get-trades), prices (public get-tickers for USD valuation). Key+secret stored AES-256-GCM encrypted. Frontend: CryptocomContext with price-enriched holdings+totalValue, services (api.js with getPrices), mapper (buildPriceMap, getUsdPrice, mapBalance, mapStakingPosition, mapTrade, mergeHoldings). CryptocomCard+CryptocomModal wired into Connections page grid. cryptocomConnected counted in liveSourceCount. Brand color #002d74/#1199fa. Build passes clean. |
| 2026-02-20 | 11.1 | GET /api/portfolio — unified portfolio endpoint. Fetches holdings from all connected providers (T212, Binance, Crypto.com) in parallel with decrypted credentials. Each provider's API called server-side. Holdings normalized to common shape with price/value. Returns merged array + totalValue + sources + errors. DeGiro excluded (session-based). Build passes clean. |
| 2026-02-20 | 11.2 | GET /api/income — unified income endpoint. Fetches dividend/reward events from T212 (paginated dividends), Binance (asset dividends + earn rewards), Crypto.com (trades). Events normalized, sorted by date desc. Returns events + totalIncome + sources + errors. Build passes clean. |
| 2026-02-20 | 11.3 | Portfolio cache layer: lib/cache.js with getCache/setCache/invalidateCache using portfolio_cache table (1hr TTL). Both /api/portfolio and /api/income check cache first, support ?refresh=true bypass. POST endpoints for cache invalidation. Cache only stored on error-free fetches. Build passes clean. |
| 2026-02-20 | 12.1 | Client AI chat UI wired to POST /api/ai/chat via authAxios. Removed mock responses. Chat UI: message bubbles, markdown rendering, typing indicator, suggested prompts (6), insight cards (3). Removed news feed section. Build passes clean. |
| 2026-02-20 | 12.2 | POST /api/ai/chat: calls Anthropic Messages API with claude-sonnet-4-6. Portfolio+income data from cache injected into system prompt (holdings, values, sectors, income events). Full conversation history supported. Returns reply+model+usage. Graceful error for missing ANTHROPIC_API_KEY. Build passes clean. |
| 2026-02-20 | 13.2 | Responsive audit complete. Layout: mobile drawer sidebar (off-screen by default, slide-in on hamburger tap, auto-close on nav), header full-width on mobile. Header: compact currency switcher (symbol-only on xs), portfolio value text scales, notification bell hidden on xs. AI chat: height capped to viewport via min(). CSS: touch-friendly horizontal scroll, smaller chart fonts on mobile. Desktop behavior fully preserved. Build passes clean. |
| 2026-02-20 | MVP COMPLETE | All backlog items done (0.1–13.2). All MVP criteria checked off in MVP.md. Auth, 6 pages, 4 integrations (DeGiro, T212, Binance, Crypto.com), unified portfolio/income, AI chat, currency switcher, responsive layout, caching, error boundaries — all shipped. |
| 2026-02-21 | Broker wiring | Step 0: Broker base URLs moved to env vars (DEGIRO_BASE_URL, T212_BASE_URL, BINANCE_BASE_URL, CRYPTOCOM_BASE_URL) with fallback defaults. All environments configured via vercel env add. |
| 2026-02-21 | Broker wiring | Step 1: DebugPanel + useDebug hook + DebugContext. Floating overlay shows API call logs (provider, action, status, latency, errors). Toggle via bottom-right button. |
| 2026-02-21 | Broker wiring | Step 2: Connection test endpoints added to connections.js for all 4 brokers. GET /api/<provider>/test pings broker API with stored credentials, returns reachable/latency/status. |
| 2026-02-21 | Broker wiring | Step 3: Test Connection button on all 4 broker cards. useTestConnection hook + TestButton component. Results logged to DebugPanel. |
| 2026-02-21 | Broker wiring | Steps 4-9: DeGiro fully wired into unified portfolio. Session (sessionId+intAccount) stored encrypted in connections table after login. fetchDegiroHoldings in portfolio.js with product enrichment. fetchDegiroIncome in income.js with dividend history. Session expiry detection (401/403 marks connection as expired). DegiroContext disconnect calls API. Portfolio/income return useMockData flag for frontend mock fallback. Function count verified: 8/12. Pushed to main, Vercel auto-deploys. |
| 2026-02-24 | Binance client-side | Moved all Binance API calls to browser-side (Web Crypto HMAC-SHA256) to bypass Vercel geo-restriction. Added store-credentials/get-credentials actions to connections.js. Credentials restored on page reload. |
| 2026-02-24 | Connections redesign | Full Connections.jsx rewrite: shared primitives (ModalShell, InputField, SubmitButton, etc.), staggered card-reveal animations, brand accent bars, ~300 lines shorter, JS bundle shrank 20KB. New CSS in index.css. |
| 2026-02-24 | UI design audit | Full site review with frontend-design skill. 10 prioritized items added to backlog (14.1–16.4). Connections page set as quality benchmark. |
| 2026-02-28 | 17.1–17.9 | All 9 critical QA bugs fixed: Binance syncing indicator, Dashboard income chart keys, T212 NaN guard, Tracked Value now includes T212, Billing zero state, Calendar daily earn entries, diversification score clamped, "Projected Income" label, T212 sector/frequency null fixes. |
| 2026-02-28 | 18.1–18.7 | All 7 UX issues fixed: Holdings filter labels ("Source:" / "Type:"), T212 frequency dash, column header tooltips (Safety + Projected Income), AI chat pill dedup + moved inside scroll area, Dashboard empty-state CTAs → /connections, Billing "Why upgrade?" section. |
| 2026-02-28 | 15.1–16.4 | UI Design Polish sprint complete: Login/Register asymmetric desktop layout, Settings card title separator, Header gradient bottom fade, Sidebar active font-semibold, AI chat bubble left border opacity bump, Holdings row hover no-shift fix. 15.3 + 16.4 already done. |
| 2026-02-28 | L1, G1, D2, P2 | Cross-category polish: progress bar tracks visible in light mode (#e5e7eb); glass-card upgraded to true frosted glass (saturate 180%); sidebar logo border strengthened + light-mode shadow; Landing hero glass stat block (portfolio preview card). |
| 2026-02-28 | L3, G3, D1, P3 | L3: KPI accent bars fully vivid in light mode (opacity 1 + glow). G3: Header upgraded to blur(20px) saturate(180%) frosted glass, bg /60 → lets dark gradient show through, warm-ivory in light mode. D1: Donut chart always reserves min-h-[140px], shows ring skeleton when sector data is loading. P3: Landing pricing section replaced with proper Free/Pro two-tier cards matching Billing page exactly. |
| 2026-02-28 | L2, L4, G4, P4 | L4: chart bar bottom stopOpacity 0.7→0.85 + area bottom stops 0.01-0.02→0.08-0.12 (Income.jsx + Dashboard.jsx). G4: Sidebar upgraded to bg/75 + blur(16px) saturate(180%) glass; light mode rgba(248,247,244,0.85) — resolves L2. P4: Landing TrustBar section (broker logo strip + 3 security callout cards: AES-256 / read-only / private). |
| 2026-02-28 | L5, G5, G6, P1 | L5: currency-switcher CSS class — light mode button dividers + soft bg. G5: body bg-image expanded to 4-stop ambient gradient (purple/emerald/cyan). G6: per-accent hover glow (emerald/cyan/amber/purple) in dark (0.09 opacity) and light (0.14 opacity). P1: AppPreview() browser mockup with macOS chrome, perspective tilt, mini dashboard (KPI cards + chart + holdings). |
| 2026-02-28 | G2, G7, G8 | G2: glass-card shadow expanded to 3-layer stack (contact+mid+far) in both themes. G7: ModalShell overlay → blur(12px) frosted scrim + new .modal-glass card class (blur(24px) saturate(200%)). G8: all inputs get backdrop-filter: blur(8px); light mode inputs upgraded to rgba(255,255,255,0.72) glass fill + blur(12px). ENTIRE POLISH BACKLOG COMPLETE (L1–L5, G1–G8, D1–D2, P1–P4). |
| 2026-02-28 | B1 | Blog infrastructure complete. Packages: gray-matter + react-markdown + remark-gfm. Posts: 3 .md articles in src/blog/posts/ (dividend investing, multi-broker tracking, DRIP). Data loader: src/blog/index.js with import.meta.glob + gray-matter parse. Pages: Blog.jsx (featured card + grid) + BlogPost.jsx (prose layout, related posts, CTA banner). Routes: /blog + /blog/:slug added to App.jsx outside auth gates. Landing nav: "Blog" link added (Link component, not anchor). Build: clean 2.02s. |
| 2026-02-28 | R3 | GitHub repo renamed carloshmiranda/accrue → carloshmiranda/flolio via gh CLI. Local remote updated to https://github.com/carloshmiranda/flolio.git. Push confirmed. GitHub auto-redirects old URL — Vercel git integration unaffected. |
| 2026-02-28 | R2 | flolio.app + www.flolio.app added to Vercel project (team_Z4AsGtjfy6pAjCOtvJqzMT8d). DNS records needed at registrar: A flolio.app → 76.76.21.21 / A www.flolio.app → 76.76.21.21. No code commit — Vercel config only. |
| 2026-03-01 | RWD1 | Root cause: <main> had w-full (=100vw) + marginLeft, making it 100vw+240px wide. Content right-edge was clipped at viewport boundary. Fix: replaced w-full with width: calc(100% - marginLeft) so main fills exactly the remaining viewport. Sidebar toggle animation preserved via transition-all on marginLeft + width. Build clean 1.88s. |
| 2026-03-01 | SEO1 | react-helmet-async installed. HelmetProvider wraps app root. Landing: full title/description/canonical/OG/Twitter tags. Blog: title "The Digest", description, canonical, OG. BlogPost: dynamic per-post title, description, canonical, og:type=article, article:published_time. Login/Register: noindex/nofollow. index.html: Google Search Console verification tag (static). Build clean 1.94s. |
| 2026-02-28 | R1 | Global rebrand: "Accrue" → "Flolio" across entire codebase. Files updated: index.html (title), package.json (name), Sidebar (logo), Login/Register (logos ×2 each), AIInsights (AI name), Landing (logo + 3 copy instances + mockup URL + footer), Connections (2 security copy lines), Holdings (CSV filename), Blog/BlogPost (all instances), README.md (header). grep confirms zero remaining occurrences. Build passes clean in 1.69s. |
