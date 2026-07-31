import json

with open('vfs-products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

necklaces = [p for p in products if p.get('cat') == 'necklaces']
bracelets = [p for p in products if p.get('cat') == 'bracelets']

print(f"Total Necklaces: {len(necklaces)}")
for n in necklaces:
    print(f"ID {n.get('id')}: {n.get('name')} -> {n.get('img')}")

print(f"\nTotal Bracelets: {len(bracelets)}")
for b in bracelets:
    print(f"ID {b.get('id')}: {b.get('name')} -> {b.get('img')}")
