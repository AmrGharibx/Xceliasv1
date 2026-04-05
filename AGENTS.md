# Excelias — AI Agent Context

This file is loaded by GitHub Copilot, Claude, and other AI agents as always-on workspace context.
The full architecture and coding rules live in `.github/copilot-instructions.md`.
Additional targeted rules are in `.github/instructions/`.

---

## Quick Reference for AI Agents

### Tech Stack
- **Runtime**: Node.js 24, Express 4.22.1
- **Auth**: Firebase Auth (client) → `firebase-admin` (server) → HMAC-SHA256 `xc_session` httpOnly cookie
- **Testing**: Jest + supertest (`cd excelias-portal && npm test`)
- **Linting**: ESLint flat config (`eslint.config.mjs`)
- **Formatting**: Prettier (`.prettierrc`, 2-space indent, single quotes, semicolons)

### Critical Files
| File | Purpose |
|------|---------|
| `excelias-portal/server.js` | Express server — all routes, auth, middleware |
| `excelias-portal/portal.js` | Client portal UI (vanilla JS) |
| `excelias-portal/xcelias-auth.js` | Client auth (Firebase + session handshake) |
| `api/gemini.js` | Vercel serverless Gemini proxy |
| `build.js` | Build pipeline (source → dist/) |

### Non-Negotiable Security Rules
1. `innerHTML` → MUST use `escHtml()` or `_esc()` for any user-derived data
2. API routes → MUST call `verifySession(parseCookies(req).xc_session)` before logic
3. Error responses → MUST use safe static strings, never `err.message`
4. No `eval`, `new Function()`, or string-based `setTimeout`/`setInterval`
5. No secrets in source files — use `process.env`
6. No `unsafe-inline` in CSP

### Dev Commands
```bash
cd excelias-portal && npm run dev    # start server with hot reload
cd excelias-portal && npm test       # run 33-test suite
node build.js                        # build dist/ from source
```
