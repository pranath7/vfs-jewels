import os
import re

app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

wallet_checkout_check_code = '''// Secure Razorpay Online Payment Flow
$('#coRazorpayBtn').addEventListener('click', async () => {
  if (!activeCheckoutOrder) return;
  
  const payBtn = $('#coRazorpayBtn');
  payBtn.disabled = true;
  const originalText = payBtn.innerHTML;

  // ── Handling 100% Wallet Credit Paid Orders (Grand Total = ₹0) ──
  if (Number(activeCheckoutOrder.total || 0) <= 0) {
    payBtn.innerHTML = '<span style="font-size:1.1rem;">Processing Wallet Payment...</span>';
    try {
      const usedWallet = Number(activeCheckoutOrder.walletDiscount || 0);
      if (usedWallet > 0 && activeCheckoutOrder.phone && window.VFS_DB && window.VFS_DB.getCustomerWalletBalance) {
        const currentBal = await window.VFS_DB.getCustomerWalletBalance(activeCheckoutOrder.phone);
        const remainingBal = Math.max(0, currentBal - usedWallet);
        await window.VFS_DB.saveWalletBalance(activeCheckoutOrder.phone, remainingBal);
      }
      if (typeof toast === 'function') toast("Paid via Wallet Credit! 👛");
      await finalizeOrderAndProceed('Wallet Credit', 'WAL_' + Date.now());
      return;
    } catch(wErr) {
      console.error("Wallet checkout error:", wErr);
      alert("Failed to process wallet payment: " + wErr.message);
      payBtn.disabled = false;
      payBtn.innerHTML = originalText;
      return;
    }
  }

  payBtn.innerHTML = '<span style="font-size:1.1rem;">Initializing Secure Payment...</span>';'''

def update_wallet_checkout(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    target = "$('#coRazorpayBtn').addEventListener('click', async () => {\n  if (!activeCheckoutOrder) return;\n  \n  const payBtn = $('#coRazorpayBtn');\n  payBtn.disabled = true;\n  const originalText = payBtn.innerHTML;\n  payBtn.innerHTML = '<span style=\"font-size:1.1rem;\">Initializing Secure Payment...</span>';"

    if target in code:
        code = code.replace(target, wallet_checkout_check_code)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"Updated {file_path} with zero-grand-total wallet credit checkout handling")
    else:
        print(f"Target pattern not found in {file_path}")

update_wallet_checkout(app_js_path)
update_wallet_checkout(wholesale_js_path)
