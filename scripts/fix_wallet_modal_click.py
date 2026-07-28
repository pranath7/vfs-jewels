import os
import re

# 1. Update index.html & wholesale.html with onclick="window.openWalletModalFunc()"
def update_storefront_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    old_wallet_btn = '<button class="icon-btn" id="openWalletModal" aria-label="Wallet" title="VFS Customer Wallet & Refund Balance" style="font-size:1.1rem; padding:4px 8px; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--color-secondary); font-weight:700; display:inline-flex; align-items:center; gap:4px;">👛 Wallet</button>'
    new_wallet_btn = '<button class="icon-btn" id="openWalletModal" onclick="window.openWalletModalFunc()" aria-label="Wallet" title="VFS Customer Wallet & Refund Balance" style="font-size:1.1rem; padding:4px 8px; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--color-secondary); font-weight:700; display:inline-flex; align-items:center; gap:4px;">👛 Wallet</button>'

    code = code.replace(old_wallet_btn, new_wallet_btn)

    old_close_btn = '<button class="close-modal" id="closeWalletModal" style="position:static; margin:0; background:none; border:none; color:var(--color-muted); font-size:2rem; cursor:pointer;">&times;</button>'
    new_close_btn = '<button class="close-modal" id="closeWalletModal" onclick="document.getElementById(\'walletModal\').style.display=\'none\'" style="position:static; margin:0; background:none; border:none; color:var(--color-muted); font-size:2rem; cursor:pointer;">&times;</button>'

    code = code.replace(old_close_btn, new_close_btn)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} with inline onclick handlers for Wallet modal")

update_storefront_html('index.html')
update_storefront_html('wholesale.html')


# 2. Update app.js & wholesale.js with window.openWalletModalFunc
global_wallet_function = '''
// ── Global Customer Wallet Modal Triggers ──
window.openWalletModalFunc = async function() {
  const modal = document.getElementById('walletModal');
  if (!modal) return;
  modal.style.display = 'flex';
  
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

  if (openBtn) {
    openBtn.onclick = window.openWalletModalFunc;
  }
  if (closeBtn) {
    closeBtn.onclick = () => { if (modal) modal.style.display = 'none'; };
  }
  if (modal) {
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
  }
  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      let phone = phoneInput.value.trim().replace(/\\D/g, '');
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

// Execute immediately upon script load & DOM ready
initWalletModalListeners();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWalletModalListeners);
}
'''

def update_storefront_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Remove old initWalletModalLogic block if exists
    code = re.sub(r'// ── VFS Customer Wallet & Cloud Refund Modal System ──[\s\S]*', '', code)

    code += '\n\n' + global_wallet_function

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} with global window.openWalletModalFunc")

update_storefront_js('app.js')
update_storefront_js('wholesale.js')
