const CACHE_NAME = 'healthcare-dss-v3-clinical';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app-new.js',
  '/voice-handler.js',
  '/i18n/en.json',
  '/i18n/hi.json',
  '/i18n/mr.json',
  'https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;500;600;700;800;900&display=swap'
];

// Clean up old caches on activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
});

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => {
      console.log('[SW] Pre-caching critical assets');
      return c.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests for caching
  if (e.request.method !== 'GET') return;

  // Strategy: Stale-While-Revalidate
  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        const fetchedResponse = fetch(e.request).then((networkResponse) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });

        return cachedResponse || fetchedResponse;
      });
    })
  );
});
