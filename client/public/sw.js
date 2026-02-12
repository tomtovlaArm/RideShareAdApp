const CACHE_NAME = 'uberpod-v1';
const API_CACHE = 'uberpod-api-v1';
const MEDIA_CACHE = 'uberpod-media-v1';

const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== API_CACHE && key !== MEDIA_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  if (url.pathname === '/api/ads') {
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
    return;
  }

  if (url.pathname === '/api/trivia') {
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
    return;
  }

  if (url.pathname.startsWith('/uploads/') ||
      url.pathname.startsWith('/assets/uploads/') ||
      isMediaUrl(url)) {
    event.respondWith(cacheFirstWithNetwork(event.request, MEDIA_CACHE));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(cacheFirstWithNetwork(event.request, CACHE_NAME));
});

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

function isMediaUrl(url) {
  const ext = url.pathname.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm'].includes(ext || '');
}
