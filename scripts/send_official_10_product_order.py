import sys
import os
import json
import random
import urllib.request
import urllib.parse

sys.stdout.reconfigure(encoding='utf-8')

# 1. Load actual products from official vfs-products.json catalog
products_file = 'vfs-products.json'
if not os.path.exists(products_file):
    print("❌ vfs-products.json not found!")
    sys.exit(1)

with open(products_file, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print(f"📦 Total Products in Official Website Catalog (vfs-products.json): {len(catalog)}")

# Filter valid products with name, price, and image/sku
valid_products = [p for p in catalog if p.get('name') and p.get('price')]

if len(valid_products) < 10:
    selected = valid_products
else:
    selected = random.sample(valid_products, 10)

order_id = f"#J{random.randint(9000, 9999)}"
phone = "916369142027"
customer_name = "Pranath Jain"
address = "B BLOCK 5E, CHENNAI - 600112"

order_items = []
for p in selected:
    qty = random.choice([1, 2])
    # Extract clean image url
    img_url = p.get('img')
    if not img_url and p.get('imgs') and len(p.get('imgs')) > 0:
        img_url = p.get('imgs')[0]
    
    order_items.append({
        "id": p.get('id'),
        "name": p.get('name'),
        "price": int(p.get('price', 499)),
        "qty": qty,
        "sku": p.get('sku') or f"ZU1-{p.get('id')}",
        "img": img_url or "https://res.cloudinary.com/cwx4zame/image/upload/v1783178917/whbmflasdurxiag7au7t.jpg"
    })

subtotal = sum(i['price'] * i['qty'] for i in order_items)
gst_amount = round(subtotal * 0.03)
shipping = 90
total = subtotal + gst_amount + shipping

order_payload = {
    "id": order_id,
    "name": customer_name,
    "phone": phone,
    "address": "B BLOCK 5E",
    "city": "CHENNAI",
    "pincode": "600112",
    "date": "29/07/2026",
    "carrier": "DTDC Express Air",
    "status": "CONFIRMED",
    "subtotal": subtotal,
    "gstAmount": gst_amount,
    "shipping": shipping,
    "total": total,
    "items": order_items
}

print(f"\n🛒 Selected 10 Products from Website Catalog for Order {order_id}:")
for idx, item in enumerate(order_items, 1):
    print(f"  {idx}. [{item['sku']}] {item['name']} × {item['qty']} @ ₹{item['price']} (Image: {item['img'][:45]}...)")

print(f"\n💰 Subtotal: ₹{subtotal} | GST 3%: ₹{gst_amount} | Shipping: ₹90 | Grand Total: ₹{total}")

# 2. Dispatch via Meta WhatsApp API serverless endpoint
url = "https://www.vfsjewels.store/api/send-order-whatsapp"
data = json.dumps(order_payload).encode('utf-8')
headers = {'Content-Type': 'application/json'}

req = urllib.request.Request(url, data=data, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        res_body = response.read().decode('utf-8')
        print("\n✅ WhatsApp API Server Response:\n", res_body)
except Exception as e:
    print("\n❌ WhatsApp API Error:", str(e))

# 3. Direct PDF inspection URLs
clean_id = order_id.replace('#', '')
invoice_link = f"https://www.vfsjewels.store/api/invoice?id={urllib.parse.quote(order_id)}&name={urllib.parse.quote(customer_name)}&phone={phone}&total={total}&subtotal={subtotal}&shipping={shipping}"
photo_slip_link = f"https://www.vfsjewels.store/api/photo-slip?id={urllib.parse.quote(order_id)}&name={urllib.parse.quote(customer_name)}&phone={phone}&total={total}&subtotal={subtotal}&shipping={shipping}"

print("\n--- Direct Links for PDF Inspection ---")
print(f"📄 Tax Invoice PDF: {invoice_link}")
print(f"🖼️ Photo Slip PDF:  {photo_slip_link}")
