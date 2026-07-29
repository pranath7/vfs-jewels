import re

timestamp = '20260729_v9999'

def safe_bump_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'src="app\.js(\?v=[^"]+)?"', f'src="app.js?v={timestamp}"', content)
    content = re.sub(r'src="wholesale\.js(\?v=[^"]+)?"', f'src="wholesale.js?v={timestamp}"', content)
    content = re.sub(r'src="admin\.js(\?v=[^"]+)?"', f'src="admin.js?v={timestamp}"', content)
    content = re.sub(r'href="style\.css(\?v=[^"]+)?"', f'href="style.css?v={timestamp}"', content)
    content = re.sub(r'href="wholesale\.css(\?v=[^"]+)?"', f'href="wholesale.css?v={timestamp}"', content)
    content = re.sub(r'register\(\'/sw\.js(\?v=[^\']+)?\'\)', f"register('/sw.js?v={timestamp}')", content)
    content = re.sub(r'register\(\'/admin/sw\.js(\?v=[^\']+)?\'\)', f"register('/admin/sw.js?v={timestamp}')", content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Safely bumped cache version to ?v={timestamp} in {file_path}")

safe_bump_file('index.html')
safe_bump_file('wholesale.html')
safe_bump_file('admin/admin.html')
