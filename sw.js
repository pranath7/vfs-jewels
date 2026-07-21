const CACHE_NAME = 'vfs-storefront-v46';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/wholesale.html',
  '/wholesale.css',
  '/wholesale.js',
  '/vfs-config.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Bypass caching for Firestore DB sync, CDN APIs, and non-GET writes
  if (
    e.request.method !== 'GET' || 
    e.request.url.includes('googleapis.com') || 
    e.request.url.includes('firebaseio.com') ||
    e.request.url.includes('api.cloudinary.com') ||
    e.request.url.includes('res.cloudinary.com') // Exclude Cloudinary CDN from SW caching
  ) {
    return; // Pass through to network natively
  }

  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      return cached || fetch(e.request).then(res => {
        // Cache new static assets dynamically (only local assets, not Cloudinary)
        if (e.request.url.includes('/assets/')) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, resClone));
        }
        return res;
      });
    })
  );
});
