const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const admin = require('firebase-admin');

/* ── Firebase Admin SDK (for verifying client ID tokens — no secrets in code) ── */
admin.initializeApp({ projectId: 'xcelias-academy' });

const app = express();
const PORT = process.env.PORT || 4000;
const WEBSITE_LOCAL_ORIGIN = process.env.WEBSITE_LOCAL_ORIGIN || 'http://localhost:3000';

/* ═══════════════════════════════════════════════════════════════════
   SERVER-SIDE SESSION SECURITY
   ═══════════════════════════════════════════════════════════════════
   HMAC-signed httpOnly cookies. Client JS cannot read or modify them.
   The server is the ONLY authority for role-based access control.
   ═══════════════════════════════════════════════════════════════════ */

/* Session secret — persisted to .session-secret so it survives restarts */
const SECRET_PATH = path.join(__dirname, '.session-secret');
let SESSION_SECRET;
if (process.env.XC_SESSION_SECRET) {
  SESSION_SECRET = process.env.XC_SESSION_SECRET;
} else if (fs.existsSync(SECRET_PATH)) {
  SESSION_SECRET = fs.readFileSync(SECRET_PATH, 'utf8').trim();
} else {
  SESSION_SECRET = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(SECRET_PATH, SESSION_SECRET, 'utf8');
}

/* ── Firebase UID → role mapping (server determines roles from verified tokens) ── */
const KNOWN_USERS = {
  'OKZ7mPrvE0cvMH8LPTUY13yXw9d2': { role: 'student', batchId: 'batch33', displayName: 'Batch 33', username: 'batch33' },
  '1olZC4rnatZlGkYPgIg2lZFjZ782': { role: 'admin', batchId: 'admin', displayName: 'Admin', username: 'admin' }
};
/* ── Batch UIDs that can NEVER be admin (safety net) ── */
const BATCH_UIDS = new Set(['OKZ7mPrvE0cvMH8LPTUY13yXw9d2']);

/* ── Rate limiter (in-memory, per-IP) ── */
const _loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 attempts per minute per IP
function rateLimitCheck(req, res) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  let record = _loginAttempts.get(ip);
  if (!record || now - record.start > RATE_LIMIT_WINDOW) {
    record = { count: 1, start: now };
    _loginAttempts.set(ip, record);
    return false; // not limited
  }
  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: 'Too many login attempts. Try again later.' });
    return true; // limited
  }
  return false;
}
// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of _loginAttempts) {
    if (now - rec.start > RATE_LIMIT_WINDOW) _loginAttempts.delete(ip);
  }
}, 5 * 60 * 1000).unref();

/* ── Cookie helpers ── */
function signSession(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return data + '.' + sig;
}

function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const data = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

function parseCookies(req) {
  const cookies = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const eq = c.indexOf('=');
    if (eq > 0) cookies[c.slice(0, eq).trim()] = decodeURIComponent(c.slice(eq + 1).trim());
  });
  return cookies;
}

function setSessionCookie(res, payload) {
  const maxAge = 24 * 60 * 60 * 1000; // 24h
  payload.exp = Date.now() + maxAge;
  const token = signSession(payload);
  res.setHeader('Set-Cookie', `xc_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge / 1000}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'xc_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
}

/* ═══════════════════════════════════════════════════════════════════
   SERVER-SIDE ROLE ENFORCEMENT MIDDLEWARE
   ═══════════════════════════════════════════════════════════════════
   Runs BEFORE static file serving. Checks the signed httpOnly cookie.
   - Student cookie on restricted path → 302 redirect to /studyguide/
   - No cookie → serve page (client-side login form will be shown)
   - Admin/agent cookie → serve page normally
   ═══════════════════════════════════════════════════════════════════ */
function studentGuardMiddleware(req, res, next) {
  const session = verifySession(parseCookies(req).xc_session);
  if (session && session.role === 'student') {
    return res.redirect(302, '/studyguide/');
  }
  next();
}

/* ─── Workspace root (parent of this folder) ─── */
const WS = path.resolve(__dirname, '..');
const DIST = path.join(WS, 'dist');

/* ─── Project paths (use dist/ when it exists, fall back to source) ─── */
const useDist = fs.existsSync(DIST);
const ACTIVITIES_DIR  = useDist ? path.join(DIST, 'activities')  : path.join(WS, 'Activites ( WorkSpace )', 'RedMaterialsAcademy');
const CONTENT_BUILD   = useDist ? path.join(DIST, 'content')     : path.join(WS, 'Content ( WorkSpace )', 'red-materials-app', 'build');
const REPORTS_DIR     = useDist ? path.join(DIST, 'reports')     : path.join(WS, 'Report Generation 3');
const WEBSITE_DIR     = useDist ? path.join(DIST, 'website')     : path.join(WS, 'Website ( WorkSpace )');
const STUDY_GUIDE_DIR = useDist ? path.join(DIST, 'studyguide') : path.join(WS, 'Study Guide & Excersies');
const PORTAL_DIR      = useDist ? DIST                           : __dirname;

/* ═══════════════════════════════════════════════════════════════════
   SECURITY HARDENING MIDDLEWARE
   ═══════════════════════════════════════════════════════════════════ */
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  next();
});

/* ─── JSON body parser for auth API (tight limit for auth endpoints) ─── */
app.use(express.json({ limit: '50kb' }));

/* ═══════════════════════════════════════════════════════════════════
   AUTH API ENDPOINTS
   ═══════════════════════════════════════════════════════════════════ */

/* POST /api/auth/firebase-session — called after Firebase auth succeeds on client.
   Verifies the Firebase ID token cryptographically, then issues a server-side cookie.
   SECURITY: No passwords in code. The server verifies the token signed by Google,
   extracts the UID, and determines the role from its own KNOWN_USERS map. */
app.post('/api/auth/firebase-session', async (req, res) => {
  if (rateLimitCheck(req, res)) return;
  const { idToken } = req.body || {};
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ error: 'Missing ID token' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const profile = KNOWN_USERS[uid];
    if (!profile) return res.status(403).json({ error: 'Unknown user' });

    /* CRITICAL: batch UIDs can never be admin */
    const role = BATCH_UIDS.has(uid) ? 'student' : profile.role;

    setSessionCookie(res, { uid, role });
    return res.json({ ok: true, uid, role, displayName: profile.displayName, batchId: profile.batchId, username: profile.username });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

/* POST /api/auth/logout — clears the server session cookie */
app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════════════
   STATIC SERVING WITH SERVER-SIDE GUARDS
   ═══════════════════════════════════════════════════════════════════ */

/* Restricted modules — server-side student guard BEFORE static serving.
   IMPORTANT: these must come BEFORE the portal static handler because
   PORTAL_DIR (dist/) contains all module subdirectories. If portal static
   was first, it would serve /activities/index.html directly from dist/
   without going through the guard middleware. */
app.use('/activities', studentGuardMiddleware, express.static(ACTIVITIES_DIR));
app.use('/content', studentGuardMiddleware, express.static(CONTENT_BUILD));
app.use('/static', studentGuardMiddleware, express.static(path.join(CONTENT_BUILD, 'static')));
app.use('/reports', studentGuardMiddleware, express.static(REPORTS_DIR));

/* Portal — guard students away from the home page */
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') {
    const session = verifySession(parseCookies(req).xc_session);
    if (session && session.role === 'student') {
      return res.redirect(302, '/studyguide/');
    }
  }
  next();
});
/* Study Guide — no guard needed (students ARE allowed here) */
app.use('/studyguide', express.static(STUDY_GUIDE_DIR));

/* ─── Project 4: Avaria Academy (Next.js — runs on port 3005) ─── *
 *  Avaria cannot be iframed because it sets X-Frame-Options: DENY
 *  and uses absolute /api/ paths that break when proxied under a sub-path.
 *  The portal opens Avaria in a new tab pointing to http://localhost:3005.
 *  To start it:  cd "System Before Prompting V2/avaria" && npm run dev     */

/* ─── Project 5: Website / Property Explorer ─── */
/*  Serve the website under /website/ on all environments (same-origin for shared auth).
    The website's index.html uses absolute paths — rewrite them on the fly.
    API calls are proxied to the standalone website server when it's running.    */
app.post(['/api/gemini', '/api/route/route', '/api/route/table', '/api/route/trip'], (req, res) => {
  const body = JSON.stringify(req.body);
  const proxyReq = http.request({
    hostname: 'localhost', port: 3000, path: req.originalUrl,
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  }, (proxyRes) => {
    res.status(proxyRes.statusCode);
    Object.entries(proxyRes.headers).forEach(([k, v]) => { if (k !== 'transfer-encoding') res.setHeader(k, v); });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => res.status(502).json({ error: 'Website server not reachable on port 3000' }));
  proxyReq.end(body);
});

if (!useDist) {
  /* Source mode only: rewrite absolute paths in website index.html on-the-fly */
  app.get(['/website/', '/website/index.html'], studentGuardMiddleware, (req, res) => {
    const htmlPath = path.join(WEBSITE_DIR, 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/(href|src)="\/(?!\/|xcelias-auth|activities\/)/g, '$1="/website/');
    html = html.replace(/register\('\/sw\.js'\)/g, "register('/website/sw.js')");
    res.type('html').send(html);
  });
}
app.use('/website', studentGuardMiddleware, express.static(WEBSITE_DIR));

/* ═══ Portal static — MUST come AFTER all /module/ routes ═══
   Because PORTAL_DIR (dist/) contains module subdirectories,
   this would serve /activities/index.html without the guard. */
app.use(express.static(PORTAL_DIR, { index: 'index.html' }));

/* Fallback: root-level requests for website assets (JS uses absolute paths) */
const WEBSITE_ASSETS = [
  'data.json','styles.css','app.js','sw.js','search.worker.js','manifest.json',
  'cairo.json','gouna.json','north_coast.json','sokhna.json','others.json'
];
WEBSITE_ASSETS.forEach(file => {
  app.get('/' + file, studentGuardMiddleware, (req, res, next) => {
    const fp = path.join(WEBSITE_DIR, file);
    if (fs.existsSync(fp)) return res.sendFile(fp);
    next();
  });
});

/* ─── Fallback: serve portal index.html for any unknown GET ─── */
app.get('*', (req, res) => {
  res.sendFile(path.join(PORTAL_DIR, 'index.html'));
});

/* ─── Global error handler — suppress stack traces and file paths ─── */
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const safeMessages = { 413: 'Payload too large', 400: 'Bad request' };
  res.status(status).json({ error: safeMessages[status] || 'Internal server error' });
});

/* ─── Launch ─── */
app.listen(PORT, () => {
  const u = `http://localhost:${PORT}`;
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║         EXCELIAS — UNIFIED PORTAL            ║');
  console.log('  ║       RED Training Academy Platform           ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║  Portal ........... ${u.padEnd(24)}║`);
  console.log(`  ║  Activities ....... ${(u + '/activities/').padEnd(24)}║`);
  console.log(`  ║  Content .......... ${(u + '/content/').padEnd(24)}║`);
  console.log(`  ║  Reports .......... ${(u + '/reports/').padEnd(24)}║`);
  console.log(`  ║  Avaria (ext) ..... ${'http://localhost:3005'.padEnd(24)}║`);
  console.log(`  ║  Website .......... ${(u + '/website/').padEnd(24)}║`);
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log(`  Serving from: ${useDist ? 'dist/' : 'source directories'}`);
  console.log('');
  console.log('  Note: Avaria Academy runs separately.');
  console.log('  Start it with: cd "System Before Prompting V2/avaria" && npm run dev');
  console.log('');
});
