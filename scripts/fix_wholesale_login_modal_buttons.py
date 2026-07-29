import os
import re

app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

modal_fix_js = '''
// ── Universal Wholesale Login Modal Handlers (#btnGoogleSignIn & #btnCancelLogin) ──
window.closeWholesaleLoginModal = function() {
  const modal = document.getElementById('wholesaleLoginModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
  document.body.style.overflow = '';
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
      
      if (loginStepPhone) loginStepPhone.style.display = 'none';
      if (loginStepRegister) {
        loginStepRegister.style.display = 'block';
        const nameInp = document.getElementById('regNameInput');
        if (nameInp) nameInp.value = userName;
      } else {
        window.closeWholesaleLoginModal();
      }
      if (typeof toast === 'function') toast(`Signed in as ${userName} ✓`);
    } else {
      throw new Error("Firebase auth unavailable, fallback to mobile sign in");
    }
  } catch(err) {
    console.warn("Google Auth popup notice:", err);
    // Mobile / Webview Fallback: Prompt 10-digit mobile number so user is NEVER stuck!
    const phonePrompt = prompt("Google popup blocked. Enter your 10-digit mobile number to complete Wholesale Sign In:");
    if (phonePrompt && phonePrompt.trim().replace(/\\D/g, '').length === 10) {
      const cleanPhone = phonePrompt.trim().replace(/\\D/g, '');
      localStorage.setItem('vfs_customer_phone', cleanPhone);
      
      if (loginStepPhone) loginStepPhone.style.display = 'none';
      if (loginStepRegister) {
        loginStepRegister.style.display = 'block';
        const phoneInp = document.getElementById('regPhoneInput');
        if (phoneInp) phoneInp.value = cleanPhone;
      } else {
        window.closeWholesaleLoginModal();
      }
      if (typeof toast === 'function') toast("Signed in successfully! 🌸");
    }
  }
};

function initWholesaleLoginModalListeners() {
  // 1. Google Sign-In Buttons (All IDs)
  const gBtns = [
    document.getElementById('btnGoogleSignIn'),
    document.getElementById('royalBtnGoogleSignIn'),
    document.getElementById('googleSignInBtn')
  ];
  gBtns.forEach(btn => {
    if (btn) btn.onclick = window.handleUniversalGoogleSignIn;
  });

  // 2. Cancel Buttons (All IDs)
  const cancelBtns = [
    document.getElementById('btnCancelLogin'),
    document.getElementById('royalBtnCancelAuth'),
    document.getElementById('royalBtnCancelTerms'),
    document.getElementById('royalBtnCancelRegister')
  ];
  cancelBtns.forEach(btn => {
    if (btn) btn.onclick = window.closeWholesaleLoginModal;
  });

  // 3. Register Form Submit
  const regBtn = document.getElementById('btnRegisterUser');
  if (regBtn) {
    regBtn.onclick = function() {
      const phoneInp = document.getElementById('regPhoneInput');
      const phone = phoneInp ? phoneInp.value.trim().replace(/\\D/g, '') : '';
      if (phone && phone.length === 10) {
        localStorage.setItem('vfs_customer_phone', phone);
      }
      window.closeWholesaleLoginModal();
      if (typeof toast === 'function') toast("Registration details saved! 🌸");
    };
  }

  // 4. Backdrop click close
  const loginModal = document.getElementById('wholesaleLoginModal');
  if (loginModal) {
    loginModal.onclick = function(e) {
      if (e.target === loginModal) {
        window.closeWholesaleLoginModal();
      }
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWholesaleLoginModalListeners);
} else {
  initWholesaleLoginModalListeners();
}
'''

def update_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    if 'window.closeWholesaleLoginModal' not in code:
        code += '\n\n' + modal_fix_js
    else:
        code = re.sub(r'// ── Universal Wholesale Login Modal Handlers[\s\S]*', modal_fix_js, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} with universal Wholesale Login modal handlers")

update_file(app_js_path)
update_file(wholesale_js_path)
