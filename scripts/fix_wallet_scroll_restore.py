import os
import re

# 1. Update index.html & wholesale.html close button to use window.closeWalletModalFunc()
def update_storefront_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    old_close_btn = r'onclick="document\.getElementById\(\'walletModal\'\)\.style\.display=\'none\';?\s*document\.body\.style\.overflow=\'\';?"'
    new_close_btn = 'onclick="window.closeWalletModalFunc()"'

    code = re.sub(old_close_btn, new_close_btn, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated close button in {file_path}")

update_storefront_html('index.html')
update_storefront_html('wholesale.html')


# 2. Update app.js & wholesale.js with window.closeWalletModalFunc & scroll restore listeners
wallet_close_js = '''
// ── Global Customer Wallet Modal Close & Scroll Restore ──
window.closeWalletModalFunc = function() {
  const modal = document.getElementById('walletModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  document.body.style.overflowY = 'auto';
};

window.openWalletModalFunc = async function() {
  const modal = document.getElementById('walletModal');
  if (!modal) return;
  modal.style.setProperty('display', 'flex', 'important');
  document.body.style.overflow = 'hidden';
  
  const loggedOutView = document.getElementById('walletViewLoggedOut');
  const loggedInView = document.getElementById('walletViewLoggedIn');
  const balDisplay = document.getElementById('walletBalanceDisplay');
  const userPhoneDisplay = document.getElementById('walletUserPhoneDisplay');

  const savedPhone = localStorage.getItem('vfs_customer_phone');
  if (savedPhone && savedPhone.length === 10) {
    if (loggedOutView) loggedOutView.style.display = 'none';
    if (loggedInView) loggedInView.style.display = 'block';
    if (userPhoneDisplay) userPhoneDisplay.textContent = `Phone: +91 ${savedPhone}`;
    if (balDisplay) balDisplay.textContent = 'Checking Cloud...';
    
    try {
      const bal = await window.VFS_DB.getCustomerWalletBalance(savedPhone);
      if (balDisplay) balDisplay.textContent = typeof fmt === 'function' ? fmt(bal) : '₹' + bal.toFixed(2);
    } catch(e) {
      if (balDisplay) balDisplay.textContent = '₹0.00';
    }
  } else {
    if (loggedOutView) loggedOutView.style.display = 'block';
    if (loggedInView) loggedInView.style.display = 'none';
  }
};

function initWalletModalListeners() {
  const modal = document.getElementById('walletModal');
  const openBtn = document.getElementById('openWalletModal');
  const closeBtn = document.getElementById('closeWalletModal');
  const loginForm = document.getElementById('walletLoginForm');
  const phoneInput = document.getElementById('walletLoginPhone');
  const switchUserBtn = document.getElementById('walletSwitchUserBtn');

  if (openBtn) openBtn.onclick = window.openWalletModalFunc;
  if (closeBtn) closeBtn.onclick = window.closeWalletModalFunc;

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) window.closeWalletModalFunc();
    };
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closeWalletModalFunc();
  });

  window.addEventListener('popstate', () => {
    window.closeWalletModalFunc();
  });

  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      let phone = phoneInput.value.trim().replace(/[^0-9]/g, '');
      if (phone.length === 10) {
        localStorage.setItem('vfs_customer_phone', phone);
        await window.openWalletModalFunc();
      } else {
        alert('Please enter a valid 10-digit mobile number.');
      }
    };
  }

  if (switchUserBtn) {
    switchUserBtn.onclick = () => {
      localStorage.removeItem('vfs_customer_phone');
      const loggedOutView = document.getElementById('walletViewLoggedOut');
      const loggedInView = document.getElementById('walletViewLoggedIn');
      if (loggedOutView) loggedOutView.style.display = 'block';
      if (loggedInView) loggedInView.style.display = 'none';
      if (phoneInput) {
        phoneInput.value = '';
        phoneInput.focus();
      }
    };
  }
}

initWalletModalListeners();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWalletModalListeners);
}
'''

def update_storefront_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'window\.openWalletModalFunc\s*=\s*async\s*function\(\)\s*\{[\s\S]*', wallet_close_js, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} with window.closeWalletModalFunc")

update_storefront_js('app.js')
update_storefront_js('wholesale.js')
