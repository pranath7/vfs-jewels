import re
import time

timestamp = f"20260730_v{int(time.time())}"

files = ['index.html', 'wholesale.html', 'admin/admin.html']

for fname in files:
    try:
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()

        # Update app.js, wholesale.js, style.css, admin.js cache parameters
        content = re.sub(r'app\.js\?v=[^\"]+', f'app.js?v={timestamp}', content)
        content = re.sub(r'wholesale\.js\?v=[^\"]+', f'wholesale.js?v={timestamp}', content)
        content = re.sub(r'style\.css\?v=[^\"]+', f'style.css?v={timestamp}', content)
        content = re.sub(r'admin\.js\?v=[^\"]+', f'admin.js?v={timestamp}', content)

        with open(fname, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Bumped cache version in {fname} -> {timestamp}")
    except Exception as e:
        print(f"Error in {fname}: {e}")
