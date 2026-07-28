import os

api_invoice_path = os.path.join('api', 'invoice.js')

new_invoice_js_code = '''// ============================================================
//  VFS Jewels — Ultra-Luxury PDF Tax Invoice Generator API
//  Exposed at https://www.vfsjewels.store/api/invoice
//  Matches official VFS Jewels GSTIN: 33AAFVC8491A1ZX tax format
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
  const trackingId = order.trackingId || `TRK${id.replace('#', '')}VFS`;
  const paymentMethod = order.paymentMethod || 'Razorpay Online';

  const items = Array.isArray(order.items) && order.items.length ? order.items : [{ name: 'Imitation Fashion Jewellery Item', qty: 1, price: Number(order.total || 0), sku: `ZU1-${id.replace('#', '')}` }];

  const subtotal = Number(order.subtotal || order.total || 0);
  const shipping = Number(order.shipping || 90);
  
  // Calculate 3% GST (1.5% CGST + 1.5% SGST)
  const gstTotal = order.gstAmount ? Number(order.gstAmount) : Math.round(subtotal * 0.03);
  const cgst = Math.round(gstTotal / 2);
  const sgst = gstTotal - cgst;

  const couponAmount = Number(order.couponDiscount || 0);
  const walletAmount = Number(order.walletDiscount || 0);
  const advanceAmount = Number(order.advanceAdjusted || order.advanceDeducted || 0);
  const total = Number(order.total || (subtotal + shipping + gstTotal - couponAmount - walletAmount - advanceAmount));

  const content = [];

  function addText(text, x, y, size = 10, font = 'F1', color = '0 0 0', align = 'left', width = 0) {
    const escaped = String(text).replace(/\\\\/g, '\\\\\\\\').replace(/\\(/g, '\\\\(').replace(/\\)/g, '\\\\)');
    if (align === 'right' && width > 0) {
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

  // ── 1. Top Luxury Header & Branding ──
  // Gold Banner Accent Top Strip
  addRect(0, 832, 595, 10, '0.83 0.68 0.21');

  // Brand Name & Subtitle
  addText('VFS JEWELS', 50, 785, 26, 'F2', '0.1 0.1 0.1');
  addText('.', 212, 785, 26, 'F2', '0.83 0.68 0.21'); // Gold Accent Dot
  addText('Handcrafted Premium Anti-Tarnish Imitation Jewellery', 50, 770, 8.5, 'F1', '0.4 0.4 0.4');

  // Header Right: "TAX INVOICE" Badge
  addRect(380, 765, 165, 30, '0.96 0.94 0.88');
  addLine(380, 765, 545, 765, '0.83 0.68 0.21', 1);
  addText('TAX INVOICE', 390, 775, 14, 'F2', '0.83 0.68 0.21');

  addText(`Invoice ID: INV-${id.replace('#', '')}`, 390, 750, 8.5, 'F1', '0.2 0.2 0.2');
  addText(`Order ID: ${id}`, 390, 738, 9, 'F2', '0 0 0');
  addText(`Date: ${date}`, 390, 726, 8.5, 'F1', '0.2 0.2 0.2');
  addText(`Payment: ${paymentMethod}`, 390, 714, 8.5, 'F2', '0.15 0.5 0.15');
  
  // Gold Divider Line (#D4AF37)
  addLine(50, 700, 545, 700, '0.83 0.68 0.21', 2);

  // ── 2. Sold By & Ship To Grid ──
  let y = 680;
  // Left Column: Sold By with GSTIN
  addText('SOLD BY (SUPPLIER):', 50, y, 8.5, 'F2', '0.33 0.33 0.33');
  addText('VFS Jewels Main Store', 50, y - 13, 9.5, 'F2', '0 0 0');
  addText('42, 2nd Floor, Natwar Kurpa Complex,', 50, y - 25, 8.5, 'F1', '0.2 0.2 0.2');
  addText('Narayana Mudali Street, Sowcarpet,', 50, y - 37, 8.5, 'F1', '0.2 0.2 0.2');
  addText('Chennai, Tamil Nadu - 600001', 50, y - 49, 8.5, 'F1', '0.2 0.2 0.2');
  addText('Email: accounts@vfsjewels.store | Web: vfsjewels.store', 50, y - 61, 8, 'F1', '0.2 0.2 0.2');
  addText('GSTIN: 33AAFVC8491A1ZX', 50, y - 73, 9, 'F2', '0.83 0.68 0.21'); // Gold GSTIN

  // Right Column: Ship To
  addText('SHIP TO (CUSTOMER):', 330, y, 8.5, 'F2', '0.33 0.33 0.33');
  addText(name, 330, y - 13, 9.5, 'F2', '0 0 0');
  addText(`Address: ${address.substring(0, 42)}`, 330, y - 25, 8.5, 'F1', '0.2 0.2 0.2');
  if (address.length > 42) {
    addText(address.substring(42, 85), 330, y - 37, 8.5, 'F1', '0.2 0.2 0.2');
    addText(`City: ${city} - ${pincode}`, 330, y - 49, 8.5, 'F1', '0.2 0.2 0.2');
    addText(`Phone: +91 ${phone.replace(/^91/, '')} | Carrier: ${carrier}`, 330, y - 61, 8.5, 'F1', '0.2 0.2 0.2');
  } else {
    addText(`City: ${city} - ${pincode}`, 330, y - 37, 8.5, 'F1', '0.2 0.2 0.2');
    addText(`Phone: +91 ${phone.replace(/^91/, '')} | Carrier: ${carrier}`, 330, y - 49, 8.5, 'F1', '0.2 0.2 0.2');
  }

  // ── 3. Table Headers ──
  y = 585;
  addRect(50, y - 4, 495, 20, '0.95 0.94 0.90');
  addLine(50, y - 4, 545, y - 4, '0.83 0.68 0.21', 1);
  addLine(50, y + 16, 545, y + 16, '0.83 0.68 0.21', 1);

  addText('S.NO', 55, y, 8.5, 'F2', '0 0 0');
  addText('DESCRIPTION OF GOODS & SKU', 100, y, 8.5, 'F2', '0 0 0');
  addText('RATE', 350, y, 8.5, 'F2', '0 0 0');
  addText('QTY', 420, y, 8.5, 'F2', '0 0 0');
  addText('AMOUNT', 480, y, 8.5, 'F2', '0 0 0');

  y -= 20;

  items.slice(0, 10).forEach((item, idx) => {
    const rate = Number(item.price || 0);
    const qty = Number(item.qty || 1);
    const itemTotal = rate * qty;
    const itemSku = item.sku || `ZU1-${(item.id || idx + 1)}`;

    addText(`${idx + 1}`, 55, y, 9, 'F1', '0 0 0');
    addText(`${(item.name || 'Anti-Tarnish Jewellery Item').substring(0, 40)}`, 100, y, 9, 'F2', '0 0 0');
    addText(`SKU: ${itemSku} | HSN: 7117 (Imitation Jewellery)`, 100, y - 10, 7.5, 'F1', '0.4 0.4 0.4');
    addText(fmt(rate), 350, y, 9, 'F1', '0 0 0');
    addText(`${qty}`, 425, y, 9, 'F1', '0 0 0');
    addText(fmt(itemTotal), 480, y, 9, 'F2', '0 0 0');

    y -= 24;
    addLine(50, y + 6, 545, y + 6, '0.92 0.92 0.92', 0.5);
  });

  // ── 4. Totals & Tax Breakdown ──
  y -= 6;
  addLine(320, y, 545, y, '0.86 0.86 0.86', 1);

  y -= 14;
  addText('Subtotal:', 320, y, 8.5, 'F1', '0.2 0.2 0.2');
  addText(fmt(subtotal), 470, y, 8.5, 'F2', '0 0 0');

  y -= 14;
  addText('Shipping Fee:', 320, y, 8.5, 'F1', '0.2 0.2 0.2');
  addText(fmt(shipping), 470, y, 8.5, 'F2', '0 0 0');

  y -= 14;
  addText('CGST (1.5%):', 320, y, 8.5, 'F1', '0.3 0.3 0.3');
  addText(fmt(cgst), 470, y, 8.5, 'F1', '0.3 0.3 0.3');

  y -= 14;
  addText('SGST (1.5%):', 320, y, 8.5, 'F1', '0.3 0.3 0.3');
  addText(fmt(sgst), 470, y, 8.5, 'F1', '0.3 0.3 0.3');

  if (couponAmount > 0) {
    y -= 14;
    addText('Coupon Discount:', 320, y, 8.5, 'F1', '0 0.5 0');
    addText('-' + fmt(couponAmount), 470, y, 8.5, 'F2', '0 0.5 0');
  }

  if (walletAmount > 0) {
    y -= 14;
    addText('Store Wallet Discount:', 320, y, 8.5, 'F1', '0 0.5 0');
    addText('-' + fmt(walletAmount), 470, y, 8.5, 'F2', '0 0.5 0');
  }

  if (advanceAmount > 0) {
    y -= 14;
    addText('Advance Paid Adjusted:', 320, y, 8.5, 'F1', '0 0.5 0');
    addText('-' + fmt(advanceAmount), 470, y, 8.5, 'F2', '0 0.5 0');
  }

  y -= 18;
  addRect(320, y - 4, 225, 20, '0.96 0.94 0.88');
  addLine(320, y - 4, 545, y - 4, '0.83 0.68 0.21', 1);
  addText('GRAND TOTAL (INCL. TAXES):', 325, y, 9.5, 'F2', '0 0 0');
  addText(fmt(total), 470, y, 10.5, 'F2', '0.83 0.68 0.21');

  // ── 5. Tracking Barcode Box & Compliance ──
  y -= 45;
  addRect(50, y, 240, 45, '0.98 0.98 0.98');
  addLine(50, y, 290, y, '0.85 0.85 0.85', 1);
  addLine(50, y + 45, 290, y + 45, '0.85 0.85 0.85', 1);
  addText('SHIPPING TRACKING BARCODE', 60, y + 32, 7.5, 'F2', '0.3 0.3 0.3');
  
  // Render Barcode vector lines
  for (let b = 0; b < 32; b++) {
    const bw = (b % 3 === 0) ? 2 : 1;
    addLine(60 + (b * 6.5), y + 10, 60 + (b * 6.5), y + 26, '0.1 0.1 0.1', bw);
  }
  addText(trackingId, 60, y + 2, 7.5, 'F1', '0.2 0.2 0.2');

  // Footer Terms & GST Compliance
  addText('• Official Store GSTIN: 33AAFVC8491A1ZX | HSN Code: 7117 (Imitation Jewellery)', 50, 52, 7.5, 'F1', '0.4 0.4 0.4');
  addText('• This is a computer-generated tax invoice and requires no physical signature.', 50, 42, 7.5, 'F1', '0.4 0.4 0.4');
  addText('Thank you for shopping with VFS Jewels Sowcarpet! 🌸', 170, 24, 9, 'F2', '0.83 0.68 0.21');

  const streamBody = content.join('\\n');

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
      trackingId: query.trackingId || '',
      paymentMethod: query.paymentMethod || 'Razorpay Online',
      status: query.status || 'CONFIRMED',
      total: query.total || '0',
      subtotal: query.subtotal || query.total || '0',
      gstAmount: query.gstAmount || '0',
      shipping: query.shipping || '90',
      couponDiscount: query.couponDiscount || '0',
      waReferralDiscount: query.waReferralDiscount || '0',
      walletDiscount: query.walletDiscount || '0',
      advanceAdjusted: query.advanceAdjusted || query.advanceDeducted || '0',
      items: items
    });

    const fileName = `VFS_Jewels_Tax_Invoice_${(query.id || 'J7001').replace('#', '')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('❌ Error generating PDF tax invoice:', err);
    return res.status(500).json({ error: 'Failed to generate PDF tax invoice', details: err.message });
  }
};
'''

with open(api_invoice_path, 'w', encoding='utf-8') as f:
    f.write(new_invoice_js_code)
print("Updated api/invoice.js with luxury tax invoice template")
