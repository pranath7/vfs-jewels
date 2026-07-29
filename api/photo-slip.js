// ============================================================
//  VFS Jewels — Ultra-Luxury PDF Photo Slip & Dispatch Manifest Generator API
//  Exposed at https://www.vfsjewels.store/api/photo-slip
//  Includes Item Photos, SKUs, Quantities, Unit Prices, and Packing Checklist
// ============================================================

function fmt(val) {
  return 'Rs. ' + Number(val || 0).toLocaleString('en-IN');
}

function createPhotoSlipPDF(order) {
  const id = order.id || '#J7001';
  const name = order.name || 'Valued Customer';
  const phone = order.phone || '';
  const address = order.address || '';
  const city = order.city || 'Chennai';
  const pincode = order.pincode || '';
  const date = order.date || new Date().toLocaleDateString('en-IN');
  const carrier = order.carrier || 'DTDC Express';
  const trackingId = order.trackingId || `TRK${id.replace('#', '')}VFS`;

  const items = Array.isArray(order.items) && order.items.length ? order.items : [
    { name: 'VFS Designer Kada #01 (Anti-Tarnish)', qty: 1, price: 499, sku: 'ZU1-201' },
    { name: 'Royal Emerald CZ Necklace Set', qty: 2, price: 1299, sku: 'ZU1-305' },
    { name: 'Kandy Gold Plated Bangle Pair', qty: 1, price: 799, sku: 'ZU1-108' }
  ];

  const subtotal = Number(order.subtotal || items.reduce((acc, i) => acc + (i.price * i.qty), 0));
  const shipping = Number(order.shipping || 90);
  const gstTotal = Number(order.gstAmount || Math.round(subtotal * 0.03));
  const total = Number(order.total || (subtotal + shipping + gstTotal));

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

  addText('VFS JEWELS', 50, 785, 24, 'F2', '0.1 0.1 0.1');
  addText('.', 202, 785, 24, 'F2', '0.83 0.68 0.21');
  addText('OFFICIAL FULFILLMENT PHOTO SLIP & ITEM MANIFEST', 50, 770, 8.5, 'F2', '0.4 0.4 0.4');

  addRect(360, 765, 185, 30, '0.94 0.96 0.94');
  addLine(360, 765, 545, 765, '0.15 0.5 0.15', 1);
  addText('DISPATCH PHOTO SLIP', 370, 775, 13, 'F2', '0.15 0.5 0.15');

  addText(`Slip ID: PS-${id.replace('#', '')}`, 370, 750, 8.5, 'F1', '0.2 0.2 0.2');
  addText(`Order ID: ${id}`, 370, 738, 9, 'F2', '0 0 0');
  addText(`Date: ${date}`, 370, 726, 8.5, 'F1', '0.2 0.2 0.2');
  addText(`Tracking: ${trackingId}`, 370, 714, 8.5, 'F2', '0.83 0.68 0.21');

  addLine(50, 700, 545, 700, '0.83 0.68 0.21', 2);

  // ── 2. Shipping Details ──
  let y = 680;
  addText('SHIP TO CUSTOMER:', 50, y, 8.5, 'F2', '0.33 0.33 0.33');
  addText(name, 50, y - 13, 9.5, 'F2', '0 0 0');
  addText(`Address: ${address}`, 50, y - 25, 8.5, 'F1', '0.2 0.2 0.2');
  addText(`City: ${city} - ${pincode} | Phone: +91 ${phone.replace(/^91/, '')}`, 50, y - 37, 8.5, 'F1', '0.2 0.2 0.2');
  addText(`Courier Partner: ${carrier} (Express Air Fulfill)`, 50, y - 49, 8.5, 'F2', '0.15 0.5 0.15');

  y -= 70;
  addLine(50, y, 545, y, '0.83 0.68 0.21', 1);

  // ── 3. Itemized Photo & Verification Table Header ──
  y -= 20;
  addRect(50, y - 5, 495, 22, '0.94 0.94 0.94');
  addText('#', 60, y, 8.5, 'F2', '0.2 0.2 0.2');
  addText('SKU CODE', 85, y, 8.5, 'F2', '0.2 0.2 0.2');
  addText('ITEM NAME & SPECIFICATION', 170, y, 8.5, 'F2', '0.2 0.2 0.2');
  addText('QTY', 390, y, 8.5, 'F2', '0.2 0.2 0.2');
  addText('PRICE', 440, y, 8.5, 'F2', '0.2 0.2 0.2');
  addText('TOTAL', 500, y, 8.5, 'F2', '0.2 0.2 0.2');

  y -= 25;
  items.forEach((item, idx) => {
    if (y < 120) return; // Prevention of overflow

    const itemTotal = Number(item.price || 0) * Number(item.qty || 1);
    const sku = item.sku || `ZU1-${100 + idx}`;
    const itemName = item.name || 'Anti-Tarnish Jewellery';

    addText(String(idx + 1), 60, y, 8.5, 'F1', '0.3 0.3 0.3');
    addText(sku, 85, y, 8.5, 'F2', '0.83 0.68 0.21');
    addText(itemName.substring(0, 38), 170, y, 8.5, 'F1', '0 0 0');
    addText(String(item.qty), 395, y, 8.5, 'F2', '0 0 0');
    addText(fmt(item.price), 440, y, 8.5, 'F1', '0.3 0.3 0.3');
    addText(fmt(itemTotal), 500, y, 8.5, 'F2', '0 0 0');

    y -= 18;
    addLine(50, y + 5, 545, y + 5, '0.92 0.92 0.92', 0.5);
  });

  // ── 4. Grand Totals & Quality Seal ──
  y -= 20;
  addRect(50, y - 45, 230, 40, '0.97 0.96 0.92');
  addText('PACKING & QUALITY CHECKLIST:', 60, y - 12, 8, 'F2', '0.83 0.68 0.21');
  addText('✔ Items Count Checked  ✔ Anti-Tarnish Bubble Wrap', 60, y - 25, 7.5, 'F1', '0.2 0.2 0.2');
  addText('✔ GST Invoice Inserted ✔ Sealed Tamper-Proof Box', 60, y - 37, 7.5, 'F1', '0.2 0.2 0.2');

  const rightX = 350;
  addText('Total Items Count:', rightX, y - 10, 8.5, 'F1', '0.3 0.3 0.3');
  addText(String(items.length) + ' SKUs', 480, y - 10, 8.5, 'F2', '0 0 0');

  addText('Subtotal:', rightX, y - 22, 8.5, 'F1', '0.3 0.3 0.3');
  addText(fmt(subtotal), 480, y - 22, 8.5, 'F1', '0 0 0');

  addText('Delivery Charge:', rightX, y - 34, 8.5, 'F1', '0.3 0.3 0.3');
  addText(fmt(shipping), 480, y - 34, 8.5, 'F1', '0 0 0');

  addLine(rightX, y - 40, 545, y - 40, '0.83 0.68 0.21', 1);
  addText('GRAND TOTAL:', rightX, y - 55, 10, 'F2', '0 0 0');
  addText(fmt(total), 470, y - 55, 11, 'F2', '0.83 0.68 0.21');

  // Footer Stamp
  addText('Computer-generated VFS Fulfillment Photo Slip & Packing Manifest. Authorized dispatch.', 50, 40, 8, 'F1', '0.5 0.5 0.5');

  // Build PDF Stream
  const contentStream = content.join('\n');
  const streamLength = Buffer.byteLength(contentStream);

  const pdfParts = [];
  pdfParts.push('%PDF-1.4\n');
  pdfParts.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  pdfParts.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  pdfParts.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n');
  pdfParts.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');
  pdfParts.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n');
  pdfParts.push(`6 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream\nendobj\n`);

  let offset = 0;
  const offsets = [0];

  for (let i = 0; i < pdfParts.length; i++) {
    offsets.push(offset + Buffer.byteLength(pdfParts[i]));
    offset += Buffer.byteLength(pdfParts[i]);
  }

  const xrefOffset = offset;
  let xref = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    xref += String(offsets[i - 1]).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.concat([
    Buffer.from(pdfParts.join('')),
    Buffer.from(xref),
    Buffer.from(trailer)
  ]);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let order = {};
    if (req.method === 'POST' && req.body) {
      order = req.body;
    } else {
      order = {
        id: req.query.id || '#J7001',
        name: req.query.name || 'Valued Customer',
        phone: req.query.phone || '',
        address: req.query.address || '',
        city: req.query.city || 'Chennai',
        pincode: req.query.pincode || '',
        total: req.query.total || 91,
        subtotal: req.query.subtotal || 1,
        shipping: req.query.shipping || 90,
        carrier: req.query.carrier || 'DTDC Express'
      };
    }

    const pdfBuffer = createPhotoSlipPDF(order);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="VFS_Photo_Slip_${(order.id || 'J7001').replace('#', '')}.pdf"`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('Error generating photo slip PDF:', err);
    return res.status(500).json({ error: 'Failed to generate photo slip PDF', details: err.message });
  }
};
