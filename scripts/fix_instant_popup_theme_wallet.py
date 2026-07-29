import os
import re

app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

instant_popup_theme_wallet_js = '''
/* ============================================================
   UNIFIED VFS MODALS, THEME & WALLET SYSTEM
   ============================================================ */

// 1. Theme (Dark Mode) Handler
window.toggleTheme = function() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('vfs_theme', next);
  if (typeof toast === 'function') {
    toast(next === 'dark' ? '🌙 Dark Mode Activated' : '☀️ Light Mode Activated');
  }
};

function initThemeFromStorage() {
  const savedTheme = localStorage.getItem('vfs_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}
initThemeFromStorage();

// 2. VFS Wallet Modal Handler
window.openWalletModalFunc = async function() {
  const modal = document.getElementById('walletModal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Refresh balance display if logged in phone exists
    const phone = localStorage.getItem('vfs_customer_phone');
    if (phone && window.VFS_DB && window.VFS_DB.getCustomerWalletBalance) {
      try {
        const bal = await window.VFS_DB.getCustomerWalletBalance(phone);
        const balDisp = document.getElementById('walletBalanceDisplay');
        const phoneDisp = document.getElementById('walletUserPhoneDisplay');
        const loggedOutView = document.getElementById('walletViewLoggedOut');
        const loggedInView = document.getElementById('walletViewLoggedIn');
        
        if (balDisp) balDisp.textContent = '₹' + (Number(bal) || 0).toLocaleString('en-IN', {minimumFractionDigits:2});
        if (phoneDisp) phoneDisp.textContent = 'Phone: +91 ' + phone;
        if (loggedOutView) loggedOutView.style.display = 'none';
        if (loggedInView) loggedInView.style.display = 'block';
      } catch(e) {
        console.warn("Wallet balance fetch note:", e);
      }
    }
  }
};

window.closeWalletModalFunc = function() {
  const modal = document.getElementById('walletModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
  document.body.style.overflow = '';
};

// 3. Welcome Mode Modal (Wholesale vs Retail)
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

// 4. Wholesale Login Modal (Google Auth & Mobile Reg)
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

// 5. Wholesale Advance Unlock Modal (₹1 Razorpay)
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

// 6. Google Sign In Handler
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

// 7. Razorpay ₹1 Advance Payment SDK Trigger
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

// 8. Master Event Listener Initializer
function initAllMasterModalListeners() {
  // A. INSTANT POPUP ON SITE OPEN
  const unlocked = localStorage.getItem('vfs_wholesale_unlocked') === 'true';
  if (!unlocked) {
    setTimeout(() => {
      window.openWelcomeModeModal();
    }, 150);
  }

  // B. Theme Toggle Buttons
  const themeBtns = document.querySelectorAll('#themeToggleBtn, #themeToggle, .theme-toggle-btn, [aria-label="Toggle Theme"]');
  themeBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      window.toggleTheme();
    };
  });

  // C. Wallet Buttons & Modal Listeners
  const walletBtns = document.querySelectorAll('#openWalletModal, #walletBtn, #headerWalletBtn, .wallet-btn');
  walletBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      window.openWalletModalFunc();
    };
  });

  const closeWalletBtn = document.getElementById('closeWalletModal');
  if (closeWalletBtn) {
    closeWalletBtn.onclick = (e) => {
      e.preventDefault();
      window.closeWalletModalFunc();
    };
  }

  const walletModal = document.getElementById('walletModal');
  if (walletModal) {
    walletModal.onclick = function(e) {
      if (e.target === walletModal) window.closeWalletModalFunc();
    };
  }

  const walletSwitchBtn = document.getElementById('walletSwitchUserBtn');
  if (walletSwitchBtn) {
    walletSwitchBtn.onclick = function(e) {
      e.preventDefault();
      localStorage.removeItem('vfs_customer_phone');
      const loggedOutView = document.getElementById('walletViewLoggedOut');
      const loggedInView = document.getElementById('walletViewLoggedIn');
      if (loggedOutView) loggedOutView.style.display = 'block';
      if (loggedInView) loggedInView.style.display = 'none';
    };
  }

  const walletForm = document.getElementById('walletLoginForm');
  if (walletForm) {
    walletForm.onsubmit = async function(e) {
      e.preventDefault();
      const phoneInput = document.getElementById('walletLoginPhone');
      const phone = phoneInput ? phoneInput.value.trim().replace(/\\D/g, '') : '';
      if (phone && phone.length === 10) {
        localStorage.setItem('vfs_customer_phone', phone);
        await window.openWalletModalFunc();
        if (typeof toast === 'function') toast("Wallet balance updated!");
      } else {
        alert("Please enter a valid 10-digit mobile number.");
      }
    };
  }

  // D. Shopping Mode Toggle Buttons
  const modeBtns = document.querySelectorAll('#openModeModal, #modeToggleBtn, #modeToggle, [data-action="toggle-mode"], .mode-toggle-btn, .shopping-mode-btn');
  modeBtns.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      window.openWelcomeModeModal();
    };
  });

  // E. Welcome Modal Preference Choice Buttons
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

  // F. Google Sign-In Buttons
  const gBtns = [
    document.getElementById('btnGoogleSignIn'),
    document.getElementById('royalBtnGoogleSignIn'),
    document.getElementById('googleSignInBtn')
  ];
  gBtns.forEach(btn => {
    if (btn) btn.onclick = window.handleUniversalGoogleSignIn;
  });

  // G. Cancel Buttons
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

  // H. Register Form Submit
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

  // I. Razorpay Pay Button in Unlock Modal
  const razorpayUnlockBtn = document.getElementById('btnUnlockRazorpayPay');
  if (razorpayUnlockBtn) {
    razorpayUnlockBtn.onclick = function(e) {
      if (e) e.preventDefault();
      window.triggerRazorpayUnlock(1);
    };
  }

  // J. Modal Backdrop Click Close
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

def update_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    cutoff_markers = [
        '/* ============================================================\n   UNIFIED VFS MODALS',
        '// ── Universal Wholesale Login',
        '// ── Universal Welcome Mode Modal'
    ]

    min_idx = len(code)
    for marker in cutoff_markers:
        idx = code.find(marker)
        if idx != -1 and idx < min_idx:
            min_idx = idx

    code = code[:min_idx].rstrip() + '\n\n' + instant_popup_theme_wallet_js

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} with instant popup, dark mode toggle, and wallet modal handlers!")

update_file(app_js_path)
update_file(wholesale_js_path)
