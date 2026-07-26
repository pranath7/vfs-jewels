import re

popup_js = """function switchModeSeamlessly(targetMode) {
  if (typeof shoppingMode !== 'undefined') {
    shoppingMode = targetMode;
  }
  localStorage.setItem('vfs_user_mode', targetMode);
  localStorage.setItem('vfs_shopping_mode', targetMode);
  sessionStorage.setItem('vfs_welcome_session_shown', 'true');
  document.documentElement.setAttribute('data-shopping-mode', targetMode);
  
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
    toast(targetMode === 'wholesale' ? 'Unlocked Wholesale Reseller Rates 📦' : 'Retail Store Active 🛍️');
  }
}

function initWelcomeModeModal() {
  const modal = document.getElementById('welcomeModeModal');
  const openBtn = document.getElementById('openModeModal');
  const sessionShown = sessionStorage.getItem('vfs_welcome_session_shown');
  
  // Show welcome popup modal automatically on landing for new sessions
  if (modal && !sessionShown) {
    modal.style.display = 'flex';
  }
  
  // Open modal anytime user clicks Mode button in header
  if (openBtn && modal) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
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

    pattern = r'function switchModeSeamlessly\(targetMode\) \{.*?\n\}'
    content = re.sub(pattern, popup_js, content, flags=re.DOTALL)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Updated welcome modal session trigger in', fname)
