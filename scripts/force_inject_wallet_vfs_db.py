import os

admin_js_path = os.path.join('admin', 'admin.js')

with open(admin_js_path, 'r', encoding='utf-8') as f:
    code = f.read()

wallet_methods = '''
  // ── Customer Wallet & Store Credit ──
  getCustomerWalletBalance: async function(phone) {
    const cleanPhone = String(phone || '').replace(/\\D/g, '');
    if (!cleanPhone) return 0;
    if (window.VFS_CLOUD_ACTIVE && window.db) {
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
    const cleanPhone = String(phone || '').replace(/\\D/g, '');
    if (!cleanPhone) return;
    const numBal = Math.max(0, Number(balance) || 0);
    if (window.VFS_CLOUD_ACTIVE && window.db) {
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
    if (window.VFS_CLOUD_ACTIVE && window.db) {
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

if 'getCustomerWalletBalance' not in code:
    code = code.replace('window.VFS_DB = {', 'window.VFS_DB = {' + wallet_methods)
    with open(admin_js_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESSFULLY INJECTED wallet methods into window.VFS_DB in admin/admin.js!")
else:
    print("getCustomerWalletBalance ALREADY PRESENT!")
