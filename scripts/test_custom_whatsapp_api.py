import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://www.vfsjewels.store/api/send-custom-whatsapp"

invoice_url = "https://www.vfsjewels.store/api/invoice?id=%23J7002&name=Pranath%20Jain&phone=916369142027&total=91&subtotal=1&shipping=90&address=B%20BLOCK%205E"

message_text = f"""💎 VFS JEWELS — OFFICIAL TAX INVOICE & ORDER CONFIRMATION 💎
━━━━━━━━━━━━━━━━━━━━━━━
Hello Pranath Jain! 🎉

Your order #J7002 has been confirmed!

🧾 Invoice ID: INV-J7002
📦 Items: Demo Test Product x 1
💰 Subtotal: ₹1
🚚 Shipping Fee: ₹90
✅ Grand Total: ₹91

📄 Download / View Official PDF Tax Invoice:
{invoice_url}

📍 Ship To: B BLOCK 5E, CHENNAI - 600112
🏢 Official GSTIN: 33AAFVC8491A1ZX

━━━━━━━━━━━━━━━━━━━━━━━
Thank you for shopping with VFS Jewels Sowcarpet! 🌸"""

payload = {
    "phone": "916369142027",
    "message": message_text,
    "recipientName": "Pranath Jain",
    "orderId": "#J7002"
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as res:
        out = res.read().decode('utf-8')
        print("API Response:", out)
except Exception as e:
    print("API Error:", str(e))
