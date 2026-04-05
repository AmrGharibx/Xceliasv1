---
name: 'Jest Test Patterns'
description: 'Test structure, mock patterns, and coverage rules for Jest + supertest tests'
applyTo: '**/__tests__/**/*.js'
---

## Jest test conventions

### File structure
- Group tests by HTTP endpoint or function using `describe()` blocks.
- Always include a `beforeEach(() => { _loginAttempts.clear(); })` at the TOP-LEVEL to reset rate limiter state between tests.
- Use `jest.clearAllMocks()` inside `describe` blocks that use `admin.auth().verifyIdToken` mocks.

### Firebase Admin mock (singleton pattern)
```js
jest.mock('firebase-admin', () => {
  const mockVerifyIdToken = jest.fn();
  const mockAuth = { verifyIdToken: mockVerifyIdToken };
  return { initializeApp: jest.fn(), auth: () => mockAuth };
});
```
Never create a new mock object per call — the singleton is required so test mocks affect what server.js uses.

### Session helpers
```js
const { app, signSession, verifySession, parseCookies, _loginAttempts } = require('../server');
function makeSession(payload) { return signSession(payload); }
function cookieHeader(token) { return `xc_session=${token}`; }
```

### Required tests for every new API endpoint
1. `401` with no session cookie
2. `401` with tampered/invalid session cookie
3. Valid session returns expected response
4. Error responses do not leak internal details

### Session expiry note
`exp` is stored in **milliseconds** (not Unix seconds) in this codebase.
Expired token: `signSession({ uid: 'x', role: 'admin', exp: Date.now() - 1 })`
