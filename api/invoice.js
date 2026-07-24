// ============================================================
//  VFS Jewels — Website Matching PDF Invoice Generator API
//  Exposed at https://www.vfsjewels.store/api/invoice
//  Matches exact VFS Jewels website invoice design & branding
// ============================================================

function fmt(val) {
  return 'Rs. ' + Number(val || 0).toLocaleString('en-IN');
}

function createPDF(order) {
  const id = order.id || '#J7001';
  const name = order.name || 'Valued Customer';
  const phone = order.phone || '';
  const address = order.address || '';
  const city = order.city || 'Chennai';
  const pincode = order.pincode || '';
  const date = order.date || new Date().toLocaleDateString('en-IN');
  const carrier = order.carrier || 'DTDC';
  const status = (order.status || 'CONFIRMED').toUpperCase();

  const items = Array.isArray(order.items) && order.items.length ? order.items : [{ name: 'Imitation Jewellery Items', qty: 1, price: Number(order.total || 0) }];

  const subtotal = Number(order.subtotal || order.total || 0);
  const shipping = Number(order.shipping || 90);
  const gstAmount = Number(order.gstAmount || 0);
  const couponAmount = Number(order.couponDiscount || 0);
  const waReferralAmount = Number(order.waReferralDiscount || 0);
  const walletAmount = Number(order.walletDiscount || 0);
  const total = Number(order.total || subtotal);

  const content = [];

  function addText(text, x, y, size = 10, font = 'F1', color = '0 0 0', align = 'left', width = 0) {
    const escaped = String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    if (align === 'right' && width > 0) {
      // Approximate right alignment offset
      const approxCharWidth = size * 0.5;
      const textWidth = escaped.length * approxCharWidth;
      const startX = Math.max(x, x + width - textWidth);
      content.push(`BT /${font} ${size} Tf ${color} rg ${startX} ${y} Td (${escaped}) Tj ET`);
    } else {
      content.push(`BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${escaped}) Tj ET`);
    }
  }

  function addLine(x1, y1, x2, y2, color = '0.8 0.8 0.8', width = 1) {
    content.push(`${width} w ${color} RG ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  function addRect(x, y, w, h, fillColor = '0.96 0.96 0.96') {
    content.push(`${fillColor} rg ${x} ${y} ${w} ${h} re f`);
  }

  // ── 1. Top Header & Branding (Matching Website) ──
  // Logo: "VFS." with Gold Dot
  addText('VFS.', 50, 755, 26, 'F2', '0 0 0');
  addText('.', 105, 755, 26, 'F2', '0.83 0.68 0.21'); // Gold #D4AF37
  addText('Handcrafted Premium Imitation Jewellery', 50, 742, 8.5, 'F1', '0.4 0.4 0.4');

  // Header Right: "INVOICE" (No "Tax Invoice")
  addText('INVOICE', 400, 765, 16, 'F2', '0.83 0.68 0.21');
  addText(`Invoice ID: INV-${id.replace('#', '')}`, 400, 750, 9, 'F1', '0.2 0.2 0.2');
  addText(`Order ID: ${id}`, 400, 738, 9, 'F2', '0 0 0');
  addText(`Date: ${date}`, 400, 726, 9, 'F1', '0.2 0.2 0.2');
  addText(`Status: ${status}`, 400, 714, 9, 'F2', '0.15 0.68 0.37');

  // Gold Divider Line (#D4AF37)
  addLine(50, 702, 545, 702, '0.83 0.68 0.21', 2);

  // ── 2. Sold By & Ship To Grid ──
  let y = 680;
  // Left Column: Sold By
  addText('SOLD BY:', 50, y, 9, 'F2', '0.33 0.33 0.33');
  addText('VFS Jewels Main Store', 50, y - 13, 9.5, 'F2', '0 0 0');
  addText('42, 2nd Floor, Natwar Kurpa Complex,', 50, y - 25, 8.5, 'F1', '0.2 0.2 0.2');
  addText('Narayana Mudali Street, Sowcarpet,', 50, y - 37, 8.5, 'F1', '0.2 0.2 0.2');
  addText('Chennai, Tamil Nadu - 600001', 50, y - 49, 8.5, 'F1', '0.2 0.2 0.2');
  addText('Contact: +91 98407 57363 | vfsjewels.store', 50, y - 61, 8.5, 'F1', '0.2 0.2 0.2');

  // Right Column: Ship To
  addText('SHIP TO:', 330, y, 9, 'F2', '0.33 0.33 0.33');
  addText(name, 330, y - 13, 9.5, 'F2', '0 0 0');
  addText(`Address: ${address.substring(0, 45)}`, 330, y - 25, 8.5, 'F1', '0.2 0.2 0.2');
  if (address.length > 45) {
    addText(address.substring(45, 90), 330, y - 37, 8.5, 'F1', '0.2 0.2 0.2');
    addText(`City: ${city} - ${pincode}`, 330, y - 49, 8.5, 'F1', '0.2 0.2 0.2');
    addText(`Phone: +${phone} | Carrier: ${carrier}`, 330, y - 61, 8.5, 'F1', '0.2 0.2 0.2');
  } else {
    addText(`City: ${city} - ${pincode}`, 330, y - 37, 8.5, 'F1', '0.2 0.2 0.2');
    addText(`Phone: +${phone} | Carrier: ${carrier}`, 330, y - 49, 8.5, 'F1', '0.2 0.2 0.2');
  }

  // ── 3. Table Headers (Exact Website Style) ──
  y = 595;
  addRect(50, y - 4, 495, 20, '0.98 0.98 0.98');
  addLine(50, y - 4, 545, y - 4, '0.86 0.86 0.86', 1.5);
  addLine(50, y + 16, 545, y + 16, '0.86 0.86 0.86', 1.5);

  addText('S.NO', 55, y, 8.5, 'F2', '0 0 0');
  addText('DESCRIPTION OF GOODS', 100, y, 8.5, 'F2', '0 0 0');
  addText('RATE', 350, y, 8.5, 'F2', '0 0 0');
  addText('QTY', 420, y, 8.5, 'F2', '0 0 0');
  addText('AMOUNT', 480, y, 8.5, 'F2', '0 0 0');

  y -= 20;

  items.slice(0, 12).forEach((item, idx) => {
    const rate = Number(item.price || 0);
    const qty = Number(item.qty || 1);
    const itemTotal = rate * qty;

    addText(`${idx + 1}`, 55, y, 9, 'F1', '0 0 0');
    addText(`${(item.name || 'Jewellery Item').substring(0, 42)}`, 100, y, 9, 'F2', '0 0 0');
    addText('Imitation Fashion Jewellery', 100, y - 10, 7.5, 'F1', '0.4 0.4 0.4');
    addText(fmt(rate), 350, y, 9, 'F1', '0 0 0');
    addText(`${qty}`, 425, y, 9, 'F1', '0 0 0');
    addText(fmt(itemTotal), 480, y, 9, 'F2', '0 0 0');

    y -= 22;
    addLine(50, y + 5, 545, y + 5, '0.93 0.93 0.93', 0.5);
  });

  // ── 4. Totals Breakdown (Matching Website Layout) ──
  y -= 10;
  addLine(330, y, 545, y, '0.86 0.86 0.86', 1);

  y -= 16;
  addText('Subtotal:', 330, y, 9, 'F1', '0 0 0');
  addText(fmt(subtotal), 470, y, 9, 'F2', '0 0 0');

  y -= 15;
  addText('Shipping Fee:', 330, y, 9, 'F1', '0 0 0');
  addText(fmt(shipping), 470, y, 9, 'F2', '0 0 0');

  if (gstAmount > 0) {
    y -= 15;
    addText('GST (3%):', 330, y, 9, 'F1', '0 0 0');
    addText(fmt(gstAmount), 470, y, 9, 'F2', '0 0 0');
  }

  if (couponAmount > 0) {
    y -= 15;
    addText('Coupon Discount:', 330, y, 9, 'F1', '0 0.5 0');
    addText('-' + fmt(couponAmount), 470, y, 9, 'F2', '0 0.5 0');
  }

  if (waReferralAmount > 0) {
    y -= 15;
    addText('WhatsApp Referral (1%):', 330, y, 9, 'F1', '0 0.5 0');
    addText('-' + fmt(waReferralAmount), 470, y, 9, 'F2', '0 0.5 0');
  }

  if (walletAmount > 0) {
    y -= 15;
    addText('Wallet Discount:', 330, y, 9, 'F1', '0 0.5 0');
    addText('-' + fmt(walletAmount), 470, y, 9, 'F2', '0 0.5 0');
  }

  y -= 20;
  addLine(330, y + 12, 545, y + 12, '0.86 0.86 0.86', 1);
  addText('Grand Total:', 330, y - 2, 11, 'F2', '0 0 0');
  addText(fmt(total), 470, y - 2, 11, 'F2', '0 0 0');

  // ── 5. Footer Terms ──
  addText('• This is a computer-generated invoice and requires no physical signature.', 50, 75, 8, 'F1', '0.4 0.4 0.4');
  addText('• Goods once sold can be replaced as per VFS Jewels exchange policies at vfsjewels.store.', 50, 63, 8, 'F1', '0.4 0.4 0.4');
  addText('Thank you for shopping with VFS Jewels! 🌸', 200, 42, 9.5, 'F2', '0.83 0.68 0.21');

  const streamBody = content.join('\n');

  const pdfString = 
`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>
endobj

4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj

6 0 obj
<< /Length ${Buffer.byteLength(streamBody)} >>
stream
${streamBody}
endstream
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000315 00000 n 
0000000391 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
${500 + Buffer.byteLength(streamBody)}
%%EOF`;

  return Buffer.from(pdfString, 'utf-8');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = req.method === 'POST' ? req.body : req.query;

  try {
    let items = [];
    if (query.items) {
      try {
        items = typeof query.items === 'string' ? JSON.parse(query.items) : query.items;
      } catch (e) {
        items = [];
      }
    }

    const pdfBuffer = createPDF({
      id: query.id || query.order || '#J7001',
      name: query.name || 'Valued Customer',
      phone: query.phone || '',
      address: query.address || 'Chennai, Tamil Nadu',
      city: query.city || 'Chennai',
      pincode: query.pincode || '',
      date: query.date || new Date().toLocaleDateString('en-IN'),
      carrier: query.carrier || 'DTDC',
      status: query.status || 'CONFIRMED',
      total: query.total || '0',
      subtotal: query.subtotal || query.total || '0',
      gstAmount: query.gstAmount || '0',
      shipping: query.shipping || '90',
      couponDiscount: query.couponDiscount || '0',
      waReferralDiscount: query.waReferralDiscount || '0',
      walletDiscount: query.walletDiscount || '0',
      items: items
    });

    const fileName = `VFS_Jewels_Invoice_${(query.id || 'J7001').replace('#', '')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('❌ Error generating PDF invoice:', err);
    return res.status(500).json({ error: 'Failed to generate PDF invoice', details: err.message });
  }
};
