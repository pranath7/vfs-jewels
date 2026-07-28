import os
import re

full_cat_page_view_html = '''  <!-- CATEGORY PAGE VIEW (HIDDEN BY DEFAULT) -->
  <div id="categoryPageView" style="display:none; padding-bottom: 50px;">
    <div class="page-width">
      <!-- Breadcrumb and Back button -->
      <div style="padding: 20px 0; font-size: 1.3rem; display: flex; align-items: center; gap: 8px;">
        <a href="#" style="color:#777; text-decoration:none;">Home</a>
        <span style="color:#ccc;">/</span>
        <span id="catBreadcrumb" style="color:var(--color-secondary); font-weight:700;">Collection</span>
      </div>

      <!-- Category Hero Banner (Minimalist & High-Contrast) -->
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
      </div>

      <!-- Section: Bestsellers in Category -->
      <div id="catBestsellersSection" style="margin-bottom: 50px;">
        <div class="section-head" style="text-align:left; margin-bottom:30px;">
          <h2 style="font-size:2.4rem; font-family:var(--font-heading); text-transform:uppercase;">🔥 Bestsellers of the Week</h2>
          <p style="font-size:1.3rem; color:#666;">Our highest rated and most loved designs</p>
          <div class="line" style="margin-left:0;"></div>
        </div>
        <div class="product-grid" id="catBestsellersGrid"></div>
      </div>

      <!-- Section: All Products in Category -->
      <div>
        <div class="section-head" style="text-align:left; margin-bottom:30px;">
          <h2 style="font-size:2.4rem; font-family:var(--font-heading); text-transform:uppercase;">All Designs in Collection</h2>
          <div class="line" style="margin-left:0;"></div>
        </div>
        <div class="product-grid" id="catAllProductsGrid"></div>
      </div>
    </div>
  </div>'''

def fix_cat_view_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'<!-- CATEGORY PAGE VIEW \(HIDDEN BY DEFAULT\) -->[\s\S]*?(?=<!-- HERO -->|\n\s*<section class="hero-section")', full_cat_page_view_html + '\n\n', code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Restored categoryPageView structure in {file_path}")

fix_cat_view_in_file('index.html')
fix_cat_view_in_file('wholesale.html')
