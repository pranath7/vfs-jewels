import re

# 1. Update index.html and wholesale.html to remove hardcoded inline light background on checkout-summary
for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        html = f.read()

    # Fix hardcoded background:#f9f9f9; on checkout-summary
    html = html.replace(
        '<div class="checkout-summary" style="background:#f9f9f9;padding:16px;border-radius:var(--rounded-md);margin-bottom:20px;text-align:left;font-size:1.35rem;">',
        '<div class="checkout-summary" style="padding:16px;border-radius:var(--rounded-md);margin-bottom:20px;text-align:left;font-size:1.35rem;">'
    )

    # Fix hardcoded background:#fffdfa or light backgrounds on brand-story if present
    html = html.replace('background: #fffdfa;', '')
    html = html.replace('background:#fffdfa;', '')

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f'Successfully updated inline styles in {fname}')

# 2. Append CSS fixes to style.css
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

exact_dark_fixes = """
/* =========================================================
   TARGETED DARK MODE FIXES FOR FOOTER, DROPDOWN, STORY & CHECKOUT
   ========================================================= */

/* 1. Footer Dark Mode Fix */
[data-theme="dark"] .footer,
[data-theme="dark"] footer,
[data-theme="dark"] .site-footer {
  background-color: #0f1117 !important;
  color: #F5F6F8 !important;
  border-top: 1px solid #2e3547 !important;
}

[data-theme="dark"] .footer a,
[data-theme="dark"] .footer p,
[data-theme="dark"] .footer span,
[data-theme="dark"] .footer div,
[data-theme="dark"] .footer h4,
[data-theme="dark"] .footer h5,
[data-theme="dark"] .footer li,
[data-theme="dark"] footer a,
[data-theme="dark"] footer p,
[data-theme="dark"] footer span,
[data-theme="dark"] footer div {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .footer a:hover,
[data-theme="dark"] footer a:hover {
  color: #D4AF37 !important;
}

[data-theme="dark"] .footer-bottom {
  border-top: 1px solid #2e3547 !important;
  background-color: #0c0e13 !important;
}

/* 2. Categories Mega Menu Dropdown Fix */
.mega-menu, .nav-dropdown, .dropdown-menu {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
}

[data-theme="dark"] .mega-menu,
[data-theme="dark"] .nav-dropdown,
[data-theme="dark"] .dropdown-menu {
  background-color: #161922 !important;
  border: 1px solid #2e3547 !important;
  box-shadow: 0 10px 30px rgba(0,0,0,0.6) !important;
}

[data-theme="dark"] .mega-menu a,
[data-theme="dark"] .nav-dropdown a,
[data-theme="dark"] .dropdown-menu a,
[data-theme="dark"] .dropdown-link {
  color: #f5f6f8 !important;
}

[data-theme="dark"] .mega-menu a:hover,
[data-theme="dark"] .nav-dropdown a:hover,
[data-theme="dark"] .dropdown-link:hover {
  color: #D4AF37 !important;
  background-color: rgba(212, 175, 55, 0.15) !important;
}

[data-theme="dark"] .mega-heading,
[data-theme="dark"] .dropdown-heading {
  color: #D4AF37 !important;
  font-weight: 800 !important;
}

/* 3. Our Story Section Fix */
[data-theme="dark"] #brand-story,
[data-theme="dark"] .brand-story-section {
  background-color: #0f1117 !important;
  color: #F5F6F8 !important;
}

[data-theme="dark"] .brand-story-quote {
  background-color: #1c202c !important;
  border-left: 4px solid #D4AF37 !important;
  color: #F5F6F8 !important;
}

[data-theme="dark"] .brand-story-quote p,
[data-theme="dark"] .brand-story-quote span {
  color: #D4AF37 !important;
}

[data-theme="dark"] .timeline-card,
[data-theme="dark"] .timeline-content {
  background-color: #1c202c !important;
  border: 1px solid #2e3547 !important;
  color: #F5F6F8 !important;
}

[data-theme="dark"] .timeline-year {
  color: #D4AF37 !important;
  font-weight: 800 !important;
}

[data-theme="dark"] .timeline-card h4,
[data-theme="dark"] .timeline-content h4 {
  color: #FFFFFF !important;
}

[data-theme="dark"] .timeline-card p,
[data-theme="dark"] .timeline-content p {
  color: #cbd5e1 !important;
}

/* 4. Checkout Summary Box Fix */
.checkout-summary {
  background-color: var(--bg-neutral);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}

[data-theme="dark"] .checkout-summary {
  background-color: #1c202c !important;
  border: 1px solid #2e3547 !important;
  color: #F5F6F8 !important;
}

[data-theme="dark"] .checkout-summary span,
[data-theme="dark"] .checkout-summary div,
[data-theme="dark"] .checkout-summary p {
  color: #cbd5e1 !important;
}

[data-theme="dark"] .checkout-summary strong {
  color: #FFFFFF !important;
}

[data-theme="dark"] #coSumTotal,
[data-theme="dark"] .checkout-summary .grand-total {
  color: #D4AF37 !important;
  font-weight: 800 !important;
}
"""

if 'TARGETED DARK MODE FIXES FOR FOOTER' not in css:
    css += '\n' + exact_dark_fixes
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print('Appended targeted dark mode fixes to style.css')
