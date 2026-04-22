/**
 * fetch-places.js
 * Pre-bakes Egypt neighbourhood/place polygon data from Overpass
 * into a static GeoJSON served at /website/data/places.geojson
 *
 * Run once locally: node "Website ( WorkSpace )/scripts/fetch-places.js"
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// Main real-estate zones (roughly) — focused tiles to keep file small
const TILES = [
  // North Coast (Alexandria → Ras El Hekma)
  { s: 30.5, w: 25.0, n: 31.5, e: 29.5, label: "north-coast-west" },
  { s: 30.5, w: 29.5, n: 31.5, e: 32.0, label: "north-coast-east" },
  // Greater Cairo + New Capital + October/Zayed
  { s: 29.8, w: 30.6, n: 30.3, e: 32.2, label: "greater-cairo" },
  // Sokhna + Galala + Hurghada corridor
  { s: 27.0, w: 32.0, n: 30.0, e: 34.5, label: "sokhna-hurghada" },
  // Port Said / Ismailia
  { s: 30.5, w: 32.0, n: 31.8, e: 32.6, label: "port-said" },
];

function fetchOverpass(query) {
  return new Promise((resolve, reject) => {
    const body = `data=${encodeURIComponent(query)}`;
    const req = https.request(
      {
        hostname: "overpass-api.de",
        path: "/api/interpreter",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "Xcelias-Places-Prebake/1.0",
        },
      },
      (res) => {
        let chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 200)}`));
          } else {
            try {
              resolve(JSON.parse(raw));
            } catch (e) {
              reject(new Error("JSON parse error: " + e.message));
            }
          }
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * Convert Overpass way elements with geom into GeoJSON polygons
 * (mirrors overpassPlacesToGeoJson in app.js)
 */
function toGeoJson(elements) {
  const features = [];
  for (const el of elements) {
    if (el.type !== "way" || !el.geometry || el.geometry.length < 3) continue;
    const coords = el.geometry.map((n) => [n.lon, n.lat]);
    // Close ring if needed
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
    const name =
      el.tags?.name ||
      el.tags?.["name:ar"] ||
      el.tags?.["name:en"] ||
      `(${el.tags?.place || el.tags?.boundary || "?"})`;
    features.push({
      type: "Feature",
      properties: {
        id: `w${el.id}`,
        name,
        "name:ar": el.tags?.["name:ar"] || null,
        place: el.tags?.place || null,
        boundary: el.tags?.boundary || null,
        admin_level: el.tags?.admin_level || null,
      },
      geometry: {
        type: "Polygon",
        coordinates: [coords],
      },
    });
  }
  return features;
}

async function main() {
  const outDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const allFeatures = [];
  const seenIds = new Set();

  for (const tile of TILES) {
    const { s, w, n, e, label } = tile;
    console.log(`Fetching ${label} [${s},${w} → ${n},${e}]...`);
    const query = [
      `[out:json][timeout:60][bbox:${s},${w},${n},${e}];`,
      `(way["place"~"suburb|neighbourhood|quarter|village|town|city"](${s},${w},${n},${e});`,
      `way["boundary"="administrative"]["admin_level"~"^(7|8|9|10)$"](${s},${w},${n},${e}););`,
      `out geom qt;`,
    ].join("");

    try {
      const data = await fetchOverpass(query);
      const features = toGeoJson(data.elements || []);
      let added = 0;
      for (const f of features) {
        if (seenIds.has(f.properties.id)) continue;
        seenIds.add(f.properties.id);
        allFeatures.push(f);
        added++;
      }
      console.log(`  ✓ ${added} new features (total: ${allFeatures.length})`);
      // Polite delay to avoid hammering Overpass
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
    }
  }

  const geojson = { type: "FeatureCollection", features: allFeatures };
  const outPath = path.join(outDir, "places.geojson");
  fs.writeFileSync(outPath, JSON.stringify(geojson));

  const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`\nSaved ${allFeatures.length} features to data/places.geojson (${kb} KB)`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
