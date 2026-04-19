const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

/* ─── Helpers ─── */
function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
}

function mkDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  mkDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest, filter) {
  mkDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sp = path.join(src, entry.name);
    const dp = path.join(dest, entry.name);
    if (filter && !filter(entry.name, sp, entry)) continue;
    /* Skip source maps in production builds — prevents source code exposure */
    if (!entry.isDirectory() && entry.name.endsWith(".map")) continue;
    if (entry.isDirectory()) {
      copyDir(sp, dp, filter);
    } else {
      fs.copyFileSync(sp, dp);
    }
  }
}

function countFiles(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? countFiles(path.join(dir, e.name)) : 1;
  }
  return n;
}

/* ─── Clean ─── */
rmDir(DIST);
mkDir(DIST);

console.log("Building Excelias portal for deployment...\n");

/* ─── Student guard: external script injected into module HTML files (CSP-safe) ─── */
/* Server-side studentGuardMiddleware handles redirection; this is defence-in-depth.  */
const studentGuardSrc = `(function(){try{var u=JSON.parse(localStorage.getItem('xcCurrentUser'));if(u&&u.role==='student'){window.location.replace('/studyguide/');}}catch(e){}})();`;
const studentGuardTag = '<script src="/student-guard.js"></script>';

/* ════════ 1. Portal files ════════ */
console.log("[1/7] Portal files...");
const portalDir = path.join(ROOT, "excelias-portal");
copyFile(path.join(portalDir, "index.html"), path.join(DIST, "index.html"));
copyFile(path.join(portalDir, "portal.css"), path.join(DIST, "portal.css"));
copyFile(path.join(portalDir, "portal.js"), path.join(DIST, "portal.js"));
copyFile(
  path.join(portalDir, "xcelias-auth.js"),
  path.join(DIST, "xcelias-auth.js"),
);

/* Copy firebase-config.js to dist root so it's accessible without the /activities
   student guard. The study guide (and any future module) loads it from /firebase-config.js. */
const fbConfigSrc = path.join(
  ROOT,
  "Activites ( WorkSpace )",
  "RedMaterialsAcademy",
  "firebase-config.js",
);
if (fs.existsSync(fbConfigSrc)) {
  copyFile(fbConfigSrc, path.join(DIST, "firebase-config.js"));
  console.log("    → Copied firebase-config.js to root");
}
/* Write student-guard.js to dist root — modules inject an external script tag (no inline = CSP safe) */
fs.writeFileSync(path.join(DIST, "student-guard.js"), studentGuardSrc);
console.log("    → Wrote student-guard.js to root");

/* ════════ 2. Activities (Project 1) ════════ */
console.log("[2/7] Activities...");
const actSrc = path.join(
  ROOT,
  "Activites ( WorkSpace )",
  "RedMaterialsAcademy",
);
copyDir(actSrc, path.join(DIST, "activities"), (name) => {
  /* Exclude non-runtime files from production build */
  const skip = [".md", "_backup", "babel.min.js"];
  return !skip.some((s) => name.toLowerCase().includes(s));
});

// Pre-compile app.jsx → app.js using Babel (eliminates runtime Babel and unsafe-eval CSP requirement)
const actJsxSrc = path.join(actSrc, "app.jsx");
const actJsDest = path.join(DIST, "activities", "app.js");
const actJsxDist = path.join(DIST, "activities", "app.jsx");
if (fs.existsSync(actJsxSrc)) {
  const jsxCode = fs.readFileSync(actJsxSrc, "utf8");
  const compiled = babel.transformSync(jsxCode, {
    presets: [
      ["@babel/preset-env", { targets: { ie: 11 } }], // transforms const/let→var (matches Babel standalone default)
      "@babel/preset-react",
    ],
    filename: "app.jsx",
  });
  fs.writeFileSync(actJsDest, compiled.code);
  if (fs.existsSync(actJsxDist)) fs.unlinkSync(actJsxDist);
  console.log(
    "    → Compiled app.jsx → app.js (JSX pre-compiled, Babel no longer needed at runtime)",
  );
} else if (fs.existsSync(actJsxDist)) {
  // Fallback if running from dist source
  fs.renameSync(actJsxDist, actJsDest);
}

// Patch index.html: add <base> tag, replace babel CDN with student-guard.js external script,
// remove type="text/babel" (compiled JS needs to load as a regular script)
const actHtml = path.join(DIST, "activities", "index.html");
let aHtml = fs.readFileSync(actHtml, "utf8");
// Replace babel.min.js script with nothing (no longer needed at runtime)
aHtml = aHtml.replace('<script src="babel.min.js"></script>', "");
// Update the JSX script tag: remove type="text/babel", change app.jsx to app.js
aHtml = aHtml.replace('src="app.jsx"', 'src="app.js"');
aHtml = aHtml.replace(' type="text/babel"', "");
// Add <base>, student-guard.js external tag (CSP-safe), and firebase-config path fix
aHtml = aHtml.replace(
  "<head>",
  '<head>\n    <base href="/activities/" />\n    ' + studentGuardTag,
);
aHtml = aHtml.replace('src="firebase-config.js"', 'src="/firebase-config.js"');
fs.writeFileSync(actHtml, aHtml);
// Remove babel.min.js from dist (no longer needed)
const babelDist = path.join(DIST, "activities", "babel.min.js");
if (fs.existsSync(babelDist)) fs.unlinkSync(babelDist);
// Extract remaining inline <script> (RITA chat) to external file for CSP compliance
let aHtml2 = fs.readFileSync(actHtml, "utf8");
const actInlineMatch = aHtml2.match(
  /<script>\s*(\(function\s*\([\s\S]*?\}\s*\)\s*\(\s*\)\s*;)\s*<\/script>\s*<\/body>/,
);
if (actInlineMatch) {
  fs.writeFileSync(
    path.join(DIST, "activities", "activities-rita.js"),
    actInlineMatch[1],
  );
  aHtml2 = aHtml2.replace(
    actInlineMatch[0],
    '<script src="activities-rita.js"></script>\n</body>',
  );
  fs.writeFileSync(actHtml, aHtml2);
  console.log("    → Extracted inline RITA script → activities-rita.js");
}
console.log(
  "    → Patched index.html: <base> + student-guard.js + pre-compiled JS script",
);

/* ════════ 3. Content / CRA Build (Project 2) ════════ */
console.log("[3/7] Content (CRA build)...");
const contentBuild = path.join(
  ROOT,
  "Content ( WorkSpace )",
  "red-materials-app",
  "build",
);
copyDir(contentBuild, path.join(DIST, "content"));

// Add <base> tag so relative paths resolve to /content/
const contentHtml = path.join(DIST, "content", "index.html");
let cHtml = fs.readFileSync(contentHtml, "utf8");
cHtml = cHtml.replace(/(src|href)="\/static\//g, '$1="static/');
cHtml = cHtml.replace(
  "<head>",
  '<head>\n<base href="/content/" />\n' + studentGuardTag,
);
/* Fix firebase-config.js path — load from root instead of /activities/ to avoid student guard */
cHtml = cHtml.replace(
  'src="/activities/firebase-config.js"',
  'src="/firebase-config.js"',
);
/* Extract inline RITA/API bootstrap script → content-rita.js (CSP compliance) */
// Match by unique DOM ID "ritaMessages" — handles any IIFE format (!(function(){} or !function(){})
const cRitaMatch = cHtml.match(/<script>\s*([\s\S]*?"ritaMessages"[\s\S]*?)<\/script>/);
if (cRitaMatch) {
  let ritaCode = cRitaMatch[1].trim();
  // Fix API_URL: always use relative /api/gemini (works for both localhost and Vercel)
  // Handles spaced and minified variants of the localhost ternary check
  ritaCode = ritaCode.replace(
    /"localhost"\s*===\s*window\.location\.hostname\s*\|\|\s*"127\.0\.0\.1"\s*===\s*window\.location\.hostname\s*\?\s*"\/api\/gemini"\s*:\s*"https:\/\/excelias\.vercel\.app\/api\/gemini"/,
    '"/api/gemini"',
  );
  fs.writeFileSync(path.join(DIST, "content", "content-rita.js"), ritaCode);
  cHtml = cHtml.replace(
    cRitaMatch[0],
    '<script src="content-rita.js"></script>',
  );
}
/* Extract inline XceliasAuth.guard() call → content-guard.js (CSP compliance) */
const cGuardMatch = cHtml.match(
  /<script>\s*(XceliasAuth\.guard[\s\S]*?)<\/script>/,
);
if (cGuardMatch) {
  fs.writeFileSync(
    path.join(DIST, "content", "content-guard.js"),
    cGuardMatch[1].trim(),
  );
  cHtml = cHtml.replace(
    cGuardMatch[0],
    '<script src="content-guard.js"></script>',
  );
}
fs.writeFileSync(contentHtml, cHtml);
console.log('    → Added <base href="/content/"> + rewrote CRA paths');

/* ════════ 4. Reports (Project 3) ════════ */
console.log("[4/7] Reports...");
const reportsSrc = path.join(ROOT, "Report Generation 3");
const reportsCspSrc = path.join(reportsSrc, "csp");
const reportsDest = path.join(DIST, "reports");
mkDir(reportsDest);
const hasReportsCspBuild =
  fs.existsSync(path.join(reportsCspSrc, "index.html")) &&
  fs.existsSync(path.join(reportsCspSrc, "reports-app.js"));
if (hasReportsCspBuild) {
  copyDir(reportsCspSrc, reportsDest);
  console.log(
    "    → Copied CSP-safe reports assets from Report Generation 3/csp",
  );
} else {
  /* Exclude backup files, READMEs, and other non-runtime files from production */
  const reportsSkip = ["_backup", ".md"];
  for (const f of fs.readdirSync(reportsSrc, { withFileTypes: true })) {
    if (
      f.isFile() &&
      !reportsSkip.some((s) => f.name.toLowerCase().includes(s))
    ) {
      copyFile(path.join(reportsSrc, f.name), path.join(reportsDest, f.name));
    }
  }
  // Add <base> tag for Reports
  const reportsHtml = path.join(reportsDest, "index.html");
  let rHtml = fs.readFileSync(reportsHtml, "utf8");
  rHtml = rHtml.replace(
    "<head>",
    '<head>\n    <base href="/reports/" />\n    ' + studentGuardTag,
  );
  /* Fix firebase-config.js path — load from root instead of /activities/ */
  rHtml = rHtml.replace(
    'src="/activities/firebase-config.js"',
    'src="/firebase-config.js"',
  );
  /* Extract inline XceliasAuth.guard() call → reports-guard.js (CSP compliance) */
  const rGuardMatch = rHtml.match(
    /<script>\s*(XceliasAuth\.guard[\s\S]*?)<\/script>/,
  );
  if (rGuardMatch) {
    fs.writeFileSync(
      path.join(reportsDest, "reports-guard.js"),
      rGuardMatch[1].trim(),
    );
    rHtml = rHtml.replace(
      rGuardMatch[0],
      '<script src="reports-guard.js"></script>',
    );
  }
  /* Extract main app inline script → reports-app.js (CSP compliance) */
  const rAppMatch = rHtml.match(
    /<script>\s*(\/\/ =+[\s\S]*?)<\/script>\s*<\/body>/,
  );
  if (rAppMatch) {
    fs.writeFileSync(
      path.join(reportsDest, "reports-app.js"),
      rAppMatch[1].trim(),
    );
    rHtml = rHtml.replace(
      rAppMatch[0],
      '<script src="reports-app.js"></script>\n</body>',
    );
  }
  fs.writeFileSync(reportsHtml, rHtml);
  console.log(
    '    → Added <base href="/reports/"> + student-guard.js external script',
  );
}

/* ════════ 5. Study Guide (Project 4) ════════ */
console.log("[5/7] Study Guide...");
const studySrc = path.join(ROOT, "Study Guide & Excersies");
const studyCspSrc = path.join(studySrc, "csp");
const studyDest = path.join(DIST, "studyguide");
mkDir(studyDest);
const hasStudyCspBuild =
  fs.existsSync(path.join(studyCspSrc, "index.html")) &&
  fs.existsSync(path.join(studyCspSrc, "studyguide.js"));
if (hasStudyCspBuild) {
  copyDir(studyCspSrc, studyDest);
  console.log(
    "    → Copied CSP-safe study guide assets from Study Guide & Excersies/csp",
  );
} else {
  copyFile(
    path.join(studySrc, "index.html"),
    path.join(studyDest, "index.html"),
  );
  // Add <base> tag for Study Guide
  const studyHtml = path.join(studyDest, "index.html");
  let sgHtml = fs.readFileSync(studyHtml, "utf8");
  sgHtml = sgHtml.replace("<head>", '<head>\n    <base href="/studyguide/" />');
  /* Fix firebase-config.js path — load from root instead of /activities/ to avoid student guard */
  sgHtml = sgHtml.replace(
    'src="/activities/firebase-config.js"',
    'src="/firebase-config.js"',
  );
  /* Extract inline <script> to external file for CSP compliance */
  const inlineMatch = sgHtml.match(
    /<script>\s*'use strict';([\s\S]*?)<\/script>\s*<\/body>/,
  );
  if (inlineMatch) {
    const scriptContent = "'use strict';" + inlineMatch[1];
    fs.writeFileSync(path.join(studyDest, "studyguide.js"), scriptContent);
    sgHtml = sgHtml.replace(
      inlineMatch[0],
      '<script src="studyguide.js"></script>\n</body>',
    );
  }
  fs.writeFileSync(studyHtml, sgHtml);
  console.log('    → Copied Study Guide + added <base href="/studyguide/">');
}

/* ════════ 6. Website / Property Explorer (Project 5) ════════ */
console.log("[6/7] Website...");
const webSrc = path.join(ROOT, "Website ( WorkSpace )");
const webDest = path.join(DIST, "website");
mkDir(webDest);

// Copy only the files needed for the static frontend (skip server, node_modules, .env, etc.)
const webFiles = [
  "index.html",
  "app.js",
  "qrcode.js",
  "styles.css",
  "website-gsap.js",
  "website-sw.js",
  "sw.js",
  "search.worker.js",
  "data.json",
  "cairo.json",
  "gouna.json",
  "north_coast.json",
  "sokhna.json",
  "others.json",
  "manifest.json",
  "split_data.js",
];
for (const f of webFiles) {
  const fp = path.join(webSrc, f);
  if (fs.existsSync(fp)) copyFile(fp, path.join(webDest, f));
}
// Copy icons/
const iconsSrc = path.join(webSrc, "icons");
if (fs.existsSync(iconsSrc)) copyDir(iconsSrc, path.join(webDest, "icons"));

// Add <base> tag + rewrite paths for Website
const webHtml = path.join(webDest, "index.html");
let wHtml = fs.readFileSync(webHtml, "utf8");
// Convert absolute /xxx → relative xxx (base tag handles resolution)
// Exclude /xcelias-auth.js and /activities/ (auth scripts must stay absolute)
wHtml = wHtml.replace(
  /(href|src)="\/(?!\/|xcelias-auth|activities\/)/g,
  '$1="',
);
// Fix service worker registration absolute path
wHtml = wHtml.replace(/register\('\/sw\.js'\)/g, "register('sw.js')");
// Add <base> so all relative paths resolve to /website/
wHtml = wHtml.replace(
  "<head>",
  '<head>\n    <base href="/website/" />\n    ' + studentGuardTag,
);
/* Extract service worker inline script → website-sw.js (CSP compliance) */
const wSwMatch = wHtml.match(
  /<script>\s*((?:const isLocalDevHost|\/\/ Service Worker)[\s\S]*?)<\/script>/,
);
if (wSwMatch) {
  fs.writeFileSync(path.join(webDest, "website-sw.js"), wSwMatch[1].trim());
  wHtml = wHtml.replace(wSwMatch[0], '<script src="website-sw.js"></script>');
}
/* Extract GSAP lazy-loader inline script → website-gsap.js (CSP compliance) */
const wGsapMatch = wHtml.match(
  /<script>(if\(window\.innerWidth[\s\S]*?)<\/script>/,
);
if (wGsapMatch) {
  fs.writeFileSync(path.join(webDest, "website-gsap.js"), wGsapMatch[1].trim());
  wHtml = wHtml.replace(
    wGsapMatch[0],
    '<script src="website-gsap.js"></script>',
  );
}
fs.writeFileSync(webHtml, wHtml);
console.log(
  '    → Added <base href="/website/"> + student-guard.js external script + rewrote paths',
);

/* ════════ 7. Pitch Lab (Project 6) ════════ */
console.log("[7/7] Pitch Lab...");
const pitchSrc = path.join(ROOT, "Pitch Lab ( WorkSpace )");
const pitchDest = path.join(DIST, "pitch-lab");
mkDir(pitchDest);
// Copy all source files
for (const f of ["index.html", "pitch-lab.css", "pitch-lab.js"]) {
  const fp = path.join(pitchSrc, f);
  if (fs.existsSync(fp)) copyFile(fp, path.join(pitchDest, f));
}
// Add <base> tag and student-guard to index.html
const pitchHtml = path.join(pitchDest, "index.html");
let pHtml = fs.readFileSync(pitchHtml, "utf8");
pHtml = pHtml.replace(
  "<head>",
  '<head>\n  <base href="/pitch-lab/" />\n  ' + studentGuardTag,
);
fs.writeFileSync(pitchHtml, pHtml);
console.log(
  '    → Added <base href="/pitch-lab/"> + student-guard.js external script',
);

/* ════════ Done ════════ */
const total = countFiles(DIST);
console.log(`\n✅ Build complete!`);
console.log(`   Output: dist/`);
console.log(`   Files:  ${total}`);
console.log(`\nProjects included:`);
console.log(`   ✓ Portal (home page)`);
console.log(`   ✓ Activities (Training Academy)`);
console.log(`   ✓ Content (Training Manual)`);
console.log(`   ✓ Reports (Report Generator)`);
console.log(`   ✓ Study Guide (Batch Library)`);
console.log(`   ✓ Website (Property Explorer)`);
console.log(`   ✓ Pitch Lab (AI Call Simulation Studio)`);
console.log(`   ⊘ Avaria (requires separate server — opens in new tab)`);
