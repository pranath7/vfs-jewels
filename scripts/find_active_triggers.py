import re

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    print(f'=== {fname} ===')
    for i, l in enumerate(lines):
        if '.classList.add(' in l and ('Modal' in l or 'active' in l):
            print(f'{i+1}: {l.strip()[:100]}')
