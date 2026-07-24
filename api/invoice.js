// ============================================================
//  VFS Jewels — Zero-Dependency PDF Invoice Generator API
//  Exposed at https://www.vfsjewels.store/api/invoice
//  Generates valid PDF 1.4 Tax Invoice without external font file dependencies
// ============================================================

function createPDF(data) {
  const { id = '#J7001', name = 'Customer', phone = '', address = '', city = '', pincode = '', date = new Date().toLocaleDateString('en-IN'), total = '0', subtotal = '0', gstAmount = '0', shipping = '90', carrier = 'DTDC', items = [] } = data;

  const content = [];

  // Helper for PDF text instructions
  function addText(text, x, y, size = 10, font = 'F1', color = '0 0 0') {
    // Escape special PDF characters
    const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    content.push(`BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${escaped}) Tj ET`);
  }

  function addLine(x1, y1, x2, y2, color = '0.8 0.8 0.8', width = 1) {
    content.push(`${width} w ${color} RG ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  function addRect(x, y, w, h, fillColor = '0.96 0.96 0.96') {
    content.push(`${fillColor} rg ${x} ${y} ${w} ${h} re f`);
  }

  // ── 1. Header & Title ──
  addText('VFS JEWELS', 50, 750, 22, 'F2', '0.85 0.47 0.02');
  addText('Premium Imitation Jewellery & Fashion Accessories', 50, 735, 9, 'F1', '0.28 0.33 0.41');
  addText('42 Narayana Mudali St, Sowcarpet, Chennai, TN - 600079', 50, 723, 9, 'F1', '0.28 0.33 0.41');
  addText('GSTIN: 33AAFVC8491A1ZX | Contact: +91 98407 57363 | vfsjewels.store', 50, 711, 9, 'F1', '0.28 0.33 0.41');

  addLine(50, 700, 545, 700, '0.8 0.8 0.8', 1);

  addText('RETAIL TAX INVOICE', 50, 680, 14, 'F2', '0.06 0.09 0.16');
  addText(`Invoice No: INV-${id.replace('#', '')}`, 400, 680, 9, 'F1', '0.2 0.25 0.33');
  addText(`Order ID: ${id}`, 400, 668, 9, 'F2', '0.2 0.25 0.33');
  addText(`Date: ${date}`, 400, 656, 9, 'F1', '0.2 0.25 0.33');
  addText(`Status: CONFIRMED`, 400, 644, 9, 'F2', '0.06 0.6 0.35');

  // ── 2. Customer Details ──
  addRect(50, 600, 320, 70, '0.97 0.98 0.99');
  addText('BILL TO / SHIP TO:', 60, 655, 9, 'F2', '0.39 0.45 0.55');
  addText(name, 60, 642, 10, 'F2', '0.06 0.09 0.16');
  addText(`${address}, ${city} - ${pincode}`, 60, 630, 9, 'F1', '0.2 0.25 0.33');
  addText(`Phone: +${phone} | Carrier: ${carrier}`, 60, 618, 9, 'F1', '0.2 0.25 0.33');

  // ── 3. Items Table Header ──
  let y = 560;
  addRect(50, y, 495, 20, '0.12 0.16 0.23');
  addText('S.No', 60, y + 5, 9, 'F2', '1 1 1');
  addText('Item Description', 100, y + 5, 9, 'F2', '1 1 1');
  addText('Qty', 370, y + 5, 9, 'F2', '1 1 1');
  addText('Rate (INR)', 430, y + 5, 9, 'F2', '1 1 1');
  addText('Amount (INR)', 490, y + 5, 9, 'F2', '1 1 1');

  y -= 20;
  items.slice(0, 10).forEach((item, idx) => {
    const itemTotal = (item.price || 0) * (item.qty || 1);
    addText(`${idx + 1}`, 60, y + 4, 9, 'F1', '0.2 0.25 0.33');
    addText(`${(item.name || 'Jewellery Item').substring(0, 35)}`, 100, y + 4, 9, 'F1', '0.2 0.25 0.33');
    addText(`${item.qty || 1}`, 375, y + 4, 9, 'F1', '0.2 0.25 0.33');
    addText(`${item.price || 0}`, 435, y + 4, 9, 'F1', '0.2 0.25 0.33');
    addText(`${itemTotal}`, 495, y + 4, 9, 'F2', '0.2 0.25 0.33');
    addLine(50, y, 545, y, '0.93 0.95 0.96', 0.5);
    y -= 18;
  });

  // ── 4. Totals Breakdown ──
  y -= 10;
  addLine(50, y, 545, y, '0.8 0.8 0.8', 1);
  y -= 18;
  addText('Subtotal:', 380, y, 9, 'F1', '0.28 0.33 0.41');
  addText(`Rs. ${subtotal}`, 490, y, 9, 'F1', '0.28 0.33 0.41');
  y -= 15;
  addText('GST (3%):', 380, y, 9, 'F1', '0.28 0.33 0.41');
  addText(`Rs. ${gstAmount}`, 490, y, 9, 'F1', '0.28 0.33 0.41');
  y -= 15;
  addText('Delivery Fee:', 380, y, 9, 'F1', '0.28 0.33 0.41');
  addText(`Rs. ${shipping}`, 490, y, 9, 'F1', '0.28 0.33 0.41');

  y -= 22;
  addRect(360, y - 4, 185, 22, '0.12 0.16 0.23');
  addText('Grand Total:', 370, y, 10, 'F2', '1 1 1');
  addText(`Rs. ${total}`, 485, y, 10, 'F2', '1 1 1');

  // ── 5. Footer ──
  addText('• This is a computer-generated invoice and requires no physical signature.', 50, 70, 8, 'F1', '0.39 0.45 0.55');
  addText('• Exchange as per VFS Jewels policies at vfsjewels.store.', 50, 58, 8, 'F1', '0.39 0.45 0.55');
  addText('Thank you for shopping with VFS Jewels!', 200, 40, 10, 'F2', '0.85 0.47 0.02');

  const streamBody = content.join('\n');

  // Build raw PDF 1.4 binary structure
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
      total: query.total || '0',
      subtotal: query.subtotal || query.total || '0',
      gstAmount: query.gstAmount || '0',
      shipping: query.shipping || '90',
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
