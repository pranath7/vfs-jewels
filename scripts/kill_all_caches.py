import json, re, time

ts = int(time.time())

# 1. Update vercel.json with strict no-cache headers
vercel_config = {
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0"
        },
        {
          "key": "Pragma",
          "value": "no-cache"
        },
        {
          "key": "Expires",
          "value": "0"
        }
      ]
    }
  ]
}

with open('vercel.json', 'w', encoding='utf-8') as f:
    json.dump(vercel_config, f, indent=2)

print('Updated vercel.json with strict edge no-cache headers')

# 2. Update sw.js to self-destruct and clear all browser caches
sw_content = """// Self-destructing Service Worker to unregister all stale PWA caches
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Pass-through straight to network
  e.respondWith(fetch(e.request));
});
"""

with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(sw_content)

print('Updated sw.js to self-destructing script')

# 3. Add no-cache meta tags and inline wiper at top of <head> in index.html & wholesale.html
no_cache_head = f"""  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <script>
    (function() {{
      if ('serviceWorker' in navigator) {{
        navigator.serviceWorker.getRegistrations().then(function(regs) {{
          for (var r of regs) r.unregister();
        }});
      }}
      if (window.caches) {{
        caches.keys().then(function(keys) {{
          for (var k of keys) caches.delete(k);
        }});
      }}
    }})();
  </script>"""

for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Clean previous meta/script cache injections if any
    content = re.sub(r'  <meta http-equiv="Cache-Control".*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*// Force clear stale PWA.*?</script>', '', content, flags=re.DOTALL)

    # Insert right after <head>
    content = content.replace('<head>', f'<head>\n{no_cache_head}')

    # Update cache-busting timestamp on app.js, style.css, wholesale.js
    content = re.sub(r'style\.css(\?v=[^\"]+)?', f'style.css?t={ts}', content)
    content = re.sub(r'app\.js(\?v=[^\"]+)?', f'app.js?t={ts}', content)
    content = re.sub(r'wholesale\.js(\?v=[^\"]+)?', f'wholesale.js?t={ts}', content)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Updated head & cache busting in', fname)
