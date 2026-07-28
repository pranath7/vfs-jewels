import os
import re

admin_html_path = os.path.join('admin', 'admin.html')
admin_js_path = os.path.join('admin', 'admin.js')

# 1. Update admin/admin.html header actions & panelWallets tab panel
with open(admin_html_path, 'r', encoding='utf-8') as f:
    a_html = f.read()

# Add Header Action Button
old_header_btns = r'<button id="btnOpenSlotAdmin"[\s\S]*?</button>'
new_header_btns = '''<button id="btnOpenSlotAdmin" class="btn-secondary-dark" style="background:#D4AF37 !important; border-color:#D4AF37 !important; color:#121212 !important; font-weight:800; padding:8px 16px;" data-tab="slots">
          📹 8:30 PM Slots
        </button>
        <button id="btnOpenWalletsAdmin" class="btn-secondary-dark" style="background:#D4AF37 !important; border-color:#D4AF37 !important; color:#121212 !important; font-weight:800; padding:8px 16px;" data-tab="wallets">
          👛 Wallets &amp; Refunds
        </button>'''

if 'id="btnOpenWalletsAdmin"' not in a_html:
    a_html = re.sub(old_header_btns, new_header_btns, a_html)

# Add panelWallets tab panel before panelSlots
panel_wallets_html = '''
      <!-- TAB: CUSTOMER WALLETS & REFUNDS SECTION -->
      <section class="tab-panel" id="panelWallets">
        <div class="orders-panel-container">
          <div class="panel-header-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h2 style="color:var(--color-secondary, #D4AF37);">👛 Customer Wallets &amp; Store Credit Refunds</h2>
            <button class="btn-secondary-dark" id="btnRefreshWallets" onclick="loadAdminWallets()" style="padding:8px 16px; font-size:1.2rem; cursor:pointer;">🔄 Refresh Wallets</button>
          </div>
          <p style="font-size:1.25rem; color:#8e8e93; margin-bottom:24px;">View all active customer wallet balances, search by mobile number, and credit refund amounts. 100% saved in Cloud Firestore (<code>wallet_credits</code> collection).</p>

          <!-- Wallet Summary KPI Cards -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom:24px;">
            <div style="background:#1a1e29; border:1px solid rgba(255,255,255,0.1); padding:20px; border-radius:10px; color:#fff;">
              <span style="font-size:1.1rem; color:#aaa; text-transform:uppercase; font-weight:700;">Total Active Wallets</span>
              <h3 id="adminKpiWalletCount" style="font-size:2.2rem; color:#fff; margin-top:4px;">0</h3>
            </div>
            <div style="background:#1a1e29; border:1px solid #D4AF37; padding:20px; border-radius:10px; color:#fff;">
              <span style="font-size:1.1rem; color:#D4AF37; text-transform:uppercase; font-weight:700;">Total Outstanding Store Credit</span>
              <h3 id="adminKpiWalletTotal" style="font-size:2.2rem; color:#D4AF37; margin-top:4px;">₹0.00</h3>
            </div>
          </div>
          
          <!-- Credit Refund Form -->
          <div style="background:var(--color-surface-dark, #1e2330); border:1px solid var(--color-border, #333); padding:24px; border-radius:8px; margin-bottom:30px; max-width:680px;">
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

          <!-- Active Wallets Search & Table -->
          <div style="margin-bottom:16px;">
            <input type="text" id="adminWalletSearchInput" onkeyup="filterAdminWalletTable()" placeholder="🔍 Search wallets by Mobile Number..." style="width:100%; max-width:400px; padding:10px 14px; font-size:1.25rem; border:1px solid #444; border-radius:6px; background:#12151e; color:#fff; outline:none;">
          </div>

          <div class="customer-table-wrap">
            <table class="customer-table" style="width:100%;">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer Phone</th>
                  <th>Wallet Balance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="walletTableBody">
                <tr><td colspan="4" style="text-align:center; padding:30px; color:#aaa;">Loading customer wallet accounts from Cloud...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
'''

if 'id="panelWallets"' not in a_html:
    a_html = a_html.replace('<!-- TAB: 8:30 PM SLOTS -->', panel_wallets_html + '\n\n      <!-- TAB: 8:30 PM SLOTS -->')

with open(admin_html_path, 'w', encoding='utf-8') as f:
    f.write(a_html)
print("Updated admin/admin.html with Customer Wallets Section panelWallets")


# 2. Update admin/admin.js loadAdminWallets & filterAdminWalletTable
with open(admin_js_path, 'r', encoding='utf-8') as f:
    a_js = f.read()

admin_wallet_script = '''
// ── Customer Wallet & Cloud Refund Management ──
window.loadAdminWallets = async function() {
  const tbody = document.getElementById('walletTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#aaa;">Fetching wallet accounts from Cloud...</td></tr>';
  
  try {
    const creditsMap = await window.VFS_DB.getWalletCredits();
    const phones = Object.keys(creditsMap);
    
    let grandTotal = 0;
    phones.forEach(p => grandTotal += (creditsMap[p] || 0));

    const countEl = document.getElementById('adminKpiWalletCount');
    const totalEl = document.getElementById('adminKpiWalletTotal');
    if (countEl) countEl.textContent = phones.length;
    if (totalEl) totalEl.textContent = typeof fmt === 'function' ? fmt(grandTotal) : '₹' + grandTotal.toFixed(2);
    
    if (phones.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#aaa;">No wallet accounts found in Cloud.</td></tr>';
      return;
    }
    
    tbody.innerHTML = phones.map((phone, idx) => {
      const bal = creditsMap[phone] || 0;
      return `
        <tr class="wallet-row" data-phone="${phone}">
          <td>${idx + 1}</td>
          <td><strong>+91 ${phone}</strong></td>
          <td><span style="font-weight:900; color:#D4AF37; font-size:1.35rem;">${typeof fmt === 'function' ? fmt(bal) : '₹' + bal.toFixed(2)}</span></td>
          <td>
            <button class="btn-card-primary" onclick="quickCreditWalletPrompt('${phone}')" style="padding:6px 14px; font-size:1.1rem; background:#D4AF37; color:#121212; border:none; border-radius:4px; font-weight:700; cursor:pointer;">+ Credit Refund</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch(e) {
    console.error("Error loading wallets:", e);
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#ff3b30;">Error loading wallets from Cloud.</td></tr>';
  }
};

window.filterAdminWalletTable = function() {
  const query = (document.getElementById('adminWalletSearchInput')?.value || '').trim().toLowerCase();
  const rows = document.querySelectorAll('#walletTableBody .wallet-row');
  rows.forEach(row => {
    const phone = row.dataset.phone || '';
    if (!query || phone.includes(query)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
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
      let phone = document.getElementById('adminWalletPhone').value.trim().replace(/[^0-9]/g, '');
      if (phone.length === 12 && phone.startsWith('91')) phone = phone.slice(2);
      
      const amt = parseFloat(document.getElementById('adminWalletAmount').value) || 0;
      const note = document.getElementById('adminWalletNote').value.trim() || 'Store Credit Refund';
      
      if (!phone || phone.length !== 10 || amt <= 0) {
        adminToast('Please enter a valid 10-digit phone number and amount!', 'error');
        return;
      }
      
      try {
        const currentBal = await window.VFS_DB.getCustomerWalletBalance(phone);
        const newBal = currentBal + amt;
        await window.VFS_DB.saveWalletBalance(phone, newBal);
        
        adminToast(`Credited ₹${amt} to +91 ${phone}! New Balance: ₹${newBal} 👛`);
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
else:
    a_js = re.sub(r'// ── Customer Wallet & Cloud Refund Management ──[\s\S]*', admin_wallet_script, a_js)

with open(admin_js_path, 'w', encoding='utf-8') as f:
    f.write(a_js)
print("Updated admin/admin.js with loadAdminWallets & filterAdminWalletTable")
