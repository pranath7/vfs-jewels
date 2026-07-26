import re

# 1. Update index.html and wholesale.html to remove hardcoded inline white background from seo-about-section
for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        html = f.read()

    # Remove hardcoded inline background: #fafafa and color: #444
    html = html.replace(
        'class="seo-about-section" style="padding: var(--space-lg) 0; background: #fafafa; border-top: 1px solid var(--color-neutral);"',
        'class="seo-about-section" style="padding: var(--space-lg) 0;"'
    )
    html = html.replace(
        '<div class="page-width" style="max-width: 800px; margin: 0 auto; text-align: center; line-height: 1.8; color: #444;">',
        '<div class="page-width" style="max-width: 800px; margin: 0 auto; text-align: center; line-height: 1.8;">'
    )
    html = html.replace(
        '<h2 style="font-family: var(--font-heading); font-size: 2.4rem; color: var(--color-on-surface); margin-bottom: 16px;">',
        '<h2 style="font-family: var(--font-heading); font-size: 2.4rem; margin-bottom: 16px;">'
    )

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f'Successfully removed inline white background from {fname}')

# 2. Comprehensive Dark Mode Overhaul in style.css
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

dark_mode_overhaul = """
/* =========================================================
   COMPREHENSIVE DARK MODE & HIGH CONTRAST FIXES
   ========================================================= */

/* 1. Header Logo Visibility in Dark Mode */
[data-theme="dark"] .logo-img,
[data-theme="dark"] .site-header img,
[data-theme="dark"] .header-logo img,
[data-theme="dark"] .nav-logo img {
  filter: brightness(0) invert(1) drop-shadow(0 0 2px rgba(255,255,255,0.4)) !important;
}

/* 2. Category Labels under Category Circles */
[data-theme="dark"] .cat-label {
  color: #F5F6F8 !important;
  font-weight: 700 !important;
}

[data-theme="dark"] .cat-item:hover .cat-label {
  color: #D4AF37 !important;
}

/* 3. SEO About Section (Eliminate White Box Glitch) */
.seo-about-section {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border-top: 1px solid var(--border-color);
}
.seo-about-section h2 {
  color: var(--text-primary) !important;
}
.seo-about-section p {
  color: var(--text-secondary) !important;
}

[data-theme="dark"] .seo-about-section {
  background-color: #0f1117 !important;
  color: #F5F6F8 !important;
  border-top: 1px solid #2e3547 !important;
}
[data-theme="dark"] .seo-about-section h2 {
  color: #F5F6F8 !important;
}
[data-theme="dark"] .seo-about-section p {
  color: #cbd5e1 !important;
}

/* 4. Google Reviews Marquee Cards */
[data-theme="dark"] .review-card {
  background-color: #1c202c !important;
  border: 1px solid #2e3547 !important;
  color: #F5F6F8 !important;
}
[data-theme="dark"] .review-card p,
[data-theme="dark"] .review-card h4,
[data-theme="dark"] .review-card span {
  color: #cbd5e1 !important;
}
[data-theme="dark"] .review-author {
  color: #FFFFFF !important;
  font-weight: 700 !important;
}

/* 5. PDP Modal & Add To Cart Button */
[data-theme="dark"] .pdp-modal-content,
[data-theme="dark"] .pdp-container {
  background-color: #161922 !important;
  color: #F5F6F8 !important;
}

[data-theme="dark"] button.add-to-cart,
[data-theme="dark"] .pdp-add-btn,
[data-theme="dark"] .pdp-actions .btn-primary {
  background-color: #D4AF37 !important;
  color: #121212 !important;
  font-weight: 800 !important;
  border: none !important;
}

[data-theme="dark"] .delivery-check-box,
[data-theme="dark"] .pdp-pincode-box {
  background-color: #1c202c !important;
  border: 1px solid #2e3547 !important;
  color: #F5F6F8 !important;
}

[data-theme="dark"] .pincode-input {
  background-color: #232836 !important;
  color: #ffffff !important;
  border: 1px solid #3b445c !important;
}

[data-theme="dark"] .pincode-btn {
  background-color: #D4AF37 !important;
  color: #121212 !important;
  font-weight: 800 !important;
}

/* 6. Floating How To Order Button */
#howToOrderBtn,
.how-to-order-btn,
.floating-order-btn {
  background-color: #D4AF37 !important;
  color: #121212 !important;
  font-weight: 800 !important;
  border: 1px solid #D4AF37 !important;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4) !important;
}

[data-theme="dark"] #howToOrderBtn,
[data-theme="dark"] .how-to-order-btn,
[data-theme="dark"] .floating-order-btn {
  background-color: #D4AF37 !important;
  color: #121212 !important;
  font-weight: 800 !important;
  border: 1px solid #D4AF37 !important;
}
"""

if '1. Header Logo Visibility in Dark Mode' not in css:
    css += '\n' + dark_mode_overhaul
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print('Appended comprehensive dark mode fixes to style.css')
