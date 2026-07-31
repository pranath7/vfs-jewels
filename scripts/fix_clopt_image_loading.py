import os
import re

app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

clopt_def = '''
// ── Cloudinary & Image Helper ──
window.clOpt = function(url, width = 800) {
  if (!url || typeof url !== 'string') return 'https://res.cloudinary.com/cwx4zame/image/upload/f_auto,q_auto,w_800/v1783178917/whbmflasdurxiag7au7t.jpg';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    if (!url.includes('/f_auto,q_auto')) {
      return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
    }
  }
  return url;
};
const clOpt = window.clOpt;
'''

def fix_clopt_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Inject clOpt definition at top
    if 'window.clOpt =' not in code:
        code = clopt_def + '\n\n' + code

    # 2. Add onerror fallback to PDP image slider
    pdp_img_target = '<img src="${clOpt(imgSrc, 800)}"'
    pdp_img_replacement = '<img src="${window.clOpt(imgSrc, 800)}" onerror="this.onerror=null;this.src=\'https://res.cloudinary.com/cwx4zame/image/upload/f_auto,q_auto,w_800/v1783178917/whbmflasdurxiag7au7t.jpg\';"'
    code = code.replace(pdp_img_target, pdp_img_replacement)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Fixed clOpt image helper in {file_path}")

fix_clopt_in_file(app_js_path)
fix_clopt_in_file(wholesale_js_path)
