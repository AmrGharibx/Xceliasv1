/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RED Training Academy - ULTRA FAST In-Memory Server
 * All data pre-loaded into RAM for instant responses (<1ms)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const IS_LOCALHOST = ['localhost', '127.0.0.1', '0.0.0.0'].includes(HOST) || !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

// ═══════════════════════════════════════════════════════════════════════════
// IN-MEMORY DATA STORE - Everything loaded at startup
// ═══════════════════════════════════════════════════════════════════════════

let DATA = {
    projects: []
};

const ROUTE_CACHE = new Map();
const ROUTE_CACHE_MAX = 250;
const OSRM_BASE_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';

function getRouteCache(key) {
    const cached = ROUTE_CACHE.get(key);
    if (!cached) return null;

    if (Date.now() - cached.createdAt > 15 * 60 * 1000) {
        ROUTE_CACHE.delete(key);
        return null;
    }

    return cached.value;
}

function setRouteCache(key, value) {
    if (ROUTE_CACHE.size >= ROUTE_CACHE_MAX) {
        const firstKey = ROUTE_CACHE.keys().next().value;
        ROUTE_CACHE.delete(firstKey);
    }

    ROUTE_CACHE.set(key, {
        value,
        createdAt: Date.now()
    });
}

function normalizeCoordinatePoint(point, index) {
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error(`Invalid coordinate at index ${index}`);
    }

    return {
        lat,
        lng,
        name: point?.name || `Point ${index + 1}`
    };
}

function toOsrmCoordinateString(points) {
    return points.map(point => `${point.lng},${point.lat}`).join(';');
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });

        if (!response.ok) {
            throw new Error(`Routing provider responded with ${response.status}`);
        }

        return await response.json();
    } finally {
        clearTimeout(timeoutId);
    }
}

function normalizeOsrmRouteResponse(payload, requestedPoints) {
    if (!payload || payload.code !== 'Ok' || !Array.isArray(payload.routes) || payload.routes.length === 0) {
        throw new Error(payload?.message || 'No route found');
    }

    const primaryRoute = payload.routes[0];

    return {
        provider: 'osrm',
        requestedPoints,
        waypoints: (payload.waypoints || []).map((waypoint, index) => ({
            name: requestedPoints[index]?.name || waypoint.name || `Point ${index + 1}`,
            distance: waypoint.distance,
            snappedLng: waypoint.location?.[0],
            snappedLat: waypoint.location?.[1],
            roadName: waypoint.name || ''
        })),
        primaryRoute: {
            distance: primaryRoute.distance,
            duration: primaryRoute.duration,
            weight: primaryRoute.weight,
            summary: primaryRoute.legs?.map(leg => leg.summary).filter(Boolean).join(' • ') || '',
            geometry: primaryRoute.geometry,
            legs: (primaryRoute.legs || []).map((leg, index) => ({
                index,
                distance: leg.distance,
                duration: leg.duration,
                summary: leg.summary || '',
                steps: (leg.steps || []).map(step => ({
                    distance: step.distance,
                    duration: step.duration,
                    name: step.name || '',
                    mode: step.mode || 'driving',
                    instruction: step.maneuver?.instruction || '',
                    type: step.maneuver?.type || '',
                    modifier: step.maneuver?.modifier || '',
                    location: step.maneuver?.location || null
                }))
            }))
        },
        alternatives: payload.routes.slice(1).map(route => ({
            distance: route.distance,
            duration: route.duration,
            weight: route.weight,
            summary: route.legs?.map(leg => leg.summary).filter(Boolean).join(' • ') || '',
            geometry: route.geometry
        }))
    };
}

function normalizeOsrmTripResponse(payload, requestedPoints) {
    if (!payload || payload.code !== 'Ok' || !Array.isArray(payload.trips) || payload.trips.length === 0) {
        throw new Error(payload?.message || 'No optimized trip found');
    }

    const trip = payload.trips[0];
    const orderedWaypoints = [...(payload.waypoints || [])].sort((a, b) => a.waypoint_index - b.waypoint_index);

    return {
        provider: 'osrm',
        waypointOrder: orderedWaypoints.map(waypoint => waypoint.trips_index === 0 ? waypoint.waypoint_index : waypoint.waypoint_index),
        orderedPoints: orderedWaypoints.map((waypoint, index) => ({
            name: requestedPoints[waypoint.waypoint_index]?.name || `Point ${index + 1}`,
            originalIndex: waypoint.waypoint_index,
            lat: requestedPoints[waypoint.waypoint_index]?.lat,
            lng: requestedPoints[waypoint.waypoint_index]?.lng,
            snappedLat: waypoint.location?.[1],
            snappedLng: waypoint.location?.[0],
            roadName: waypoint.name || ''
        })),
        trip: {
            distance: trip.distance,
            duration: trip.duration,
            weight: trip.weight,
            summary: trip.legs?.map(leg => leg.summary).filter(Boolean).join(' • ') || '',
            geometry: trip.geometry,
            legs: (trip.legs || []).map((leg, index) => ({
                index,
                distance: leg.distance,
                duration: leg.duration,
                summary: leg.summary || ''
            }))
        }
    };
}

/**
 * Load all JSON files into memory
 */
function loadAllData() {
    console.log('📂 Loading data into memory...');
    const startTime = Date.now();
    
    const JSON_FILES = [
        { file: 'cairo.json', zone: 'cairo' },
        { file: 'north_coast.json', zone: 'north_coast' },
        { file: 'sokhna.json', zone: 'sokhna' },
        { file: 'gouna.json', zone: 'gouna' },
        { file: 'others.json', zone: 'other' }
    ];

    const allProjects = [];
    let id = 1;

    for (const { file, zone } of JSON_FILES) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            console.log(`  ⚠️ ${file} not found`);
            continue;
        }

        try {
            const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const projects = raw.projects || raw;
            
            for (const p of projects) {
                if (!p.name) continue;
                
                // Normalize and enrich project data
                const project = {
                    id: id++,
                    name: p.name,
                    dev: p.dev || p.developer || '',
                    lat: parseFloat(p.lat) || null,
                    lng: parseFloat(p.lng) || null,
                    zone: p.zone || zone,
                    status: p.status || 'Under Construction',
                    type: p.type || 'residential',
                    priceMin: p.priceMin || p.price_min || null,
                    priceMax: p.priceMax || p.price_max || null,
                    areaMin: p.areaMin || p.area_min || null,
                    areaMax: p.areaMax || p.area_max || null,
                    downPayment: p.downPayment || p.down_payment || null,
                    installmentYears: p.installmentYears || p.installment_years || null,
                    paymentPlan: p.paymentPlan || p.payment_plan || '',
                    deliveryYear: p.deliveryYear || p.delivery_year || '',
                    description: p.description || '',
                    amenities: Array.isArray(p.amenities) ? p.amenities : (p.amenities ? [p.amenities] : []),
                    unitTypes: Array.isArray(p.unitTypes) ? p.unitTypes : (p.unitTypes ? [p.unitTypes] : []),
                    bedrooms: Array.isArray(p.bedrooms) ? p.bedrooms : (p.bedrooms ? [p.bedrooms] : []),
                    // Pre-compute search text
                    _searchText: `${p.name} ${p.dev || p.developer || ''} ${p.zone || ''} ${p.status || ''}`.toLowerCase()
                };

                allProjects.push(project);
            }
            
            console.log(`  ✅ ${file}: ${projects.length} projects`);
        } catch (err) {
            console.error(`  ❌ Error loading ${file}:`, err.message);
        }
    }

    // Store in memory
    DATA.projects = allProjects;
    
    const elapsed = Date.now() - startTime;
    console.log(`\n✅ Loaded ${allProjects.length} projects in ${elapsed}ms`);
}

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

if (IS_LOCALHOST) {
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: false,
        originAgentCluster: false,
        referrerPolicy: false,
        frameguard: false,
        hsts: false
    }));
} else {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
                scriptSrcAttr: ["'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "blob:", "https://*.basemaps.cartocdn.com", "https://server.arcgisonline.com", "https://*.tile.openstreetmap.org"],
                connectSrc: ["'self'", "https://overpass-api.de", "https://*.basemaps.cartocdn.com", "https://server.arcgisonline.com", "https://router.project-osrm.org"],
                workerSrc: ["'self'", "blob:"],
                manifestSrc: ["'self'"],
                upgradeInsecureRequests: null
            }
        },
        crossOriginEmbedderPolicy: false,
        hsts: { maxAge: 31536000, includeSubDomains: true }
    }));
}

// Simple in-memory rate limiter for routing API (no extra dependency)
const _rateBuckets = new Map();
function rateLimitRoute(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = _rateBuckets.get(ip) || { count: 0, reset: now + 60000 };
    if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + 60000; }
    bucket.count++;
    _rateBuckets.set(ip, bucket);
    if (bucket.count > 60) {
        return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
    }
    next();
}
// Cleanup stale buckets every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of _rateBuckets) {
        if (now > bucket.reset + 120000) _rateBuckets.delete(ip);
    }
}, 300000);

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Request timing
app.use((req, res, next) => {
    req._startTime = process.hrtime.bigint();
    res.on('finish', () => {
        const elapsed = Number(process.hrtime.bigint() - req._startTime) / 1e6;
        if (req.path.startsWith('/api')) {
            console.log(`${req.method} ${req.path} - ${elapsed.toFixed(2)}ms`);
        }
    });
    next();
});

// ═══════════════════════════════════════════════════════════════════════════
// GEMINI AI PROXY
// ═══════════════════════════════════════════════════════════════════════════

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'];
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGeminiWithRetry(geminiBody, retries = 2) {
    for (const model of GEMINI_MODELS) {
        for (let attempt = 0; attempt < retries; attempt++) {
            const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(geminiBody),
                signal: AbortSignal.timeout(30000)
            });
            if (response.ok) {
                const data = await response.json();
                return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
            const status = response.status;
            if (status === 503 || status === 429) {
                console.warn(`Gemini ${model} attempt ${attempt + 1}: ${status}, retrying...`);
                await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
                continue;
            }
            // Non-retryable error — throw immediately
            const errText = await response.text().catch(() => '');
            throw new Error(`Gemini API ${status}: ${errText}`);
        }
    }
    throw new Error('All Gemini models unavailable');
}

app.post('/api/gemini', rateLimitRoute, async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ success: false, error: 'Gemini API key not configured' });
        }

        const { systemPrompt, messages, generationConfig } = req.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, error: 'Messages array is required' });
        }

        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(m.content || '') }]
        }));

        const geminiBody = {
            contents,
            generationConfig: {
                temperature: generationConfig?.temperature ?? 0.8,
                topP: generationConfig?.topP ?? 0.9,
                maxOutputTokens: generationConfig?.maxOutputTokens ?? 600
            }
        };

        if (systemPrompt) {
            geminiBody.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const text = await callGeminiWithRetry(geminiBody);
        res.json({ success: true, text });
    } catch (err) {
        console.error('Gemini proxy error:', err.message);
        res.status(502).json({ success: false, error: err.message || 'Gemini request failed' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/route/route', rateLimitRoute, async (req, res) => {
    try {
        const profile = req.body?.profile || 'driving';
        const alternatives = req.body?.alternatives ? 'true' : 'false';
        const requestedPoints = (req.body?.coordinates || []).map(normalizeCoordinatePoint);

        if (requestedPoints.length < 2) {
            return res.status(400).json({ success: false, error: 'At least two route points are required' });
        }

        const cacheKey = JSON.stringify({ type: 'route', profile, alternatives, requestedPoints });
        const cached = getRouteCache(cacheKey);
        if (cached) {
            return res.json({ success: true, data: cached, cached: true });
        }

        const coordinates = toOsrmCoordinateString(requestedPoints);
        const url = `${OSRM_BASE_URL}/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson&steps=true&annotations=distance,duration&alternatives=${alternatives}`;
        const payload = await fetchJsonWithTimeout(url);
        const normalized = normalizeOsrmRouteResponse(payload, requestedPoints);

        setRouteCache(cacheKey, normalized);
        res.json({ success: true, data: normalized });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Route request failed' });
    }
});

app.post('/api/route/table', rateLimitRoute, async (req, res) => {
    try {
        const profile = req.body?.profile || 'driving';
        const requestedPoints = (req.body?.coordinates || []).map(normalizeCoordinatePoint);

        if (requestedPoints.length < 2) {
            return res.status(400).json({ success: false, error: 'At least two table points are required' });
        }

        const cacheKey = JSON.stringify({ type: 'table', profile, requestedPoints });
        const cached = getRouteCache(cacheKey);
        if (cached) {
            return res.json({ success: true, data: cached, cached: true });
        }

        const coordinates = toOsrmCoordinateString(requestedPoints);
        const url = `${OSRM_BASE_URL}/table/v1/${profile}/${coordinates}?annotations=distance,duration`;
        const payload = await fetchJsonWithTimeout(url);

        if (!payload || payload.code !== 'Ok') {
            throw new Error(payload?.message || 'Route matrix failed');
        }

        const normalized = {
            provider: 'osrm',
            points: requestedPoints,
            distances: payload.distances || [],
            durations: payload.durations || []
        };

        setRouteCache(cacheKey, normalized);
        res.json({ success: true, data: normalized });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Route matrix request failed' });
    }
});

app.post('/api/route/trip', rateLimitRoute, async (req, res) => {
    try {
        const profile = req.body?.profile || 'driving';
        const requestedPoints = (req.body?.coordinates || []).map(normalizeCoordinatePoint);

        if (requestedPoints.length < 3) {
            return res.status(400).json({ success: false, error: 'At least three points are required for smart trip optimization' });
        }

        const cacheKey = JSON.stringify({ type: 'trip', profile, requestedPoints });
        const cached = getRouteCache(cacheKey);
        if (cached) {
            return res.json({ success: true, data: cached, cached: true });
        }

        const coordinates = toOsrmCoordinateString(requestedPoints);
        const url = `${OSRM_BASE_URL}/trip/v1/${profile}/${coordinates}?roundtrip=false&source=first&destination=last&overview=full&geometries=geojson&steps=false`;
        const payload = await fetchJsonWithTimeout(url);
        const normalized = normalizeOsrmTripResponse(payload, requestedPoints);

        setRouteCache(cacheKey, normalized);
        res.json({ success: true, data: normalized });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message || 'Smart trip request failed' });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// STATIC FILES
// ═══════════════════════════════════════════════════════════════════════════

// Serve public folder
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
}));

// Serve root files
app.use(express.static(__dirname, {
    maxAge: 0,
    etag: true,
    extensions: ['html', 'css', 'js', 'json']
}));

// SPA fallback
app.get('*', (req, res) => {
    const publicIndex = path.join(__dirname, 'public', 'index.html');
    const rootIndex = path.join(__dirname, 'index.html');
    res.sendFile(fs.existsSync(publicIndex) ? publicIndex : rootIndex);
});

// ═══════════════════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════════════════

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

// Load data and start server
loadAllData();

const localIP = getLocalIP();
app.listen(PORT, HOST, () => {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ⚡ RED Training Academy - ULTRA FAST Server');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`  📱 Local Network:  http://${localIP}:${PORT}`);
    console.log(`  🖥️  Localhost:      http://localhost:${PORT}`);
    console.log(`  📡 API:            http://localhost:${PORT}/api`);
    console.log(`  💾 Projects in RAM: ${DATA.projects.length}`);
    console.log('\n  All queries served from memory (<1ms response time)');
    console.log('\n═══════════════════════════════════════════════════════════════\n');
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    process.exit(0);
});
