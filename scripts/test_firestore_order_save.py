import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_ID = 'vfs-jewellery'
order_id = "J9099"

order_data = {
    "id": f"#{order_id}",
    "name": "Pranath Jain",
    "phone": "916369142027",
    "total": 7800,
    "subtotal": 7485,
    "gstAmount": 225,
    "shipping": 90,
    "items": [
        { "sku": "SN-K107", "name": "VFS Designer Kada #107", "qty": 1, "price": 499 },
        { "sku": "SN-K572", "name": "VFS Designer Kada #143", "qty": 2, "price": 499 },
        { "sku": "SN-K559", "name": "VFS Designer Kada #130", "qty": 1, "price": 499 },
        { "sku": "SN-BR625", "name": "VFS Designer Gold Plated Bracelet #31", "qty": 2, "price": 499 },
        { "sku": "SN-K058", "name": "VFS Designer Kada #58", "qty": 2, "price": 499 },
        { "sku": "SN-K096", "name": "VFS Designer Kada #96", "qty": 1, "price": 499 },
        { "sku": "SN-K108", "name": "VFS Designer Kada #108", "qty": 2, "price": 499 },
        { "sku": "SN-K557", "name": "VFS Designer Kada #128", "qty": 1, "price": 499 },
        { "sku": "SN-BR597", "name": "VFS Designer Gold Plated Bracelet #03", "qty": 2, "price": 499 },
        { "sku": "SN-K118", "name": "VFS Designer Kada #118", "qty": 1, "price": 499 }
    ]
}

fields = {}
for k, v in order_data.items():
    if isinstance(v, (int, float)):
        fields[k] = { "doubleValue": float(v) }
    elif isinstance(v, str):
        fields[k] = { "stringValue": v }
    elif isinstance(v, list):
        array_vals = []
        for item in v:
            item_map = {}
            for ik, iv in item.items():
                if isinstance(iv, (int, float)):
                    item_map[ik] = { "doubleValue": float(iv) }
                else:
                    item_map[ik] = { "stringValue": str(iv) }
            array_vals.append({ "mapValue": { "fields": item_map } })
        fields[k] = { "arrayValue": { "values": array_vals } }

url = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/orders?documentId={order_id}"
data = json.dumps({ "fields": fields }).encode('utf-8')
headers = { 'Content-Type': 'application/json' }

req = urllib.request.Request(url, data=data, headers=headers, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        print("Firestore Save Success:", resp.read().decode('utf-8'))
except Exception as e:
    print("Firestore Save Note:", str(e))
