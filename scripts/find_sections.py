with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if '<section' in l or 'id=' in l and ('promise' in l.lower() or 'reel' in l.lower() or 'story' in l.lower()):
        print(f'{i+1}: {l.strip()[:100]}')
