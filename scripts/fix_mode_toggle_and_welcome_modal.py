import re

app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

welcome_modal_js = '''// ── Universal Welcome Mode Modal & Mode Toggle Handlers ──
window.openWelcomeModeModal = function() {
  const modal = document.getElementById('welcomeModeModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
};

function initWelcomeModeModal() {
  const modal = document.getElementById('welcomeModeModal');
  
  const modeBtns = document.querySelectorAll('#openModeModal, #modeToggleBtn, #modeToggle, [data-action="toggle-mode"], .mode-toggle-btn, .shopping-mode-btn');
  modeBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      window.openWelcomeModeModal();
    };
  });
  
  const wholesaleBtn = document.getElementById('chooseWholesaleBtn');
  const retailBtn = document.getElementById('chooseRetailBtn');
  
  if (wholesaleBtn) {
    wholesaleBtn.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.style.display = 'none';
      if (typeof openWholesaleFunnel === 'function') {
        openWholesaleFunnel();
      } else if (typeof openWholesaleUnlockModal === 'function') {
        openWholesaleUnlockModal();
      }
    };
  }
  
  if (retailBtn) {
    retailBtn.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.style.display = 'none';
      if (typeof switchModeSeamlessly === 'function') {
        switchModeSeamlessly('retail');
      }
    };
  }
}
'''

def update_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'function initWelcomeModeModal\(\) \{[\s\S]*?\n\}', welcome_modal_js, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated initWelcomeModeModal in {file_path}")

update_file(app_js_path)
update_file(wholesale_js_path)
