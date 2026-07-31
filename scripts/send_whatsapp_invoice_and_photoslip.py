import sys
import urllib.request
import urllib.parse
import json

sys.stdout.reconfigure(encoding='utf-8')

phone = "916369142027"
order_id = "#J7002"
customer_name = "Pranath Jain"
address = "B BLOCK 5E, CHENNAI - 600112"

order_payload = {
    "id": order_id,
    "name": customer_name,
    "phone": phone,
    "address": "B BLOCK 5E",
    "city": "CHENNAI",
    "pincode": "600112",
    "date": "28/07/2026",
    "carrier": "DTDC Express",
    "status": "CONFIRMED",
    "subtotal": 1,
    "gstAmount": 0.03,
    "shipping": 90,
    "total": 91,
    "items": [
        {
            "id": 7002,
            "name": "Demo Test Product (Anti-Tarnish Jewellery)",
            "qty": 1,
            "price": 1,
            "sku": "ZU1-7002"
        }
    ]
}

# 1. Call api/send-order-whatsapp endpoint
url = "https://www.vfsjewels.store/api/send-order-whatsapp"
data = json.dumps(order_payload).encode('utf-8')
headers = {'Content-Type': 'application/json'}

req = urllib.request.Request(url, data=data, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        res_body = response.read().decode('utf-8')
        print("Serverless API Response:", res_body)
except Exception as e:
    print("API Call Note:", str(e))

# 2. Build Direct WhatsApp Web links for immediate client-side click-to-open
invoice_pdf_link = f"https://www.vfsjewels.store/api/invoice?id={urllib.parse.quote(order_id)}&name={urllib.parse.quote(customer_name)}&phone={phone}&total=91&subtotal=1&shipping=90&address={urllib.parse.quote(address)}"

wa_text = f"""💎 VFS JEWELS — OFFICIAL TAX INVOICE & ORDER CONFIRMATION 💎
━━━━━━━━━━━━━━━━━━━━━━━
Hello *{customer_name}*! 🎉

Your order *{order_id}* has been confirmed!

🧾 Invoice ID: INV-J7002
📦 Items: Demo Test Product (Anti-Tarnish Jewellery) x 1
💰 Subtotal: ₹1
🚚 Shipping Fee: ₹90
✅ Grand Total: ₹91

📄 Download / View Official PDF Tax Invoice:
{invoice_pdf_link}

📍 Ship To: {address}
🏢 Official GSTIN: 33AAFVC8491A1ZX

━━━━━━━━━━━━━━━━━━━━━━━
Thank you for shopping with VFS Jewels Sowcarpet! 🌸
Web: https://vfsjewels.store"""

wa_web_link = f"https://api.whatsapp.com/send?phone={phone}&text={urllib.parse.quote(wa_text)}"

print("\nDirect WhatsApp Link for Order Confirmation & PDF Invoice:")
print(wa_web_link)
