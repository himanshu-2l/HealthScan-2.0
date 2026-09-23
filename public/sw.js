// HealthScan Clinical PWA Service Worker
const CACHE_NAME = 'healthscan-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-icon.svg',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/models/hand_landmarker.task',
  '/models/mediapipe/wasm/vision_wasm_internal.js',
  '/models/mediapipe/wasm/vision_wasm_internal.wasm',
  '/models/mediapipe/wasm/vision_wasm_nosimd_internal.js',
  '/models/mediapipe/wasm/vision_wasm_nosimd_internal.wasm'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Cache prefill error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  // Strictly ignore unsupported schemes (e.g. chrome-extension://, moz-extension://, blob:, data:)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Only intercept same-origin assets. External CDNs, Google Fonts, and APIs are fetched directly by the browser.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Don't intercept API or authentication calls
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth')
  ) {
    return;
  }

  // Network-first with cache fallback for fresh updates
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;

        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          const indexFallback = await caches.match('/index.html') || await caches.match('/');
          if (indexFallback) return indexFallback;
        }

        return new Response('Resource offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});
