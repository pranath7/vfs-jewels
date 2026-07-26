import re

for fname in ['index.html', 'wholesale.html', 'app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'Cash on Delivery', 'Prepaid Online Payment (UPI / Cards / QR)', content, flags=re.IGNORECASE)
    content = re.sub(r'\bCOD\b', 'Online Prepaid', content)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Removed COD from', fname)
