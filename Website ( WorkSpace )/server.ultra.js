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
    projects: [],
    projectsById: new Map(),
    projectsByZone: new Map(),
    mapProjects: [],
    filters: null,
    searchIndex: []
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
                    zoneNormalized: normalizeZone(p.zone || zone),
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
    
    // Build indexes
    console.log('🔨 Building indexes...');
    
    // By ID
    for (const p of allProjects) {
        DATA.projectsById.set(p.id, p);
        DATA.projectsById.set(p.name.toLowerCase(), p);
    }
    
    // By Zone
    for (const p of allProjects) {
        const zone = p.zoneNormalized;
        if (!DATA.projectsByZone.has(zone)) {
            DATA.projectsByZone.set(zone, []);
        }
        DATA.projectsByZone.get(zone).push(p);
    }
    
    // Map projects (only with coordinates)
    DATA.mapProjects = allProjects.filter(p => p.lat && p.lng).map(p => ({
        id: p.id,
        name: p.name,
        dev: p.dev,
        lat: p.lat,
        lng: p.lng,
        zone: p.zone,
        zoneNormalized: p.zoneNormalized,
        status: p.status,
        type: p.type,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        downPayment: p.downPayment,
        installmentYears: p.installmentYears
    }));
    
    // Pre-compute filters
    DATA.filters = computeFilters(allProjects);
    
    // Search index
    DATA.searchIndex = allProjects.map(p => ({
        id: p.id,
        name: p.name,
        dev: p.dev,
        zone: p.zone,
        text: p._searchText
    }));

    const elapsed = Date.now() - startTime;
    console.log(`\n✅ Loaded ${allProjects.length} projects in ${elapsed}ms`);
    console.log(`   📊 Map markers: ${DATA.mapProjects.length}`);
    console.log(`   🗺️ Zones: ${DATA.projectsByZone.size}`);
}

function normalizeZone(zone) {
    if (!zone) return 'other';
    const z = zone.toLowerCase();
    if (z.includes('north') || z.includes('sahel') || z.includes('alamein')) return 'north_coast';
    if (z.includes('sokhna') || z.includes('galala')) return 'sokhna';
    if (z.includes('gouna')) return 'gouna';
    if (z.includes('cairo') || z.includes('capital') || z.includes('october') || z.includes('zayed')) return 'cairo';
    return 'other';
}

function computeFilters(projects) {
    const zones = {};
    const developers = {};
    const unitTypes = {};
    const statuses = { delivered: 0, construction: 0 };
    let priceMin = Infinity, priceMax = 0;
    let areaMin = Infinity, areaMax = 0;

    for (const p of projects) {
        // Zones
        const zone = p.zoneNormalized;
        zones[zone] = (zones[zone] || 0) + 1;

        // Developers
        if (p.dev) {
            developers[p.dev] = (developers[p.dev] || 0) + 1;
        }

        // Unit types
        for (const ut of p.unitTypes) {
            if (ut) unitTypes[ut] = (unitTypes[ut] || 0) + 1;
        }

        // Status
        const status = (p.status || '').toLowerCase();
        if (status.includes('delivered') || status.includes('ready')) {
            statuses.delivered++;
        } else {
            statuses.construction++;
        }

        // Price range
        if (p.priceMin && p.priceMin < priceMin) priceMin = p.priceMin;
        if (p.priceMax && p.priceMax > priceMax) priceMax = p.priceMax;

        // Area range
        if (p.areaMin && p.areaMin < areaMin) areaMin = p.areaMin;
        if (p.areaMax && p.areaMax > areaMax) areaMax = p.areaMax;
    }

    return {
        zones: Object.entries(zones).map(([value, count]) => ({ value, label: value.replace('_', ' '), count })).sort((a, b) => b.count - a.count),
        developers: Object.entries(developers).map(([value, count]) => ({ value, label: value, count })).sort((a, b) => b.count - a.count).slice(0, 50),
        unitTypes: Object.entries(unitTypes).map(([value, count]) => ({ value, label: value, count })).sort((a, b) => b.count - a.count),
        statuses: [
            { value: 'delivered', label: 'Delivered', count: statuses.delivered },
            { value: 'construction', label: 'Under Construction', count: statuses.construction }
        ],
        priceRange: { min: priceMin === Infinity ? 0 : priceMin, max: priceMax },
        areaRange: { min: areaMin === Infinity ? 0 : areaMin, max: areaMax }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// ULTRA-FAST QUERY ENGINE
// ═══════════════════════════════════════════════════════════════════════════

function queryProjects(options = {}) {
    const {
        q,
        zone,
        status,
        type,
        unitType,
        priceMin,
        priceMax,
        developer,
        sort = 'name-asc',
        page = 1,
        pageSize = 20
    } = options;

    let results = DATA.projects;

    // Zone filter (use pre-indexed data if only zone filter)
    if (zone && zone !== 'all' && !q && !status && !type && !developer) {
        results = DATA.projectsByZone.get(zone) || [];
    } else {
        // Apply filters
        if (zone && zone !== 'all') {
            results = results.filter(p => p.zoneNormalized === zone);
        }
        
        if (status) {
            const isDelivered = status === 'delivered';
            results = results.filter(p => {
                const s = (p.status || '').toLowerCase();
                return isDelivered 
                    ? (s.includes('delivered') || s.includes('ready'))
                    : s.includes('construction');
            });
        }
        
        if (type) {
            results = results.filter(p => p.type === type);
        }
        
        if (unitType) {
            const ut = unitType.toLowerCase();
            results = results.filter(p => p.unitTypes.some(t => t.toLowerCase().includes(ut)));
        }
        
        if (priceMin != null) {
            results = results.filter(p => !p.priceMax || p.priceMax >= priceMin);
        }
        
        if (priceMax != null) {
            results = results.filter(p => !p.priceMin || p.priceMin <= priceMax);
        }
        
        if (developer) {
            const dev = developer.toLowerCase();
            results = results.filter(p => p.dev && p.dev.toLowerCase().includes(dev));
        }
        
        // Text search
        if (q && q.length >= 2) {
            const terms = q.toLowerCase().split(/\s+/);
            results = results.filter(p => 
                terms.every(term => p._searchText.includes(term))
            );
        }
    }

    // Sort
    const sortFn = getSortFunction(sort);
    if (sortFn) {
        results = [...results].sort(sortFn);
    }

    // Paginate
    const total = results.length;
    const limit = Math.min(parseInt(pageSize) || 20, 100);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;
    const paged = results.slice(offset, offset + limit);

    return {
        projects: paged,
        pagination: {
            page: Math.max(parseInt(page) || 1, 1),
            pageSize: limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

function getSortFunction(sort) {
    const sorts = {
        'name-asc': (a, b) => a.name.localeCompare(b.name),
        'name-desc': (a, b) => b.name.localeCompare(a.name),
        'price-asc': (a, b) => (a.priceMin || Infinity) - (b.priceMin || Infinity),
        'price-desc': (a, b) => (b.priceMax || 0) - (a.priceMax || 0),
        'area-asc': (a, b) => (a.areaMin || Infinity) - (b.areaMin || Infinity),
        'area-desc': (a, b) => (b.areaMax || 0) - (a.areaMax || 0)
    };
    return sorts[sort];
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
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
                scriptSrcAttr: ["'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "blob:", "https://*.basemaps.cartocdn.com", "https://server.arcgisonline.com", "https://*.tile.openstreetmap.org"],
                connectSrc: ["'self'", "https://overpass-api.de", "https://*.basemaps.cartocdn.com", "https://server.arcgisonline.com", "https://router.project-osrm.org", "http://localhost:11434"],
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
// API ROUTES - All served from memory
// ═══════════════════════════════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        projects: DATA.projects.length,
        uptime: process.uptime()
    });
});

// Get map projects (MUST be before /api/projects/:id)
app.get('/api/projects/map', (req, res) => {
    let results = DATA.mapProjects;
    
    // Optional zone filter
    if (req.query.zone && req.query.zone !== 'all') {
        results = results.filter(p => p.zoneNormalized === req.query.zone);
    }
    
    res.json({ success: true, data: results });
});

// Get projects with filters
app.get('/api/projects', (req, res) => {
    try {
        const result = queryProjects(req.query);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get single project (MUST be after /api/projects/map)
app.get('/api/projects/:id', (req, res) => {
    const id = req.params.id;
    const project = DATA.projectsById.get(parseInt(id)) || DATA.projectsById.get(id.toLowerCase());
    
    if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    res.json({ success: true, data: project });
});

// Get filters
app.get('/api/filters', (req, res) => {
    res.json({ success: true, data: DATA.filters });
});

// Search suggestions
app.get('/api/search/suggest', (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    if (q.length < 2) {
        return res.json({ success: true, data: [] });
    }
    
    const results = DATA.searchIndex
        .filter(p => p.text.includes(q))
        .slice(0, 10)
        .map(p => ({ name: p.name, dev: p.dev, zone: p.zone }));
    
    res.json({ success: true, data: results });
});

// Natural language search
app.post('/api/search', (req, res) => {
    const result = queryProjects(req.body);
    res.json({ success: true, ...result });
});

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
    console.log(`  🗺️ Map Markers:     ${DATA.mapProjects.length}`);
    console.log('\n  All queries served from memory (<1ms response time)');
    console.log('\n═══════════════════════════════════════════════════════════════\n');
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    process.exit(0);
});
