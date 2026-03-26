// RED Training Academy - Ultimate Performance Service Worker
// Version 2.0 - Aggressive Caching for Maximum Speed

const CACHE_VERSION = 'red-v6';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const CDN_CACHE = `${CACHE_VERSION}-cdn`;

// Mutable shell assets should prefer fresh network responses.
const MUTABLE_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/search.worker.js',
  '/data.json'
];

// Core shell cached for offline fallback.
const STATIC_ASSETS = [
  '/',
  '/index.html'
];

// CDN resources - Cache on first use
const CDN_PATTERNS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'cdn.jsdelivr.net'
];

// Map tile patterns - Cache aggressively
const TILE_PATTERNS = [
  'basemaps.cartocdn.com',
  'arcgisonline.com',
  'tile.openstreetmap.org'
];

// Install - Pre-cache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - Clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys
          .filter(key => key.startsWith('red-') && !key.startsWith(CACHE_VERSION))
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch - Smart caching strategies
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Strategy 1: Network-First for mutable shell assets so live edits are visible.
  if (MUTABLE_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset.slice(1)))) {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
    return;
  }
  
  // Strategy 2: Stale-While-Revalidate for CDN resources
  if (CDN_PATTERNS.some(pattern => url.hostname.includes(pattern))) {
    event.respondWith(staleWhileRevalidate(event.request, CDN_CACHE));
    return;
  }
  
  // Strategy 3: Cache-First for map tiles (with long TTL)
  if (TILE_PATTERNS.some(pattern => url.hostname.includes(pattern))) {
    event.respondWith(cacheFirst(event.request, DATA_CACHE, 7 * 24 * 60 * 60 * 1000)); // 7 days
    return;
  }
  
  // Strategy 4: Network-First for JSON data (fresh data preferred)
  if (url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(event.request, DATA_CACHE));
    return;
  }
  
  // Default: Network with cache fallback
  event.respondWith(networkWithCacheFallback(event.request));
});

// Cache-First Strategy (fastest for static)
async function cacheFirst(request, cacheName, maxAge = null) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Optional: Check if cache is too old
    if (maxAge) {
      const dateHeader = cached.headers.get('date');
      if (dateHeader) {
        const age = Date.now() - new Date(dateHeader).getTime();
        if (age > maxAge) {
          // Cache too old, fetch new
          return fetchAndCache(request, cache);
        }
      }
    }
    return cached;
  }
  
  return fetchAndCache(request, cache);
}

// Stale-While-Revalidate (fast + fresh)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  // Return cached immediately if available
  return cached || fetchPromise;
}

// Network-First (fresh data)
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Network with Cache Fallback
async function networkWithCacheFallback(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline page for navigation
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    throw error;
  }
}

// Helper: Fetch and cache
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// Listen for skip waiting message
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
