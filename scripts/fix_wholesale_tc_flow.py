import re

# 1. Clean style.css to allow wholesaleTermsModal to open when .active is added
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = re.sub(r'/\* Permanently disable legacy wholesale T&C.*?\n\}', '', css, flags=re.DOTALL)
css = re.sub(r'html\[data-shopping-mode="retail"\].*?\n\}', '', css, flags=re.DOTALL)

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('Updated style.css for Wholesale T&C modal')

# 2. Update JS files for clean T&C flow
tc_flow_js = """function switchModeSeamlessly(targetMode) {
  if (typeof shoppingMode !== 'undefined') {
    shoppingMode = targetMode;
  }
  localStorage.setItem('vfs_user_mode', targetMode);
  localStorage.setItem('vfs_shopping_mode', targetMode);
  document.documentElement.setAttribute('data-shopping-mode', targetMode);
  
  const welcomeModal = document.getElementById('welcomeModeModal');
  if (welcomeModal) welcomeModal.style.display = 'none';
  
  const wholesaleTermsModal = document.getElementById('wholesaleTermsModal');
  if (wholesaleTermsModal) wholesaleTermsModal.classList.remove('active');
  
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

function openWholesaleTermsModal() {
  const welcomeModal = document.getElementById('welcomeModeModal');
  if (welcomeModal) welcomeModal.style.display = 'none';
  
  const termsModal = document.getElementById('wholesaleTermsModal');
  if (termsModal) {
    termsModal.classList.add('active');
  } else {
    switchModeSeamlessly('wholesale');
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
      openWholesaleTermsModal();
    };
  }
  
  if (retailBtn) {
    retailBtn.onclick = (e) => {
      e.preventDefault();
      switchModeSeamlessly('retail');
    };
  }

  // Bind Wholesale T&C Checkbox & Accept Button
  const termsCheckbox = document.getElementById('agreeWholesaleTerms');
  const acceptTermsBtn = document.getElementById('btnAcceptTerms');
  const cancelTermsBtn = document.getElementById('btnCancelTerms');

  if (termsCheckbox && acceptTermsBtn) {
    termsCheckbox.onchange = () => {
      if (termsCheckbox.checked) {
        acceptTermsBtn.disabled = false;
        acceptTermsBtn.style.opacity = '1';
        acceptTermsBtn.style.cursor = 'pointer';
      } else {
        acceptTermsBtn.disabled = true;
        acceptTermsBtn.style.opacity = '0.6';
        acceptTermsBtn.style.cursor = 'not-allowed';
      }
    };

    acceptTermsBtn.onclick = (e) => {
      e.preventDefault();
      if (!termsCheckbox.checked) return;
      switchModeSeamlessly('wholesale');
    };
  }

  if (cancelTermsBtn) {
    cancelTermsBtn.onclick = (e) => {
      e.preventDefault();
      const termsModal = document.getElementById('wholesaleTermsModal');
      if (termsModal) termsModal.classList.remove('active');
      switchModeSeamlessly('retail');
    };
  }
}"""

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'function switchModeSeamlessly\(targetMode\) \{.*?\n\}'
    content = re.sub(pattern, tc_flow_js, content, flags=re.DOTALL)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Updated Wholesale T&C modal flow in', fname)
