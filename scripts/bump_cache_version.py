import re

timestamp = '20260729_v5000'

def bump_cache(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'app\.js(\?v=[^\"]+)?', f'app.js?v={timestamp}', content)
    content = re.sub(r'wholesale\.js(\?v=[^\"]+)?', f'wholesale.js?v={timestamp}', content)
    content = re.sub(r'admin\.js(\?v=[^\"]+)?', f'admin.js?v={timestamp}', content)
    content = re.sub(r'style\.css(\?v=[^\"]+)?', f'style.css?v={timestamp}', content)
    content = re.sub(r'wholesale\.css(\?v=[^\"]+)?', f'wholesale.css?v={timestamp}', content)
    content = re.sub(r'sw\.js(\?v=[^\"]+)?', f'sw.js?v={timestamp}', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Bumped cache version to ?v={timestamp} in {file_path}")

bump_cache('index.html')
bump_cache('wholesale.html')
bump_cache('admin/admin.html')
