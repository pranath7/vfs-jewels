import urllib.request
import json
import fitz # PyMuPDF
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load 10 products from vfs-products.json
with open('vfs-products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

items = catalog[:10]

print(f"Loaded {len(items)} products for Photo Slip PDF test.")

def fetch_jpeg_bytes(url):
    # Transform Cloudinary URL or fallback to standard JPEG
    if not url or not isinstance(url, str) or not url.startswith('http'):
        url = "https://res.cloudinary.com/cwx4zame/image/upload/f_jpg,w_150,h_150,c_fill/v1783178917/whbmflasdurxiag7au7t.jpg"
    else:
        if 'cloudinary.com' in url and '/upload/' in url:
            parts = url.split('/upload/')
            url = parts[0] + '/upload/f_jpg,w_150,h_150,c_fill/' + parts[1]
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.read()
    except Exception as e:
        print(f"Warning: Failed to fetch image {url}: {e}")
        # Fetch fallback
        fallback = "https://res.cloudinary.com/cwx4zame/image/upload/f_jpg,w_150,h_150,c_fill/v1783178917/whbmflasdurxiag7au7t.jpg"
        req = urllib.request.Request(fallback, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            return resp.read()

# Test fetching image bytes
img_bytes = fetch_jpeg_bytes(items[0].get('img'))
print(f"Fetched test image bytes: {len(img_bytes)} bytes")
