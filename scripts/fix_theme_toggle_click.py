import os
import re

# 1. Update index.html & wholesale.html themeToggleBtn with inline onclick="window.toggleTheme()" and gold outline
def update_storefront_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    old_btn = r'<button id="themeToggleBtn"[\s\S]*?</button>'
    new_btn = '''<button id="themeToggleBtn" onclick="window.toggleTheme()" class="icon-btn theme-toggle-btn" aria-label="Toggle Theme" title="Toggle Dark/Light Mode" style="font-size:1.25rem; border:1.5px solid #D4AF37 !important; width:36px; height:36px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:rgba(212,175,55,0.1); cursor:pointer; flex-shrink:0;">
            <span class="theme-icon-sun" style="display:none;">☀️</span>
            <span class="theme-icon-moon">🌙</span>
          </button>'''

    code = re.sub(old_btn, new_btn, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated theme toggle button with onclick and gold outline in {file_path}")

update_storefront_html('index.html')
update_storefront_html('wholesale.html')


# 2. Update app.js & wholesale.js with window.toggleTheme global function
global_theme_js = '''
// ── Global Theme Toggle (Light / Dark Mode) ──
window.toggleTheme = function() {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('vfs_theme', isDark ? 'dark' : 'light');
  window.updateThemeIcons(isDark);
};

window.updateThemeIcons = function(isDark) {
  const suns = document.querySelectorAll('.theme-icon-sun');
  const moons = document.querySelectorAll('.theme-icon-moon');
  
  suns.forEach(s => s.style.display = isDark ? 'inline-block' : 'none');
  moons.forEach(m => m.style.display = isDark ? 'none' : 'inline-block');
};

// Initial Theme Check on Load
(function initThemeOnLoad() {
  const savedTheme = localStorage.getItem('vfs_theme');
  const isDark = savedTheme === 'dark';
  if (isDark) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.updateThemeIcons(isDark));
  } else {
    window.updateThemeIcons(isDark);
  }
})();
'''

def update_storefront_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Remove old initThemeToggle block if present
    code = re.sub(r'// ── Single-Icon Theme Toggle & Big Logo Support ──[\s\S]*', '', code)

    code += '\n\n' + global_theme_js

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated global window.toggleTheme in {file_path}")

update_storefront_js('app.js')
update_storefront_js('wholesale.js')
