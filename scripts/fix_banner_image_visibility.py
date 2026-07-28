import os
import re

# 1. Update style.css .category-banner-overlay for crystal clear banner image visibility
style_css_path = 'style.css'
with open(style_css_path, 'r', encoding='utf-8') as f:
    css = f.read()

old_overlay_css = r'\.category-banner-overlay\s*\{[\s\S]*?\}'
new_overlay_css = '''.category-banner-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(10, 12, 18, 0.88) 0%, rgba(10, 12, 18, 0.6) 45%, rgba(10, 12, 18, 0.1) 80%, transparent 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 28px 36px;
  color: #ffffff;
  z-index: 2;
}'''

css = re.sub(old_overlay_css, new_overlay_css, css)

# Make sure .category-banner has high contrast & proper min-height
css = css.replace('min-height: 180px;', 'min-height: 220px;')

with open(style_css_path, 'w', encoding='utf-8') as f:
    f.write(css)
print("Updated style.css with clear banner visibility gradient")


# 2. Update index.html & wholesale.html catHeroBg opacity from 0.35 to 0.85
def update_cat_hero_opacity(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = code.replace('opacity:0.35;', 'opacity:0.85;')
    code = code.replace('opacity:0.45;', 'opacity:0.85;')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Boosted category banner opacity in {file_path}")

update_cat_hero_opacity('index.html')
update_cat_hero_opacity('wholesale.html')
