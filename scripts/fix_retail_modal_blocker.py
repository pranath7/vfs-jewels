import re

# 1. Update style.css with strict CSS override
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

blocker_css = """
/* Guarantee Wholesale Modals are hidden 100% when in Retail mode */
html[data-shopping-mode="retail"] #wholesaleTermsModal,
html[data-shopping-mode="retail"] #wholesaleLoginModal,
html[data-shopping-mode="retail"] #wholesaleUnlockModal,
html[data-shopping-mode="retail"] #modeSelectorModal {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
"""

if 'html[data-shopping-mode="retail"]' not in css:
    css += '\n' + blocker_css + '\n'
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print('Added retail modal blocker CSS to style.css')

# 2. Update JS files to set data-shopping-mode on <html> and clean up modals
seamless_js = """function switchModeSeamlessly(targetMode) {
  if (typeof shoppingMode !== 'undefined') {
    shoppingMode = targetMode;
  }
  localStorage.setItem('vfs_user_mode', targetMode);
  localStorage.setItem('vfs_shopping_mode', targetMode);
  sessionStorage.setItem('vfs_welcome_session_shown', 'true');
  document.documentElement.setAttribute('data-shopping-mode', targetMode);
  
  const modal = document.getElementById('welcomeModeModal');
  if (modal) modal.style.display = 'none';
  
  // Close any active wholesale modals
  const wholesaleTermsModal = document.getElementById('wholesaleTermsModal');
  const wholesaleLoginModal = document.getElementById('wholesaleLoginModal');
  const wholesaleUnlockModal = document.getElementById('wholesaleUnlockModal');
  const modeSelectorModal = document.getElementById('modeSelectorModal');

  if (wholesaleTermsModal) wholesaleTermsModal.classList.remove('active');
  if (wholesaleLoginModal) wholesaleLoginModal.classList.remove('active');
  if (wholesaleUnlockModal) wholesaleUnlockModal.classList.remove('active');
  if (modeSelectorModal) modeSelectorModal.classList.remove('active');
  
  if (targetMode === 'wholesale') {
    // If switching to wholesale and not unlocked, open login/terms modal
    if (typeof wholesaleUnlocked !== 'undefined' && !wholesaleUnlocked) {
      if (wholesaleLoginModal) {
        wholesaleLoginModal.classList.add('active');
      } else if (wholesaleTermsModal) {
        wholesaleTermsModal.classList.add('active');
      }
    }
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

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Ensure document.documentElement attribute is set on init
    content = content.replace(
        "let shoppingMode = localStorage.getItem('vfs_user_mode') || localStorage.getItem('vfs_shopping_mode') || 'retail';",
        "let shoppingMode = localStorage.getItem('vfs_user_mode') || localStorage.getItem('vfs_shopping_mode') || 'retail';\ndocument.documentElement.setAttribute('data-shopping-mode', shoppingMode);"
    )

    pattern = r'function switchModeSeamlessly\(targetMode\) \{.*?\n\}'
    content = re.sub(pattern, seamless_js, content, flags=re.DOTALL)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Updated switchModeSeamlessly in', fname)
