# Excelias Portal — AI Coding Instructions

> These instructions apply to every Copilot request in this workspace.
> Update this file whenever the architecture changes.

---

## Project Identity

**Excelias** is the unified portal for the **RED Training Academy** e-learning platform.
Built with **Node.js + Express**, served on **port 4000**, deployed via **Vercel**.
All static content is served from `dist/` (built by `node build.js`).

---

## Monorepo Structure

```
j:\Excelias V2\
├── excelias-portal/          ← Main server (Express 4.22.1, Node 24)
│   ├── server.js             ← SINGLE entry point — routes, auth, middleware, static serving
│   ├── portal.js             ← Client-side portal UI (vanilla JS, no framework)
│   ├── xcelias-auth.js       ← Client-side auth (Firebase sign-in + session handshake)
│   ├── admin-reset.js        ← CLI tool to manage Firebase Auth users (NOT served)
│   ├── eslint.config.mjs     ← ESLint flat config
│   └── __tests__/server.test.js  ← Jest + supertest test suite (33 tests)
│
├── api/
│   └── gemini.js             ← Vercel serverless function — proxies Google Gemini API
│
├── Activites ( WorkSpace )/  ← Activities module (React/JSX, Babel pre-compiled)
├── Content ( WorkSpace )/    ← Content module (Create React App build)
├── Report Generation 3/      ← Reports module (vanilla HTML/JS)
├── Study Guide & Excersies/  ← Study guide module (vanilla HTML/JS)
├── Website ( WorkSpace )/    ← Property Explorer (vanilla JS + Leaflet maps)
│
├── build.js                  ← Build script: copies all modules to dist/, Babel-compiles JSX
├── dist/                     ← Production output (never edit directly)
└── .github/
    └── copilot-instructions.md  ← This file
```

---

## Auth Architecture (CRITICAL — read before touching any auth code)

- **Flow**: Client → Firebase Auth (email/password) → Firebase ID token → `POST /api/auth/firebase-session` → server verifies token with `firebase-admin` → issues HMAC-signed `xc_session` httpOnly cookie
- **Session format**: `base64url(JSON).HMAC-SHA256(base64url(JSON))`
- **Secret**: `XC_SESSION_SECRET` env var → `.session-secret` file → auto-generated on first run
- **Roles**: `KNOWN_USERS` map on the server. Roles are **NEVER** derived from client input.
- **BATCH_UIDS safety net**: Any UID in `BATCH_UIDS` is always `'student'` regardless of DB profile.
- **Guards**: `studentGuardMiddleware` — no session → 302 `/`; student session → 302 `/studyguide/`
- **Rate limiter**: In-memory per-IP, 5 req/60s, applies to `/api/auth/firebase-session` and `/api/gemini`

---

## Security Rules (OWASP — enforce always)

1. **XSS**: All user-controlled values written to `innerHTML` MUST use `escHtml()` or `_esc()`. Static developer HTML is safe without escaping.
2. **Session cookies**: Always `HttpOnly; SameSite=Lax; Path=/`. Add `Secure` in production.
3. **Auth on all API routes**: Routes that touch sensitive data MUST call `verifySession()` first.
4. **No eval / no implied-eval**: Banned by ESLint rule `no-eval`.
5. **Error responses**: Never expose `err.message` or stack traces to the client. Use safe static strings.
6. **Proxy targets**: The Gemini/route proxy target (`localhost:3000`) is hardcoded — never accept host/port from user input.
7. **CSP**: Do NOT add `unsafe-inline` or `unsafe-eval`. The 10-directive CSP in `server.js` is the baseline.
8. **Secrets**: No API keys, tokens, or passwords in source files. Use environment variables.

---

## Code Style

- **Language**: Node.js CommonJS (`require`/`module.exports`) everywhere in the portal
- **No frameworks**: Portal JS (portal.js, xcelias-auth.js) uses vanilla JS — no React, no jQuery
- **Escaping**: `escHtml(str)` in portal.js, `_esc(str)` in xcelias-auth.js — same DOM-based implementation
- **Error handling**: Global error handler in server.js sanitizes all unhandled errors
- **Async**: `async/await` preferred over `.then()` chains in new code
- **Naming**: camelCase for variables/functions, SCREAMING_SNAKE for module-level constants
- **Indentation**: 2 spaces (configured in .prettierrc)
- **Single quotes** for strings, semicolons required

---

## Testing

- **Framework**: Jest + supertest
- **Location**: `excelias-portal/__tests__/server.test.js`
- **Run**: `cd excelias-portal && npm test`
- **Mock pattern**: `firebase-admin` is mocked with a stable singleton. Always `_loginAttempts.clear()` in `beforeEach` to reset rate limiter state between tests.
- **Coverage targets**: Auth endpoints, session crypto, role guard invariants, security headers, error responses
- **Rule**: Every new API endpoint MUST have a test that proves unauthenticated access returns 401.

---

## Build & Dev

```bash
# Start server with auto-reload
cd excelias-portal && npm run dev       # nodemon

# Build dist/ from source modules
node build.js

# Run tests
cd excelias-portal && npm test

# Lint
cd excelias-portal && npm run lint

# Format
cd excelias-portal && npm run format
```

---

## Key Patterns to Follow

### Adding a new protected API route

```js
app.post("/api/my-route", (req, res) => {
  const session = verifySession(parseCookies(req).xc_session);
  if (!session)
    return res.status(401).json({ error: "Authentication required" });
  // ... handler logic
  try {
    // work
  } catch (err) {
    console.error("my-route error:", err.message); // log internally
    res.status(500).json({ error: "Internal server error" }); // never leak err.message
  }
});
```

### Safe innerHTML (always escape user data)

```js
// CORRECT
element.innerHTML = `<span class="chip">${escHtml(user.displayName)}</span>`;

// WRONG — never do this
element.innerHTML = `<span>${user.displayName}</span>`;
```

### Adding a module guard

```js
app.use("/mymodule", studentGuardMiddleware, express.static(MY_MODULE_DIR));
```

---

## Modules Overview

| Module        | Path                    | Auth                       |
| ------------- | ----------------------- | -------------------------- |
| Portal (home) | `/`                     | Admin only                 |
| Activities    | `/activities/`          | Admin only (student guard) |
| Content       | `/content/`             | Admin only (student guard) |
| Reports       | `/reports/`             | Admin only (student guard) |
| Study Guide   | `/studyguide/`          | All authenticated users    |
| Website       | `/website/`             | Student guard              |
| Avaria        | `http://localhost:3005` | Runs separately (Next.js)  |

---

## What NOT to do

- Do NOT add `express-session`, `passport`, or JWT middleware — the HMAC cookie system is already the auth layer
- Do NOT use `res.send(err)` or `res.json(err)` — always sanitize errors
- Do NOT add `unsafe-inline` to the CSP without removing inline scripts first
- Do NOT import secrets into source files — always use `process.env`
- Do NOT call `app.listen()` unconditionally — it's wrapped with `require.main === module` for testability
- Do NOT edit files in `dist/` — always edit source and rebuild
