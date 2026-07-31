import urllib.request, re
r = urllib.request.urlopen('https://www.vfsjewels.store/')
html = r.read().decode('utf-8', errors='ignore')
imgs = re.findall(r'https://res\.cloudinary\.com/cwx4zame/image/upload/[^\s"\']+\.jpg', html)
seen = set()
unique = [x for x in imgs if x not in seen and not seen.add(x)]
print('Found', len(unique), 'unique Cloudinary images:')
for u in unique[:15]:
    print(' ', u)
