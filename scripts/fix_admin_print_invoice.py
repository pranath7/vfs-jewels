import os
import re

admin_js_path = os.path.join('admin', 'admin.js')

with open(admin_js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Update window.printInvoice and downloadInvoicePDF in admin/admin.js
new_invoice_func = '''
// ── Modern Luxury GST Tax Invoice Printing & PDF Generation ──
window.printInvoice = async function(orderId) {
  await window.downloadInvoicePDF(orderId);
};

window.downloadInvoicePDF = async function(orderId) {
  const ordersList = await window.VFS_DB.getOrders();
  const order = ordersList.find(o => o.id === orderId) || { id: orderId, name: 'Valued Customer', items: [], total: 0 };
  
  adminToast("Generating luxury tax invoice... 📄");

  const items = Array.isArray(order.items) && order.items.length ? order.items : [{ name: 'Imitation Jewellery Items', qty: 1, price: Number(order.total || 0), id: 1 }];

  const subtotal = order.subtotal || items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const shipping = order.shipping || 90;
  const gstAmt = order.gstAmount || Math.round(subtotal * 0.03);
  const cgst = Math.round(gstAmt / 2);
  const sgst = gstAmt - cgst;
  const advanceAmt = order.advanceAdjusted || order.advanceDeducted || 0;
  const couponAmt = order.couponDiscount || 0;
  const walletAmt = order.walletDiscount || 0;
  const total = order.total || subtotal;

  const tableRows = items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #eeeeee;">
      <td style="padding: 10px; font-size: 10pt; color: #121212;">${idx + 1}</td>
      <td style="padding: 10px; font-size: 10pt; color: #121212;">
        <strong>${escapeHtml(item.name)}</strong><br>
        <span style="font-size:8.5pt; color:#666666;">SKU: ZU1-${item.id || idx + 1} | HSN: 7117 (Imitation Jewellery)</span>
      </td>
      <td style="padding: 10px; font-size: 10pt; color: #121212;">${fmt(item.price)}</td>
      <td style="padding: 10px; font-size: 10pt; color: #121212;">${item.qty}</td>
      <td style="padding: 10px; font-size: 10pt; text-align: right; color: #121212; font-weight: 700;">${fmt(item.price * item.qty)}</td>
    </tr>
  `).join('');

  let totalsHtml = `
    <tr>
      <td style="padding: 4px 0; color: #333333;">Subtotal:</td>
      <td style="text-align: right; font-weight: 700; padding: 4px 0; color: #121212;">${fmt(subtotal)}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; color: #333333;">Shipping Fee:</td>
      <td style="text-align: right; font-weight: 700; padding: 4px 0; color: #121212;">${fmt(shipping)}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; color: #555555;">CGST (1.5%):</td>
      <td style="text-align: right; padding: 4px 0; color: #555555;">${fmt(cgst)}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; color: #555555;">SGST (1.5%):</td>
      <td style="text-align: right; padding: 4px 0; color: #555555;">${fmt(sgst)}</td>
    </tr>
  `;

  if (couponAmt) {
    totalsHtml += `
      <tr>
        <td style="padding: 4px 0; color: #27ae60;">Coupon Discount (${order.couponCode || ''}):</td>
        <td style="text-align: right; font-weight: 700; padding: 4px 0; color: #27ae60;">-${fmt(couponAmt)}</td>
      </tr>
    `;
  }
  if (advanceAmt) {
    totalsHtml += `
      <tr>
        <td style="padding: 4px 0; color: #27ae60;">Advance Paid Adjusted:</td>
        <td style="text-align: right; font-weight: 700; padding: 4px 0; color: #27ae60;">-${fmt(advanceAmt)}</td>
      </tr>
    `;
  }
  if (walletAmt) {
    totalsHtml += `
      <tr>
        <td style="padding: 4px 0; color: #27ae60;">Store Wallet Discount:</td>
        <td style="text-align: right; font-weight: 700; padding: 4px 0; color: #27ae60;">-${fmt(walletAmt)}</td>
      </tr>
    `;
  }
  totalsHtml += `
    <tr style="font-size: 11.5pt; font-weight: 900; border-top: 2px solid #D4AF37; color: #121212;">
      <td style="padding: 10px 0 0 0; color: #121212;">Grand Total:</td>
      <td style="text-align: right; padding: 10px 0 0 0; color: #D4AF37; font-size: 13pt;">${fmt(total)}</td>
    </tr>
  `;

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>VFS Jewels Tax Invoice ${order.id}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #121212; background: #fff; margin: 0; padding: 20px; }
        .invoice-box { max-width: 800px; margin: auto; border: 1px solid #D4AF37; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .top-banner { background: #D4AF37; height: 6px; margin: -30px -30px 20px -30px; border-radius: 8px 8px 0 0; }
        .header-row { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #D4AF37; padding-bottom: 16px; margin-bottom: 24px; }
        .brand-logo { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #121212; margin: 0; }
        .brand-logo span { color: #D4AF37; }
        .invoice-title-badge { background: #fdfbf7; border: 1px solid #D4AF37; padding: 8px 16px; border-radius: 4px; text-align: right; }
        .invoice-title-badge h2 { margin: 0; font-size: 16px; color: #D4AF37; text-transform: uppercase; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; font-size: 9.5pt; line-height: 1.6; }
        .gstin-tag { font-weight: 800; color: #D4AF37; font-size: 10pt; margin-top: 4px; display: inline-block; }
        table.items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        table.items-table th { background: #fdfbf7; border-top: 1px solid #D4AF37; border-bottom: 1px solid #D4AF37; padding: 10px; font-size: 9pt; text-transform: uppercase; text-align: left; }
        .footer-note { font-size: 8pt; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 12px; text-align: center; }
        @media print {
          body { padding: 0; }
          .invoice-box { border: none; box-shadow: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="top-banner"></div>
        <div class="header-row">
          <div>
            <h1 class="brand-logo">VFS JEWELS<span>.</span></h1>
            <p style="margin: 4px 0 0 0; font-size: 9pt; color: #666;">Handcrafted Premium Anti-Tarnish Imitation Jewellery</p>
          </div>
          <div class="invoice-title-badge">
            <h2>TAX INVOICE</h2>
            <div style="font-size: 9pt; margin-top: 4px;">
              <strong>Invoice ID:</strong> INV-${order.id.replace('#', '')}<br>
              <strong>Order ID:</strong> ${order.id}<br>
              <strong>Date:</strong> ${order.date || new Date().toLocaleDateString('en-IN')}<br>
              <strong>Payment:</strong> <span style="color:#27ae60;">${order.paymentMethod || 'Online Paid'}</span>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <strong style="text-transform: uppercase; color: #555; font-size: 8.5pt;">SOLD BY (SUPPLIER):</strong><br>
            <strong style="font-size: 11pt; color: #121212;">VFS Jewels Main Store</strong><br>
            42, 2nd Floor, Natwar Kurpa Complex,<br>
            Narayana Mudali Street, Sowcarpet, George Town,<br>
            Chennai, Tamil Nadu - 600001<br>
            Email: accounts@vfsjewels.store | Web: vfsjewels.store<br>
            <span class="gstin-tag">GSTIN: 33AAFVC8491A1ZX</span>
          </div>
          <div>
            <strong style="text-transform: uppercase; color: #555; font-size: 8.5pt;">SHIP TO (CUSTOMER):</strong><br>
            <strong style="font-size: 11pt; color: #121212;">${escapeHtml(order.name)}</strong><br>
            Address: ${escapeHtml(order.address)}<br>
            City: ${escapeHtml(order.city)} - ${escapeHtml(order.pincode)}<br>
            Phone: +91 ${escapeHtml(order.phone)}<br>
            Carrier: <strong>${escapeHtml(order.carrier || 'DTDC')}</strong>
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 8%;">S.No</th>
              <th>Description of Goods &amp; SKU</th>
              <th style="width: 15%;">Rate</th>
              <th style="width: 10%;">Qty</th>
              <th style="width: 18%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
          <table style="width: 300px; font-size: 9.5pt; line-height: 1.6; border-collapse: collapse;">
            ${totalsHtml}
          </table>
        </div>

        <div class="footer-note">
          <p style="margin:2px 0;">• Official Store GSTIN: <strong>33AAFVC8491A1ZX</strong> | HSN Code: 7117 (Imitation Jewellery)</p>
          <p style="margin:2px 0;">• This is a computer-generated tax invoice and requires no physical signature.</p>
          <p style="margin:6px 0 0 0; color:#D4AF37; font-weight:800; font-size:10pt;">Thank you for shopping with VFS Jewels Sowcarpet! 🌸</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWin = window.open('', '_blank', 'width=850,height=900');
  if (printWin) {
    printWin.document.write(printHtml);
    printWin.document.close();
  } else {
    alert("Please allow popups to print tax invoice!");
  }
};
'''

js = re.sub(r'// ── Dynamic PDF Invoice Downloader [\s\S]*?(?=window\.printPhotoSlip|\n\/\/ ──)', new_invoice_func, js)

with open(admin_js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated admin/admin.js with new printInvoice & downloadInvoicePDF luxury GST Tax Invoice template")
