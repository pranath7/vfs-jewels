import re

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Force default shoppingMode to 'retail' and remove auto-redirects to wholesale.html
    old_init = """let shoppingMode = localStorage.getItem('vfs_user_mode') || localStorage.getItem('vfs_shopping_mode') || 'retail';
document.documentElement.setAttribute('data-shopping-mode', shoppingMode);
if (shoppingMode === 'wholesale') {
  window.location.replace('/wholesale.html');
}"""

    new_init = """let shoppingMode = 'retail';
localStorage.setItem('vfs_user_mode', 'retail');
localStorage.setItem('vfs_shopping_mode', 'retail');
document.documentElement.setAttribute('data-shopping-mode', 'retail');"""

    content = content.replace(old_init, new_init)

    # 2. Update initWelcomeModeModal: DO NOT auto-popup on page load. Show ONLY when clicking mode switch button
    new_modal_js = """function switchModeSeamlessly(targetMode) {
  if (typeof shoppingMode !== 'undefined') {
    shoppingMode = targetMode;
  }
  localStorage.setItem('vfs_user_mode', targetMode);
  localStorage.setItem('vfs_shopping_mode', targetMode);
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
  
  // Hide modal by default on load (Retail is default)
  if (modal) {
    modal.style.display = 'none';
  }
  
  // Open modal ONLY when user clicks Mode button
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

    pattern = r'function switchModeSeamlessly\(targetMode\) \{.*?\n\}'
    content = re.sub(pattern, new_modal_js, content, flags=re.DOTALL)

    # 3. Clean up any remaining auto-redirects
    content = content.replace("window.location.replace('/wholesale.html');", "// disabled auto redirect")
    content = content.replace("window.location.href = '/wholesale.html';", "// disabled auto redirect")
    content = content.replace("window.location.href = 'wholesale.html';", "// disabled auto redirect")

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Updated default mode to retail and mode switcher in', fname)
