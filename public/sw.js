// Service Worker to prevent caching issues
const CACHE_NAME = 'neuronerds-v' + Date.now();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
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
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Don't cache, always fetch from network
  event.respondWith(
    fetch(event.request).catch(() => {
      // Fallback for offline
      return new Response('Offline', { status: 503 });
    })
  );
});