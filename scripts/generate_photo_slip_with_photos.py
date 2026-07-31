import fitz # PyMuPDF
import json
import urllib.request
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load 10 real products from vfs-products.json
with open('vfs-products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

items = catalog[:10]

doc = fitz.open()
page = doc.new_page(width=595, height=842) # A4 Size

# Colors
GOLD = (0.83, 0.68, 0.21)
DARK = (0.1, 0.1, 0.1)
GRAY = (0.4, 0.4, 0.4)
LIGHT_BG = (0.96, 0.96, 0.96)
LINE_COLOR = (0.88, 0.88, 0.88)

# 1. Gold Top Bar Accent
page.draw_rect(fitz.Rect(0, 0, 595, 10), color=GOLD, fill=GOLD)

# 2. Header
page.insert_text((50, 45), "VFS JEWELS", fontsize=24, color=DARK)
page.insert_text((195, 45), ".", fontsize=24, color=GOLD)
page.insert_text((50, 60), "OFFICIAL FULFILLMENT PHOTO SLIP & ITEM MANIFEST", fontsize=8.5, color=GRAY)

# Badge Right
page.draw_rect(fitz.Rect(350, 25, 545, 55), color=(0.15, 0.5, 0.15), fill=(0.94, 0.96, 0.94))
page.insert_text((365, 45), "DISPATCH PHOTO SLIP", fontsize=13, color=(0.15, 0.5, 0.15))

page.insert_text((365, 70), "Slip ID: PS-J9099", fontsize=8.5, color=DARK)
page.insert_text((365, 82), "Order ID: #J9099", fontsize=9, color=DARK)
page.insert_text((365, 94), "Date: 29/07/2026", fontsize=8.5, color=DARK)
page.insert_text((365, 106), "Carrier: DTDC Express Air", fontsize=8.5, color=GOLD)

page.draw_line((50, 115), (545, 115), color=GOLD, width=1.5)

# 3. Customer Ship To
page.insert_text((50, 135), "SHIP TO CUSTOMER:", fontsize=8.5, color=GRAY)
page.insert_text((50, 148), "Pranath Jain", fontsize=10, color=DARK)
page.insert_text((50, 160), "Address: B BLOCK 5E, CHENNAI - 600112", fontsize=8.5, color=DARK)
page.insert_text((50, 172), "Phone: +91 6369142027 | Status: CONFIRMED & PAID", fontsize=8.5, color=(0.15, 0.5, 0.15))

page.draw_line((50, 182), (545, 182), color=LINE_COLOR, width=1)

# 4. Table Header
y = 195
page.draw_rect(fitz.Rect(50, y, 545, y + 20), color=LINE_COLOR, fill=(0.94, 0.94, 0.94))
page.insert_text((58, y + 14), "#", fontsize=8.5, color=DARK)
page.insert_text((75, y + 14), "PRODUCT PHOTO", fontsize=8.5, color=DARK)
page.insert_text((180, y + 14), "SKU CODE & ITEM SPECIFICATION", fontsize=8.5, color=DARK)
page.insert_text((410, y + 14), "QTY", fontsize=8.5, color=DARK)
page.insert_text((455, y + 14), "PRICE", fontsize=8.5, color=DARK)
page.insert_text((505, y + 14), "TOTAL", fontsize=8.5, color=DARK)

y += 26

def fetch_image_bytes(url):
    if not url or not isinstance(url, str) or not url.startswith('http'):
        url = "https://res.cloudinary.com/cwx4zame/image/upload/f_jpg,w_150,h_150,c_fill/v1783178917/whbmflasdurxiag7au7t.jpg"
    elif 'cloudinary.com' in url and '/upload/' in url:
        parts = url.split('/upload/')
        url = parts[0] + '/upload/f_jpg,w_150,h_150,c_fill/' + parts[1]
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.read()
    except Exception as e:
        fallback = "https://res.cloudinary.com/cwx4zame/image/upload/f_jpg,w_150,h_150,c_fill/v1783178917/whbmflasdurxiag7au7t.jpg"
        req = urllib.request.Request(fallback, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            return resp.read()

subtotal = 0

for idx, item in enumerate(items, 1):
    if y > 750:
        break
    
    sku = item.get('sku') or f"ZU1-{item.get('id', idx)}"
    name = item.get('name') or "Anti-Tarnish Jewellery"
    price = int(item.get('price', 499))
    qty = 1
    total_price = price * qty
    subtotal += total_price
    
    # Draw Index
    page.insert_text((58, y + 25), str(idx), fontsize=9, color=DARK)
    
    # Fetch & Insert Product Photo Thumbnail (45x45px box)
    img_url = item.get('img')
    if not img_url and item.get('imgs') and len(item.get('imgs')) > 0:
        img_url = item.get('imgs')[0]
    
    img_bytes = fetch_image_bytes(img_url)
    
    # Product Thumbnail Box
    img_rect = fitz.Rect(80, y + 2, 130, y + 52)
    page.draw_rect(img_rect, color=GOLD, width=0.5)
    page.insert_image(img_rect, stream=img_bytes)
    
    # SKU & Name
    page.insert_text((180, y + 18), f"SKU: {sku}", fontsize=9, color=GOLD)
    page.insert_text((180, y + 32), name[:35], fontsize=8.5, color=DARK)
    page.insert_text((180, y + 44), "Anti-Tarnish Premium Jewellery", fontsize=7.5, color=GRAY)
    
    # Qty, Price, Total
    page.insert_text((415, y + 28), str(qty), fontsize=9, color=DARK)
    page.insert_text((450, y + 28), f"Rs. {price:,}", fontsize=8.5, color=DARK)
    page.insert_text((505, y + 28), f"Rs. {total_price:,}", fontsize=9, color=DARK)
    
    y += 56
    page.draw_line((50, y - 4), (545, y - 4), color=LINE_COLOR, width=0.5)

# Summary & Seal
shipping = 90
grand_total = subtotal + shipping

page.draw_rect(fitz.Rect(50, 770, 260, 825), color=GOLD, fill=(0.97, 0.96, 0.92), width=0.5)
page.insert_text((60, 785), "PACKING & QUALITY CHECKLIST:", fontsize=8, color=GOLD)
page.insert_text((60, 798), "[OK] Items Count Checked   [OK] Bubble Wrap Protected", fontsize=7.5, color=DARK)
page.insert_text((60, 810), "[OK] GST Invoice Attached  [OK] Sealed Box Container", fontsize=7.5, color=DARK)

page.insert_text((350, 782), f"Total Items: {len(items)} SKUs", fontsize=8.5, color=DARK)
page.insert_text((350, 796), f"Subtotal: Rs. {subtotal:,}", fontsize=8.5, color=DARK)
page.insert_text((350, 810), f"Shipping: Rs. {shipping}", fontsize=8.5, color=DARK)

page.draw_line((350, 815), (545, 815), color=GOLD, width=1)
page.insert_text((350, 830), "GRAND TOTAL:", fontsize=9.5, color=DARK)
page.insert_text((460, 830), f"Rs. {grand_total:,}", fontsize=11, color=GOLD)

doc.save("photo_slip_with_real_photos.pdf")
print("Saved photo_slip_with_real_photos.pdf")

# Convert page 1 to PNG
page_pix = doc[0].get_pixmap(dpi=150)
page_pix.save("photo_slip_with_real_photos_page1.png")
print("Rendered photo_slip_with_real_photos_page1.png")
