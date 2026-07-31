import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

invoice_url = "https://www.vfsjewels.store/api/invoice?id=J9099"
photo_slip_url = "https://www.vfsjewels.store/api/photo-slip?id=J9099"

print("🔍 Testing Live Tax Invoice PDF URL:", invoice_url)
try:
    with urllib.request.urlopen(invoice_url) as resp:
        content = resp.read()
        print(f"✅ Invoice PDF size: {len(content)} bytes (Header: {content[:10]})")
        with open("live_invoice_j9099.pdf", "wb") as f:
            f.write(content)
except Exception as e:
    print("❌ Invoice PDF fetch error:", e)

print("\n🔍 Testing Live Photo Slip PDF URL:", photo_slip_url)
try:
    with urllib.request.urlopen(photo_slip_url) as resp:
        content = resp.read()
        print(f"✅ Photo Slip PDF size: {len(content)} bytes (Header: {content[:10]})")
        with open("live_photoslip_j9099.pdf", "wb") as f:
            f.write(content)
except Exception as e:
    print("❌ Photo Slip PDF fetch error:", e)
