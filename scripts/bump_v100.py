import re

for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'style\.css(\?v=[^\"]+)?', 'style.css?v=20260726_v100', content)
    content = re.sub(r'app\.js(\?v=[^\"]+)?', 'app.js?v=20260726_v100', content)
    content = re.sub(r'wholesale\.js(\?v=[^\"]+)?', 'wholesale.js?v=20260726_v100', content)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

print('Bumped cache busting version to v=20260726_v100')
