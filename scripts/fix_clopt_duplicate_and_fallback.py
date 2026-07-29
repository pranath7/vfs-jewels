import os
import re

app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

def fix_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Remove top duplicated clOpt definition if present
    code = re.sub(r'// ── Cloudinary & Image Helper ──[\s\S]*?const clOpt = window\.clOpt;\n\n', '', code)

    # 2. Update clOpt at line 556 to be robust with fallback
    robust_clopt = '''const clOpt = (url, width) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return 'https://res.cloudinary.com/cwx4zame/image/upload/f_auto,q_auto,w_800/v1783178917/whbmflasdurxiag7au7t.jpg';
  }
  if (!url.includes('cloudinary.com')) return url;
  
  const parts = url.split('/upload/');
  if (parts.length === 2) {
    let cleanPath = parts[1];
    const pathSegments = cleanPath.split('/');
    if (pathSegments.length > 1 && (pathSegments[0].includes('_') || pathSegments[0].includes('w_') || pathSegments[0].includes('q_'))) {
      pathSegments.shift();
      cleanPath = pathSegments.join('/');
    }
    return `${parts[0]}/upload/f_auto,q_auto,w_${width}/${cleanPath}`;
  }
  return url;
};
window.clOpt = clOpt;'''

    code = re.sub(r'const clOpt = \(url, width\) => \{[\s\S]*?\n\};', robust_clopt, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Cleaned and upgraded clOpt in {file_path}")

fix_file(app_js_path)
fix_file(wholesale_js_path)
