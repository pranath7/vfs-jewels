import os
import re

# ── 1. UPDATE index.html & wholesale.html Navbar Header & Wallet Modal ──
def update_storefront_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Add Wallet Button right next to Mode button
    old_mode_btn = '<button class="icon-btn" id="openModeModal" aria-label="Change Mode" title="Wholesale / Retail Preference" style="font-size:1.1rem; padding:4px 8px; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-secondary);">🔄 Mode</button>'
    new_mode_wallet_btn = old_mode_btn + '\n          <button class="icon-btn" id="openWalletModal" aria-label="Wallet" title="VFS Customer Wallet & Refund Balance" style="font-size:1.1rem; padding:4px 8px; border-radius:4px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--color-secondary); font-weight:700; display:inline-flex; align-items:center; gap:4px;">👛 Wallet</button>'

    if 'openWalletModal' not in code:
        code = code.replace(old_mode_btn, new_mode_wallet_btn)

    # Add Wallet Modal HTML before closing body tag if not present
    wallet_modal_html = '''
  <!-- CUSTOMER VFS WALLET MODAL -->
  <div class="modal-backdrop" id="walletModal" style="display:none; z-index:100000;">
    <div class="modal-card" style="max-width: 480px; width: 92%; padding: 24px; border-radius: 12px; background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--color-border); padding-bottom:12px;">
        <h3 style="margin:0; font-size:1.5rem; color:var(--color-on-surface); font-weight:700; display:flex; align-items:center; gap:8px;">
          <span>👛</span> <span>VFS Wallet &amp; Store Credit</span>
        </h3>
        <button class="close-modal" id="closeWalletModal" style="position:static; margin:0; background:none; border:none; color:var(--color-muted); font-size:2rem; cursor:pointer;">&times;</button>
      </div>
      
      <div id="walletViewLoggedOut">
        <p style="font-size:1.2rem; color:var(--color-muted); margin-bottom:16px; line-height:1.5;">Enter your 10-digit mobile number to access your VFS Wallet balance and refund credits saved in cloud.</p>
        <form id="walletLoginForm" style="display:flex; flex-direction:column; gap:12px;">
          <input type="tel" id="walletLoginPhone" placeholder="Enter 10-digit Mobile Number" maxlength="10" required style="padding:12px; font-size:1.3rem; border:1px solid var(--color-border); border-radius:var(--rounded-md); outline:none; background:var(--color-surface-card); color:var(--color-on-surface);">
          <button type="submit" class="btn-primary" style="padding:12px; font-size:1.3rem; font-weight:800; background:var(--color-secondary); color:#121212; border:none; cursor:pointer;">Access Wallet Balance →</button>
        </form>
      </div>

      <div id="walletViewLoggedIn" style="display:none;">
        <div style="background:linear-gradient(135deg, #1c202c 0%, #2a2f42 100%); border:1px solid var(--color-secondary); border-radius:10px; padding:20px; color:#fff; text-align:center; margin-bottom:20px;">
          <div style="font-size:1.1rem; color:var(--color-secondary); text-transform:uppercase; letter-spacing:0.08em; font-weight:700; margin-bottom:6px;">Available Wallet Balance</div>
          <div id="walletBalanceDisplay" style="font-size:2.8rem; font-weight:900; color:#D4AF37;">₹0.00</div>
          <div id="walletUserPhoneDisplay" style="font-size:1.15rem; color:#aaa; margin-top:6px;">Phone: +91 ----------</div>
        </div>
        <p style="font-size:1.15rem; color:var(--color-muted); line-height:1.5; margin-bottom:16px;">✨ Your wallet balance is automatically available at checkout to pay for future orders.</p>
        <button id="walletSwitchUserBtn" style="background:none; border:none; color:var(--color-secondary); font-size:1.15rem; font-weight:700; cursor:pointer; text-decoration:underline;">Switch Mobile Number</button>
      </div>
    </div>
  </div>
'''

    if 'walletModal' not in code:
        code = code.replace('</body>', wallet_modal_html + '\n</body>')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} with Wallet button & modal HTML")

update_storefront_html('index.html')
update_storefront_html('wholesale.html')

# ── 2. UPDATE admin/admin.html with Wallets Tab & Nav Button ──
admin_html_path = os.path.join('admin', 'admin.html')
with open(admin_html_path, 'r', encoding='utf-8') as f:
    a_html = f.read()

# Add Wallets nav button if missing
old_nav_slots = '<button class="bottom-nav-btn" data-tab="slots">\n      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>\n      <span>8:30 PM Slots</span>\n    </button>'
new_nav_wallets = '<button class="bottom-nav-btn" data-tab="wallets">\n      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>\n      <span>Wallets</span>\n    </button>\n    ' + old_nav_slots

if 'data-tab="wallets"' not in a_html:
    a_html = a_html.replace(old_nav_slots, new_nav_wallets)

# Add panelWallets tab section
panel_wallets_html = '''
      <!-- TAB: CUSTOMER WALLETS & REFUNDS -->
      <section class="tab-panel" id="panelWallets">
        <div class="orders-panel-container">
          <div class="panel-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h2 style="color:var(--color-secondary);">👛 Customer Wallets &amp; Store Credit Refunds</h2>
            <button class="btn-secondary-dark" id="btnRefreshWallets" onclick="loadAdminWallets()" style="padding:8px 16px; font-size:1.2rem; cursor:pointer;">🔄 Refresh Wallets</button>
          </div>
          <p style="font-size:1.25rem; color:#8e8e93; margin-bottom:20px;">Manage customer wallet balances and credit refund amounts directly to customer mobile numbers. 100% saved in Cloud Firestore (<code>wallet_credits</code> collection).</p>
          
          <!-- Credit Refund Form -->
          <div style="background:var(--color-surface-dark, #1e2330); border:1px solid var(--color-border, #333); padding:24px; border-radius:var(--rounded-md, 8px); margin-bottom:30px; max-width:650px;">
            <h3 style="color:#fff; margin-bottom:14px; font-size:1.4rem;">➕ Credit Refund / Add Store Credit</h3>
            <form id="adminCreditWalletForm" style="display:flex; flex-direction:column; gap:14px;">
              <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <input type="text" id="adminWalletPhone" placeholder="Customer Mobile (e.g. 9840757363)" required style="flex:1; min-width:200px; padding:12px; font-size:1.25rem; border:1px solid #444; border-radius:6px; background:#12151e; color:#fff; outline:none;">
                <input type="number" id="adminWalletAmount" placeholder="Amount (₹) e.g. 500" min="1" required style="width:160px; padding:12px; font-size:1.25rem; border:1px solid #444; border-radius:6px; background:#12151e; color:#fff; outline:none;">
              </div>
              <input type="text" id="adminWalletNote" placeholder="Reason / Note (e.g. Refund for Order #VFS-98407)" style="width:100%; padding:12px; font-size:1.25rem; border:1px solid #444; border-radius:6px; background:#12151e; color:#fff; outline:none;">
              <button type="submit" class="btn-primary" style="padding:12px 24px; font-size:1.25rem; font-weight:800; background:#D4AF37; color:#121212; border:none; cursor:pointer; align-self:flex-start;">Credit Refund to Wallet ✓</button>
            </form>
          </div>

          <!-- Active Wallets List -->
          <div class="customer-table-wrap">
            <table class="customer-table" style="width:100%;">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer Phone</th>
                  <th>Wallet Balance</th>
                  <th>Last Note / Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="walletTableBody">
                <tr><td colspan="5" style="text-align:center; padding:30px; color:#aaa;">Loading customer wallet accounts from Cloud...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
'''

if 'id="panelWallets"' not in a_html:
    a_html = a_html.replace('<!-- TAB: REPORTS & ANALYTICS -->', panel_wallets_html + '\n\n      <!-- TAB: REPORTS & ANALYTICS -->')

with open(admin_html_path, 'w', encoding='utf-8') as f:
    f.write(a_html)
print("Updated admin/admin.html with Wallets tab & nav button")

# ── 3. UPDATE admin/admin.js with loadAdminWallets & Credit submit handler ──
admin_js_path = os.path.join('admin', 'admin.js')
with open(admin_js_path, 'r', encoding='utf-8') as f:
    a_js = f.read()

admin_wallet_script = '''
// ── Customer Wallet & Cloud Refund Management ──
window.loadAdminWallets = async function() {
  const tbody = document.getElementById('walletTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#aaa;">Fetching wallet accounts...</td></tr>';
  
  try {
    const creditsMap = await window.VFS_DB.getWalletCredits();
    const phones = Object.keys(creditsMap);
    
    if (phones.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#aaa;">No wallet credits found in database.</td></tr>';
      return;
    }
    
    tbody.innerHTML = phones.map((phone, idx) => {
      const bal = creditsMap[phone] || 0;
      return `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>+91 ${phone}</strong></td>
          <td><span style="font-weight:900; color:#D4AF37; font-size:1.3rem;">${fmt(bal)}</span></td>
          <td>Store Credit / Refund</td>
          <td>
            <button class="btn-card-primary" onclick="quickCreditWalletPrompt('${phone}')" style="padding:6px 12px; font-size:1.1rem;">+ Credit Refund</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch(e) {
    console.error("Error loading wallets:", e);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#ff3b30;">Error loading wallets.</td></tr>';
  }
};

window.quickCreditWalletPrompt = function(phone) {
  document.getElementById('adminWalletPhone').value = phone;
  document.getElementById('adminWalletAmount').focus();
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('adminCreditWalletForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let phone = document.getElementById('adminWalletPhone').value.trim().replace(/\\D/g, '');
      if (phone.length === 10) phone = phone;
      else if (phone.length === 12 && phone.startsWith('91')) phone = phone.slice(2);
      
      const amt = parseFloat(document.getElementById('adminWalletAmount').value) || 0;
      const note = document.getElementById('adminWalletNote').value.trim() || 'Store Credit Refund';
      
      if (!phone || phone.length !== 10 || amt <= 0) {
        adminToast('Please enter a valid 10-digit phone and credit amount!', 'error');
        return;
      }
      
      try {
        const currentBal = await window.VFS_DB.getCustomerWalletBalance(phone);
        const newBal = currentBal + amt;
        await window.VFS_DB.saveWalletBalance(phone, newBal);
        
        adminToast(`Credited ${fmt(amt)} to +91 ${phone}! New Balance: ${fmt(newBal)} 👛`);
        document.getElementById('adminWalletAmount').value = '';
        document.getElementById('adminWalletNote').value = '';
        await window.loadAdminWallets();
      } catch(err) {
        console.error("Error crediting wallet:", err);
        adminToast("Failed to credit wallet: " + err.message, "error");
      }
    });
  }
});
'''

if 'window.loadAdminWallets' not in a_js:
    a_js += '\n\n' + admin_wallet_script

with open(admin_js_path, 'w', encoding='utf-8') as f:
    f.write(a_js)
print("Updated admin/admin.js with Cloud Wallet Management")

# ── 4. UPDATE app.js & wholesale.js with Customer Wallet Modal & Checkout Wallet Option ──
def update_storefront_js(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        js_code = f.read()

    wallet_logic = '''
// ── VFS Customer Wallet & Cloud Refund Modal System ──
function initWalletModalLogic() {
  const modal = document.getElementById('walletModal');
  const openBtn = document.getElementById('openWalletModal');
  const closeBtn = document.getElementById('closeWalletModal');
  const loginForm = document.getElementById('walletLoginForm');
  const phoneInput = document.getElementById('walletLoginPhone');
  const loggedOutView = document.getElementById('walletViewLoggedOut');
  const loggedInView = document.getElementById('walletViewLoggedIn');
  const balDisplay = document.getElementById('walletBalanceDisplay');
  const userPhoneDisplay = document.getElementById('walletUserPhoneDisplay');
  const switchUserBtn = document.getElementById('walletSwitchUserBtn');

  if (!modal) return;

  async function checkUserWallet() {
    const savedPhone = localStorage.getItem('vfs_customer_phone');
    if (savedPhone && savedPhone.length === 10) {
      loggedOutView.style.display = 'none';
      loggedInView.style.display = 'block';
      userPhoneDisplay.textContent = `Phone: +91 ${savedPhone}`;
      balDisplay.textContent = 'Checking Cloud...';
      
      const bal = await window.VFS_DB.getCustomerWalletBalance(savedPhone);
      balDisplay.textContent = fmt(bal);
    } else {
      loggedOutView.style.display = 'block';
      loggedInView.style.display = 'none';
    }
  }

  if (openBtn) {
    openBtn.addEventListener('click', async () => {
      modal.style.display = 'flex';
      await checkUserWallet();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let phone = phoneInput.value.trim().replace(/\\D/g, '');
      if (phone.length === 10) {
        localStorage.setItem('vfs_customer_phone', phone);
        await checkUserWallet();
      } else {
        alert('Please enter a valid 10-digit mobile number.');
      }
    });
  }

  if (switchUserBtn) {
    switchUserBtn.addEventListener('click', () => {
      localStorage.removeItem('vfs_customer_phone');
      loggedOutView.style.display = 'block';
      loggedInView.style.display = 'none';
      phoneInput.value = '';
      phoneInput.focus();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initWalletModalLogic();
});
'''

    if 'initWalletModalLogic' not in js_code:
        js_code += '\n\n' + wallet_logic

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(js_code)
    print(f"Updated {file_path} with Wallet modal logic")

update_storefront_js('app.js')
update_storefront_js('wholesale.js')
