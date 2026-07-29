import os
import re

app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'

clean_trigger_razorpay_js = '''// ── Razorpay ₹1 Advance Payment Handler ──
window.triggerRazorpayUnlock = async function(amt = 1) {
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

    const numAmt = Number(amt) || 1;
    const amountInPaise = (numAmt >= 100 && Number.isInteger(numAmt)) ? numAmt : Math.round(numAmt * 100);

    let orderId = '';
    let keyId = window.VFS_CONFIG?.razorpay?.keyId || 'rzp_live_vfs_jewels';

    try {
      const res = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmt, currency: 'INR', receipt: 'adv_' + Date.now() })
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
    alert("Razorpay payment error: " + err.message);
  }
};'''

def update_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'// ── Razorpay ₹1 Advance Payment Handler ──[\s\S]*', clean_trigger_razorpay_js, code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Cleaned triggerRazorpayUnlock in {file_path}")

update_file(app_js_path)
update_file(wholesale_js_path)
