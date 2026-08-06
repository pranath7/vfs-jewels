// ============================================================
//  VFS Jewels — Ultra-Luxury PDF Tax Invoice Generator API
//  Exposed at https://www.vfsjewels.store/api/invoice
//  Matches official VFS Jewels GSTIN: 33AAFVC8491A1ZX tax format
// ============================================================

const https = require('https');

function fmt(val) {
  return 'Rs. ' + Number(val || 0).toLocaleString('en-IN');
}

function fetchOrderFromFirestore(orderId) {
  const cleanId = String(orderId).replace('#', '');
  return new Promise((resolve) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/vfs-jewellery/databases/(default)/documents/orders/${cleanId}`,
      method: 'GET'
    };

    const req = https.get(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const doc = JSON.parse(body);
          if (doc && doc.fields) {
            const parsedOrder = {};
            for (let k in doc.fields) {
              const f = doc.fields[k];
              if (f.stringValue !== undefined) parsedOrder[k] = f.stringValue;
              else if (f.doubleValue !== undefined) parsedOrder[k] = f.doubleValue;
              else if (f.integerValue !== undefined) parsedOrder[k] = Number(f.integerValue);
              else if (f.arrayValue && f.arrayValue.values) {
                parsedOrder[k] = f.arrayValue.values.map(v => {
                  const itemMap = {};
                  if (v.mapValue && v.mapValue.fields) {
                    for (let ik in v.mapValue.fields) {
                      const tf = v.mapValue.fields[ik];
                      if (tf.stringValue !== undefined) itemMap[ik] = tf.stringValue;
                      else if (tf.doubleValue !== undefined) itemMap[ik] = tf.doubleValue;
                      else if (tf.integerValue !== undefined) itemMap[ik] = Number(tf.integerValue);
                    }
                  }
                  return itemMap;
                });
              }
            }
            return resolve(parsedOrder);
          }
          resolve(null);
        } catch(e) {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
  });
}

function createPDF(order) {
  const id = order.id || '#J7001';
  const name = order.name || 'Valued Customer';
  const phone = order.phone || '';
  const address = order.address || 'Chennai, Tamil Nadu';
  const city = order.city || 'Chennai';
  const pincode = order.pincode || '';
  const date = order.date || new Date().toLocaleDateString('en-IN');
  const carrier = order.carrier || 'DTDC Express';
  const trackingId = order.trackingId || `TRK${id.replace('#', '')}VFS`;
  const paymentMethod = order.paymentMethod || 'Razorpay Online';

  const items = Array.isArray(order.items) && order.items.length ? order.items : [{ name: 'Imitation Fashion Jewellery Item', qty: 1, price: Number(order.subtotal || order.total || 0), sku: `ZU1-${id.replace('#', '')}` }];

  const calculatedSubtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 1)), 0);
  const subtotal = (order.subtotal !== undefined && order.subtotal !== null && order.subtotal !== '') ? Number(order.subtotal) : calculatedSubtotal;
  const shipping = (order.shipping !== undefined && order.shipping !== null && order.shipping !== '') ? Number(order.shipping) : 90;
  const gstTotal = (order.gstAmount !== undefined && order.gstAmount !== null && order.gstAmount !== '') ? Number(order.gstAmount) : Math.round(subtotal * 0.03);
  const cgst = Math.round(gstTotal / 2);
  const sgst = gstTotal - cgst;

  const couponAmount = Number(order.couponDiscount || 0);
  const walletAmount = Number(order.walletDiscount || 0);
  const advanceAmount = Number(order.advanceAdjusted || order.advanceDeducted || 0);
  const total = (order.total !== undefined && order.total !== null && order.total !== '') ? Number(order.total) : Math.max(0, subtotal + shipping + gstTotal - couponAmount - walletAmount - advanceAmount);

  const content = [];

  function addText(text, x, y, size = 10, font = 'F1', color = '0 0 0', align = 'left', width = 0) {
    const escaped = String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
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
  addRect(0, 832, 595, 10, '0.83 0.68 0.21');

  addText('VFS JEWELS', 50, 785, 26, 'F2', '0.1 0.1 0.1');
  addText('.', 212, 785, 26, 'F2', '0.83 0.68 0.21');
  addText('Handcrafted Premium Anti-Tarnish Imitation Jewellery', 50, 770, 8.5, 'F1', '0.4 0.4 0.4');

  addRect(380, 765, 165, 30, '0.96 0.94 0.88');
  addLine(380, 765, 545, 765, '0.83 0.68 0.21', 1);
  addText('TAX INVOICE', 390, 775, 14, 'F2', '0.83 0.68 0.21');

  addText(`Invoice ID: INV-${id.replace('#', '')}`, 390, 750, 8.5, 'F1', '0.2 0.2 0.2');
  addText(`Order ID: ${id}`, 390, 738, 9, 'F2', '0 0 0');
  addText(`Date: ${date}`, 390, 726, 8.5, 'F1', '0.2 0.2 0.2');
  addText(`Payment: ${paymentMethod}`, 390, 714, 8.5, 'F2', '0.15 0.5 0.15');
  
  addLine(50, 700, 545, 700, '0.83 0.68 0.21', 2);

  // ── 2. Sold By & Ship To Grid ──
  let y = 680;
  addText('SOLD BY (SUPPLIER):', 50, y, 8.5, 'F2', '0.33 0.33 0.33');
  addText('VFS Jewels Main Store', 50, y - 13, 9.5, 'F2', '0 0 0');
  addText('42, 2nd Floor, Natwar Kurpa Complex,', 50, y - 25, 8.5, 'F1', '0.2 0.2 0.2');
  addText('Narayana Mudali Street, Sowcarpet,', 50, y - 37, 8.5, 'F1', '0.2 0.2 0.2');
  addText('Chennai, Tamil Nadu - 600001', 50, y - 49, 8.5, 'F1', '0.2 0.2 0.2');
  addText('Email: accounts@vfsjewels.store | Web: vfsjewels.store', 50, y - 61, 8, 'F1', '0.2 0.2 0.2');
  addText('GSTIN: 33AAFVC8491A1ZX', 50, y - 73, 9, 'F2', '0.83 0.68 0.21');

  addText('SHIP TO (CUSTOMER):', 330, y, 8.5, 'F2', '0.33 0.33 0.33');
  addText(name, 330, y - 13, 9.5, 'F2', '0 0 0');
  addText(`Address: ${address.substring(0, 42)}`, 330, y - 25, 8.5, 'F1', '0.2 0.2 0.2');
  addText(`City: ${city} - ${pincode}`, 330, y - 37, 8.5, 'F1', '0.2 0.2 0.2');
  addText(`Phone: +91 ${phone.replace(/^91/, '')} | Carrier: ${carrier}`, 330, y - 49, 8.5, 'F1', '0.2 0.2 0.2');

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
    addText(`${(item.name || 'Anti-Tarnish Jewellery Item').substring(0, 36)}`, 100, y, 9, 'F2', '0 0 0');
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

  // ── 5. Footer & Barcode ──
  addText('SHIPPING TRACKING BARCODE', 50, 110, 8, 'F2', '0.3 0.3 0.3');
  let barcodeX = 50;
  for (let b = 0; b < 32; b++) {
    const w = (b % 3 === 0) ? 2 : 1;
    content.push(`${w} w 0 0 0 RG ${barcodeX} 68 m ${barcodeX} 98 l S`);
    barcodeX += (b % 2 === 0) ? 3 : 4;
  }
  addText(trackingId, 50, 56, 8, 'F1', '0.2 0.2 0.2');

  addText('Declaration: This invoice shows actual price of goods and that all particulars are true and correct.', 50, 40, 7.5, 'F1', '0.5 0.5 0.5');

  const streamBody = content.join('\n');
  const streamLength = Buffer.byteLength(streamBody);

  const pdfString = `%PDF-1.4
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
<< /Length ${streamLength} >>
stream
${streamBody}
endstream
endobj
xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000059 00000 n 
0000000116 00000 n 
0000000244 00000 n 
0000000305 00000 n 
0000000371 00000 n 
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
    const rawId = query.id || query.order || 'J7001';
    
    // Fetch stored order payload from Firestore if available
    let fsOrder = await fetchOrderFromFirestore(rawId);
    let orderPayload = fsOrder || {};

    let items = orderPayload.items || [];
    if (!items || items.length === 0) {
      if (query.items) {
        try {
          items = typeof query.items === 'string' ? JSON.parse(query.items) : query.items;
        } catch (e) {
          items = [];
        }
      }
    }

    const pdfBuffer = createPDF({
      id: orderPayload.id || (rawId.startsWith('#') ? rawId : '#' + rawId),
      name: orderPayload.name || query.name || 'Valued Customer',
      phone: orderPayload.phone || query.phone || '',
      address: orderPayload.address || query.address || 'Chennai, Tamil Nadu',
      city: orderPayload.city || query.city || 'Chennai',
      pincode: orderPayload.pincode || query.pincode || '',
      date: orderPayload.date || query.date || new Date().toLocaleDateString('en-IN'),
      carrier: orderPayload.carrier || query.carrier || 'DTDC',
      trackingId: orderPayload.trackingId || query.trackingId || '',
      paymentMethod: orderPayload.paymentMethod || query.paymentMethod || 'Razorpay Online',
      status: orderPayload.status || query.status || 'CONFIRMED',
      total: orderPayload.total !== undefined ? orderPayload.total : (query.total !== undefined ? query.total : 0),
      subtotal: orderPayload.subtotal !== undefined ? orderPayload.subtotal : (query.subtotal !== undefined ? query.subtotal : undefined),
      gstAmount: orderPayload.gstAmount !== undefined ? orderPayload.gstAmount : (query.gstAmount !== undefined ? query.gstAmount : undefined),
      shipping: orderPayload.shipping !== undefined ? orderPayload.shipping : (query.shipping !== undefined ? query.shipping : 90),
      couponDiscount: orderPayload.couponDiscount !== undefined ? orderPayload.couponDiscount : (query.couponDiscount !== undefined ? query.couponDiscount : 0),
      walletDiscount: orderPayload.walletDiscount !== undefined ? orderPayload.walletDiscount : (query.walletDiscount !== undefined ? query.walletDiscount : 0),
      advanceAdjusted: orderPayload.advanceAdjusted !== undefined ? orderPayload.advanceAdjusted : (query.advanceAdjusted !== undefined ? query.advanceAdjusted : 0),
      items: items
    });

    const fileName = `VFS_Jewels_Tax_Invoice_${(rawId).replace('#', '')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('❌ Error generating PDF tax invoice:', err);
    return res.status(500).json({ error: 'Failed to generate PDF tax invoice', details: err.message });
  }
};
