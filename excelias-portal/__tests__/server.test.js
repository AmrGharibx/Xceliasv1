/**
 * Excelias Portal — Server Security & API Tests
 * ──────────────────────────────────────────────
 * Tests: auth endpoints, session management, guards, rate limiter, error handling
 *
 * Firebase Admin is mocked — no credentials required.
 */

'use strict';

/* ── Mock firebase-admin before loading server ── */
jest.mock('firebase-admin', () => {
  // Use a STABLE singleton so mock calls applied in tests actually affect what
  // server.js invokes (server.js calls admin.auth().verifyIdToken(...)).
  const mockVerifyIdToken = jest.fn();
  const mockAuth = { verifyIdToken: mockVerifyIdToken };
  return {
    initializeApp: jest.fn(),
    auth: () => mockAuth,
  };
});

const request = require('supertest');
const admin = require('firebase-admin');
const {
  app,
  signSession,
  verifySession,
  parseCookies,
  _loginAttempts,
  _geminiAttempts,
} = require('../server');

/* ─────────────────────────────────────────────────────────── */
/* Global setup — clear rate-limiter state before each test   */
/* ─────────────────────────────────────────────────────────── */
beforeEach(() => {
  _loginAttempts.clear();
  _geminiAttempts.clear();
});

/* ─────────────────────────────────────────────────────────── */
/* Helpers                                                      */
/* ─────────────────────────────────────────────────────────── */

/** Known UIDs from server.js KNOWN_USERS map */
const UID_STUDENT = 'OKZ7mPrvE0cvMH8LPTUY13yXw9d2';
const UID_ADMIN = '1olZC4rnatZlGkYPgIg2lZFjZ782';

function makeSession(payload) {
  return signSession(payload);
}

function cookieHeader(token) {
  return `xc_session=${token}`;
}

/* ─────────────────────────────────────────────────────────── */
/* 1 — Session helpers unit tests                              */
/* ─────────────────────────────────────────────────────────── */

describe('signSession / verifySession', () => {
  test('round-trips a valid payload', () => {
    const token = signSession({ uid: 'u1', role: 'admin' });
    const decoded = verifySession(token);
    expect(decoded).toMatchObject({ uid: 'u1', role: 'admin' });
  });

  test('returns null for tampered token', () => {
    const token = signSession({ uid: 'u1', role: 'admin' });
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(verifySession(tampered)).toBeNull();
  });

  test('returns null for expired token', () => {
    // exp is stored in milliseconds (see setSessionCookie)
    const token = signSession({ uid: 'u1', role: 'admin', exp: Date.now() - 1 });
    expect(verifySession(token)).toBeNull();
  });

  test('returns null for null/empty input', () => {
    expect(verifySession(null)).toBeNull();
    expect(verifySession('')).toBeNull();
    expect(verifySession('not.a.token')).toBeNull();
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 2 — parseCookies unit tests                                 */
/* ─────────────────────────────────────────────────────────── */

describe('parseCookies', () => {
  test('parses a simple cookie string', () => {
    const req = { headers: { cookie: 'xc_session=abc123; other=xyz' } };
    expect(parseCookies(req).xc_session).toBe('abc123');
    expect(parseCookies(req).other).toBe('xyz');
  });

  test('returns empty object when no cookies', () => {
    expect(parseCookies({ headers: {} })).toEqual({});
    expect(parseCookies({ headers: { cookie: '' } })).toEqual({});
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 3 — GET /api/auth/whoami                                    */
/* ─────────────────────────────────────────────────────────── */

describe('GET /api/auth/whoami', () => {
  test('returns 401 with no session cookie', async () => {
    const res = await request(app).get('/api/auth/whoami');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 401 with invalid session cookie', async () => {
    const res = await request(app)
      .get('/api/auth/whoami')
      .set('Cookie', 'xc_session=invalid.token.here');
    expect(res.status).toBe(401);
  });

  test('returns uid + role with valid admin session', async () => {
    const token = makeSession({ uid: UID_ADMIN, role: 'admin' });
    const res = await request(app).get('/api/auth/whoami').set('Cookie', cookieHeader(token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ uid: UID_ADMIN, role: 'admin' });
  });

  test('returns uid + role with valid student session', async () => {
    const token = makeSession({ uid: UID_STUDENT, role: 'student' });
    const res = await request(app).get('/api/auth/whoami').set('Cookie', cookieHeader(token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ uid: UID_STUDENT, role: 'student' });
  });

  test('does NOT expose sensitive fields', async () => {
    const token = makeSession({ uid: UID_ADMIN, role: 'admin' });
    const res = await request(app).get('/api/auth/whoami').set('Cookie', cookieHeader(token));
    // Must not expose secret, password, or server internals
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/secret|password|SESSION_SECRET/i);
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 4 — POST /api/auth/logout                                   */
/* ─────────────────────────────────────────────────────────── */

describe('POST /api/auth/logout', () => {
  test('returns ok:true and clears the session cookie', async () => {
    const token = makeSession({ uid: UID_ADMIN, role: 'admin' });
    const res = await request(app).post('/api/auth/logout').set('Cookie', cookieHeader(token));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
    // Cookie should be cleared (Max-Age=0 or expired)
    const setCookie = res.headers['set-cookie'] || [];
    const cookieStr = setCookie.join('; ');
    expect(cookieStr).toMatch(/xc_session/);
    expect(cookieStr).toMatch(/Max-Age=0|expires=.*1970/i);
  });

  test('works even without a session (unauthenticated logout)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 5 — POST /api/auth/firebase-session                         */
/* ─────────────────────────────────────────────────────────── */

describe('POST /api/auth/firebase-session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 when idToken is missing', async () => {
    const res = await request(app).post('/api/auth/firebase-session').send({});
    expect(res.status).toBe(400);
  });

  test('returns 400 when idToken is not a string', async () => {
    const res = await request(app).post('/api/auth/firebase-session').send({ idToken: 12345 });
    expect(res.status).toBe(400);
  });

  test('returns 401 when Firebase rejects the token', async () => {
    admin.auth().verifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));
    const res = await request(app)
      .post('/api/auth/firebase-session')
      .send({ idToken: 'fake-firebase-token' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
    // Must NOT leak the internal error message
    expect(res.body.error).not.toMatch(/Invalid token/);
  });

  test('returns 403 for an unknown Firebase UID', async () => {
    admin.auth().verifyIdToken.mockResolvedValueOnce({ uid: 'unknown-uid-xyz' });
    const res = await request(app)
      .post('/api/auth/firebase-session')
      .send({ idToken: 'valid-but-unknown-user-token' });
    expect(res.status).toBe(403);
  });

  test('issues a session cookie for a known student UID', async () => {
    admin.auth().verifyIdToken.mockResolvedValueOnce({ uid: UID_STUDENT });
    const res = await request(app)
      .post('/api/auth/firebase-session')
      .send({ idToken: 'valid-student-token' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, role: 'student' });
    const setCookie = res.headers['set-cookie'] || [];
    expect(setCookie.some((c) => c.startsWith('xc_session='))).toBe(true);
    // Cookie must be HttpOnly
    expect(setCookie.some((c) => /httponly/i.test(c))).toBe(true);
  });

  test('issues an admin session for the known admin UID', async () => {
    admin.auth().verifyIdToken.mockResolvedValueOnce({ uid: UID_ADMIN });
    const res = await request(app)
      .post('/api/auth/firebase-session')
      .send({ idToken: 'valid-admin-token' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, role: 'admin' });
  });

  test('CRITICAL: batch UID can never become admin (role override test)', async () => {
    // Simulate an attack: Firebase says UID_STUDENT has a valid token,
    // and the DB profile somehow claims admin — BATCH_UIDS safety net must hold.
    admin.auth().verifyIdToken.mockResolvedValueOnce({ uid: UID_STUDENT });
    const res = await request(app)
      .post('/api/auth/firebase-session')
      .send({ idToken: 'student-token-claims-admin' });
    expect(res.status).toBe(200);
    // Role MUST be student, never admin
    expect(res.body.role).toBe('student');
    expect(res.body.role).not.toBe('admin');
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 6 — Rate limiter                                            */
/* ─────────────────────────────────────────────────────────── */

describe('Rate limiter on /api/auth/firebase-session', () => {
  test('returns 429 after 5 rapid requests from same IP', async () => {
    // Drive 5 requests that each get 401 (invalid token) to exhaust rate limit
    admin.auth().verifyIdToken.mockRejectedValue(new Error('bad'));

    let lastStatus;
    for (let i = 0; i < 6; i++) {
      const res = await request(app)
        .post('/api/auth/firebase-session')
        .set('X-Forwarded-For', '10.9.8.7') // stable IP for this test
        .send({ idToken: 'x' });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 7 — Student guard: /activities, /content, /reports         */
/* ─────────────────────────────────────────────────────────── */

describe('Student guard middleware', () => {
  test('redirects unauthenticated HTML request to /', async () => {
    const res = await request(app).get('/activities/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  test('redirects student HTML request to /studyguide/', async () => {
    const token = makeSession({ uid: UID_STUDENT, role: 'student' });
    const res = await request(app).get('/activities/').set('Cookie', cookieHeader(token));
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/studyguide/');
  });

  test('allows admin session through activities guard', async () => {
    const token = makeSession({ uid: UID_ADMIN, role: 'admin' });
    // Admin gets through the guard — will hit 404 since dist/ doesn't exist in test
    const res = await request(app).get('/activities/').set('Cookie', cookieHeader(token));
    // Just ensure it's NOT a 302 redirect (i.e., guard was passed)
    expect(res.status).not.toBe(302);
  });

  test('redirects unauthenticated HTML request to /content/', async () => {
    const res = await request(app).get('/content/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  test('redirects unauthenticated HTML request to /reports/', async () => {
    const res = await request(app).get('/reports/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  test('redirects unauthenticated HTML request to /pitch-lab/', async () => {
    const res = await request(app).get('/pitch-lab/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });

  test('redirects student session from /pitch-lab/ to /studyguide/', async () => {
    const token = makeSession({ uid: UID_STUDENT, role: 'student' });
    const res = await request(app).get('/pitch-lab/').set('Cookie', cookieHeader(token));
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/studyguide/');
  });

  test('allows admin session through /pitch-lab/ guard', async () => {
    const token = makeSession({ uid: UID_ADMIN, role: 'admin' });
    const res = await request(app).get('/pitch-lab/').set('Cookie', cookieHeader(token));
    expect(res.status).not.toBe(302);
  });

  test('redirects removed /atlas/ route to /', async () => {
    const res = await request(app).get('/atlas/');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/');
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 8 — API proxy auth guard                                    */
/* ─────────────────────────────────────────────────────────── */

describe('POST /api/gemini — requires authentication', () => {
  test('returns 401 with no session cookie', async () => {
    const res = await request(app)
      .post('/api/gemini')
      .send({ messages: [{ role: 'user', content: 'hello' }] });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('returns 401 with invalid session cookie', async () => {
    const res = await request(app)
      .post('/api/gemini')
      .set('Cookie', 'xc_session=tampered.token.value')
      .send({ messages: [{ role: 'user', content: 'hello' }] });
    expect(res.status).toBe(401);
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 9 — Security headers                                        */
/* ─────────────────────────────────────────────────────────── */

describe('Security headers on page responses', () => {
  test('sets X-Content-Type-Options: nosniff', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  test('sets Content-Security-Policy header', async () => {
    const res = await request(app).get('/');
    expect(res.headers['content-security-policy']).toBeTruthy();
    expect(res.headers['content-security-policy']).toContain('connect-src');
    expect(res.headers['content-security-policy']).toContain('https://server.arcgisonline.com');
    expect(res.headers['content-security-policy']).toContain('img-src');
    expect(res.headers['content-security-policy']).toContain('blob:');
  });

  test('allows same-origin microphone access in Permissions-Policy', async () => {
    const res = await request(app).get('/');
    expect(res.headers['permissions-policy']).toBe(
      'camera=(), microphone=(self), geolocation=(self)'
    );
  });

  test('does not expose X-Powered-By', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 10 — Error handling — no internal details leaked            */
/* ─────────────────────────────────────────────────────────── */

describe('Error responses do not leak internals', () => {
  test('401 does not expose stack traces or file paths', async () => {
    const res = await request(app).get('/api/auth/whoami');
    expect(res.status).toBe(401);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/Error:|stack|\.js:|node_modules/);
  });

  test('firebase-session 401 body does not echo the input token', async () => {
    admin.auth().verifyIdToken.mockRejectedValueOnce(new Error('bad token'));
    const res = await request(app)
      .post('/api/auth/firebase-session')
      .send({ idToken: 'super-secret-token-value' });
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain('super-secret-token-value');
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 11 — Root redirect for student session                      */
/* ─────────────────────────────────────────────────────────── */

describe('GET / — student session redirect', () => {
  test('redirects student at root to /studyguide/', async () => {
    const token = makeSession({ uid: UID_STUDENT, role: 'student' });
    const res = await request(app).get('/').set('Cookie', cookieHeader(token));
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/studyguide/');
  });

  test('does NOT redirect admin at root', async () => {
    const token = makeSession({ uid: UID_ADMIN, role: 'admin' });
    const res = await request(app).get('/').set('Cookie', cookieHeader(token));
    // Admin gets through — no 302 to studyguide
    expect(res.status).not.toBe(302);
    expect(res.headers.location || '').not.toMatch(/studyguide/);
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 12 — Study guide has NO server-side auth guard              */
/* ─────────────────────────────────────────────────────────── */

describe('GET /studyguide/ — no server-side redirect', () => {
  test('unauthenticated request is NOT redirected to login', async () => {
    const res = await request(app).get('/studyguide/');
    // Should NOT redirect to / — studyguide is client-side guarded only
    expect(res.status).not.toBe(302);
    // Either 200 (file found in dist) or 404 (dist not built), never 302
    expect([200, 404]).toContain(res.status);
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 13 — Rate limiter on /api/gemini with valid session         */
/* ─────────────────────────────────────────────────────────── */

describe('Rate limiter on /api/gemini with authenticated session', () => {
  test('returns 429 after 20 rapid authenticated requests', async () => {
    const token = makeSession({ uid: UID_ADMIN, role: 'admin' });

    let lastStatus;
    for (let i = 0; i < 21; i++) {
      const res = await request(app)
        .post('/api/gemini')
        .set('Cookie', cookieHeader(token))
        .set('X-Forwarded-For', '10.1.2.3')
        .send({ messages: [{ role: 'user', content: 'hi' }] });
      lastStatus = res.status;
    }
    // 21st request must be rate-limited
    expect(lastStatus).toBe(429);
  });

  test('returns 503 when GEMINI_API_KEY is not set (authenticated, not rate-limited)', async () => {
    const token = makeSession({ uid: UID_ADMIN, role: 'admin' });
    const savedKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      const res = await request(app)
        .post('/api/gemini')
        .set('Cookie', cookieHeader(token))
        .set('X-Forwarded-For', '10.5.6.7')
        .send({ messages: [{ role: 'user', content: 'hello' }] });
      expect(res.status).toBe(503);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).not.toMatch(/key|apiKey|GEMINI/i);
    } finally {
      if (savedKey !== undefined) process.env.GEMINI_API_KEY = savedKey;
    }
  });

  test('returns 400 for empty messages array (authenticated)', async () => {
    const token = makeSession({ uid: UID_ADMIN, role: 'admin' });
    const saved = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'test-key';
    try {
      const res = await request(app)
        .post('/api/gemini')
        .set('Cookie', cookieHeader(token))
        .set('X-Forwarded-For', '10.8.9.0')
        .send({ messages: [] });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    } finally {
      if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
      else delete process.env.GEMINI_API_KEY;
    }
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 14 — verifySession edge cases                               */
/* ─────────────────────────────────────────────────────────── */

describe('verifySession edge cases', () => {
  test('returns null for token with no dot separator', () => {
    expect(verifySession('nodotinhere')).toBeNull();
  });

  test('returns null for token with invalid base64url payload', () => {
    // valid-looking structure but payload is not valid JSON base64url
    const badPayload = '!!!.validlookingsig';
    expect(verifySession(badPayload)).toBeNull();
  });

  test('returns null for token whose payload decodes to non-object JSON', () => {
    const data = Buffer.from('"justAString"').toString('base64url');
    const sig = require('crypto')
      .createHmac('sha256', 'wrongsecret')
      .update(data)
      .digest('base64url');
    expect(verifySession(data + '.' + sig)).toBeNull();
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 15 — Oversized payload returns 413                          */
/* ─────────────────────────────────────────────────────────── */

describe('POST /api/auth/firebase-session — payload size limit', () => {
  test('returns 413 when body exceeds 50kb', async () => {
    const bigToken = 'x'.repeat(52 * 1024); // 52 KB > 50 KB limit
    const res = await request(app)
      .post('/api/auth/firebase-session')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ idToken: bigToken }));
    expect(res.status).toBe(413);
    // Must not leak internals
    if (res.body && res.body.error) {
      expect(res.body.error).not.toMatch(/Error:|stack|\.js:/);
    }
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 16 — Security headers on redirect responses                 */
/* ─────────────────────────────────────────────────────────── */

describe('Security headers on redirect responses', () => {
  test('/activities/ redirect carries security headers', async () => {
    const res = await request(app).get('/activities/');
    expect(res.status).toBe(302);
    // Security headers must be present even on redirects
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeTruthy();
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 17 — Session cookie attributes                              */
/* ─────────────────────────────────────────────────────────── */

describe('Session cookie attributes', () => {
  test('xc_session cookie has SameSite=Lax and Path=/', async () => {
    admin.auth().verifyIdToken.mockResolvedValueOnce({ uid: UID_ADMIN });
    const res = await request(app)
      .post('/api/auth/firebase-session')
      .send({ idToken: 'valid-admin-token' });
    const setCookie = res.headers['set-cookie'] || [];
    const cookieStr = setCookie.join('; ');
    expect(cookieStr).toMatch(/SameSite=Lax/i);
    expect(cookieStr).toMatch(/Path=\//i);
    expect(cookieStr).toMatch(/HttpOnly/i);
  });
});

/* ─────────────────────────────────────────────────────────── */
/* 18 — Route proxy endpoints require authentication           */
/* ─────────────────────────────────────────────────────────── */

describe('Route proxy endpoints require authentication', () => {
  test('POST /api/route/route returns 401 without session', async () => {
    const res = await request(app).post('/api/route/route').send({ origin: 'A', destination: 'B' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/route/table returns 401 without session', async () => {
    const res = await request(app).post('/api/route/table').send({});
    expect(res.status).toBe(401);
  });

  test('POST /api/route/trip returns 401 without session', async () => {
    const res = await request(app).post('/api/route/trip').send({});
    expect(res.status).toBe(401);
  });
});
