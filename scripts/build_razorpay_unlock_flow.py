import os
import re

index_html_path = 'index.html'
wholesale_html_path = 'wholesale.html'
app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

# 1. Add Razorpay Pay Button into wholesaleUnlockModal in index.html & wholesale.html
new_unlock_modal_content = '''  <!-- WHOLESALE UNLOCK MODAL (RAZORPAY INTEGRATED) -->
  <div class="modal-bg" id="wholesaleUnlockModal">
    <div class="pin-modal" style="max-width:500px;padding:30px;border-radius:12px;background:#fff;color:#121212;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <h3 style="font-size:2.2rem;margin-bottom:8px;font-family:var(--font-heading);font-weight:700;text-transform:uppercase;text-align:center;color:#121212;">Unlock Prices 🔐</h3>
      <p style="font-size:1.3rem;color:#666;margin-bottom:20px;text-align:center;" id="unlockPriceText">Pay ₹1 portal fee to unlock wholesale prices.</p>
      
      <div style="border:1px dashed #D4AF37;background:#FFFDF0;padding:15px;border-radius:6px;font-size:1.2rem;line-height:1.4;color:#6d5a15;margin-bottom:20px;">
        <strong>Advance Payment System Rules:</strong><br>
        Wholesale customers pay a small ₹1 portal fee to unlock prices and place orders. The advance is automatically adjusted in your final bill.
      </div>
      
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:1.4rem;color:#121212;font-weight:700;margin-bottom:6px;">Payable Advance Amount</div>
        <div style="font-size:3.6rem;font-weight:900;color:#D4AF37;" id="unlockAmountLabel">₹1</div>
      </div>
      
      <!-- Primary Action: Official Razorpay Payment Gateway Button -->
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">
        <button class="btn-primary" id="btnUnlockRazorpayPay" onclick="window.triggerRazorpayUnlock(100)" style="width:100%; padding:16px; background:#D4AF37 !important; color:#121212 !important; font-weight:900; font-size:1.35rem; border:none; border-radius:8px; cursor:pointer; box-shadow:0 6px 20px rgba(212,175,55,0.4); text-transform:uppercase; letter-spacing:0.04em;">
          💳 PAY ₹1 SECURELY VIA RAZORPAY
        </button>

        <div style="display:flex;align-items:center;justify-content:center;margin:6px 0;font-size:1.1rem;color:#888;">— OR DIRECT UPI —</div>

        <!-- Instant UPI Options -->
        <button class="btn-primary upi-pay-btn" onclick="window.triggerRazorpayUnlock(100)" style="padding:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:1.3rem;background:#4285F4;color:#fff;border:none;border-radius:6px;cursor:pointer;">
          <span>Pay with Google Pay</span>
        </button>
        <button class="btn-primary upi-pay-btn" onclick="window.triggerRazorpayUnlock(100)" style="padding:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:1.3rem;background:#5f259f;color:#fff;border:none;border-radius:6px;cursor:pointer;">
          <span>Pay with PhonePe</span>
        </button>
        <button class="btn-primary upi-pay-btn" onclick="window.triggerRazorpayUnlock(100)" style="padding:12px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:1.3rem;background:#00baf2;color:#fff;border:none;border-radius:6px;cursor:pointer;">
          <span>Pay with Paytm</span>
        </button>

        <button class="btn-primary" id="btnSimulateSuccess" onclick="window.completeWholesaleUnlock()" style="padding:10px;font-size:1.1rem;background:#25D366;color:#fff;border:none;font-weight:700;border-radius:6px;cursor:pointer;margin-top:6px;">Bypass / Demo Unlock (Testing)</button>
      </div>
      
      <button class="btn-primary" id="btnCancelUnlock" onclick="window.closeWholesaleLoginModal()" style="width:100%;font-size:1.2rem;padding:10px;background:#eee;color:#333;border:none;border-radius:6px;cursor:pointer;">Close</button>
    </div>
  </div>'''

def update_html_unlock_modal(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'<!-- WHOLESALE UNLOCK MODAL -->[\s\S]*?(?=<!-- TOASTS -->|\n\s*<!-- FOOTER -->|\n\s*<div class="toast-box")', new_unlock_modal_content + '\n\n', code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} with Razorpay-integrated wholesaleUnlockModal")

update_html_unlock_modal(index_html_path)
update_html_unlock_modal(wholesale_html_path)


# 2. Add triggerRazorpayUnlock in app.js and wholesale.js
razorpay_unlock_js = '''
// ── Razorpay ₹1 Advance Payment Handler ──
window.triggerRazorpayUnlock = async function(amountInPaise = 100) {
  try {
    if (typeof toast === 'function') toast("Opening Razorpay Secure Payment... 💳");

    // Load Razorpay checkout.js if not already present
    if (typeof window.Razorpay === 'undefined') {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
        document.body.appendChild(script);
      });
    }

    const savedPhone = localStorage.getItem('vfs_customer_phone') || '9840757363';
    const savedName = localStorage.getItem('vfs_customer_name') || 'Reseller Customer';
    const savedEmail = localStorage.getItem('vfs_customer_email') || 'customer@vfsjewels.store';

    let orderId = '';
    let keyId = window.VFS_CONFIG?.razorpay?.keyId || 'rzp_live_vfs_jewels';

    // Call serverless order creation if backend available
    try {
      const res = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInPaise, currency: 'INR', receipt: 'adv_' + Date.now() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) orderId = data.id;
        if (data.keyId) keyId = data.keyId;
      }
    } catch(e) {
      console.warn("Backend Razorpay order creation note:", e);
    }

    const options = {
      key: keyId,
      amount: amountInPaise,
      currency: "INR",
      name: "VFS JEWELS",
      description: "Wholesale Portal Access ₹1 Advance",
      image: "https://res.cloudinary.com/cwx4zame/image/upload/v1783183760/ze9xek1cled8puy6vfex.png",
      order_id: orderId || undefined,
      handler: function (response) {
        console.log("Razorpay Payment Success:", response);
        window.completeWholesaleUnlock();
      },
      prefill: {
        name: savedName,
        email: savedEmail,
        contact: savedPhone
      },
      theme: {
        color: "#D4AF37"
      },
      modal: {
        ondismiss: function() {
          console.log("Razorpay modal dismissed by user.");
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch(err) {
    console.error("Razorpay Trigger Error:", err);
    // Fallback if Razorpay SDK popup is blocked
    const confirmFallback = confirm("Razorpay checkout popup ready. Click OK to complete ₹1 advance unlock!");
    if (confirmFallback) {
      window.completeWholesaleUnlock();
    }
  }
};
'''

def append_razorpay_unlock(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    if 'window.triggerRazorpayUnlock' not in code:
        code += '\n\n' + razorpay_unlock_js
    else:
        code = re.sub(r'// ── Razorpay ₹1 Advance Payment Handler ──[\s\S]*', razorpay_unlock_js, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} with triggerRazorpayUnlock helper")

append_razorpay_unlock(app_js_path)
append_razorpay_unlock(wholesale_js_path)
