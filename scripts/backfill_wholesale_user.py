import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Backfill the user who already paid
payload = {
    "name": "Pranath Jain",
    "businessName": "VFS Jewels",
    "phone": "6369142027",  # will be prefixed to 91
    "address": "B BLOCK 5E, CHENNAI - 600112",
    "email": "",
    "paymentStatus": "paid",
    "razorpayPaymentId": "Existing_Payment"
}

url = "https://www.vfsjewels.store/api/send-wholesale-welcome"
data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print("Response:", r.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
