import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://www.vfsjewels.store/api/photo-slip?id=J9779"
print("Testing live Photo Slip PDF URL:", url)

try:
    with urllib.request.urlopen(url) as resp:
        content = resp.read()
        print(f"✅ Photo Slip PDF Size: {len(content)} bytes")
        with open("live_photoslip_j9779.pdf", "wb") as f:
            f.write(content)
except Exception as e:
    print("❌ Error:", e)
