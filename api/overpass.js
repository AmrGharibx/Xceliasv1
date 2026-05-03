/**
 * Vercel serverless proxy for Overpass API
 * Avoids CORS / IP-block issues when calling from the browser on prod.
 * Only forwards POST requests with an Overpass QL query body.
 */

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

// Vercel body size limit
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: "64kb",
    },
  },
};

async function tryOverpass(query, mirror) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000); // 8 s per mirror — all fire in parallel, must finish inside Vercel's 10 s limit
  try {
    const res = await fetch(mirror, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Excelias-Portal/2.0 (https://excelias.vercel.app; educational real estate map)",
        Accept: "application/json",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${mirror}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    console.warn(`Overpass ${mirror}: ${err.message}`);
    throw err; // re-throw so Promise.any can count this as a rejection
  }
}

module.exports = async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract and validate query — body is a raw string (bodyParser handles it)
  const query =
    typeof req.body === "string"
      ? req.body
      : typeof req.body?.query === "string"
        ? req.body.query
        : null;

  if (!query || query.length > 8192) {
    return res.status(400).json({ error: "Invalid query" });
  }

  // Fire all mirrors in parallel — first successful response wins.
  // This keeps total latency within Vercel's 10 s function timeout
  // whereas sequential attempts (5 mirrors × 5 s) would always time out.
  const data = await Promise.any(
    OVERPASS_MIRRORS.map((mirror) => tryOverpass(query, mirror)),
  ).catch(() => null);

  if (data) {
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.status(200).json(data);
  }

  return res.status(503).json({ error: "Overpass API unavailable" });
};
