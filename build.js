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

/* ════════ 2. Activities (Project 1) ════════ */
console.log('[2/5] Activities...');
const actSrc = path.join(ROOT, 'Activites ( WorkSpace )', 'RedMaterialsAcademy');
copyDir(actSrc, path.join(DIST, 'activities'));

// Rename .jsx → .js so Vercel serves it with correct MIME type
const actJsx = path.join(DIST, 'activities', 'app.jsx');
const actJs  = path.join(DIST, 'activities', 'app.js');
if (fs.existsSync(actJsx)) {
  fs.renameSync(actJsx, actJs);
  const actHtml = path.join(DIST, 'activities', 'index.html');
  let aHtml = fs.readFileSync(actHtml, 'utf8');
  aHtml = aHtml.replace('src="app.jsx"', 'src="app.js"');
  fs.writeFileSync(actHtml, aHtml);
  console.log('    → Renamed app.jsx → app.js for MIME compatibility');
}

/* ════════ 3. Content / CRA Build (Project 2) ════════ */
console.log('[3/5] Content (CRA build)...');
const contentBuild = path.join(ROOT, 'Content ( WorkSpace )', 'red-materials-app', 'build');
copyDir(contentBuild, path.join(DIST, 'content'));

// Rewrite CRA HTML: /static/js/... → static/js/... (relative)
const contentHtml = path.join(DIST, 'content', 'index.html');
let cHtml = fs.readFileSync(contentHtml, 'utf8');
cHtml = cHtml.replace(/(src|href)="\/static\//g, '$1="static/');
fs.writeFileSync(contentHtml, cHtml);
console.log('    → Rewrote CRA absolute paths to relative');

/* ════════ 4. Reports (Project 3) ════════ */
console.log('[4/5] Reports...');
const reportsSrc = path.join(ROOT, 'Report Generation 3');
const reportsDest = path.join(DIST, 'reports');
mkDir(reportsDest);
for (const f of fs.readdirSync(reportsSrc, { withFileTypes: true })) {
  if (f.isFile()) {
    copyFile(path.join(reportsSrc, f.name), path.join(reportsDest, f.name));
  }
}

/* ════════ 5. Website / Property Explorer (Project 5) ════════ */
console.log('[5/5] Website...');
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

// Rewrite Website HTML: convert absolute /xxx paths to relative xxx
const webHtml = path.join(webDest, 'index.html');
let wHtml = fs.readFileSync(webHtml, 'utf8');
// href="/manifest.json" → href="manifest.json", src="/app.js" → src="app.js", etc.
// Negative lookahead avoids // (protocol-relative URLs)
wHtml = wHtml.replace(/(href|src)="\/(?!\/)/g, '$1="');
// Fix service worker registration absolute path
wHtml = wHtml.replace(/register\('\/sw\.js'\)/g, "register('sw.js')");
fs.writeFileSync(webHtml, wHtml);
console.log('    → Rewrote Website absolute paths to relative');

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
console.log(`   ✓ Website (Property Explorer)`);
console.log(`   ⊘ Avaria (requires separate server — opens in new tab)`);
