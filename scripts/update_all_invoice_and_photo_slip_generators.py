import re

with open('admin/admin.js', 'r', encoding='utf-8') as f:
    admin_js = f.read()

# Invoice function
admin_invoice_func = r"""window.downloadOrderInvoice = async function(orderId) {
  const ordersList = await window.VFS_DB.getOrders();
  const order = ordersList.find(o => o.id === orderId);
  if (!order) return;

  adminToast("Generating invoice PDF... 📄");

  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.top = '0';
  wrapper.style.left = '-9999px';
  wrapper.style.width = '750px';

  const tempDiv = document.createElement('div');
  tempDiv.style.width = '750px';
  tempDiv.style.background = '#ffffff';
  tempDiv.style.color = '#000000';
  tempDiv.style.padding = '30px';
  tempDiv.style.fontFamily = "'Lato', sans-serif";

  const tableRows = (order.items || []).map((item, idx) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px; font-size: 10pt; color: #111;"><strong>${item.name}</strong><br><span style="font-size:8.5pt;color:#666">SKU: ${item.sku || 'N/A'}</span></td>
      <td style="padding: 10px; font-size: 10pt; color: #111; text-align: center;">${item.qty}</td>
      <td style="padding: 10px; font-size: 10pt; color: #111; text-align: right;">${fmt(item.price)}</td>
      <td style="padding: 10px; font-size: 10pt; text-align: right; color: #111; font-weight:700;">${fmt(item.price * item.qty)}</td>
    </tr>
  `).join('');

  const subtotal = order.subtotal || (order.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const shipping = order.shipping || 90;
  const gstAmt = order.gstAmount || Math.round(subtotal * 0.03);
  const total = order.total || (subtotal + shipping + gstAmt);

  tempDiv.innerHTML = `
    <div style="border: 1px solid #d1d5db; padding: 25px; background: #ffffff; color: #000000;">
      <!-- Top Header (Matching Screenshot 1) -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div>
          <div style="font-size: 22px; font-weight: 900; color: #121212; letter-spacing: 0.5px;">VIKRAM FANCY STORE (VFS)</div>
          <div style="font-size: 15px; font-weight: 800; color: #D4AF37; margin-top:2px;">VFS JEWELS</div>
          <p style="font-size: 8.5pt; color: #444444; margin: 4px 0 0 0; line-height:1.4;">
            42, 2nd Floor, Natwar Kurpa Complex, Sowcarpet, Chennai - 600001<br>
            Phone: +91 98407 57363 | Email: vfsjewels@gmail.com
          </p>
        </div>
        <div style="text-align: right;">
          <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 10px 0; color: #222; text-transform: uppercase;">INVOICE</h1>
          <table style="width: 220px; border-collapse: collapse; font-size: 8.5pt; text-align: center; border: 1px solid #9ca3af; margin-left: auto;">
            <tr style="background: #e5e7eb; font-weight: 700;">
              <td style="border: 1px solid #9ca3af; padding: 3px;">INVOICE #</td>
              <td style="border: 1px solid #9ca3af; padding: 3px;">DATE</td>
            </tr>
            <tr>
              <td style="border: 1px solid #9ca3af; padding: 4px;">INV-${order.id.replace('#', '')}</td>
              <td style="border: 1px solid #9ca3af; padding: 4px;">${order.date || new Date().toLocaleDateString('en-IN')}</td>
            </tr>
            <tr style="background: #e5e7eb; font-weight: 700;">
              <td style="border: 1px solid #9ca3af; padding: 3px;">CUSTOMER ID</td>
              <td style="border: 1px solid #9ca3af; padding: 3px;">TERMS</td>
            </tr>
            <tr>
              <td style="border: 1px solid #9ca3af; padding: 4px;">CUST-${order.phone || '98407'}</td>
              <td style="border: 1px solid #9ca3af; padding: 4px;">Prepaid (UPI)</td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Bill To / Ship To Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div style="border: 1px solid #9ca3af;">
          <div style="background: #d1d5db; font-size: 9pt; font-weight: 700; padding: 5px 10px;">BILL TO</div>
          <div style="padding: 10px; font-size: 9pt; line-height: 1.5;">
            <strong>Name:</strong> ${order.name}<br>
            <strong>Company:</strong> ${order.companyName || 'VFS Partner'}<br>
            <strong>Address:</strong> ${order.address}<br>
            <strong>City:</strong> ${order.city} - ${order.pincode}<br>
            <strong>Phone:</strong> +91 ${order.phone}<br>
            <strong>Email:</strong> ${order.email || 'customer@vfsjewels.store'}
          </div>
        </div>
        <div style="border: 1px solid #9ca3af;">
          <div style="background: #d1d5db; font-size: 9pt; font-weight: 700; padding: 5px 10px;">SHIP TO</div>
          <div style="padding: 10px; font-size: 9pt; line-height: 1.5;">
            <strong>Name:</strong> ${order.name}<br>
            <strong>Company:</strong> ${order.companyName || 'VFS Partner'}<br>
            <strong>Address:</strong> ${order.address}<br>
            <strong>City:</strong> ${order.city} - ${order.pincode}<br>
            <strong>Phone:</strong> +91 ${order.phone}
          </div>
        </div>
      </div>

      <!-- Item Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #9ca3af;">
        <thead>
          <tr style="background: #d1d5db; border-bottom: 1px solid #9ca3af;">
            <th style="text-align: left; padding: 8px 10px; font-size: 9pt; text-transform: uppercase;">DESCRIPTION</th>
            <th style="width: 10%; text-align: center; padding: 8px 10px; font-size: 9pt; text-transform: uppercase;">QTY</th>
            <th style="width: 18%; text-align: right; padding: 8px 10px; font-size: 9pt; text-transform: uppercase;">UNIT PRICE</th>
            <th style="width: 18%; text-align: right; padding: 8px 10px; font-size: 9pt; text-transform: uppercase;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <!-- Totals Table -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
        <table style="width: 250px; font-size: 9.5pt; line-height: 1.6; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 0;">Subtotal:</td>
            <td style="text-align: right; font-weight: 700;">${fmt(subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">GST (3%):</td>
            <td style="text-align: right; font-weight: 700;">${fmt(gstAmt)}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0;">Shipping Fee:</td>
            <td style="text-align: right; font-weight: 700;">${fmt(shipping)}</td>
          </tr>
          <tr style="border-top: 2px solid #D4AF37; font-size: 11pt; font-weight: 900; color: #D4AF37;">
            <td style="padding: 6px 0 0 0;">Grand Total:</td>
            <td style="text-align: right; padding: 6px 0 0 0;">${fmt(total)}</td>
          </tr>
        </table>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 10px; text-align: center; font-size: 8.5pt; color: #666666;">
        This is an official computer-generated Tax Invoice by Vikram Fancy Store (VFS) / VFS Jewels.<br>
        Thank you for shopping with VFS Jewels! 🌸
      </div>
    </div>
  `;

  wrapper.appendChild(tempDiv);
  document.body.appendChild(wrapper);

  const opt = {
    margin:       0.2,
    filename:     `VFS_Invoice_${order.id.replace('#', '')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(tempDiv).save();
    adminToast("Invoice PDF downloaded!");
  } catch(err) {
    console.error("html2pdf failed:", err);
  } finally {
    document.body.removeChild(wrapper);
  }
};"""

# Photo slip function
admin_photo_slip_func = r"""window.printPhotoSlip = async function(orderId) {
  const ordersList = await window.VFS_DB.getOrders();
  const order = ordersList.find(o => o.id === orderId);
  if (!order) return;

  adminToast("Generating Product Photo Slip PDF...");

  const items = order.items || [];
  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.top = '0';
  wrapper.style.left = '-9999px';
  wrapper.style.width = '750px';

  const tempDiv = document.createElement('div');
  tempDiv.style.width = '750px';
  tempDiv.style.background = '#ffffff';
  tempDiv.style.color = '#000000';
  tempDiv.style.padding = '24px';
  tempDiv.style.fontFamily = "'Lato', sans-serif";

  const productCardsHtml = items.map(item => `
    <div style="border: 1px solid #cccccc; padding: 12px; background: #fafafa; border-radius: 4px; display: flex; flex-direction: column; align-items: center; text-align: left;">
      <div style="width: 160px; height: 160px; background: #ffffff; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; overflow: hidden;">
        <img src="${(item.img || '').replace(/\/upload\/[^/]+\//, '/upload/f_auto,q_auto,w_200/')}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
      </div>
      <div style="width: 100%; font-size: 9.5pt; line-height: 1.6; color: #222222;">
        <div><strong>qty orderd :</strong> ${item.qty || 1}</div>
        <div><strong>price :</strong> ${fmt(item.price)}</div>
        <div><strong>product :</strong> ${item.name}</div>
        <div><strong>product code :</strong> ${item.sku || item.id || 'VFS-SKU'}</div>
      </div>
    </div>
  `).join('');

  tempDiv.innerHTML = `
    <div style="border: 1px solid #9ca3af; padding: 20px; background: #ffffff;">
      <h2 style="font-size: 16pt; font-weight: 900; margin: 0 0 10px 0; color: #111111; text-transform: uppercase;">VIKRAM FANCY STORE (VFS) PRODUCT PHOTO SLIP</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 15px; font-size: 9.5pt; font-weight: 700; color: #333333;">
        <div>
          <div>BILLED FROM : Vikram Fancy Store (VFS) / VFS Jewels (Sowcarpet, Chennai)</div>
          <div style="margin-top: 4px;">INV . NO : INV-${order.id.replace('#', '')}</div>
        </div>
        <div>
          <div>BILLED TO : ${order.name} (${order.phone})</div>
          <div style="margin-top: 4px;">ORDER NO : ${order.id}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        ${productCardsHtml}
      </div>
    </div>
  `;

  wrapper.appendChild(tempDiv);
  document.body.appendChild(wrapper);

  const opt = {
    margin:       0.2,
    filename:     `VFS_PhotoSlip_${order.id.replace('#', '')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(tempDiv).save();
    adminToast("Product Photo Slip PDF downloaded!");
  } catch(err) {
    console.error("Photo slip pdf error:", err);
  } finally {
    document.body.removeChild(wrapper);
  }
};"""

admin_js = re.sub(r'window\.downloadOrderInvoice\s*=\s*async\s*function\([^)]*\)\s*\{[\s\S]*?\}\s*;', admin_invoice_func, admin_js)
admin_js = re.sub(r'window\.printPhotoSlip\s*=\s*async\s*function\([^)]*\)\s*\{[\s\S]*?\}\s*;', admin_photo_slip_func, admin_js)

with open('admin/admin.js', 'w', encoding='utf-8') as f:
    f.write(admin_js)
print("Successfully updated admin/admin.js generators!")

# 2. Update wholesale.js
with open('wholesale.js', 'r', encoding='utf-8') as f:
    ws_js = f.read()

ws_js = ws_js.replace('Retail Tax Invoice', 'INVOICE')
ws_js = ws_js.replace('VFS JEWELS.', 'VIKRAM FANCY STORE (VFS)<br><span style="font-size:14px;color:#D4AF37;">VFS JEWELS</span>')

with open('wholesale.js', 'w', encoding='utf-8') as f:
    f.write(ws_js)
print("Successfully updated wholesale.js!")

# 3. Update app.js if present
try:
    with open('app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()

    app_js = app_js.replace('Retail Tax Invoice', 'INVOICE')
    app_js = app_js.replace('VFS JEWELS.', 'VIKRAM FANCY STORE (VFS)<br><span style="font-size:14px;color:#D4AF37;">VFS JEWELS</span>')

    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app_js)
    print("Successfully updated app.js!")
except FileNotFoundError:
    pass
