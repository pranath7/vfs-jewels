import os
import re

# 1. Update index.html & wholesale.html themeToggleBtn to compact single icon button
def update_storefront_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    old_pill_btn = r'<button id="themeToggleBtn" class="theme-toggle-pill"[\s\S]*?</button>'
    new_icon_btn = '''<button id="themeToggleBtn" class="icon-btn" aria-label="Toggle Theme" title="Toggle Dark/Light Mode" style="font-size:1.3rem;">
            <span class="theme-icon-sun" style="display:none;">☀️</span>
            <span class="theme-icon-moon">🌙</span>
          </button>'''

    code = re.sub(old_pill_btn, new_icon_btn, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated theme toggle button in {file_path}")

update_storefront_html('index.html')
update_storefront_html('wholesale.html')


# 2. Update style.css to make Logo BIG and clear
style_css_path = 'style.css'
with open(style_css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Desktop logo size
css = css.replace('.logo-img { height: 60px; width: auto; object-fit: contain; display: block; }',
                  '.logo-img { height: 75px; width: auto; object-fit: contain; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1)); }')

# Mobile logo size & layout
css = css.replace('.logo-img { height: 50px; }',
                  '.logo-img { height: 62px; max-width: 140px; }\n  .header-logo { justify-content: center; flex: 1; }\n  .header-icons { gap: 1px; }')

with open(style_css_path, 'w', encoding='utf-8') as f:
    f.write(css)
print("Updated style.css with BIG logo and compact header layout")


# 3. Update app.js & wholesale.js theme toggle logic
theme_toggle_js = '''
// ── Single-Icon Theme Toggle & Big Logo Support ──
function initThemeToggle() {
  const themeBtn = document.getElementById('themeToggleBtn');
  const sun = document.querySelector('.theme-icon-sun');
  const moon = document.querySelector('.theme-icon-moon');

  function applyTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-theme');
      if (sun) sun.style.display = 'inline-block';
      if (moon) moon.style.display = 'none';
    } else {
      document.body.classList.remove('dark-theme');
      if (sun) sun.style.display = 'none';
      if (moon) moon.style.display = 'inline-block';
    }
  }

  const savedTheme = localStorage.getItem('vfs_theme');
  const isDark = savedTheme === 'dark';
  applyTheme(isDark);

  if (themeBtn) {
    themeBtn.onclick = () => {
      const darkNow = document.body.classList.toggle('dark-theme');
      localStorage.setItem('vfs_theme', darkNow ? 'dark' : 'light');
      applyTheme(darkNow);
    };
  }
}

initThemeToggle();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThemeToggle);
}
'''

def update_storefront_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Remove old theme toggle block if exists
    code = re.sub(r'// ── Theme Toggle Switch Logic ──[\s\S]*?(?=// ──|\n\n|\Z)', '', code)

    code += '\n\n' + theme_toggle_js

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated theme toggle logic in {file_path}")

update_storefront_js('app.js')
update_storefront_js('wholesale.js')
