import os
import re

admin_js_path = os.path.join('admin', 'admin.js')
app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

# 1. Add wallet functions to window.VFS_DB in admin/admin.js
with open(admin_js_path, 'r', encoding='utf-8') as f:
    admin_js = f.read()

wallet_vfs_db_methods = '''
  // ── Customer Wallet & Cloud Credits ──
  getCustomerWalletBalance: async function(phone) {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone) return 0;
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const doc = await window.db.collection('wallet_credits').doc(cleanPhone).get();
        if (doc.exists) {
          const val = doc.data().balance;
          return val !== undefined ? Number(val) : 0;
        }
      } catch(e) {
        console.error("Firestore wallet read error:", e);
      }
    }
    const local = localStorage.getItem('vfs_wallet_credits');
    const creditsMap = local ? JSON.parse(local) : {};
    return Number(creditsMap[cleanPhone] || 0);
  },

  saveWalletBalance: async function(phone, balance) {
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!cleanPhone) return;
    const numBal = Math.max(0, Number(balance) || 0);
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('wallet_credits').doc(cleanPhone).set({
          balance: numBal,
          updatedAt: Date.now()
        });
        return;
      } catch(e) {
        console.error("Firestore wallet write error:", e);
      }
    }
    const local = localStorage.getItem('vfs_wallet_credits');
    const creditsMap = local ? JSON.parse(local) : {};
    creditsMap[cleanPhone] = numBal;
    localStorage.setItem('vfs_wallet_credits', JSON.stringify(creditsMap));
  },

  getWalletCredits: async function() {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const snap = await window.db.collection('wallet_credits').get();
        const map = {};
        snap.forEach(doc => {
          map[doc.id] = doc.data().balance || 0;
        });
        return map;
      } catch(e) {
        console.error("Firestore wallet credits read error:", e);
      }
    }
    const local = localStorage.getItem('vfs_wallet_credits');
    return local ? JSON.parse(local) : {};
  },
'''

if 'getCustomerWalletBalance' not in admin_js:
    admin_js = admin_js.replace('window.VFS_DB = {', 'window.VFS_DB = {' + wallet_vfs_db_methods)

with open(admin_js_path, 'w', encoding='utf-8') as f:
    f.write(admin_js)
print("Added missing wallet methods to window.VFS_DB in admin/admin.js")


# 2. Attach Google Sign In handler in wholesale.js and app.js
google_signin_js = '''
// ── Google Sign In Handler ──
window.handleGoogleSignIn = async function() {
  try {
    if (window.VFS_CLOUD_ACTIVE && window.firebase && firebase.auth) {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      const user = result.user;
      
      const userPhone = user.phoneNumber ? user.phoneNumber.replace(/\D/g, '').replace(/^91/, '') : '';
      const userName = user.displayName || 'Reseller Customer';
      
      if (userPhone && userPhone.length === 10) {
        localStorage.setItem('vfs_customer_phone', userPhone);
      }
      
      const authScreen = document.getElementById('royalScreenAuth');
      const regScreen = document.getElementById('royalScreenRegister');
      const unlockScreen = document.getElementById('royalScreenUnlock');
      
      if (authScreen) authScreen.style.display = 'none';
      if (regScreen) {
        const nameInput = document.getElementById('royalRegName');
        if (nameInput) nameInput.value = userName;
        regScreen.style.display = 'block';
      } else if (unlockScreen) {
        unlockScreen.style.display = 'block';
      }
      
      if (typeof toast === 'function') toast(`Signed in as ${userName} ✓`);
    } else {
      const phonePrompt = prompt("Enter your 10-digit mobile number to complete Reseller Google Sign In:");
      if (phonePrompt && phonePrompt.trim().replace(/\D/g, '').length === 10) {
        const cleanPhone = phonePrompt.trim().replace(/\D/g, '');
        localStorage.setItem('vfs_customer_phone', cleanPhone);
        const authScreen = document.getElementById('royalScreenAuth');
        const regScreen = document.getElementById('royalScreenRegister');
        if (authScreen) authScreen.style.display = 'none';
        if (regScreen) regScreen.style.display = 'block';
        if (typeof toast === 'function') toast("Signed in successfully!");
      }
    }
  } catch(err) {
    console.error("Google Sign-In Error:", err);
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
      const phonePrompt = prompt("Google Popup was blocked. Enter your 10-digit mobile number to sign in:");
      if (phonePrompt && phonePrompt.trim().replace(/\D/g, '').length === 10) {
        const cleanPhone = phonePrompt.trim().replace(/\D/g, '');
        localStorage.setItem('vfs_customer_phone', cleanPhone);
        const authScreen = document.getElementById('royalScreenAuth');
        const regScreen = document.getElementById('royalScreenRegister');
        if (authScreen) authScreen.style.display = 'none';
        if (regScreen) regScreen.style.display = 'block';
      }
    } else {
      alert("Google Sign-In Note: " + (err.message || "Please sign in using mobile number."));
    }
  }
};

function initGoogleSignInListeners() {
  const gBtn1 = document.getElementById('royalBtnGoogleSignIn');
  if (gBtn1) gBtn1.onclick = window.handleGoogleSignIn;
  
  const gBtn2 = document.getElementById('googleSignInBtn');
  if (gBtn2) gBtn2.onclick = window.handleGoogleSignIn;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGoogleSignInListeners);
} else {
  initGoogleSignInListeners();
}
'''

def append_google_auth(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    if 'window.handleGoogleSignIn' not in code:
        code += '\n\n' + google_signin_js
    else:
        code = re.sub(r'// ── Google Sign In Handler ──[\s\S]*', google_signin_js, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Added Google Sign In handler to {file_path}")

append_google_auth(app_js_path)
append_google_auth(wholesale_js_path)
