import re

seamless_js = """function switchModeSeamlessly(targetMode) {
  if (typeof shoppingMode !== 'undefined') {
    shoppingMode = targetMode;
  }
  localStorage.setItem('vfs_user_mode', targetMode);
  sessionStorage.setItem('vfs_welcome_session_shown', 'true');
  
  const modal = document.getElementById('welcomeModeModal');
  if (modal) modal.style.display = 'none';
  
  if (typeof renderProducts === 'function') {
    try { renderProducts(null); } catch (e) {}
  }
  if (typeof renderCart === 'function') {
    try { renderCart(); } catch (e) {}
  }
  
  const modeBadge = document.getElementById('activeModeLabel');
  if (modeBadge) {
    modeBadge.textContent = targetMode === 'wholesale' ? 'Wholesale (Reseller Rates)' : 'Retail (Personal Use)';
  }
  
  if (typeof toast === 'function') {
    toast(targetMode === 'wholesale' ? 'Unlocked Wholesale Reseller Rates 📦' : 'Switched to Retail Shopping 🛍️');
  }
}

function initWelcomeModeModal() {
  const savedMode = localStorage.getItem('vfs_user_mode');
  const sessionShown = sessionStorage.getItem('vfs_welcome_session_shown');
  const modal = document.getElementById('welcomeModeModal');
  const openBtn = document.getElementById('openModeModal');
  
  if ((!savedMode || !sessionShown) && modal) {
    modal.style.display = 'flex';
  }
  
  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }
  
  const wholesaleBtn = document.getElementById('chooseWholesaleBtn');
  const retailBtn = document.getElementById('chooseRetailBtn');
  
  if (wholesaleBtn) {
    wholesaleBtn.onclick = (e) => {
      e.preventDefault();
      switchModeSeamlessly('wholesale');
    };
  }
  
  if (retailBtn) {
    retailBtn.onclick = (e) => {
      e.preventDefault();
      switchModeSeamlessly('retail');
    };
  }
}"""

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find and replace initWelcomeModeModal block
    pattern = r'function initWelcomeModeModal\(\) \{.*?\n\}'
    content = re.sub(pattern, seamless_js, content, flags=re.DOTALL)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Replaced initWelcomeModeModal with seamless 0ms mode switcher in', fname)
