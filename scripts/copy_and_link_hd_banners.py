import os
import glob
import shutil
import re

brain_dir = r"C:\Users\91636\.gemini\antigravity-ide\brain\9438da06-7f01-4306-893b-97bede64edec"
banners_dir = os.path.join(os.getcwd(), "assets", "banners")
os.makedirs(banners_dir, exist_ok=True)

# Find latest generated images for each category
def find_latest(pattern):
    files = glob.glob(os.path.join(brain_dir, pattern))
    if not files:
        return None
    return max(files, key=os.path.getmtime)

kadas_src = find_latest("kadas_banner_hd_*.png")
chains_src = find_latest("chains_banner_hd_*.png")
bracelets_src = find_latest("bracelets_banner_hd_*.png")
necklaces_src = find_latest("necklaces_banner_hd_*.png")
earrings_src = find_latest("earrings_banner_hd_*.png")

def copy_file(src, dst_name):
    if src and os.path.exists(src):
        dst = os.path.join(banners_dir, dst_name)
        shutil.copy2(src, dst)
        print(f"Copied {os.path.basename(src)} -> assets/banners/{dst_name}")
        return f"assets/banners/{dst_name}"
    return None

kadas_path = copy_file(kadas_src, "kadas_banner.png")
chains_path = copy_file(chains_src, "chains_banner.png")
bracelets_path = copy_file(bracelets_src, "bracelets_banner.png")
necklaces_path = copy_file(necklaces_src, "necklaces_banner.png")
earrings_path = copy_file(earrings_src, "earrings_banner.png")

# Update CATEGORY_BANNERS in app.js and wholesale.js
new_category_banners = f'''const CATEGORY_BANNERS = {{
  bracelets: {{ 
    title: "Bracelets Collection", 
    desc: "Elegant handcrafted anti-tarnish gold & CZ bracelets.", 
    img: "{bracelets_path or 'assets/banners/bracelets_banner.png'}" 
  }},
  necklaces: {{ 
    title: "Necklaces Collection", 
    desc: "Exquisite handcrafted gold & CZ necklace sets.", 
    img: "{necklaces_path or 'assets/banners/necklaces_banner.png'}" 
  }},
  kadas: {{ 
    title: "Kadas Collection", 
    desc: "Premium handcrafted daily-wear gold plated Kadas.", 
    img: "{kadas_path or 'assets/banners/kadas_banner.png'}" 
  }},
  chains: {{ 
    title: "Chains Collection", 
    desc: "Classic and luxury gold-plated chains and necklaces.", 
    img: "{chains_path or 'assets/banners/chains_banner.png'}" 
  }},
  earrings: {{ 
    title: "Ear Rings Collection", 
    desc: "Dazzling handcrafted ear rings for every occasion.", 
    img: "{earrings_path or 'assets/banners/earrings_banner.png'}" 
  }},
  rings: {{
    title: "Rings Collection",
    desc: "Stunning anti-tarnish gold & CZ designer rings.",
    img: "{bracelets_path or 'assets/banners/bracelets_banner.png'}"
  }}
}};'''

def update_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()
    code = re.sub(r'const CATEGORY_BANNERS = \{\s*[\s\S]*?\n\};', new_category_banners, code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated CATEGORY_BANNERS in {file_path}")

update_js('app.js')
update_js('wholesale.js')
