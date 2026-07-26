import re

# Update app.js and wholesale.js with the complete 3-step Wholesale Membership Funnel

funnel_js = """// ── Complete 3-Step Wholesale Membership Funnel ──

function openWholesaleFunnel() {
  const welcomeModal = document.getElementById('welcomeModeModal');
  if (welcomeModal) welcomeModal.style.display = 'none';

  // If already unlocked, switch directly
  if (typeof wholesaleUnlocked !== 'undefined' && wholesaleUnlocked) {
    switchModeSeamlessly('wholesale');
    return;
  }

  // Step 1: Open Wholesale Terms Modal
  const termsModal = document.getElementById('wholesaleTermsModal');
  if (termsModal) {
    termsModal.classList.add('active');
  } else {
    openWholesaleLoginModal();
  }
}

function openWholesaleLoginModal() {
  const termsModal = document.getElementById('wholesaleTermsModal');
  if (termsModal) termsModal.classList.remove('active');

  const loginModal = document.getElementById('wholesaleLoginModal');
  if (loginModal) {
    if ($('#loginStepPhone')) $('#loginStepPhone').style.display = 'block';
    if ($('#loginStepRegister')) $('#loginStepRegister').style.display = 'none';
    loginModal.classList.add('active');
  } else {
    openWholesaleUnlockModal();
  }
}

function openWholesaleUnlockModal() {
  const loginModal = document.getElementById('wholesaleLoginModal');
  if (loginModal) loginModal.classList.remove('active');

  const unlockModal = document.getElementById('wholesaleUnlockModal');
  if (unlockModal) {
    const unlockAmountLabel = $('#unlockAmountLabel');
    const unlockPriceText = $('#unlockPriceText');
    if (unlockAmountLabel) unlockAmountLabel.innerHTML = '₹1';
    if (unlockPriceText) unlockPriceText.innerHTML = 'Pay ₹1 portal fee to unlock wholesale prices.';
    unlockModal.classList.add('active');
  } else {
    completeWholesaleUnlock();
  }
}

function completeWholesaleUnlock() {
  const unlockModal = document.getElementById('wholesaleUnlockModal');
  if (unlockModal) unlockModal.classList.remove('active');
  
  if (typeof wholesaleUnlocked !== 'undefined') {
    wholesaleUnlocked = true;
  }
  localStorage.setItem('vfs_wholesale_unlocked', 'true');
  switchModeSeamlessly('wholesale');
  
  if (typeof toast === 'function') {
    toast('🎉 Wholesale Portal Unlocked! Welcome Reseller.');
  }
}

function switchModeSeamlessly(targetMode) {
  if (typeof shoppingMode !== 'undefined') {
    shoppingMode = targetMode;
  }
  localStorage.setItem('vfs_user_mode', targetMode);
  localStorage.setItem('vfs_shopping_mode', targetMode);
  document.documentElement.setAttribute('data-shopping-mode', targetMode);
  
  const welcomeModal = document.getElementById('welcomeModeModal');
  if (welcomeModal) welcomeModal.style.display = 'none';
  
  const termsModal = document.getElementById('wholesaleTermsModal');
  const loginModal = document.getElementById('wholesaleLoginModal');
  const unlockModal = document.getElementById('wholesaleUnlockModal');

  if (termsModal) termsModal.classList.remove('active');
  if (loginModal) loginModal.classList.remove('active');
  if (unlockModal) unlockModal.classList.remove('active');
  
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
  
  if (typeof toast === 'function' && targetMode === 'retail') {
    toast('Retail Store Active 🛍️');
  }
}

function initWelcomeModeModal() {
  const modal = document.getElementById('welcomeModeModal');
  const openBtn = document.getElementById('openModeModal');
  const sessionShown = sessionStorage.getItem('vfs_welcome_session_shown');
  
  if (modal && !sessionShown) {
    modal.style.display = 'flex';
  }
  
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
      openWholesaleFunnel();
    };
  }
  
  if (retailBtn) {
    retailBtn.onclick = (e) => {
      e.preventDefault();
      switchModeSeamlessly('retail');
    };
  }

  // Step 1: Wholesale T&C Checkbox & Accept Button
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
      openWholesaleLoginModal();
    };
  }

  if (cancelTermsBtn) {
    cancelTermsBtn.onclick = (e) => {
      e.preventDefault();
      switchModeSeamlessly('retail');
    };
  }

  // Step 2: Login / Registration Handlers
  const btnCancelLogin = document.getElementById('btnCancelLogin');
  if (btnCancelLogin) {
    btnCancelLogin.onclick = (e) => {
      e.preventDefault();
      switchModeSeamlessly('retail');
    };
  }

  const btnRegisterUser = document.getElementById('btnRegisterUser');
  if (btnRegisterUser) {
    btnRegisterUser.onclick = (e) => {
      e.preventDefault();
      openWholesaleUnlockModal();
    };
  }

  // Step 3: Unlock / UPI Payment Handlers
  const btnSimulateSuccess = document.getElementById('btnSimulateSuccess');
  if (btnSimulateSuccess) {
    btnSimulateSuccess.onclick = (e) => {
      e.preventDefault();
      completeWholesaleUnlock();
    };
  }

  const upiBtns = document.querySelectorAll('.upi-pay-btn');
  upiBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      completeWholesaleUnlock();
    };
  });

  const btnCancelUnlock = document.getElementById('btnCancelUnlock');
  if (btnCancelUnlock) {
    btnCancelUnlock.onclick = (e) => {
      e.preventDefault();
      switchModeSeamlessly('retail');
    };
  }
}"""

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    pattern = r'function switchModeSeamlessly\(targetMode\) \{.*?\n\}'
    content = re.sub(pattern, funnel_js, content, flags=re.DOTALL)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Updated complete wholesale membership funnel in', fname)
