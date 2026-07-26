import re

for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'style\.css(\?v=\d+)?', 'style.css?v=999', content)
    content = re.sub(r'app\.js(\?v=\d+)?', 'app.js?v=999', content)
    content = re.sub(r'wholesale\.js(\?v=\d+)?', 'wholesale.js?v=999', content)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Updated cache busting in', fname)
