# InvestIQ Security Audit

**Date:** 2026-02-21
**Auditor:** Claude Code (Opus 4.6) + Trail of Bits skills
**Scope:** Full codebase — authentication, encryption, API routes, broker integrations, database, environment, dependencies

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 1     |
| HIGH     | 4     |
| MEDIUM   | 4     |
| LOW      | 2     |
| **Total**| **11**|

---

## Findings

### [CRITICAL] No rate limiting on authentication endpoints

- **File:** `api/auth/[action].js`, `lib/apiHandler.js`
- **Issue:** Login, register, and refresh endpoints have zero rate limiting. An attacker can brute-force passwords at network speed. On Vercel serverless, there is no infrastructure-level throttle — each request is an independent invocation. A 8-character lowercase password can be cracked in hours with sustained parallel requests.
- **Fix:** Add an in-memory sliding-window rate limiter keyed on IP address for auth endpoints. Limit login to 5 attempts per minute per IP, register to 3 per minute.
- **Status:** FIXED (`a11d61c`)

---

### [HIGH] Refresh tokens stored as plaintext in database

- **File:** `api/auth/[action].js`, `prisma/schema.prisma` (Session model)
- **Issue:** The `Session.refreshToken` column stores the raw JWT refresh token. If the database is compromised (SQL injection, backup leak, hosting breach), an attacker can immediately use any refresh token to impersonate users and mint new access tokens — no cracking required.
- **Fix:** Store a SHA-256 hash of the refresh token in the database. Send the raw token to the client in the HttpOnly cookie. On lookup, hash the incoming cookie value before querying.
- **Status:** FIXED (`7ec0d88`)

---

### [HIGH] Debug error messages leak internal information to clients

- **File:** `api/trading212/[action].js:94-97`, `api/binance/[action].js:80-83`, `api/cryptocom/[action].js:93-97`
- **Issue:** Broker connect endpoints return `{ error: '...', debug: err.message }` on failure. The `err.message` originates from upstream broker APIs and can leak internal URLs, error codes, stack traces, or infrastructure details that aid further attacks.
- **Fix:** Remove the `debug` field from all error responses. Log the full error server-side only.
- **Status:** FIXED (`d73f14b`)

---

### [HIGH] CORS allows wildcard origin as fallback

- **File:** `lib/apiHandler.js:4`
- **Issue:** `Access-Control-Allow-Origin` is set to `process.env.VITE_API_URL || '*'`. If `VITE_API_URL` is not set in a deployment environment, CORS opens to all origins. Combined with `withCredentials: true` on the client, this is a misconfiguration that browsers may partially block but still represents a defense-in-depth failure.
- **Fix:** Remove the `'*'` fallback. Require `VITE_API_URL` to be set. In development, default to `http://localhost:5173` instead of wildcard.
- **Status:** FIXED (`c08f3fb`)

---

### [HIGH] Missing security response headers

- **File:** `lib/apiHandler.js`
- **Issue:** API responses lack standard security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `X-XSS-Protection`, `Referrer-Policy`, and `Content-Security-Policy`. This leaves the application vulnerable to clickjacking, MIME sniffing, and reduces defense-in-depth.
- **Fix:** Add security headers to the `corsHeaders()` function in `apiHandler.js`.
- **Status:** FIXED (`c08f3fb`)

---

### [MEDIUM] DeGiro session credentials passed as URL query parameters

- **File:** `api/degiro/[action].js:128-141`
- **Issue:** `sessionId` and `intAccount` are passed as URL query parameters (`?sessionId=xxx&intAccount=xxx`). Query parameters are logged in server access logs, browser history, CDN/proxy logs, and potentially leaked via the Referer header.
- **Fix:** Move `sessionId` and `intAccount` to request headers or body. This requires coordinated frontend changes.
- **Status:** OPEN (requires frontend refactor)

---

### [MEDIUM] No email format validation on registration

- **File:** `api/auth/[action].js:38`
- **Issue:** Registration only checks for presence of `email`, not format. Any string is accepted (e.g., `"not-an-email"`, `"<script>alert(1)</script>"`). While Prisma parameterizes queries (preventing SQLi), malformed emails could cause issues with any future email-sending features or be rendered unsafely.
- **Fix:** Add a basic email regex validation before creating the user.
- **Status:** OPEN

---

### [MEDIUM] No request body size limits

- **File:** `lib/apiHandler.js`, all API routes
- **Issue:** No explicit limit on request body size. Vercel has a 4.5MB default for serverless functions, but attackers can send large payloads to consume memory/processing time. Fields like `name`, `email`, `messages` (AI chat) have no length limits.
- **Fix:** Add input length validation on user-controlled fields (name: 100 chars, email: 254 chars, password: 128 chars, AI messages: 10,000 chars).
- **Status:** OPEN

---

### [MEDIUM] No session count limit per user

- **File:** `api/auth/[action].js:62-70, 100-108`
- **Issue:** Users can create unlimited sessions by logging in repeatedly. An attacker with valid credentials could create thousands of sessions, polluting the Session table.
- **Fix:** Cap active sessions per user (e.g., 10). On new login, evict the oldest session if at the limit.
- **Status:** OPEN

---

### [LOW] Encryption key not validated at startup

- **File:** `lib/encryption.js:7`
- **Issue:** `Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex')` — if `ENCRYPTION_KEY` is missing or malformed, the application will crash on first encrypt/decrypt call rather than failing fast at startup with a clear error.
- **Fix:** Add a startup check that validates `ENCRYPTION_KEY` is a 64-character hex string (32 bytes).
- **Status:** OPEN

---

### [LOW] Dev dependency vulnerabilities (npm audit)

- **File:** `package.json` (devDependencies)
- **Issue:** `npm audit` reports 5 vulnerabilities (1 moderate, 4 high) — all in `minimatch` and `ajv`, used transitively by ESLint. These are **dev-only** dependencies and do not ship to production.
  - `minimatch <10.2.1` — ReDoS via repeated wildcards (HIGH × 4)
  - `ajv <6.14.0` — ReDoS when using `$data` option (MODERATE × 1)
- **Fix:** Run `npm audit fix` or upgrade ESLint to v10+.
- **Status:** OPEN

---

## Passed Checks

| Area | Status | Notes |
|------|--------|-------|
| **Password hashing** | PASS | bcryptjs with 12 salt rounds — industry standard |
| **JWT implementation** | PASS | Uses `jose` library, HS256, separate access/refresh secrets, 15m/7d expiry, `jti` on refresh tokens |
| **Access token storage** | PASS | Stored in memory only (React state + ref), never in localStorage |
| **Refresh token cookie** | PASS | HttpOnly, SameSite=Strict, Path=/api/auth, Secure in production |
| **Refresh token rotation** | PASS | Old token replaced on each refresh — proper rotation |
| **Session invalidation** | PASS | Logout deletes session, logout-all clears all sessions, individual revoke supported |
| **AES-256-GCM encryption** | PASS | Random 12-byte IV per operation, auth tag validated, correct algorithm usage |
| **IV reuse risk** | PASS | `randomBytes(12)` called per encryption — no IV reuse |
| **Prisma parameterized queries** | PASS | All DB queries use Prisma's parameterized API — no raw SQL, no injection vectors |
| **userId scoping** | PASS | All protected routes use `req.userId` from JWT — queries scoped to authenticated user |
| **API key encryption at rest** | PASS | Broker API keys encrypted with AES-256-GCM before database storage |
| **No secrets in console.log** | PASS | No instances of logging secrets, tokens, or API keys |
| **.env in .gitignore** | PASS | `.env` is gitignored, never committed to repository history |
| **Separate access/refresh secrets** | PASS | `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are distinct 32-byte keys |
| **Error message uniformity (auth)** | PASS | Login returns same "Invalid email or password" for wrong email and wrong password — no user enumeration |
| **Protected route enforcement** | PASS | All sensitive endpoints use `createProtectedHandler()` which calls `requireAuth()` before dispatch |
| **Cookie path restriction** | PASS | Refresh token cookie scoped to `Path=/api/auth` — not sent on other requests |
