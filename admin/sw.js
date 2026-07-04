const CACHE = 'vfs-admin-v3';
const ASSETS = [
  '/admin/admin.html',
  '/admin/admin.css',
  '/admin/admin.js',
  '/admin/manifest.json'
];

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE) return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first strategy for admin panel so updates apply immediately
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const resClone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('/admin/admin.html')))
  );
});
