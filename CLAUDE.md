# InvestIQ — Claude Code Project Rules

## VERCEL FUNCTION LIMIT — HARD CONSTRAINT

The Vercel Hobby plan allows maximum 12 Serverless Functions per deployment.

BEFORE creating any new file under /api/, you MUST:
1. Count existing .js files in /api/ recursively:
   find api -name "*.js" | wc -l
2. If count is 10 or more — STOP. Do not create the new function.
   Instead, route the new endpoint through an existing catch-all function.
3. If count is 11 or 12 — STOP and notify the user:
   "⚠️ FUNCTION LIMIT: Cannot add new /api/*.js file. Currently at N/12.
   New endpoint must be added as a route inside an existing function.
   Explicitly confirm in chat before I proceed."

NEVER exceed 12 files in /api/ without explicit user confirmation.
This rule overrides all backlog items and feature requests.

## CURRENT FUNCTION BUDGET
Limit:    12
Used:     8  (after consolidation)
Reserved: 4  (for future features)

## Architecture Rules
- One catch-all function per domain (/api/auth.js, /api/connections.js, etc.)
- URL routing via vercel.json rewrites — preserves existing frontend URLs
- All functions use the createHandler/createProtectedHandler wrapper from /lib/apiHandler.js
- Broker-specific routes rewritten to /api/connections.js via vercel.json

## API Route Map (8 functions)
| File                | Routes handled                                      |
|---------------------|-----------------------------------------------------|
| api/health.js       | GET /api/health                                     |
| api/rates.js        | GET /api/rates                                      |
| api/auth.js         | /api/auth/* (register, login, refresh, logout)      |
|                     | /api/user/* (profile, password, sessions, currency) |
| api/portfolio.js    | GET/POST /api/portfolio                             |
| api/income.js       | GET/POST /api/income                                |
| api/connections.js  | /api/degiro/*, /api/trading212/*,                    |
|                     | /api/binance/*, /api/cryptocom/*                    |
| api/brokers.js      | /api/brokers/* (reserved for future proxy routes)   |
| api/ai.js           | POST /api/ai/chat                                   |
