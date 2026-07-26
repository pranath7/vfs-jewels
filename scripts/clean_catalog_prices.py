import json, requests

PRODUCTS_FILE = 'vfs-products.json'
FIREBASE_PROJECT = 'vfs-jewellery'
FIREBASE_API_KEY = 'AIzaSyD6h-kC0Afqd20pLASwUC1smMCdjUfQLes'

with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
    products = json.load(f)

# Remove demo test product #1
products = [p for p in products if p['id'] != 1 and p.get('sku') != 'DEMO-TEST-001']

for p in products:
    p['priceOnRequest'] = False
    if not p.get('price') or p['price'] < 50:
        p['price'] = 499
    if not p.get('wholesalePrice') or p['wholesalePrice'] < 50:
        p['wholesalePrice'] = 148
    if not p.get('mrp') or p['mrp'] < 100:
        p['mrp'] = 749

with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f'Cleaned catalog! Total valid products: {len(products)}')
