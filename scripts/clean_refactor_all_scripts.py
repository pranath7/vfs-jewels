import os
import re

app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

unified_modal_system_js = '''
/* ============================================================
   UNIFIED VFS MODALS & PAYMENT GATEWAY FUNNEL SYSTEM
   ============================================================ */

// 1. Welcome Mode Modal (Wholesale vs Retail)
window.openWelcomeModeModal = function() {
  const modal = document.getElementById('welcomeModeModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeWelcomeModeModal = function() {
  const modal = document.getElementById('welcomeModeModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
  document.body.style.overflow = '';
};

// 2. Wholesale Login Modal (Google Auth & Mobile Reg)
window.openWholesaleLoginModal = function() {
  window.closeWelcomeModeModal();
  const termsModal = document.getElementById('wholesaleTermsModal');
  if (termsModal) termsModal.classList.remove('active');

  const loginModal = document.getElementById('wholesaleLoginModal');
  if (loginModal) {
    const loginStepPhone = document.getElementById('loginStepPhone');
    const loginStepRegister = document.getElementById('loginStepRegister');
    if (loginStepPhone) loginStepPhone.style.display = 'block';
    if (loginStepRegister) loginStepRegister.style.display = 'none';
    loginModal.style.display = 'flex';
    loginModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    window.openWholesaleUnlockModal();
  }
};

window.closeWholesaleLoginModal = function() {
  const loginModal = document.getElementById('wholesaleLoginModal');
  if (loginModal) {
    loginModal.style.display = 'none';
    loginModal.classList.remove('active');
  }
  document.body.style.overflow = '';
};

// 3. Wholesale Advance Unlock Modal (₹1 Razorpay)
window.openWholesaleUnlockModal = function() {
  window.closeWholesaleLoginModal();
  window.closeWelcomeModeModal();
  
  const unlockModal = document.getElementById('wholesaleUnlockModal');
  const royalScreenUnlock = document.getElementById('royalScreenUnlock');
  
  if (unlockModal) {
    const unlockAmountLabel = document.getElementById('unlockAmountLabel');
    const unlockPriceText = document.getElementById('unlockPriceText');
    if (unlockAmountLabel) unlockAmountLabel.innerHTML = '₹1';
    if (unlockPriceText) unlockPriceText.innerHTML = 'Pay ₹1 portal fee to unlock wholesale prices.';
    unlockModal.style.display = 'flex';
    unlockModal.classList.add('active');
    document.body.style.overflow = 'hidden';
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
  document.body.style.overflow = '';
  
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

// 4. Google Sign In Handler
window.handleUniversalGoogleSignIn = async function() {
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

// 5. Razorpay ₹1 Advance Payment SDK Trigger
window.triggerRazorpayUnlock = async function(amt = 1) {
  try {
    if (typeof toast === 'function') toast("Opening Razorpay Secure Payment... 💳");

    if (typeof window.Razorpay === 'undefined') {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
        document.body.appendChild(script);
      });
    }

    const savedPhone = localStorage.getItem('vfs_customer_phone') || '9840757363';
    const savedName = localStorage.getItem('vfs_customer_name') || 'Reseller Customer';
    const savedEmail = localStorage.getItem('vfs_customer_email') || 'customer@vfsjewels.store';

    const numAmt = Number(amt) || 1;
    const amountInPaise = (numAmt >= 100 && Number.isInteger(numAmt)) ? numAmt : Math.round(numAmt * 100);

    let orderId = '';
    let keyId = window.VFS_CONFIG?.razorpay?.keyId || 'rzp_live_vfs_jewels';

    try {
      const res = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmt, currency: 'INR', receipt: 'adv_' + Date.now() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) orderId = data.id;
        if (data.keyId) keyId = data.keyId;
      }
    } catch(e) {
      console.warn("Backend Razorpay order creation note:", e);
    }

    const options = {
      key: keyId,
      amount: amountInPaise,
      currency: "INR",
      name: "VFS JEWELS",
      description: "Wholesale Portal Access ₹1 Advance",
      image: "https://res.cloudinary.com/cwx4zame/image/upload/v1783183760/ze9xek1cled8puy6vfex.png",
      order_id: orderId || undefined,
      handler: function (response) {
        console.log("Razorpay Payment Success:", response);
        window.completeWholesaleUnlock();
      },
      prefill: {
        name: savedName,
        email: savedEmail,
        contact: savedPhone
      },
      theme: {
        color: "#D4AF37"
      },
      modal: {
        ondismiss: function() {
          console.log("Razorpay modal dismissed by user.");
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch(err) {
    console.error("Razorpay Trigger Error:", err);
    alert("Razorpay payment error: " + err.message);
  }
};

// 6. Master Event Listener Initializer
function initAllMasterModalListeners() {
  // Mode Toggle Buttons
  const modeBtns = document.querySelectorAll('#openModeModal, #modeToggleBtn, #modeToggle, [data-action="toggle-mode"], .mode-toggle-btn, .shopping-mode-btn');
  modeBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      window.openWelcomeModeModal();
    };
  });

  // Welcome Modal Preference Choice Buttons
  const wholesaleChoiceBtn = document.getElementById('chooseWholesaleBtn');
  const retailChoiceBtn = document.getElementById('chooseRetailBtn');
  
  if (wholesaleChoiceBtn) {
    wholesaleChoiceBtn.onclick = (e) => {
      e.preventDefault();
      window.closeWelcomeModeModal();
      if (typeof openWholesaleFunnel === 'function') {
        openWholesaleFunnel();
      } else {
        window.openWholesaleUnlockModal();
      }
    };
  }

  if (retailChoiceBtn) {
    retailChoiceBtn.onclick = (e) => {
      e.preventDefault();
      window.closeWelcomeModeModal();
      if (typeof switchModeSeamlessly === 'function') {
        switchModeSeamlessly('retail');
      }
    };
  }

  // Google Sign-In Buttons
  const gBtns = [
    document.getElementById('btnGoogleSignIn'),
    document.getElementById('royalBtnGoogleSignIn'),
    document.getElementById('googleSignInBtn')
  ];
  gBtns.forEach(btn => {
    if (btn) btn.onclick = window.handleUniversalGoogleSignIn;
  });

  // Cancel Buttons
  const cancelBtns = [
    document.getElementById('btnCancelLogin'),
    document.getElementById('royalBtnCancelAuth'),
    document.getElementById('royalBtnCancelTerms'),
    document.getElementById('royalBtnCancelRegister'),
    document.getElementById('btnCancelUnlock')
  ];
  cancelBtns.forEach(btn => {
    if (btn) btn.onclick = function(e) {
      if (e) e.preventDefault();
      window.closeWholesaleLoginModal();
      const unlockModal = document.getElementById('wholesaleUnlockModal');
      if (unlockModal) {
        unlockModal.style.display = 'none';
        unlockModal.classList.remove('active');
      }
      document.body.style.overflow = '';
    };
  });

  // Register Form Submit
  const regBtn = document.getElementById('btnRegisterUser');
  if (regBtn) {
    regBtn.onclick = function(e) {
      if (e) e.preventDefault();
      const phoneInp = document.getElementById('regPhoneInput');
      const phone = phoneInp ? phoneInp.value.trim().replace(/\\D/g, '') : '';
      if (phone && phone.length === 10) {
        localStorage.setItem('vfs_customer_phone', phone);
      }
      window.openWholesaleUnlockModal();
      if (typeof toast === 'function') toast("Registration saved! Proceeding to ₹1 Advance Payment 💳");
    };
  }

  // Razorpay Pay Button in Unlock Modal
  const razorpayUnlockBtn = document.getElementById('btnUnlockRazorpayPay');
  if (razorpayUnlockBtn) {
    razorpayUnlockBtn.onclick = function(e) {
      if (e) e.preventDefault();
      window.triggerRazorpayUnlock(1);
    };
  }

  // Modal Backdrop Click Close
  const welcomeModal = document.getElementById('welcomeModeModal');
  if (welcomeModal) {
    welcomeModal.onclick = function(e) {
      if (e.target === welcomeModal) window.closeWelcomeModeModal();
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllMasterModalListeners);
} else {
  initAllMasterModalListeners();
}
'''

def clean_and_unify_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Truncate all old appended blocks past line 6450 or after // ── Universal Wholesale Login
    cutoff_markers = [
        '// ── Universal Wholesale Login',
        '// ── Universal Welcome Mode Modal',
        '// ── Master Event Listener Initializer',
        '/* ============================================================\n   UNIFIED VFS MODALS'
    ]

    min_idx = len(code)
    for marker in cutoff_markers:
        idx = code.find(marker)
        if idx != -1 and idx < min_idx:
            min_idx = idx

    code = code[:min_idx].rstrip() + '\n\n' + unified_modal_system_js

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Cleaned up duplications and attached unified modal system to {file_path}")

clean_and_unify_file(app_js_path)
clean_and_unify_file(wholesale_js_path)
