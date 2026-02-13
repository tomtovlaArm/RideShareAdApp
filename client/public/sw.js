const CACHE_NAME = 'uberpod-v3';
const API_CACHE = 'uberpod-api-v2';
const MEDIA_CACHE = 'uberpod-media-v2';

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

  if (url.pathname.startsWith('/api/ads') || url.pathname.startsWith('/api/trivia')) {
    event.respondWith(networkFirstWithCache(event.request, API_CACHE));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    return;
  }

  if (url.pathname.startsWith('/uploads/') ||
      url.pathname.startsWith('/assets/uploads/')) {
    event.respondWith(cacheFirstWithNetwork(event.request, MEDIA_CACHE));
    return;
  }

  if (url.pathname.match(/\.(mp4|webm|mov)$/i)) {
    event.respondWith(cacheFirstWithNetwork(event.request, MEDIA_CACHE));
    return;
  }

  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) && !url.pathname.endsWith('/favicon.png')) {
    event.respondWith(cacheFirstWithNetwork(event.request, MEDIA_CACHE));
    return;
  }

  event.respondWith(networkFirstWithCache(event.request, CACHE_NAME));
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
