/**
 * simplify-places.js
 * Simplifies places.geojson polygon vertices using Ramer-Douglas-Peucker
 * and filters out features with degenerate rings.
 * Target output: < 2 MB raw
 *
 * Run: node "Website ( WorkSpace )/scripts/simplify-places.js"
 */

const fs = require("fs");
const path = require("path");

const TOLERANCE = 0.002; // degrees — ~220m, good for neighbourhood-scale polygons
const MIN_RING_POINTS = 4; // polygon needs ≥ 4 points (3 unique + closing)

// Ramer-Douglas-Peucker
function perpDist(point, lineStart, lineEnd) {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  if (dx === 0 && dy === 0) {
    return Math.hypot(point[0] - lineStart[0], point[1] - lineStart[1]);
  }
  const t = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (dx * dx + dy * dy);
  return Math.hypot(point[0] - (lineStart[0] + t * dx), point[1] - (lineStart[1] + t * dy));
}

function rdp(points, tolerance) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let maxIdx = 0;
  const last = points.length - 1;
  for (let i = 1; i < last; i++) {
    const d = perpDist(points[i], points[0], points[last]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > tolerance) {
    const left = rdp(points.slice(0, maxIdx + 1), tolerance);
    const right = rdp(points.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[last]];
}

function simplifyRing(ring, tolerance) {
  const simplified = rdp(ring, tolerance);
  // Ensure ring is closed
  const first = simplified[0];
  const last = simplified[simplified.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) simplified.push(first);
  return simplified;
}

function simplifyFeature(feature, tolerance) {
  const geom = feature.geometry;
  if (!geom) return null;
  if (geom.type === "Polygon") {
    const rings = geom.coordinates.map((r) => simplifyRing(r, tolerance));
    if (rings[0].length < MIN_RING_POINTS) return null;
    return { ...feature, geometry: { type: "Polygon", coordinates: rings } };
  }
  if (geom.type === "MultiPolygon") {
    const polys = geom.coordinates
      .map((poly) => poly.map((r) => simplifyRing(r, tolerance)))
      .filter((poly) => poly[0].length >= MIN_RING_POINTS);
    if (!polys.length) return null;
    return { ...feature, geometry: { type: "MultiPolygon", coordinates: polys } };
  }
  return feature;
}

const inPath = path.join(__dirname, "..", "data", "places.geojson");
const outPath = path.join(__dirname, "..", "data", "places.geojson");

console.log("Reading places.geojson...");
const raw = fs.readFileSync(inPath, "utf8");
const geojson = JSON.parse(raw);
const before = geojson.features.length;
const beforeKb = (raw.length / 1024).toFixed(1);

console.log(`Input: ${before} features, ${beforeKb} KB`);
console.log(`Simplifying with tolerance=${TOLERANCE}°...`);

const simplified = geojson.features
  .map((f) => simplifyFeature(f, TOLERANCE))
  .filter(Boolean);

const out = { type: "FeatureCollection", features: simplified };
const outStr = JSON.stringify(out);
fs.writeFileSync(outPath, outStr);

const afterKb = (outStr.length / 1024).toFixed(1);
const removed = before - simplified.length;
console.log(`Output: ${simplified.length} features (removed ${removed}), ${afterKb} KB`);
