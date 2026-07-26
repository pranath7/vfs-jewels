import re

for fname in ['index.html', 'wholesale.html', 'app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        text = f.read()

    matches = [m.start() for m in re.finditer(r'wholesaleTermsModal', text)]
    print(f'=== {fname} matches: {len(matches)} ===')
    for m in matches:
        start = max(0, m - 60)
        end = min(len(text), m + 80)
        print(' ', repr(text[start:end]))
