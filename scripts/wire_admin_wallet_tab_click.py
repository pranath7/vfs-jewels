import os

admin_js_path = os.path.join('admin', 'admin.js')

with open(admin_js_path, 'r', encoding='utf-8') as f:
    js = f.read()

tab_listener = '''
// Handle top header Wallets button & bottom nav wallets button click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tab="wallets"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bottom-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = '';
      });
      const navBtn = document.querySelector('.bottom-nav-btn[data-tab="wallets"]');
      if (navBtn) navBtn.classList.add('active');
      const panel = document.getElementById('panelWallets');
      if (panel) {
        panel.classList.add('active');
        panel.style.display = 'block';
      }
      const title = document.getElementById('tabTitle');
      const sub = document.getElementById('tabSubtitle');
      if (title) title.textContent = "👛 Customer Wallets & Store Credit Refunds";
      if (sub) sub.textContent = "View customer wallet balances, search by phone number, and credit store refunds.";
      if (typeof window.loadAdminWallets === 'function') {
        window.loadAdminWallets();
      }
    });
  });
});
'''

if 'data-tab="wallets"' not in js or 'window.loadAdminWallets()' not in js:
    js += '\n\n' + tab_listener
else:
    js += '\n\n' + tab_listener

with open(admin_js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Wired admin wallet tab click handler in admin/admin.js")
