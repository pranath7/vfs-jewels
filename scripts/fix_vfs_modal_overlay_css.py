import os
import re

style_css_path = 'style.css'
wholesale_css_path = 'wholesale.css'
app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

vfs_overlay_css = '''
/* ── Universal VFS Modal Overlay System ── */
.vfs-modal-overlay {
  display: none;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(10, 12, 18, 0.85) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  z-index: 9999999 !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 20px !important;
  box-sizing: border-box !important;
}

.vfs-modal-overlay.active,
.vfs-modal-overlay[style*="display: flex"] {
  display: flex !important;
}

.vfs-modal-content {
  position: relative !important;
  max-width: 520px !important;
  width: 100% !important;
  background: #ffffff !important;
  color: #121212 !important;
  padding: 32px !important;
  border-radius: 16px !important;
  border: 1px solid #D4AF37 !important;
  box-shadow: 0 25px 60px rgba(0,0,0,0.6) !important;
  box-sizing: border-box !important;
  margin: auto !important;
}
'''

def add_overlay_css(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        css = f.read()

    if '/* ── Universal VFS Modal Overlay System ── */' not in css:
        css += '\n' + vfs_overlay_css
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(css)
        print(f"Added vfs-modal-overlay CSS to {file_path}")

add_overlay_css(style_css_path)
add_overlay_css(wholesale_css_path)


# 2. Update openWelcomeModeModal in app.js and wholesale.js
open_modal_js = '''window.openWelcomeModeModal = function() {
  const modal = document.getElementById('welcomeModeModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};'''

def update_open_modal_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'window\.openWelcomeModeModal = function\(\) \{[\s\S]*?\n\};', open_modal_js, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated openWelcomeModeModal in {file_path}")

update_open_modal_js(app_js_path)
update_open_modal_js(wholesale_js_path)
