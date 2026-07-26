import re

for fname in ['index.html', 'wholesale.html', 'app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    print(f'=== {fname} ===')
    for i, l in enumerate(lines):
        if 'reload()' in l or 'location.href' in l or 'location.replace' in l or 'setInterval' in l:
            print(f'{i+1}: {l.strip()[:100]}')
