import re

# 1. Update sw.js to Network-First strategy & bump CACHE_NAME to v999
sw_content = """const CACHE_NAME = 'vfs-storefront-v999';

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
"""

with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(sw_content)

print('Updated sw.js to Network-First cache clearing')

# 2. Add automatic cache clearing script in index.html & wholesale.html
cache_clear_script = """<script>
    // Force clear stale PWA ServiceWorker caches on load
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(r => r.unregister());
      });
      if (window.caches) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }
    }
  </script>"""

for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'Force clear stale PWA ServiceWorker' not in content:
        content = content.replace('</head>', f'{cache_clear_script}\n</head>')

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Added cache clearing script to', fname)
