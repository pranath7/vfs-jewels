const CACHE_NAME = 'vfs-storefront-v999';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  
  // Network First Strategy: Always fetch fresh content from Vercel server
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        return networkResponse;
      })
      .catch(() => caches.match(e.request))
  );
});
