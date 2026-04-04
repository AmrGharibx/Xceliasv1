const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

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
    if (!entry.isDirectory() && entry.name.endsWith('.map')) continue;
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

console.log('Building Excelias portal for deployment...\n');

/* ════════ 1. Portal files ════════ */
console.log('[1/5] Portal files...');
const portalDir = path.join(ROOT, 'excelias-portal');
copyFile(path.join(portalDir, 'index.html'), path.join(DIST, 'index.html'));
copyFile(path.join(portalDir, 'portal.css'), path.join(DIST, 'portal.css'));
copyFile(path.join(portalDir, 'portal.js'), path.join(DIST, 'portal.js'));
copyFile(path.join(portalDir, 'xcelias-auth.js'), path.join(DIST, 'xcelias-auth.js'));

/* Copy firebase-config.js to dist root so it's accessible without the /activities
   student guard. The study guide (and any future module) loads it from /firebase-config.js. */
const fbConfigSrc = path.join(ROOT, 'Activites ( WorkSpace )', 'RedMaterialsAcademy', 'firebase-config.js');
if (fs.existsSync(fbConfigSrc)) {
  copyFile(fbConfigSrc, path.join(DIST, 'firebase-config.js'));
  console.log('    → Copied firebase-config.js to root');
}

/* ─── Student guard: injected into modules that have no role-based auth ─── */
const studentGuard = '<script>!function(){try{var u=JSON.parse(localStorage.getItem(\'xcCurrentUser\'));if(u&&u.role===\'student\'){window.location.replace(\'/studyguide/index.html\');document.write(\'<!--\');}}catch(e){}}();<\/script>';

/* ════════ 2. Activities (Project 1) ════════ */
console.log('[2/5] Activities...');
const actSrc = path.join(ROOT, 'Activites ( WorkSpace )', 'RedMaterialsAcademy');
copyDir(actSrc, path.join(DIST, 'activities'), (name) => {
  /* Exclude non-runtime files from production build */
  const skip = ['.md', '_backup'];
  return !skip.some(s => name.toLowerCase().includes(s));
});

// Rename .jsx → .js so Vercel serves it with correct MIME type
const actJsx = path.join(DIST, 'activities', 'app.jsx');
const actJs  = path.join(DIST, 'activities', 'app.js');
if (fs.existsSync(actJsx)) {
  fs.renameSync(actJsx, actJs);
}
// Add <base> tag + fix script path for Activities
const actHtml = path.join(DIST, 'activities', 'index.html');
let aHtml = fs.readFileSync(actHtml, 'utf8');
aHtml = aHtml.replace('src="app.jsx"', 'src="app.js"');
aHtml = aHtml.replace('<head>', '<head>\n    <base href="/activities/" />\n    ' + studentGuard);
fs.writeFileSync(actHtml, aHtml);
console.log('    → Renamed app.jsx → app.js + added <base> tag + student guard');

/* ════════ 3. Content / CRA Build (Project 2) ════════ */
console.log('[3/5] Content (CRA build)...');
const contentBuild = path.join(ROOT, 'Content ( WorkSpace )', 'red-materials-app', 'build');
copyDir(contentBuild, path.join(DIST, 'content'));

// Add <base> tag so relative paths resolve to /content/
const contentHtml = path.join(DIST, 'content', 'index.html');
let cHtml = fs.readFileSync(contentHtml, 'utf8');
cHtml = cHtml.replace(/(src|href)="\/static\//g, '$1="static/');
cHtml = cHtml.replace('<head>', '<head>\n<base href="/content/" />\n' + studentGuard);
fs.writeFileSync(contentHtml, cHtml);
console.log('    → Added <base href="/content/"> + rewrote CRA paths');

/* ════════ 4. Reports (Project 3) ════════ */
console.log('[4/6] Reports...');
const reportsSrc = path.join(ROOT, 'Report Generation 3');
const reportsDest = path.join(DIST, 'reports');
mkDir(reportsDest);
/* Exclude backup files, READMEs, and other non-runtime files from production */
const reportsSkip = ['_backup', '.md'];
for (const f of fs.readdirSync(reportsSrc, { withFileTypes: true })) {
  if (f.isFile() && !reportsSkip.some(s => f.name.toLowerCase().includes(s))) {
    copyFile(path.join(reportsSrc, f.name), path.join(reportsDest, f.name));
  }
}
// Add <base> tag for Reports
const reportsHtml = path.join(reportsDest, 'index.html');
let rHtml = fs.readFileSync(reportsHtml, 'utf8');
rHtml = rHtml.replace('<head>', '<head>\n    <base href="/reports/" />\n    ' + studentGuard);
fs.writeFileSync(reportsHtml, rHtml);
console.log('    → Added <base href="/reports/">');

/* ════════ 5. Study Guide (Project 4) ════════ */
console.log('[5/6] Study Guide...');
const studySrc = path.join(ROOT, 'Study Guide & Excersies');
const studyDest = path.join(DIST, 'studyguide');
mkDir(studyDest);
copyFile(path.join(studySrc, 'index.html'), path.join(studyDest, 'index.html'));
// Add <base> tag for Study Guide
const studyHtml = path.join(studyDest, 'index.html');
let sgHtml = fs.readFileSync(studyHtml, 'utf8');
sgHtml = sgHtml.replace('<head>', '<head>\n    <base href="/studyguide/" />');
/* Fix firebase-config.js path — load from root instead of /activities/ to avoid student guard */
sgHtml = sgHtml.replace('src="/activities/firebase-config.js"', 'src="/firebase-config.js"');
fs.writeFileSync(studyHtml, sgHtml);
console.log('    → Copied Study Guide + added <base href="/studyguide/">');

/* ════════ 6. Website / Property Explorer (Project 5) ════════ */
console.log('[6/6] Website...');
const webSrc = path.join(ROOT, 'Website ( WorkSpace )');
const webDest = path.join(DIST, 'website');
mkDir(webDest);

// Copy only the files needed for the static frontend (skip server, node_modules, .env, etc.)
const webFiles = [
  'index.html', 'app.js', 'styles.css', 'sw.js', 'search.worker.js',
  'data.json', 'cairo.json', 'gouna.json', 'north_coast.json', 'sokhna.json', 'others.json',
  'manifest.json', 'split_data.js'
];
for (const f of webFiles) {
  const fp = path.join(webSrc, f);
  if (fs.existsSync(fp)) copyFile(fp, path.join(webDest, f));
}
// Copy icons/
const iconsSrc = path.join(webSrc, 'icons');
if (fs.existsSync(iconsSrc)) copyDir(iconsSrc, path.join(webDest, 'icons'));

// Add <base> tag + rewrite paths for Website
const webHtml = path.join(webDest, 'index.html');
let wHtml = fs.readFileSync(webHtml, 'utf8');
// Convert absolute /xxx → relative xxx (base tag handles resolution)
// Exclude /xcelias-auth.js and /activities/ (auth scripts must stay absolute)
wHtml = wHtml.replace(/(href|src)="\/(?!\/|xcelias-auth|activities\/)/g, '$1="');
// Fix service worker registration absolute path
wHtml = wHtml.replace(/register\('\/sw\.js'\)/g, "register('sw.js')");
// Add <base> so all relative paths resolve to /website/
wHtml = wHtml.replace('<head>', '<head>\n    <base href="/website/" />\n    ' + studentGuard);
fs.writeFileSync(webHtml, wHtml);
console.log('    → Added <base href="/website/"> + student guard + rewrote paths');

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
console.log(`   ⊘ Avaria (requires separate server — opens in new tab)`);
