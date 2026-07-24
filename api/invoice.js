// ============================================================
//  VFS Jewels — PDF Invoice Generator API (Vercel Serverless)
//  Exposed at https://vfsjewels.store/api/invoice
//  Generates & Streams PDF Tax Invoice dynamically
// ============================================================

const PDFDocument = require('pdfkit');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = req.method === 'POST' ? req.body : req.query;

  const orderId = query.id || query.order || '#J7001';
  const customerName = query.name || 'Valued Customer';
  const phone = query.phone || '';
  const address = query.address || 'Chennai, Tamil Nadu';
  const city = query.city || 'Chennai';
  const pincode = query.pincode || '';
  const date = query.date || new Date().toLocaleDateString('en-IN');
  const carrier = query.carrier || 'DTDC';
  const total = query.total || '0';
  const subtotal = query.subtotal || total;
  const gstAmount = query.gstAmount || '0';
  const shipping = query.shipping || '90';

  // Parse items if passed as JSON string or array
  let items = [];
  try {
    items = typeof query.items === 'string' ? JSON.parse(query.items) : (query.items || []);
  } catch (e) {
    items = [];
  }
  if (!items.length) {
    items = [{ name: 'Imitation Jewellery Items', qty: 1, price: subtotal }];
  }

  // Create PDF Document
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  const fileName = `VFS_Jewels_Invoice_${orderId.replace('#', '')}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

  doc.pipe(res);

  // ── Header & Branding ──
  doc.fillColor('#d97706').fontSize(22).font('Helvetica-Bold').text('💎 VFS JEWELS', 40, 40);
  doc.fillColor('#475569').fontSize(9).font('Helvetica').text('Premium Imitation Jewellery & Fashion Accessories', 40, 68);
  doc.text('42 Narayana Mudali St, Sowcarpet, Chennai, TN - 600079', 40, 80);
  doc.text('GSTIN: 33AAFVC8491A1ZX | Contact: +91 98407 57363 | vfsjewels.store', 40, 92);

  // Divider Line
  doc.moveTo(40, 110).lineTo(555, 110).strokeColor('#cbd5e1').lineWidth(1).stroke();

  // ── Invoice Meta Title ──
  doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('RETAIL TAX INVOICE', 40, 125);
  
  doc.fillColor('#334155').fontSize(10).font('Helvetica');
  doc.text(`Invoice No: INV-${orderId.replace('#', '')}`, 400, 125, { align: 'right' });
  doc.text(`Order ID: ${orderId}`, 400, 140, { align: 'right' });
  doc.text(`Date: ${date}`, 400, 155, { align: 'right' });
  doc.text(`Status: CONFIRMED`, 400, 170, { align: 'right' });

  // ── Customer Details Box ──
  doc.fillColor('#f8fafc').rect(40, 150, 320, 75).fill();
  doc.strokeColor('#e2e8f0').rect(40, 150, 320, 75).stroke();
  
  doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('BILL TO / SHIP TO:', 50, 158);
  doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(customerName, 50, 172);
  doc.fillColor('#334155').fontSize(9).font('Helvetica').text(`${address}, ${city} - ${pincode}`, 50, 186);
  doc.text(`Phone: +${phone} | Carrier: ${carrier}`, 50, 200);

  // ── Items Table Header ──
  let y = 245;
  doc.fillColor('#1e293b').rect(40, y, 515, 22).fill();
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
  doc.text('S.No', 50, y + 6);
  doc.text('Item Description', 90, y + 6);
  doc.text('Qty', 370, y + 6, { width: 40, align: 'center' });
  doc.text('Rate (₹)', 420, y + 6, { width: 60, align: 'right' });
  doc.text('Amount (₹)', 490, y + 6, { width: 60, align: 'right' });

  y += 26;
  doc.fillColor('#334155').fontSize(9).font('Helvetica');

  items.forEach((item, index) => {
    const itemTotal = (item.price || 0) * (item.qty || 1);
    doc.text(`${index + 1}`, 50, y);
    doc.text(item.name || 'Jewellery Item', 90, y, { width: 270 });
    doc.text(`${item.qty || 1}`, 370, y, { width: 40, align: 'center' });
    doc.text(`${item.price || 0}`, 420, y, { width: 60, align: 'right' });
    doc.text(`${itemTotal}`, 490, y, { width: 60, align: 'right' });

    y += 20;
    doc.moveTo(40, y - 5).lineTo(555, y - 5).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
  });

  // ── Totals Breakdown ──
  y += 10;
  doc.moveTo(40, y).lineTo(555, y).strokeColor('#cbd5e1').lineWidth(1).stroke();
  y += 15;

  doc.fillColor('#475569').fontSize(9).font('Helvetica');
  doc.text('Subtotal:', 380, y, { width: 100, align: 'right' });
  doc.text(`₹${subtotal}`, 490, y, { width: 60, align: 'right' });
  
  y += 16;
  doc.text('GST (3%):', 380, y, { width: 100, align: 'right' });
  doc.text(`₹${gstAmount}`, 490, y, { width: 60, align: 'right' });

  y += 16;
  doc.text('Delivery Fee:', 380, y, { width: 100, align: 'right' });
  doc.text(`₹${shipping}`, 490, y, { width: 60, align: 'right' });

  y += 20;
  doc.fillColor('#1e293b').rect(360, y, 195, 26).fill();
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('Grand Total:', 370, y + 7, { width: 100, align: 'right' });
  doc.text(`₹${total}`, 480, y + 7, { width: 70, align: 'right' });

  // ── Footer Terms ──
  doc.fillColor('#64748b').fontSize(8).font('Helvetica');
  doc.text('• This is a computer-generated invoice and requires no physical signature.', 40, 720);
  doc.text('• Goods once sold can be replaced as per VFS Jewels exchange policies at vfsjewels.store.', 40, 732);
  doc.fillColor('#d97706').font('Helvetica-Bold').text('Thank you for shopping with VFS Jewels!', 40, 750, { align: 'center' });

  doc.end();
};
