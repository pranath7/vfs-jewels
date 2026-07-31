import urllib.request
import json
import time

url = "https://www.vfsjewels.store/api/save-slot-booking"
today_str = time.strftime('%Y-%m-%d')

payload = {
    "name": "Pranath Jain",
    "phone": "6369142027",
    "city": "Chennai",
    "slotFee": 1,
    "paymentId": "PAY_SLOT_6369142027",
    "date": today_str
}

data = json.dumps(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req, timeout=30) as r:
        print("Response:", r.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
