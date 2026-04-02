const express = require('express');
const path = require('path');
const fs = require('fs');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 4000;
const WEBSITE_LOCAL_ORIGIN = process.env.WEBSITE_LOCAL_ORIGIN || 'http://localhost:3000';

/* ─── Workspace root (parent of this folder) ─── */
const WS = path.resolve(__dirname, '..');

/* ─── Project paths ─── */
const ACTIVITIES_DIR  = path.join(WS, 'Activites ( WorkSpace )', 'RedMaterialsAcademy');
const CONTENT_BUILD   = path.join(WS, 'Content ( WorkSpace )', 'red-materials-app', 'build');
const REPORTS_DIR     = path.join(WS, 'Report Generation 3');
const WEBSITE_DIR     = path.join(WS, 'Website ( WorkSpace )');
const STUDY_GUIDE_DIR = path.join(WS, 'Study Guide & Excersies');

/* ─── Portal static files (this folder) ─── */
app.use(express.static(__dirname, { index: 'index.html' }));

/* ─── Project 1: Activities (CDN-based React + Babel) ─── */
app.use('/activities', express.static(ACTIVITIES_DIR));

/* ─── Project 2: Content / Training Manual (CRA build) ─── */
/*  CRA build uses absolute paths like /static/js/main.xxx.js
    so we serve /static/ from the build's static folder as well. */
app.use('/content', express.static(CONTENT_BUILD));
app.use('/static', express.static(path.join(CONTENT_BUILD, 'static')));

/* ─── Project 3: Report Generator (single HTML files) ─── */
app.use('/reports', express.static(REPORTS_DIR));

/* ─── Project 6: Study Guide ─── */
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
app.use(express.json({ limit: '1mb' }));
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

app.get(['/website/', '/website/index.html'], (req, res) => {
  const htmlPath = path.join(WEBSITE_DIR, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  // Rewrite absolute paths in href="/..." and src="/..." attributes
  // Exclude: protocol-relative (//), xcelias-auth.js, activities/ (firebase-config)
  html = html.replace(/(href|src)="\/(?!\/|xcelias-auth|activities\/)/g, '$1="/website/');
  // Rewrite service worker registration path in inline scripts
  html = html.replace(/register\('\/sw\.js'\)/g, "register('/website/sw.js')");
  res.type('html').send(html);
});
app.use('/website', express.static(WEBSITE_DIR));

/* Fallback: root-level requests for website assets (JS uses absolute paths) */
const WEBSITE_ASSETS = [
  'data.json','styles.css','app.js','sw.js','search.worker.js','manifest.json',
  'cairo.json','gouna.json','north_coast.json','sokhna.json','others.json'
];
WEBSITE_ASSETS.forEach(file => {
  app.get('/' + file, (req, res, next) => {
    const fp = path.join(WEBSITE_DIR, file);
    if (fs.existsSync(fp)) return res.sendFile(fp);
    next();
  });
});

/* ─── Fallback: serve portal index.html for any unknown GET ─── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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
  console.log('');
  console.log('  Note: Avaria Academy runs separately.');
  console.log('  Start it with: cd "System Before Prompting V2/avaria" && npm run dev');
  console.log('');
});
