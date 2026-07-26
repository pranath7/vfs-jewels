import re

# Update app.js and wholesale.js so that ALL mode buttons open the funnel or switch mode cleanly

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Make setupShoppingMode bind all mode buttons properly
    old_setup = """  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      localStorage.setItem('vfs_shopping_mode', 'wholesale');
      // disabled auto redirect
    });
  }"""

    new_setup = """  if (switchBtn) {
    switchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openWholesaleFunnel();
    });
  }"""

    content = content.replace(old_setup, new_setup)
    content = content.replace("localStorage.setItem('vfs_shopping_mode', 'wholesale');\n      // disabled auto redirect", "openWholesaleFunnel();")

    # Wire up window.addEventListener('DOMContentLoaded') and initApp to attach listeners to all mode buttons
    bind_all_buttons_js = """
// Global Mode Button Attacher
function bindAllModeButtons() {
  document.querySelectorAll('#openModeModal, .mode-btn, [data-action="switch-mode"], #switchModeBtn, #headerModeBtn').forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const modal = document.getElementById('welcomeModeModal');
      if (modal) modal.style.display = 'flex';
    };
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindAllModeButtons);
} else {
  bindAllModeButtons();
}
"""

    if 'function bindAllModeButtons()' not in content:
        content += '\n' + bind_all_buttons_js

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Bound all mode buttons in', fname)
