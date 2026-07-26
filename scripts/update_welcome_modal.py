import re

# 1. Update style.css modal rule
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

modal_css = """
/* Highest priority modal overlay for welcome mode popup */
#welcomeModeModal {
  z-index: 999999 !important;
  position: fixed !important;
  top: 0 !important; left: 0 !important;
  width: 100vw !important; height: 100vh !important;
  background: rgba(0, 0, 0, 0.75) !important;
  backdrop-filter: blur(10px) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
"""

if '#welcomeModeModal' not in css:
    css += '\n' + modal_css + '\n'
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print('Added #welcomeModeModal CSS to style.css')

# 2. Update initWelcomeModeModal in JS files
old_fn = """function initWelcomeModeModal() {
  const savedMode = localStorage.getItem('vfs_user_mode');
  const modal = document.getElementById('welcomeModeModal');
  const openBtn = document.getElementById('openModeModal');
  
  if (!savedMode && modal) {
    modal.style.display = 'flex';
  }"""

new_fn = """function initWelcomeModeModal() {
  const savedMode = localStorage.getItem('vfs_user_mode');
  const sessionShown = sessionStorage.getItem('vfs_welcome_session_shown');
  const modal = document.getElementById('welcomeModeModal');
  const openBtn = document.getElementById('openModeModal');
  
  if ((!savedMode || !sessionShown) && modal) {
    modal.style.display = 'flex';
  }"""

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        js = f.read()

    js = js.replace(old_fn, new_fn)
    js = js.replace("localStorage.setItem('vfs_user_mode', 'wholesale');", "localStorage.setItem('vfs_user_mode', 'wholesale'); sessionStorage.setItem('vfs_welcome_session_shown', 'true');")
    js = js.replace("localStorage.setItem('vfs_user_mode', 'retail');", "localStorage.setItem('vfs_user_mode', 'retail'); sessionStorage.setItem('vfs_welcome_session_shown', 'true');")

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(js)

    print('Updated initWelcomeModeModal in', fname)
