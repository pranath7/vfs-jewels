import os
import re

# 1. Add #walletModal styling to style.css
style_css_path = 'style.css'
with open(style_css_path, 'r', encoding='utf-8') as f:
    css = f.read()

wallet_css = '''
/* Customer VFS Wallet Modal Overlay */
#walletModal {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(0, 0, 0, 0.82) !important;
  z-index: 9999999 !important;
  display: none;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
  padding: 16px;
}
'''

if '#walletModal' not in css:
    css += '\n' + wallet_css
    with open(style_css_path, 'w', encoding='utf-8') as f:
        f.write(css)
    print("Added #walletModal fixed positioning CSS to style.css")

# 2. Update index.html & wholesale.html walletModal HTML structure
new_modal_html = '''  <!-- CUSTOMER VFS WALLET MODAL -->
  <div id="walletModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; width:100vw; height:100vh; background:rgba(0,0,0,0.82); align-items:center; justify-content:center; z-index:9999999; backdrop-filter:blur(6px); padding:16px;">
    <div class="modal-card" style="max-width: 480px; width: 100%; padding: 24px; border-radius: 12px; background: var(--color-surface, #fff); border: 1px solid var(--color-border, #ddd); box-shadow: 0 12px 40px rgba(0,0,0,0.4); color: var(--color-on-surface, #121212); position: relative;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--color-border, #eee); padding-bottom:12px;">
        <h3 style="margin:0; font-size:1.5rem; color:var(--color-on-surface, #121212); font-weight:700; display:flex; align-items:center; gap:8px;">
          <span>👛</span> <span>VFS Wallet &amp; Store Credit</span>
        </h3>
        <button class="close-modal" id="closeWalletModal" onclick="document.getElementById('walletModal').style.display='none'; document.body.style.overflow='';" style="position:static; margin:0; background:none; border:none; color:var(--color-muted, #777); font-size:2rem; cursor:pointer; line-height:1;">&times;</button>
      </div>
      
      <div id="walletViewLoggedOut">
        <p style="font-size:1.2rem; color:var(--color-muted, #666); margin-bottom:16px; line-height:1.5;">Enter your 10-digit mobile number to access your VFS Wallet balance and refund credits saved in cloud.</p>
        <form id="walletLoginForm" style="display:flex; flex-direction:column; gap:12px;">
          <input type="tel" id="walletLoginPhone" placeholder="Enter 10-digit Mobile Number" maxlength="10" required style="padding:12px; font-size:1.3rem; border:1px solid var(--color-border, #ccc); border-radius:var(--rounded-md, 6px); outline:none; background:var(--color-surface-card, #f9f9f9); color:var(--color-on-surface, #121212);">
          <button type="submit" class="btn-primary" style="padding:12px; font-size:1.3rem; font-weight:800; background:var(--color-secondary, #D4AF37); color:#121212; border:none; border-radius:6px; cursor:pointer;">Access Wallet Balance →</button>
        </form>
      </div>

      <div id="walletViewLoggedIn" style="display:none;">
        <div style="background:linear-gradient(135deg, #1c202c 0%, #2a2f42 100%); border:1px solid #D4AF37; border-radius:10px; padding:20px; color:#fff; text-align:center; margin-bottom:20px;">
          <div style="font-size:1.1rem; color:#D4AF37; text-transform:uppercase; letter-spacing:0.08em; font-weight:700; margin-bottom:6px;">Available Wallet Balance</div>
          <div id="walletBalanceDisplay" style="font-size:2.8rem; font-weight:900; color:#D4AF37;">₹0.00</div>
          <div id="walletUserPhoneDisplay" style="font-size:1.15rem; color:#aaa; margin-top:6px;">Phone: +91 ----------</div>
        </div>
        <p style="font-size:1.15rem; color:var(--color-muted, #666); line-height:1.5; margin-bottom:16px;">✨ Your wallet balance is automatically available at checkout to pay for future orders.</p>
        <button id="walletSwitchUserBtn" style="background:none; border:none; color:#D4AF37; font-size:1.15rem; font-weight:700; cursor:pointer; text-decoration:underline;">Switch Mobile Number</button>
      </div>
    </div>
  </div>'''

def replace_wallet_modal_in_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'<!-- CUSTOMER VFS WALLET MODAL -->[\s\S]*?<div id="walletModal"[\s\S]*?</div>\s*</div>\s*</div>', new_modal_html, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Replaced walletModal in {file_path}")

replace_wallet_modal_in_html('index.html')
replace_wallet_modal_in_html('wholesale.html')

# 3. Update app.js & wholesale.js openWalletModalFunc
new_open_func = '''window.openWalletModalFunc = async function() {
  const modal = document.getElementById('walletModal');
  if (!modal) {
    console.error("Wallet modal element not found!");
    return;
  }
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
};'''

def update_open_func_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'window\.openWalletModalFunc\s*=\s*async\s*function\(\)\s*\{[\s\S]*?\};', new_open_func, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated window.openWalletModalFunc in {file_path}")

update_open_func_js('app.js')
update_open_func_js('wholesale.js')
