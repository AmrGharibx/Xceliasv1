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

/* ── Trust first proxy (Vercel / nginx) so req.ip returns real client IP ── */
if (process.env.VERCEL || process.env.TRUST_PROXY) app.set('trust proxy', 1);
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
    res.status(429).json({ error: 'Too many requests. Try again later.' });
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
  for (const [ip, rec] of _geminiAttempts) {
    if (now - rec.start > GEMINI_RATE_WINDOW) _geminiAttempts.delete(ip);
  }
}, 5 * 60 * 1000).unref();

/* ── Gemini rate limiter (separate bucket — higher limit for chat UX) ── */
const _geminiAttempts = new Map();
const GEMINI_RATE_WINDOW = 60 * 1000; // 1 minute
const GEMINI_RATE_MAX = 20;           // 20 AI messages per minute per IP
function geminiRateLimitCheck(req, res) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  let record = _geminiAttempts.get(ip);
  if (!record || now - record.start > GEMINI_RATE_WINDOW) {
    record = { count: 1, start: now };
    _geminiAttempts.set(ip, record);
    return false;
  }
  record.count++;
  if (record.count > GEMINI_RATE_MAX) {
    res.status(429).json({ error: 'Too many requests. Try again later.' });
    return true;
  }
  return false;
}

/* ── Gemini model list (ordered by preference — most capable first) ── */
const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

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
  const isSecure = process.env.NODE_ENV === 'production' || (process.env.VERCEL === '1');
  const securePart = isSecure ? ' Secure;' : '';
  res.setHeader('Set-Cookie', `xc_session=${token}; HttpOnly;${securePart} SameSite=Lax; Path=/; Max-Age=${maxAge / 1000}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'xc_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
}

/* ═══════════════════════════════════════════════════════════════════
   SERVER-SIDE ROLE ENFORCEMENT MIDDLEWARE
   ═══════════════════════════════════════════════════════════════════
   Runs BEFORE static file serving. Checks the signed httpOnly cookie.
   - No cookie on an HTML page   → 302 redirect to portal login (/)
   - Student cookie on restricted path → 302 redirect to /studyguide/
   - Admin/agent cookie → serve page normally
   Only HTML navigation requests are gated; JS/CSS/image assets are
   served without auth so the browser can load the login page itself.
   ═══════════════════════════════════════════════════════════════════ */
function _isHtmlReq(path) {
  /* No file extension (directory index) OR explicit .html/.htm request */
  return !path.match(/\.\w{1,5}$/) || /\.html?$/i.test(path);
}

function studentGuardMiddleware(req, res, next) {
  const session = verifySession(parseCookies(req).xc_session);
  if (!session && _isHtmlReq(req.path)) {
    return res.redirect(302, '/');           // unauthenticated → portal login
  }
  if (session && session.role === 'student') {
    return res.redirect(302, '/studyguide/'); // student → study guide only
  }
  next();
}

/* ─── Workspace root (parent of this folder) ─── */
const WS = path.resolve(__dirname, '..');
const DIST = path.join(WS, 'dist');
const REPORTS_SRC = fs.existsSync(path.join(WS, 'Report Generation 3', 'csp'))
  ? path.join(WS, 'Report Generation 3', 'csp')
  : path.join(WS, 'Report Generation 3');
const STUDY_GUIDE_SRC = fs.existsSync(path.join(WS, 'Study Guide & Excersies', 'csp'))
  ? path.join(WS, 'Study Guide & Excersies', 'csp')
  : path.join(WS, 'Study Guide & Excersies');

/* ─── Project paths (use dist/ when it exists, fall back to source) ─── */
const useDist = fs.existsSync(DIST);
const ACTIVITIES_DIR  = useDist ? path.join(DIST, 'activities')  : path.join(WS, 'Activites ( WorkSpace )', 'RedMaterialsAcademy');
const CONTENT_BUILD   = useDist ? path.join(DIST, 'content')     : path.join(WS, 'Content ( WorkSpace )', 'red-materials-app', 'build');
const REPORTS_DIR     = useDist ? path.join(DIST, 'reports')     : REPORTS_SRC;
const WEBSITE_DIR     = useDist ? path.join(DIST, 'website')     : path.join(WS, 'Website ( WorkSpace )');
const STUDY_GUIDE_DIR = useDist ? path.join(DIST, 'studyguide') : STUDY_GUIDE_SRC;
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
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' https://www.gstatic.com https://*.firebasedatabase.app https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.googleapis.com https://*.firebasedatabase.app wss://*.firebasedatabase.app https://overpass-api.de",
    "img-src 'self' data: https://*.basemaps.cartocdn.com",
    "frame-src 'self' https://lms.xcelias.com https://*.firebasedatabase.app",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'"
  ].join('; '));
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
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

/* GET /api/auth/whoami — lightweight session check for client-side verification.
   Returns the role from the signed httpOnly cookie. No secrets exposed. */
app.get('/api/auth/whoami', (req, res) => {
  const session = verifySession(parseCookies(req).xc_session);
  if (!session) return res.status(401).json({ error: 'No session' });
  res.json({ uid: session.uid, role: session.role });
});

/* POST /api/auth/logout — clears the server session cookie */
app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════════════
   STATIC SERVING WITH SERVER-SIDE GUARDS
   ═══════════════════════════════════════════════════════════════════ */

/* Serve firebase-config.js from root — not behind student guard.
   Study guide needs it to initialize Firebase, but /activities/ has student guard. */
app.get('/firebase-config.js', (req, res, next) => {
  const fp = path.join(ACTIVITIES_DIR, 'firebase-config.js');
  if (fs.existsSync(fp)) return res.sendFile(fp);
  next();
});

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
/* Study Guide — students ARE allowed here; client-side xcelias-auth.js handles
   authentication (including Firebase session refresh for expired cookies).
   No server-side cookie guard here to avoid redirect loops when cookie expires. */
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
app.post(['/api/route/route', '/api/route/table', '/api/route/trip'], (req, res) => {
  if (!verifySession(parseCookies(req).xc_session)) return res.status(401).json({ error: 'Authentication required' });
  if (rateLimitCheck(req, res)) return; // prevent API quota abuse
  const body = JSON.stringify(req.body);
  const proxyReq = http.request({
    hostname: 'localhost', port: 3000, path: req.originalUrl,
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  }, (proxyRes) => {
    res.status(proxyRes.statusCode);
    Object.entries(proxyRes.headers).forEach(([k, v]) => { if (k !== 'transfer-encoding') res.setHeader(k, v); });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => res.status(502).json({ error: 'Upstream service unavailable' }));
  proxyReq.end(body);
});

/* ─── RITA AI — Gemini proxy (direct call, no external server dependency) ─── */
app.post('/api/gemini', async (req, res) => {
  const session = verifySession(parseCookies(req).xc_session);
  if (!session) return res.status(401).json({ error: 'Authentication required' });
  if (geminiRateLimitCheck(req, res)) return;

  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return res.status(503).json({ error: 'AI service not configured' });

  try {
    const { systemPrompt, messages, generationConfig } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }]
    }));

    const geminiBody = {
      contents,
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: Math.min((generationConfig && generationConfig.maxOutputTokens) || 1200, 4096)
      }
    };
    if (systemPrompt) {
      geminiBody.systemInstruction = { parts: [{ text: String(systemPrompt).slice(0, 8000) }] };
    }

    for (const model of GEMINI_MODELS) {
      const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiBody)
        });
      } catch { continue; }
      if (!response.ok) {
        if (response.status === 503 || response.status === 429 || response.status === 404) continue;
        break; // hard error (e.g. 400/401/403) — no point trying other models
      }
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return res.json({ success: true, text });
    }
    res.status(502).json({ error: 'AI service temporarily unavailable' });
  } catch (err) {
    console.error('Gemini handler error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
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

module.exports = { app, signSession, verifySession, parseCookies, _loginAttempts, _geminiAttempts };

/* ─── Launch ─── */
if (require.main === module) app.listen(PORT, () => {
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
