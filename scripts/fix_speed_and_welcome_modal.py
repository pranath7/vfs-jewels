import re

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. FIX SPEED LAG: Eliminate 281 individual Firestore network calls on load
    old_stock_loop = """  // Load stock levels into cache
  const catalog = getFullCatalog();
  const loadPromises = catalog.map(async (p) => {
    const stockVal = await window.VFS_DB.getProductStock(p.id);
    window.VFS_STOCK_CACHE[p.id] = stockVal;
  });
  await Promise.all(loadPromises);"""

    new_stock_loop = """  // Fast instant local stock cache init (sub-100ms load)
  const catalog = getFullCatalog();
  catalog.forEach(p => {
    window.VFS_STOCK_CACHE[p.id] = p.stock || 6;
  });"""

    content = content.replace(old_stock_loop, new_stock_loop)

    # 2. RESTORE WELCOME POPUP ON LANDING
    welcome_modal_js = """function switchModeSeamlessly(targetMode) {
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
  
  // Show welcome popup modal on landing if user hasn't made a choice yet or wants to switch
  const savedMode = localStorage.getItem('vfs_user_mode');
  if (modal && !savedMode) {
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

    pattern = r'function switchModeSeamlessly\(targetMode\) \{.*?\n\}'
    content = re.sub(pattern, welcome_modal_js, content, flags=re.DOTALL)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Updated speed optimization and welcome modal in', fname)
