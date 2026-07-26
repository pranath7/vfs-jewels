import re

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Unify shoppingMode initialization
    content = content.replace(
        "let shoppingMode = localStorage.getItem('vfs_shopping_mode') || 'retail';",
        "let shoppingMode = localStorage.getItem('vfs_user_mode') || localStorage.getItem('vfs_shopping_mode') || 'retail';"
    )

    # 2. Ensure both localStorage keys are saved in saveState / mode switch
    content = content.replace(
        "localStorage.setItem('vfs_shopping_mode', shoppingMode);",
        "localStorage.setItem('vfs_user_mode', shoppingMode);\n  localStorage.setItem('vfs_shopping_mode', shoppingMode);"
    )

    # 3. Replace switchModeSeamlessly with clean sync function
    clean_switch_fn = """function switchModeSeamlessly(targetMode) {
  if (typeof shoppingMode !== 'undefined') {
    shoppingMode = targetMode;
  }
  localStorage.setItem('vfs_user_mode', targetMode);
  localStorage.setItem('vfs_shopping_mode', targetMode);
  sessionStorage.setItem('vfs_welcome_session_shown', 'true');
  
  const modal = document.getElementById('welcomeModeModal');
  if (modal) modal.style.display = 'none';
  
  // Close any wholesale modals if switching to retail
  if (targetMode === 'retail') {
    const wholesaleTermsModal = document.getElementById('wholesaleTermsModal');
    const wholesaleLoginModal = document.getElementById('wholesaleLoginModal');
    const wholesaleUnlockModal = document.getElementById('wholesaleUnlockModal');
    const modeSelectorModal = document.getElementById('modeSelectorModal');

    if (wholesaleTermsModal) wholesaleTermsModal.classList.remove('active');
    if (wholesaleLoginModal) wholesaleLoginModal.classList.remove('active');
    if (wholesaleUnlockModal) wholesaleUnlockModal.classList.remove('active');
    if (modeSelectorModal) modeSelectorModal.classList.remove('active');
  }
  
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
    toast(targetMode === 'wholesale' ? 'Wholesale Mode Active 📦' : 'Retail Store Active 🛍️');
  }
}"""

    pattern = r'function switchModeSeamlessly\(targetMode\) \{.*?\n\}'
    content = re.sub(pattern, clean_switch_fn, content, flags=re.DOTALL)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Successfully synchronized shopping mode keys in', fname)
