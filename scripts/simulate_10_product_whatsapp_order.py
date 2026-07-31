import sys
import urllib.request
import urllib.parse
import json
import random
import subprocess
import os
import time

sys.stdout.reconfigure(encoding='utf-8')

phone = "916369142027"
order_id = f"#J{random.randint(8000, 9999)}"
customer_name = "Pranath Jain"

# Load REAL products from vfs-products.json
script_dir = os.path.dirname(os.path.abspath(__file__))
repo_dir = os.path.dirname(script_dir)
products_file = os.path.join(repo_dir, 'vfs-products.json')

with open(products_file, 'r', encoding='utf-8') as f:
    all_products = json.load(f)

# Randomly pick 10 products
selected = random.sample(all_products, min(10, len(all_products)))

items = []
for p in selected:
    # Use first image in imgs array, or fallback to img field
    img_url = ''
    if 'imgs' in p and p['imgs']:
        img_url = p['imgs'][0]
    elif 'img' in p:
        img_url = p['img']

    items.append({
        'id': p.get('id', 0),
        'name': p.get('name', 'VFS Jewel'),
        'price': p.get('price', 499),
        'sku': p.get('sku', f"ZU1-{p.get('id', 0)}"),
        'img': img_url,
        'qty': random.choice([1, 2])
    })

subtotal = sum(item['price'] * item['qty'] for item in items)
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
    "items": items
}

print(f"=== Simulating 10-Product Order {order_id} (Grand Total: Rs.{total}) ===")
for i, item in enumerate(items, 1):
    print(f"  {i}. {item['name'][:40]} x{item['qty']} @ Rs.{item['price']}")

# Call api/send-order-whatsapp endpoint
print("\nCalling send-order-whatsapp API...")
url = "https://www.vfsjewels.store/api/send-order-whatsapp"
data = json.dumps(order_payload).encode('utf-8')
headers = {'Content-Type': 'application/json'}
req = urllib.request.Request(url, data=data, headers=headers)
try:
    with urllib.request.urlopen(req, timeout=40) as response:
        res_body = response.read().decode('utf-8')
        print("WhatsApp API Response:\n", res_body)
except Exception as e:
    print("WhatsApp API error:", str(e))

# Build preview URLs with full items embedded
items_json = urllib.parse.quote(json.dumps(items))
base = "https://www.vfsjewels.store/api"
invoice_link = f"{base}/invoice?id={urllib.parse.quote(order_id)}&name={urllib.parse.quote(customer_name)}&phone={phone}&total={total}&subtotal={subtotal}&shipping={shipping}&items={items_json}"
photo_slip_link = f"{base}/photo-slip?id={urllib.parse.quote(order_id)}&name={urllib.parse.quote(customer_name)}&phone={phone}&total={total}&subtotal={subtotal}&shipping={shipping}&items={items_json}"

print("\n=== Preview Links ===")
print(f"Invoice:    {invoice_link[:100]}...")
print(f"Photo Slip: {photo_slip_link[:100]}...")

# Download and open Photo Slip PDF locally
print("\nDownloading Photo Slip PDF for local preview...")
try:
    with urllib.request.urlopen(photo_slip_link, timeout=40) as r:
        pdf_data = r.read()
    clean_id = order_id.replace('#', '')
    out_path = f"C:/Users/91636/.gemini/antigravity-ide/brain/9438da06-7f01-4306-893b-97bede64edec/photo_slip_FINAL_{clean_id}.pdf"
    with open(out_path, 'wb') as f:
        f.write(pdf_data)
    print(f"Saved {len(pdf_data):,} bytes -> {out_path}")
    subprocess.Popen(['cmd', '/c', 'start', '', out_path])
    print("Opened PDF in default viewer!")
except Exception as e:
    print("PDF download/open error:", str(e))
