// Cashier PWA Service Worker per DOC-001 1.3 Offline-First
const CACHE_NAME = 'zayjar-cashier-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  console.log('Cashier PWA SW installing, caching core scripts and styles');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Cashier PWA SW activated, tenant isolated cache');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Cache-first for static assets, network-first for API
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/api/')) {
    // Network-first for API calls with offline fallback
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache successful API responses
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-orders') {
    console.log('Background sync triggered for offline orders');
    // In real implementation, would sync IndexedDB orders
    event.waitUntil(Promise.resolve());
  }
});
