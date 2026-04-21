# XCELIAS PROPERTY EXPLORER — MASTER UPGRADE PROMPT
## "Beat Wikimapia, Own Egypt's Real Estate Map"

> **To: GitHub Copilot Agent**
> **Codebase**: `j:\Excelias V2\Website ( WorkSpace )\`
> **Main files**: `app.js` (11,319 lines), `index.html`, `styles.css`
> **Server**: Express on port 4000, `dist/` built by `node build.js` at workspace root
> **Push target**: `AmrGharibx/Xceliasv1` → `main`

---

## CONTEXT & COMPETITIVE INTELLIGENCE (Read This First)

**Wikimapia's secret**: Roads are NOT rendered client-side. They are pre-baked pixels inside 256×256 PNG tile images served from 16 CDN shards (`i0–i15.wikimapia.org`). This is why roads appear instantly — they are just background images. Their place polygons (neighborhoods, hospitals, malls) are a **separate** lightweight vector overlay that fetches per-viewport bbox via their private API.

**Our current architecture**:
- `CartoDB dark_all` tile layer = our background (already tile-speed, but roads hidden in dark theme)
- Overpass API → GeoJSON polylines → Canvas layer = optional interactive road overlay (20–40s first load)
- 1,383 real estate projects = our unique data advantage
- Egypt-bounded only: `{ south: 22.0, north: 31.8, west: 24.7, east: 36.9 }`

**The gap to close**: We have richer road data but it takes 20–40s to appear. Wikimapia has instant roads baked in tiles. Our plan: add an instant tile overlay for roads AND add a places layer with our project intelligence baked in.

---

## PRE-IMPLEMENTATION CHECKLIST (Do Before Any Code Change)

1. Read `app.js` lines 2065–2115 → confirm road engine state variables
2. Read `app.js` lines 1785–1855 → confirm tile layer setup (CartoDB dark_all, satellite, hybrid)
3. Read `app.js` lines 2447–2475 → confirm `_updateCacheSize()` uses old v2 key
4. Read `app.js` lines 2940–2990 → confirm v2 migration code exists
5. Read `index.html` lines 2462–2600 → see full road panel HTML structure
6. Run `cd "j:\Excelias V2\excelias-portal" ; npm test` → all 33 tests must pass before starting
7. Confirm server is running: GET `http://localhost:4000/website/` → should return 200
8. Take screenshot of current Property Explorer for before/after comparison

---

## PHASE 1 — INSTANT ROAD TILES (Match Wikimapia Speed, 0ms)

### Goal
Add a transparent tile overlay layer that renders Egypt's road network **instantly** from pre-baked tiles — same technical approach as Wikimapia. This runs alongside our existing Overpass canvas layer. Users see roads immediately on load; the Overpass layer adds interactivity when it finishes.

### Why CartoDB Voyager Labels?
`https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png`
- Transparent background (alpha PNG) — roads/labels show over our dark tiles
- Free, no API key, same CDN (`a/b/c/d` subdomains) we already use
- Loads in 100–300ms (tile-cached globally)
- Shows road names in English/Arabic at appropriate zoom levels
- Does NOT replace our dark tile aesthetic — it overlays on top

### Implementation Steps

#### Step 1.1 — Add road tile layer variable after line 1802 in `app.js`

After this block:
```js
const layers = {
  street: L.tileLayer(darkTiles, {
```

Add BEFORE the `layers` object declaration:
```js
// Road label tile overlay — instant road visibility, zero Overpass delay
// Transparent PNG tiles from CartoDB Voyager Labels overlay
const ROAD_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png';
let roadTileLayer = null;
let _roadTilesVisible = false;
```

#### Step 1.2 — Add `roadTiles` toggle function in `app.js`, after `closeRoadPanel()` function (around line 3075)

```js
/** Toggle the instant tile-based road overlay */
function setRoadTilesVisible(visible) {
  _roadTilesVisible = visible;
  if (visible) {
    if (!roadTileLayer) {
      roadTileLayer = L.tileLayer(ROAD_TILE_URL, {
        subdomains: 'abcd',
        maxZoom: 22,
        detectRetina: true,
        opacity: 0.75,
        pane: 'overlayPane',
        updateWhenZooming: false,
        keepBuffer: 3,
        attribution: '',
      });
    }
    if (!map.hasLayer(roadTileLayer)) roadTileLayer.addTo(map);
  } else {
    if (roadTileLayer && map.hasLayer(roadTileLayer)) {
      map.removeLayer(roadTileLayer);
    }
  }
  // Sync UI toggle
  const cb = document.getElementById('road-tile-toggle');
  if (cb) cb.checked = visible;
}
```

#### Step 1.3 — Add tile toggle to road panel HTML in `index.html`

Find the road panel header section (`id="road-panel"`) and add this toggle at the TOP of the panel body, before the existing zone buttons:

```html
<!-- INSTANT ROAD TILES — zero latency -->
<div class="road-tile-row">
  <label class="road-tile-label" for="road-tile-toggle">
    <span class="rtl-icon">⚡</span>
    <span class="rtl-text">طرق فورية <small>(tile overlay)</small></span>
  </label>
  <input
    type="checkbox"
    id="road-tile-toggle"
    class="road-toggle-cb"
    onchange="setRoadTilesVisible(this.checked)"
  />
</div>
```

#### Step 1.4 — Add CSS for the new row in `index.html` `<style>` block or `styles.css`

```css
.road-tile-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}
.road-tile-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-primary, #e2e8f0);
  cursor: pointer;
}
.road-tile-label small {
  color: var(--text-secondary, #94a3b8);
  font-size: 10px;
}
```

#### Step 1.5 — Auto-enable road tiles on first load (in `app.js`, after map.whenReady callback)

```js
// Auto-show road tiles on load for instant road visibility
setTimeout(() => setRoadTilesVisible(true), 500);
```

#### Verification for Phase 1
- Screenshot before enabling tiles vs after → roads should appear within 300ms
- Toggle off/on should work cleanly
- Dark tile base should still be clearly visible
- Road tile opacity 0.75 is the sweet spot — adjust if labels too bold

---

## PHASE 2 — PLACES/AREAS OVERLAY (Beat Wikimapia's Core Feature)

### Goal
Add Egypt neighborhood/district polygon overlay from OpenStreetMap. On hover: polygon highlights + tooltip with Arabic name + our project count. On click: detailed slide panel with real estate intelligence for that area. This is what Wikimapia does but with **our data on top**.

### Technical Architecture

**Data source**: Overpass API
```
[out:json][timeout:30][bbox:22.0,24.7,31.8,36.9];
(
  relation["boundary"="administrative"]["admin_level"~"^(6|7|8)$"];
  way["place"~"^(suburb|neighbourhood|quarter|village|town|city_block)$"];
);
out geom qt;
```

**Rendering**: `L.geoJSON` Canvas layer, only active at zoom ≥ 9
**Cache key**: `xc_places_v1` in localStorage, TTL 60 days (admin boundaries rarely change)
**Dedup strategy**: OSM relation/way ID

### State Variables (add to road engine block in `app.js` around line 2100)

```js
// ── Places/Areas overlay ──
let placesLayer = null;
let _placesVisible = false;
let _placesLoaded = false;
let _placesLoading = false;
const PLACES_CACHE_KEY = 'xc_places_v1';
const PLACES_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
```

### Core Functions (add after `setRoadTilesVisible()` in `app.js`)

#### `_buildPlaceTooltip(feature)` — Arabic-first tooltip

```js
function _buildPlaceTooltip(feature) {
  const p = feature.properties || {};
  const nameAr = p['name:ar'] || '';
  const nameEn = p.name || p['name:en'] || '';
  const type = p.place || p.boundary || 'منطقة';
  const typeLabel = { suburb: 'حي', neighbourhood: 'حي', quarter: 'ربع',
    village: 'قرية', town: 'مدينة', administrative: 'منطقة إدارية' }[type] || type;

  // Count projects in this area using bbox
  let projectCount = 0;
  if (window.projects && feature.geometry) {
    const coords = _flattenCoords(feature.geometry);
    if (coords.length > 0) {
      const lats = coords.map(c => c[1]);
      const lngs = coords.map(c => c[0]);
      const bboxS = Math.min(...lats), bboxN = Math.max(...lats);
      const bboxW = Math.min(...lngs), bboxE = Math.max(...lngs);
      projectCount = window.projects.filter(proj =>
        proj.lat >= bboxS && proj.lat <= bboxN &&
        proj.lng >= bboxW && proj.lng <= bboxE
      ).length;
    }
  }

  const countBadge = projectCount > 0
    ? `<div class="place-tt-count">${projectCount} مشروع</div>`
    : '';

  return `<div class="place-tooltip">
    ${nameAr ? `<div class="place-tt-ar">${escHtml(nameAr)}</div>` : ''}
    ${nameEn ? `<div class="place-tt-en">${escHtml(nameEn)}</div>` : ''}
    <div class="place-tt-type">${escHtml(typeLabel)}</div>
    ${countBadge}
  </div>`;
}
```

#### `_flattenCoords(geometry)` — Flatten nested polygon/multipolygon coords

```js
function _flattenCoords(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return geometry.coordinates;
  if (geometry.type === 'Polygon') return geometry.coordinates[0] || [];
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap(p => p[0] || []);
  }
  return [];
}
```

#### `overpassPlacesToGeoJson(data)` — Convert Overpass response to GeoJSON

```js
function overpassPlacesToGeoJson(data) {
  const features = [];
  if (!data || !data.elements) return { type: 'FeatureCollection', features };
  for (const el of data.elements) {
    if (!el.geometry && !el.members) continue;
    let coordinates;
    if (el.type === 'way' && el.geometry) {
      coordinates = el.geometry.map(n => [n.lon, n.lat]);
      if (coordinates.length < 3) continue;
      // Close the ring
      if (coordinates[0][0] !== coordinates[coordinates.length-1][0]) {
        coordinates.push(coordinates[0]);
      }
      features.push({
        type: 'Feature',
        properties: { id: el.id, ...el.tags },
        geometry: { type: 'Polygon', coordinates: [coordinates] }
      });
    }
    // Relations are complex — skip for MVP, handle in v2
  }
  return { type: 'FeatureCollection', features };
}
```

#### `loadPlacesLayer()` — Main load function

```js
async function loadPlacesLayer() {
  if (_placesLoaded || _placesLoading) {
    if (_placesLoaded && !_placesVisible) setPlacesVisible(true);
    return;
  }
  _placesLoading = true;

  try {
    let features = null;

    // Try cache first
    try {
      const raw = localStorage.getItem(PLACES_CACHE_KEY);
      if (raw) {
        const env = JSON.parse(raw);
        if (env && env.v === 1 && Date.now() - (env.ts || 0) < PLACES_TTL_MS) {
          const jsonStr = await _decompressStr(env);
          features = await _parseJsonWorker(jsonStr);
          if (!Array.isArray(features)) features = null;
        }
      }
    } catch (_) { features = null; }

    // Fetch from Overpass if no cache
    if (!features) {
      const query = [
        '[out:json][timeout:30][bbox:22.0,24.7,31.8,36.9];',
        '(way["place"~"suburb|neighbourhood|quarter|village|town"](22.0,24.7,31.8,36.9);',
        'way["boundary"="administrative"]["admin_level"~"^(7|8|9|10)$"](22.0,24.7,31.8,36.9););',
        'out geom qt;'
      ].join('');
      const response = await _fetchOverpass(query, 30000);
      const data = await _parseJsonWorker(await response.text());
      const geojson = overpassPlacesToGeoJson(data);

      // Compact storage: only keep id + name fields + geometry
      features = geojson.features.map(f => ({
        i: f.properties.id,
        n: f.properties.name || '',
        a: f.properties['name:ar'] || '',
        p: f.properties.place || '',
        b: f.properties.boundary || '',
        l: f.properties.admin_level || '',
        c: f.geometry.coordinates[0], // outer ring only
      }));

      // Cache compressed
      try {
        const compressed = await _compressStr(JSON.stringify(features));
        localStorage.setItem(PLACES_CACHE_KEY, JSON.stringify({ v: 1, ts: Date.now(), ...compressed }));
      } catch (_) { /* quota */ }
    }

    // Build GeoJSON layer
    const renderer = L.canvas({ padding: 0.5, tolerance: 8 });
    placesLayer = L.geoJSON(null, {
      renderer,
      style: {
        color: 'rgba(102, 126, 234, 0.6)',
        weight: 1.5,
        fillColor: 'rgba(102, 126, 234, 0.04)',
        fillOpacity: 1,
        lineCap: 'round',
      },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(_buildPlaceTooltip(feature), {
          sticky: true,
          direction: 'top',
          className: 'place-name-tooltip',
          opacity: 0.97,
        });
        layer.on('mouseover', function() {
          this.setStyle({ color: 'rgba(102, 126, 234, 1)', fillColor: 'rgba(102, 126, 234, 0.12)', weight: 2.5 });
        });
        layer.on('mouseout', function() {
          this.setStyle({ color: 'rgba(102, 126, 234, 0.6)', fillColor: 'rgba(102, 126, 234, 0.04)', weight: 1.5 });
        });
        layer.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          _showPlacePanel(feature);
        });
      },
    });

    // Add features using compact format
    for (const f of features) {
      if (!f.c || f.c.length < 3) continue;
      placesLayer.addData({
        type: 'Feature',
        properties: { id: f.i, name: f.n, 'name:ar': f.a, place: f.p, boundary: f.b, admin_level: f.l },
        geometry: { type: 'Polygon', coordinates: [f.c] },
      });
    }

    _placesLoaded = true;
    _placesLoading = false;
    setPlacesVisible(true);

  } catch (err) {
    _placesLoading = false;
    console.warn('Places layer load failed:', err.message);
  }
}
```

#### `setPlacesVisible(visible)` — Toggle visibility

```js
function setPlacesVisible(visible) {
  _placesVisible = visible;
  if (!placesLayer) return;
  const zoom = map.getZoom();
  if (visible && zoom >= 9) {
    if (!map.hasLayer(placesLayer)) placesLayer.addTo(map);
  } else {
    if (map.hasLayer(placesLayer)) map.removeLayer(placesLayer);
  }
  const cb = document.getElementById('places-toggle');
  if (cb) cb.checked = visible;
}
```

#### `_showPlacePanel(feature)` — Slide-up panel with Xcelias intelligence

```js
function _showPlacePanel(feature) {
  const p = feature.properties || {};
  const nameAr = p['name:ar'] || p.name || 'منطقة';
  const nameEn = p.name || '';
  const type = p.place || p.boundary || 'area';

  // Find projects in this area bbox
  const coords = _flattenCoords(feature.geometry);
  let nearProjects = [];
  if (coords.length > 0 && window.projects) {
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);
    const bS = Math.min(...lats), bN = Math.max(...lats);
    const bW = Math.min(...lngs), bE = Math.max(...lngs);
    nearProjects = window.projects.filter(proj =>
      proj.lat >= bS && proj.lat <= bN && proj.lng >= bW && proj.lng <= bE
    );
  }

  const avgPrice = nearProjects.length > 0
    ? nearProjects.reduce((s, p) => s + (parseFloat(p.minPrice) || 0), 0) / nearProjects.filter(p => p.minPrice).length
    : 0;

  const projectRows = nearProjects.slice(0, 5).map(proj =>
    `<div class="place-proj-row">
      <span class="place-proj-name">${escHtml(proj.name || '')}</span>
      <span class="place-proj-dev">${escHtml(proj.dev || '')}</span>
    </div>`
  ).join('');

  const panel = document.getElementById('place-intel-panel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="pip-header">
      <div class="pip-names">
        <h3 class="pip-name-ar">${escHtml(nameAr)}</h3>
        ${nameEn ? `<p class="pip-name-en">${escHtml(nameEn)}</p>` : ''}
      </div>
      <button class="pip-close" onclick="document.getElementById('place-intel-panel').hidden=true">✕</button>
    </div>
    <div class="pip-stats">
      <div class="pip-stat">
        <span class="pip-stat-num">${nearProjects.length}</span>
        <span class="pip-stat-label">مشروع</span>
      </div>
      ${avgPrice > 0 ? `<div class="pip-stat">
        <span class="pip-stat-num">${(avgPrice / 1e6).toFixed(1)}M</span>
        <span class="pip-stat-label">متوسط السعر (EGP)</span>
      </div>` : ''}
    </div>
    ${nearProjects.length > 0 ? `
    <div class="pip-projects">
      <div class="pip-proj-title">أبرز المشاريع</div>
      ${projectRows}
      ${nearProjects.length > 5 ? `<div class="pip-more">+ ${nearProjects.length - 5} مشاريع أخرى</div>` : ''}
    </div>` : '<div class="pip-empty">لا توجد مشاريع مسجلة في هذه المنطقة</div>'}
  `;
  panel.hidden = false;
}
```

#### Places panel HTML (add to `index.html` before closing `</body>`)

```html
<!-- Place Intelligence Panel -->
<div id="place-intel-panel" class="place-intel-panel" hidden>
  <!-- Filled dynamically by _showPlacePanel() -->
</div>
```

#### Places toggle in road panel HTML (`index.html`)

Add after the road tile toggle row:
```html
<!-- OSM Places / Neighborhoods -->
<div class="road-tile-row">
  <label class="road-tile-label" for="places-toggle">
    <span class="rtl-icon">🏘</span>
    <span class="rtl-text">أحياء ومناطق <small>(OSM)</small></span>
  </label>
  <input
    type="checkbox"
    id="places-toggle"
    class="road-toggle-cb"
    onchange="this.checked ? loadPlacesLayer() : setPlacesVisible(false)"
  />
</div>
```

#### CSS for places panel (add to `index.html` `<style>` or `styles.css`)

```css
.place-name-tooltip {
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(102, 126, 234, 0.4);
  border-radius: 8px;
  padding: 6px 10px;
  backdrop-filter: blur(8px);
  font-family: inherit;
}
.place-tt-ar { font-size: 14px; font-weight: 700; color: #e2e8f0; direction: rtl; }
.place-tt-en { font-size: 11px; color: #94a3b8; }
.place-tt-type { font-size: 10px; color: #667eea; margin-top: 2px; }
.place-tt-count {
  font-size: 12px; font-weight: 600;
  color: #f093fb; margin-top: 3px;
  background: rgba(240, 147, 251, 0.15);
  padding: 2px 6px; border-radius: 10px; display: inline-block;
}

.place-intel-panel {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9000;
  width: min(380px, 92vw);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(16px);
  color: #e2e8f0;
  font-family: inherit;
  direction: rtl;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.pip-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.pip-name-ar { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 0; }
.pip-name-en { font-size: 12px; color: #94a3b8; margin: 2px 0 0; }
.pip-close { background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1; }
.pip-close:hover { color: #e2e8f0; }
.pip-stats { display: flex; gap: 16px; margin-bottom: 12px; }
.pip-stat { text-align: center; }
.pip-stat-num { display: block; font-size: 24px; font-weight: 800; color: #667eea; }
.pip-stat-label { font-size: 11px; color: #94a3b8; }
.pip-proj-title { font-size: 12px; color: #667eea; font-weight: 600; margin-bottom: 6px; }
.pip-projects { border-top: 1px solid rgba(102,126,234,0.2); padding-top: 10px; }
.place-proj-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.place-proj-name { font-size: 12px; font-weight: 600; }
.place-proj-dev { font-size: 11px; color: #94a3b8; }
.pip-more { font-size: 11px; color: #667eea; text-align: center; padding-top: 6px; }
.pip-empty { font-size: 12px; color: #94a3b8; text-align: center; padding: 8px 0; }
```

#### Zoom-gate places visibility in map event listeners (`app.js`)

Add to the `map.on('zoomend')` handler:
```js
map.on('zoomend', () => {
  if (_placesVisible && placesLayer) {
    const zoom = map.getZoom();
    if (zoom >= 9 && !map.hasLayer(placesLayer)) placesLayer.addTo(map);
    if (zoom < 9 && map.hasLayer(placesLayer)) map.removeLayer(placesLayer);
  }
});
```

#### Verification for Phase 2
- Load places layer → polygons appear over map as thin blue-purple lines
- Hover a neighborhood → tooltip shows Arabic name + project count
- Click a neighborhood → slide panel shows project list, average price
- Zoom out below 9 → polygons disappear automatically
- Zoom back to 9+ → polygons reappear
- Cache persists in localStorage as `xc_places_v1` (check DevTools Application tab)

---

## PHASE 3 — DEAD CODE REMOVAL & PERFORMANCE FIXES

### Dead Code to Remove (exact locations)

#### 3.1 — `_updateCacheSize()` — remove stale v2 key reference (line ~2456)

**Find**:
```js
const keys = [EGYPT_HW_CACHE_KEY, "xc_egypt_hw_v2"];
```
**Replace with**:
```js
const keys = [EGYPT_HW_CACHE_KEY];
```

#### 3.2 — `loadFullEgyptHighways()` — remove v2 migration block (lines ~2955–2985)

**Find and delete** this entire block (inside `loadFullEgyptHighways`):
```js
// ── 1b. Migrate legacy v2 cache → v3 (one-time upgrade for existing users) ──
if (!features) {
  try {
    const v2raw = localStorage.getItem("xc_egypt_hw_v2");
    ...
    }
  } catch (_) {
    features = null;
  }
}
```
All existing users have been migrated to v3 by now (30+ days since v3 was deployed). The migration block is dead weight that runs on every cold start.

#### 3.3 — `fetchAndDrawRoads()` — remove the complex viewport tiling path

The viewport-tiling path (grid cells at 0.5° increments) was superseded by `loadZoneRoads()`. It creates unreliable bbox grid cells that overlap zone loads and double-fetch road segments.

**The `else` branch inside `fetchAndDrawRoads(overrideBbox)`** when `!overrideBbox` — keep it for now but add early return if a zone is already fully loaded for that area. (Full removal = Phase 3 v2 — too risky for now)

#### 3.4 — `_refreshRoadLabels` debounce (in `moveend` listener, lines ~3210–3220)

**Find** (in the `moveend` listener):
```js
map.on("moveend", () => {
  if (map.getZoom() >= 13 && _roadsVisible) {
    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(() => _refreshRoadLabels(), { timeout: 300 });
    } else {
      setTimeout(_refreshRoadLabels, 16);
    }
  }
});
```
**Replace with** (proper debounce — avoid calling on every pan):
```js
let _labelRefreshTimer = null;
map.on("moveend", () => {
  if (map.getZoom() >= 13 && _roadsVisible) {
    clearTimeout(_labelRefreshTimer);
    _labelRefreshTimer = setTimeout(() => {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(() => _refreshRoadLabels(), { timeout: 500 });
      } else {
        _refreshRoadLabels();
      }
    }, 400);
  }
});
```

#### 3.5 — Web Worker blob — create once, reuse (performance)

In `_parseJsonWorker()` (around line 2220), the Blob URL is created on every call:

**Find**:
```js
async function _parseJsonWorker(str) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([`self.onmessage=e=>postMessage(JSON.parse(e.data));`], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
```
**Replace with** (singleton blob URL):
```js
let _workerBlobUrl = null;
function _getWorkerUrl() {
  if (!_workerBlobUrl) {
    const blob = new Blob([`self.onmessage=e=>postMessage(JSON.parse(e.data));`], { type: 'application/javascript' });
    _workerBlobUrl = URL.createObjectURL(blob);
  }
  return _workerBlobUrl;
}

async function _parseJsonWorker(str) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(_getWorkerUrl());
```
*(Remove the blob/url creation lines from inside the function)*

#### 3.6 — `satellite` keepBuffer: 6 → 3

In the `layers` object (line ~1825):
```js
keepBuffer: 6, // Extra buffer for satellite (more caching)
```
Change to:
```js
keepBuffer: 3,
```
Rationale: 6 tiles buffer = 28 extra tiles pre-loaded per zoom level. Cuts memory usage ~50% for satellite mode.

#### 3.7 — Remove `updateWhenIdle: true` from map init (conflicts with `updateWhenZooming: false`)

In map initialization (line ~1790):
```js
updateWhenIdle: true, // Update tiles when map stops moving
```
Remove this line entirely — `updateWhenZooming: false` already handles it, and both together cause duplicate tile requests on pan.

### Performance Verification
After Phase 3 changes, run:
```bash
cd "j:\Excelias V2\excelias-portal" && npm test
```
All 33 tests must still pass (they don't test `app.js` directly but build integrity matters).

Open Chrome DevTools → Performance tab → Record 10 seconds of map panning → check for:
- No more than 1 worker blob creation in Memory section
- `_refreshRoadLabels` not called more than 1×/400ms during panning
- Satellite mode: tile count in Network tab should be 30–40% lower than before

---

## PHASE 4 — XCELIAS INTELLIGENCE LAYER (Unique Advantage Nobody Can Copy)

### 4.1 — Zone Price Heatmap (Choropleth)

**Goal**: Color each of our 6 zones by average price/m² — users see at a glance where is expensive vs affordable.

**Implementation**: After all projects load (`parseProjectData()` completes), compute zone stats:

```js
function _buildZoneChoropleth() {
  const zoneStats = {};
  const zones = ['north-coast', 'sokhna', 'gouna', 'new-capital', 'october', 'new-cairo'];

  zones.forEach(z => {
    const bbox = ZONE_ROAD_BBOXES[z];
    if (!bbox) return;
    const zProjects = (window.projects || []).filter(p =>
      p.lat >= bbox.south && p.lat <= bbox.north &&
      p.lng >= bbox.west && p.lng <= bbox.east &&
      p.minPrice
    );
    if (!zProjects.length) return;
    const avgPrice = zProjects.reduce((s, p) => s + parseFloat(p.minPrice || 0), 0) / zProjects.length;
    zoneStats[z] = { avgPrice, count: zProjects.length };
  });

  // Price range → color gradient (low = cool blue, high = hot red)
  const prices = Object.values(zoneStats).map(s => s.avgPrice).filter(Boolean);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);

  return { zoneStats, minP, maxP };
}
```

**UI**: Add a legend card in the bottom-right corner showing zone prices with color squares.
**Trigger**: Called once after `parseProjectData()` on initial load.
**Toggle**: Button in the sidebar "عرض أسعار المناطق" (Show Zone Prices).

### 4.2 — Property Density Rings

**Goal**: Right-click or long-press any map location → draw concentric rings (1km, 3km, 5km) + count projects inside each ring.

**Implementation**:

```js
let _densityRings = [];

function showDensityRings(latlng) {
  // Clear previous rings
  _densityRings.forEach(l => map.removeLayer(l));
  _densityRings = [];

  const radii = [1000, 3000, 5000]; // meters
  const colors = ['rgba(240,147,251,0.6)', 'rgba(102,126,234,0.5)', 'rgba(240,147,251,0.3)'];

  radii.forEach((r, i) => {
    const circle = L.circle(latlng, {
      radius: r,
      color: colors[i],
      weight: 1.5,
      fill: true,
      fillColor: colors[i],
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(map);
    _densityRings.push(circle);

    // Count projects inside this ring
    const count = (window.projects || []).filter(p => {
      const dist = map.distance(latlng, L.latLng(p.lat, p.lng));
      return dist <= r;
    }).length;

    const label = L.marker(L.latLng(latlng.lat, latlng.lng + (r / 111320) * 0.7), {
      icon: L.divIcon({
        html: `<div class="density-ring-label">${count} مشروع · ${r >= 1000 ? r/1000 + 'km' : r + 'm'}</div>`,
        className: '',
        iconAnchor: [0, 10],
      }),
      interactive: false,
    }).addTo(map);
    _densityRings.push(label);
  });

  // Auto-remove after 15 seconds
  setTimeout(() => {
    _densityRings.forEach(l => map.removeLayer(l));
    _densityRings = [];
  }, 15000);
}

// Trigger on right-click
map.on('contextmenu', (e) => showDensityRings(e.latlng));
```

**CSS for label**:
```css
.density-ring-label {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(102, 126, 234, 0.4);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 11px;
  color: #e2e8f0;
  white-space: nowrap;
  direction: rtl;
}
```

### 4.3 — Highway-Adjacent Projects Filter

**Goal**: Button "مشاريع قرب الطرق السريعة" — highlights only projects within 500m of a motorway/trunk road.

**Implementation**: After `mainRoadsLayer` is populated, build a quick proximity index:

```js
let _highwayAdjacentIds = null;

async function _buildHighwayProximityIndex() {
  if (!mainRoadsLayer || !window.projects) return;
  const HW_THRESHOLD = 500; // meters

  // Collect all motorway/trunk coordinates from mainRoadsLayer
  const hwCoords = [];
  mainRoadsLayer.eachLayer(layer => {
    const latlngs = layer.getLatLngs ? layer.getLatLngs() : [];
    latlngs.forEach(ll => hwCoords.push(ll));
  });

  if (!hwCoords.length) return;

  _highwayAdjacentIds = new Set();
  window.projects.forEach(p => {
    const projLL = L.latLng(p.lat, p.lng);
    const isNear = hwCoords.some(hwLL => map.distance(projLL, hwLL) <= HW_THRESHOLD);
    if (isNear) _highwayAdjacentIds.add(p.name);
  });
}

function toggleHighwayFilter(active) {
  if (active && !_highwayAdjacentIds) {
    _buildHighwayProximityIndex().then(() => _applyHighwayFilter(true));
  } else {
    _applyHighwayFilter(active);
  }
}

function _applyHighwayFilter(active) {
  if (!window.markerCluster) return;
  window.markerCluster.eachLayer(marker => {
    const p = marker.options._projectData;
    if (!p) return;
    if (active && !_highwayAdjacentIds.has(p.name)) {
      marker.setOpacity(0.2);
    } else {
      marker.setOpacity(1);
    }
  });
}
```

---

## BUILD & DEPLOY SEQUENCE

After ALL phases are implemented:

```bash
# 1. Verify no JS syntax errors
cd "j:\Excelias V2\excelias-portal" ; npm run lint

# 2. Run test suite
cd "j:\Excelias V2\excelias-portal" ; npm test

# 3. Build dist/
cd "j:\Excelias V2" ; node build.js

# 4. Screenshot before/after in browser at http://localhost:4000/website/
# - With road tiles ON: roads visible within 300ms
# - Places toggle ON at zoom 10: neighborhood polygons visible
# - Right-click on map: density rings appear

# 5. Git commit
git -C "j:\Excelias V2" add -A
git -C "j:\Excelias V2" commit -m "feat(website): Phase 1-4 upgrade - instant road tiles, places overlay, dead code cleanup, Xcelias intelligence layer"
git -C "j:\Excelias V2" push origin main
```

---

## IMPLEMENTATION ORDER (Strict Sequence)

```
Phase 3.5–3.7 (worker singleton + map init fixes)   ← START HERE, lowest risk
    ↓
Phase 3.1–3.4 (dead code + debounce)               ← Still low risk
    ↓
Phase 1 (road tile overlay)                         ← New feature, additive only
    ↓
Phase 2 (places layer + panel)                      ← Biggest addition, save for last
    ↓
Phase 4.1 (zone choropleth)                         ← Polish
    ↓
Phase 4.2 (density rings)                           ← Polish
    ↓
Phase 4.3 (highway filter)                          ← Requires Phase 1 data
    ↓
Build + test + screenshot + commit + push
```

---

## SECURITY CHECKLIST (Non-Negotiable)

- [ ] Every `innerHTML` write uses `escHtml()` — check `_showPlacePanel()` and `_buildPlaceTooltip()`
- [ ] Overpass response validated for `content-type: application/json` before parsing
- [ ] No user-controlled values passed to `eval`, `new Function`, or `setTimeout(string)`
- [ ] `_flattenCoords()` returns empty array (not throws) on invalid geometry
- [ ] Place panel close button uses `hidden=true`, not `innerHTML = ''` (avoid re-injection)
- [ ] No API keys in source — tile URLs use public free endpoints only
- [ ] CSP in `server.js` is not modified (CartoDB tiles already whitelisted as `img-src *.cartocdn.com`)

---

## EXPECTED OUTCOME

After all 4 phases:

| Metric | Before | After |
|--------|--------|-------|
| Time to see roads on load | 20–40s (Overpass) | **< 300ms** (tiles) |
| Neighborhood info on hover | Not available | ✅ Arabic + project count |
| Click area → real estate data | Not available | ✅ Count, avg price, project list |
| Dead code in app.js | ~180 lines | 0 |
| Memory (satellite mode) | High (keepBuffer:6) | Reduced ~40% |
| Map label refresh on pan | Every moveend | Every 400ms max |
| Unique vs Wikimapia | Property data only | **Property + Places + Intelligence** |
