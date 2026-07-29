import os
import re

index_html_path = 'index.html'
wholesale_html_path = 'wholesale.html'
app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'
style_css_path = 'style.css'

# 1. Ultra-Clean Wholesale Unlock Modal (ONLY Razorpay Button, no mock buttons or mock QR)
clean_unlock_modal_html = '''  <!-- WHOLESALE UNLOCK MODAL (RAZORPAY SECURE GATEWAY) -->
  <div class="modal-bg" id="wholesaleUnlockModal">
    <div class="pin-modal" style="max-width:480px;padding:32px;border-radius:14px;background:#ffffff;color:#121212;box-shadow:0 20px 60px rgba(0,0,0,0.35);border:1px solid #D4AF37;">
      <h3 style="font-size:2.2rem;margin-bottom:8px;font-family:var(--font-heading);font-weight:700;text-transform:uppercase;text-align:center;color:#121212;">Unlock Prices 🔐</h3>
      <p style="font-size:1.3rem;color:#666;margin-bottom:20px;text-align:center;" id="unlockPriceText">Pay ₹1 portal fee to unlock wholesale prices.</p>
      
      <div style="border:1px dashed #D4AF37;background:#FFFDF0;padding:16px;border-radius:8px;font-size:1.2rem;line-height:1.5;color:#6d5a15;margin-bottom:24px;">
        <strong>Advance Payment System Rules:</strong><br>
        Wholesale members pay a small ₹1 portal fee to unlock reseller prices. This advance is automatically adjusted and deducted from your invoice.
      </div>
      
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:1.3rem;color:#555;font-weight:700;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">Payable Advance Amount</div>
        <div style="font-size:3.8rem;font-weight:900;color:#D4AF37;" id="unlockAmountLabel">₹1</div>
      </div>
      
      <!-- Single Official Razorpay Secure Gateway Button -->
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">
        <button class="btn-primary" id="btnUnlockRazorpayPay" onclick="window.triggerRazorpayUnlock(100)" style="width:100%; padding:18px; background:#D4AF37 !important; color:#121212 !important; font-weight:900; font-size:1.4rem; border:none; border-radius:8px; cursor:pointer; box-shadow:0 6px 20px rgba(212,175,55,0.4); text-transform:uppercase; letter-spacing:0.04em;">
          💳 PAY ₹1 SECURELY VIA RAZORPAY
        </button>
        <p style="text-align:center; font-size:1.1rem; color:#777; margin:0;">Supports Google Pay, PhonePe, Paytm, Cards, NetBanking &amp; UPI QR</p>
      </div>
      
      <button class="btn-primary" id="btnCancelUnlock" onclick="window.closeWholesaleLoginModal()" style="width:100%;font-size:1.2rem;padding:10px;background:#f5f5f5;color:#666;border:1px solid #ddd;border-radius:6px;cursor:pointer;margin-top:8px;">Close</button>
    </div>
  </div>'''

def update_html_clean_modal(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'<!-- WHOLESALE UNLOCK MODAL[\s\S]*?(?=<!-- TOASTS -->|\n\s*<!-- FOOTER -->|\n\s*<div class="toast-box")', clean_unlock_modal_html + '\n\n', code)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} with clean Razorpay-only wholesaleUnlockModal")

update_html_clean_modal(index_html_path)
update_html_clean_modal(wholesale_html_path)


# 2. Add Wholesale Business Club Header Strip in wholesale.html and index.html
wholesale_strip_html = '''  <!-- WHOLESALE BUSINESS CLUB ANNOUNCEMENT STRIP -->
  <div class="wholesale-club-strip" id="wholesaleClubStrip" style="background: linear-gradient(90deg, #11141e 0%, #1e1b15 50%, #2a2214 100%); color: #D4AF37; padding: 10px 16px; text-align: center; font-size: 1.25rem; font-weight: 800; letter-spacing: 0.04em; border-bottom: 1px solid rgba(212, 175, 55, 0.4); box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
    👑 WELCOME TO WHOLESALE BUSINESS CLUB — RESELLER EXCLUSIVE PRICES UNLOCKED ✨
  </div>'''

def update_html_wholesale_strip(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    if 'id="wholesaleClubStrip"' not in code:
        code = code.replace('<!-- ANNOUNCEMENT BAR -->', wholesale_strip_html + '\n\n  <!-- ANNOUNCEMENT BAR -->')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Added Wholesale Club Announcement Strip to {file_path}")

update_html_wholesale_strip(wholesale_html_path)
update_html_wholesale_strip(index_html_path)


# 3. Add CSS for wholesale-club-strip in style.css
with open(style_css_path, 'r', encoding='utf-8') as f:
    css = f.read()

strip_css = '''
/* Wholesale Business Club Header Strip */
.wholesale-club-strip {
  display: block;
}

html[data-shopping-mode="retail"] .wholesale-club-strip {
  display: none !important;
}

html[data-shopping-mode="wholesale"] .wholesale-club-strip {
  display: block !important;
}
'''

if '/* Wholesale Business Club Header Strip */' not in css:
    css += '\n' + strip_css
    with open(style_css_path, 'w', encoding='utf-8') as f:
        f.write(css)
    print("Added wholesale-club-strip CSS to style.css")
