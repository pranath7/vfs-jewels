import os
import re

# 1. Update CATEGORY_BANNERS in app.js & wholesale.js with ultra-clean studio photo assets
category_banners_dict = '''const CATEGORY_BANNERS = {
  bracelets: { 
    title: "Bracelets Collection", 
    desc: "Elegant handcrafted anti-tarnish gold & CZ bracelets.", 
    img: "assets/cleaned_bracelets/bracelet_cleaned_595.png" 
  },
  necklaces: { 
    title: "Necklaces Collection", 
    desc: "Exquisite handcrafted gold & CZ necklace sets.", 
    img: "https://res.cloudinary.com/cwx4zame/image/upload/v1784987541/necklaces/nkfoqzblg8cengy6hrda.jpg" 
  },
  kadas: { 
    title: "Kadas Collection", 
    desc: "Premium handcrafted daily-wear gold plated Kadas.", 
    img: "assets/cleaned_bracelets/bracelet_cleaned_600.png" 
  },
  chains: { 
    title: "Chains Collection", 
    desc: "Classic and luxury gold-plated chains and necklaces.", 
    img: "assets/cleaned_bracelets/bracelet_cleaned_608.png" 
  },
  earrings: { 
    title: "Ear Rings Collection", 
    desc: "Dazzling handcrafted ear rings for every occasion.", 
    img: "https://res.cloudinary.com/cwx4zame/image/upload/v1783694425/kuk50yyh9yzosthcsxkk.png" 
  },
  rings: {
    title: "Rings Collection",
    desc: "Stunning anti-tarnish gold & CZ designer rings.",
    img: "assets/cleaned_bracelets/bracelet_cleaned_615.png"
  }
};'''

def update_storefront_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'const CATEGORY_BANNERS = \{\s*[\s\S]*?\n\};', category_banners_dict, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated CATEGORY_BANNERS in {file_path}")

update_storefront_js('app.js')
update_storefront_js('wholesale.js')


# 2. Update index.html & wholesale.html catHeroBanner structure with high-contrast minimalist banner
new_cat_hero_html = '''      <!-- Category Hero Banner (Minimalist & High-Contrast) -->
      <div id="catHeroBanner" class="category-hero" style="position:relative; border-radius:12px; overflow:hidden; margin-bottom: 30px; min-height: 240px; display: flex; align-items: center; padding: 32px 40px; background: linear-gradient(135deg, #0e1017 0%, #1c1815 45%, #2a2214 100%); border: 1px solid rgba(212, 175, 55, 0.3); box-shadow: 0 8px 30px rgba(0,0,0,0.25);">
        <!-- Right side clean product image -->
        <div id="catHeroBg" style="position:absolute; top:0; right:0; width:45%; height:100%; background-size:contain; background-position:center right; background-repeat:no-repeat; opacity:0.85; pointer-events:none; z-index:1; padding:10px;"></div>
        <!-- Left-to-right dark gradient overlay for crystal clear text readability -->
        <div style="position:absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(90deg, #0e1017 0%, rgba(14,16,23,0.95) 45%, rgba(14,16,23,0.4) 75%, transparent 100%); pointer-events:none; z-index:2;"></div>
        <!-- Bottom gold shimmer accent line -->
        <div style="position:absolute; bottom:0; left:0; width:100%; height:3px; background: linear-gradient(90deg, #D4AF37, transparent); z-index:3;"></div>
        
        <!-- Text & Action Content -->
        <div style="z-index: 4; max-width: 540px;">
          <span id="catHeroTag" class="tag" style="background:#D4AF37; color:#121212; font-size:1rem; padding:4px 12px; border-radius:4px; text-transform:uppercase; font-weight:800; display:inline-block; margin-bottom:12px; letter-spacing:0.08em;">Collection</span>
          <h1 id="catHeroTitle" style="font-size:2.8rem; font-family:var(--font-heading); color:#ffffff; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.04em; font-weight:700; line-height:1.2;">Category Title</h1>
          <p id="catHeroDesc" style="font-size:1.3rem; color:rgba(255,255,255,0.85); line-height:1.5; font-weight:400; margin-bottom:16px;">Category description text goes here.</p>
          <a href="#products" class="btn-primary" style="background:#D4AF37; color:#121212; font-weight:800; padding:10px 22px; font-size:1.2rem; border-radius:6px; text-decoration:none; display:inline-flex; align-items:center; gap:6px;">Explore Collection &rarr;</a>
        </div>
      </div>'''

def update_html_cat_banner(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'<!-- Category Hero Banner -->[\s\S]*?</div>\s*</div>\s*</div>', new_cat_hero_html, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated category banner HTML in {file_path}")

update_html_cat_banner('index.html')
update_html_cat_banner('wholesale.html')


# 3. Add responsive mobile styling for .category-hero to style.css
style_css_path = 'style.css'
with open(style_css_path, 'r', encoding='utf-8') as f:
    css = f.read()

mobile_cat_css = '''
/* Category Hero Banner Responsive Adjustments */
@media (max-width: 768px) {
  .category-hero {
    padding: 20px 24px !important;
    min-height: 200px !important;
  }
  #catHeroTitle {
    font-size: 2.0rem !important;
  }
  #catHeroDesc {
    font-size: 1.15rem !important;
    margin-bottom: 12px !important;
  }
  #catHeroBg {
    width: 40% !important;
    opacity: 0.7 !important;
  }
}
'''

if '/* Category Hero Banner Responsive Adjustments */' not in css:
    css += '\n' + mobile_cat_css
    with open(style_css_path, 'w', encoding='utf-8') as f:
        f.write(css)
    print("Added category hero banner responsive CSS to style.css")
