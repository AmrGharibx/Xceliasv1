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
├── New Xcelias Data/red-academy/ ← Private Academy Operations (invitation-only, persistent data)
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

## RED Academy and trainer activities

- The private Academy Operations app lives in `New Xcelias Data/red-academy/` and has its own invitation-only `admin` / `instructor` / `viewer` roles; its authenticated API uses `red_session` in self-hosted mode or a short-lived bearer token in cloud mode.
- `/red-academy/trainer-activities/` is the standalone Academy Studio. It shares RED Academy's authenticated session, canonical roster, and server-side `activity_assignments` / `activity_assignment_participants` records. Native quiz answer keys stay server-side; learner entry links are random bearer tokens stored only as SHA-256 hashes, and quiz scores/XP are graded by the server.
- `/red-academy/#/activities` remains the earlier trainer-workspace fallback. Do not remove it or the separate `/activities/` legacy game library as the Studio grows; preserving both is intentional.
- Academy Studio supports shared immutable trainer-authored challenges, optional active-recall cards, and an optional Gemini challenge-draft assistant. AI drafts require explicit consent, may include only the learning brief and non-sensitive lesson notes (never roster data), are validated server-side, and must remain unsaved until a trainer reviews and publishes. Custom answer keys are private data; local and cloud APIs must continue stripping keys until server-side grading/reveal. Cloud deployments additionally require `20260924200000_studio_custom_challenges.sql`; do not apply it from tests/builds.
- Academy Studio's shared classroom run-of-show is stored in `activity_session_plans`: batch/date and optional-company scoped, four-step (warm-up, live challenge, coaching huddle, exit ticket), audited, version-checked, and visible only to writable staff. The linked challenge must be selected from the active server-side Studio library; session dates suggested by the planner must not silently alter attendance. Cloud deployments additionally require `20260924220000_activity_session_plans.sql` after the custom-challenge migration; do not apply it from tests/builds.
- Academy Studio's learner quiz loop is covered against an isolated SQLite server and Chromium. Cloud support additionally depends on applying `20260924120000_trainer_activities.sql` and `20260924140000_activity_studio_learner_loop.sql`, then redeploying the Edge Function/static build; local test/build tasks must never apply cloud migrations.
- Academy Studio's optional session co-planner requires explicit trainer consent and sends only the selected learning focus, safe challenge metadata, and lesson notes to Gemini. Never include the roster, trainee identifiers, scores, attendance, or answer keys. AI cue drafts remain unsaved until a trainer reviews and submits the session plan; shared cue text is validated through `activity-session-plans.mjs` and persisted in the existing four-step outline. Local and Edge Function AI paths must stay behaviorally aligned.
- The optional Role-play Lab AI co-planner requires its own explicit consent and sends only the selected skill and trainer-entered lesson notes. Validate contact details and all generated scene fields on the server, keep the draft in ephemeral trainer UI state only, and never record performance, send roster/assessment/attendance data, award XP, or alter curated role-play scenes. Local API and Academy Edge Function implementations must stay aligned.
- The standalone `/activities/` React/Firebase library is legacy game content and has a separate authentication system. Do not treat its local accounts, user profiles, or Firebase roles as the Academy roster or authorization source.
- For cloud releases, apply the matching `New Xcelias Data/red-academy/supabase/migrations/` migration before publishing frontend/API changes. Never run a cloud migration from an ordinary local build/test task.

## Modules Overview

| Module        | Path                    | Auth                       |
| ------------- | ----------------------- | -------------------------- |
| Portal (home) | `/`                     | Admin only                 |
| Trainer Activities | `/red-academy/trainer-activities/` | RED Academy invitation-only session; admin/instructor can manage |
| Trainer Activities fallback | `/red-academy/#/activities` | RED Academy invitation-only session; admin/instructor can manage |
| Legacy game library | `/activities/` | Portal staff guard plus legacy Firebase/local sign-in |
| Content       | `/content/`             | Admin only (student guard) |
| Reports       | `/reports/`             | Admin only (student guard) |
| Study Guide   | `/studyguide/`          | All authenticated users    |
| Academy Operations | `/red-academy/` | RED Academy invitation-only session |
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
