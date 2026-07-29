import os
import re

app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

auto_payment_js = '''
// ── Universal Wholesale Login & Advance Payment Funnel ──
window.closeWholesaleLoginModal = function() {
  const modal = document.getElementById('wholesaleLoginModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
  document.body.style.overflow = '';
};

window.openWholesaleUnlockModal = function() {
  window.closeWholesaleLoginModal();
  
  const unlockModal = document.getElementById('wholesaleUnlockModal');
  const royalScreenUnlock = document.getElementById('royalScreenUnlock');
  
  if (unlockModal) {
    const unlockAmountLabel = document.getElementById('unlockAmountLabel');
    const unlockPriceText = document.getElementById('unlockPriceText');
    if (unlockAmountLabel) unlockAmountLabel.innerHTML = '₹1';
    if (unlockPriceText) unlockPriceText.innerHTML = 'Pay ₹1 portal fee to unlock wholesale prices.';
    unlockModal.style.display = 'flex';
    unlockModal.classList.add('active');
  } else if (royalScreenUnlock) {
    royalScreenUnlock.style.display = 'block';
  } else {
    window.completeWholesaleUnlock();
  }
};

window.completeWholesaleUnlock = function() {
  const unlockModal = document.getElementById('wholesaleUnlockModal');
  if (unlockModal) {
    unlockModal.style.display = 'none';
    unlockModal.classList.remove('active');
  }
  
  if (typeof wholesaleUnlocked !== 'undefined') {
    wholesaleUnlocked = true;
  }
  localStorage.setItem('vfs_wholesale_unlocked', 'true');
  localStorage.setItem('vfs_user_mode', 'wholesale');
  localStorage.setItem('vfs_shopping_mode', 'wholesale');
  document.documentElement.setAttribute('data-shopping-mode', 'wholesale');
  
  if (typeof switchModeSeamlessly === 'function') {
    switchModeSeamlessly('wholesale');
  }
  
  if (typeof toast === 'function') {
    toast('🎉 Wholesale Portal Unlocked! Welcome Reseller.');
  }
};

window.handleUniversalGoogleSignIn = async function() {
  const loginStepPhone = document.getElementById('loginStepPhone');
  const loginStepRegister = document.getElementById('loginStepRegister');
  
  try {
    if (window.VFS_CLOUD_ACTIVE && window.firebase && firebase.auth) {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      const user = result.user;
      
      const userPhone = user.phoneNumber ? user.phoneNumber.replace(/\\D/g, '').replace(/^91/, '') : '';
      const userName = user.displayName || 'Reseller Member';
      
      if (userPhone && userPhone.length === 10) {
        localStorage.setItem('vfs_customer_phone', userPhone);
      }
      if (user.email) {
        localStorage.setItem('vfs_customer_email', user.email);
      }
      
      window.openWholesaleUnlockModal();
      if (typeof toast === 'function') toast(`Signed in as ${userName}! Proceeding to ₹1 Advance Payment 💳`);
    } else {
      throw new Error("Firebase auth unavailable, fallback to mobile sign in");
    }
  } catch(err) {
    console.warn("Google Auth popup notice:", err);
    const phonePrompt = prompt("Enter your 10-digit mobile number to sign in & pay ₹1 advance:");
    if (phonePrompt && phonePrompt.trim().replace(/\\D/g, '').length === 10) {
      const cleanPhone = phonePrompt.trim().replace(/\\D/g, '');
      localStorage.setItem('vfs_customer_phone', cleanPhone);
      window.openWholesaleUnlockModal();
      if (typeof toast === 'function') toast("Signed in! Proceeding to ₹1 Advance Payment 💳");
    }
  }
};

function initWholesaleLoginModalListeners() {
  // 1. Google Sign-In Buttons
  const gBtns = [
    document.getElementById('btnGoogleSignIn'),
    document.getElementById('royalBtnGoogleSignIn'),
    document.getElementById('googleSignInBtn')
  ];
  gBtns.forEach(btn => {
    if (btn) btn.onclick = window.handleUniversalGoogleSignIn;
  });

  // 2. Cancel Buttons
  const cancelBtns = [
    document.getElementById('btnCancelLogin'),
    document.getElementById('royalBtnCancelAuth'),
    document.getElementById('royalBtnCancelTerms'),
    document.getElementById('royalBtnCancelRegister'),
    document.getElementById('btnCancelUnlock')
  ];
  cancelBtns.forEach(btn => {
    if (btn) btn.onclick = function() {
      window.closeWholesaleLoginModal();
      const unlockModal = document.getElementById('wholesaleUnlockModal');
      if (unlockModal) {
        unlockModal.style.display = 'none';
        unlockModal.classList.remove('active');
      }
    };
  });

  // 3. Register Form Submit -> Triggers Payment Modal immediately!
  const regBtn = document.getElementById('btnRegisterUser');
  if (regBtn) {
    regBtn.onclick = function() {
      const phoneInp = document.getElementById('regPhoneInput');
      const phone = phoneInp ? phoneInp.value.trim().replace(/\\D/g, '') : '';
      if (phone && phone.length === 10) {
        localStorage.setItem('vfs_customer_phone', phone);
      }
      window.openWholesaleUnlockModal();
      if (typeof toast === 'function') toast("Registration saved! Proceeding to ₹1 Advance Payment 💳");
    };
  }

  // 4. Payment Buttons in Unlock Modal -> Unlocks Portal
  const payBtns = document.querySelectorAll('.upi-pay-btn, #btnSimulateSuccess, #royalBtnRazorpayPay');
  payBtns.forEach(btn => {
    btn.onclick = function() {
      window.completeWholesaleUnlock();
    };
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWholesaleLoginModalListeners);
} else {
  initWholesaleLoginModalListeners();
}
'''

def apply_auto_payment(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    if 'window.openWholesaleUnlockModal' not in code or 'Universal Wholesale Login' not in code:
        code += '\n\n' + auto_payment_js
    else:
        code = re.sub(r'// ── Universal Wholesale Login [\s\S]*', auto_payment_js, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} with auto-payment modal funnel")

apply_auto_payment(app_js_path)
apply_auto_payment(wholesale_js_path)
