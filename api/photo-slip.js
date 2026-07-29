// ============================================================
//  VFS Jewels — Ultra-Luxury PDF Photo Slip & Dispatch Manifest Generator API
//  Exposed at https://www.vfsjewels.store/api/photo-slip
//  Uses PDFKit to embed high-res product photos alongside item SKUs & specifications
// ============================================================

const PDFDocument = require('pdfkit');
const https = require('https');
const http = require('http');

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

function fetchImageBuffer(url) {
  let targetUrl = url;
  if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('http')) {
    targetUrl = "https://res.cloudinary.com/cwx4zame/image/upload/f_jpg,w_150,h_150,c_fill/v1783178917/whbmflasdurxiag7au7t.jpg";
  } else if (targetUrl.includes('cloudinary.com') && targetUrl.includes('/upload/')) {
    const parts = targetUrl.split('/upload/');
    targetUrl = parts[0] + '/upload/f_jpg,w_150,h_150,c_fill/' + parts[1];
  }

  return new Promise((resolve) => {
    const client = targetUrl.startsWith('https') ? https : http;
    const req = client.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchImageBuffer(res.headers.location).then(resolve);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length > 100) resolve(buf);
        else resolve(null);
      });
    });
    req.on('error', () => {
      const fallbackUrl = "https://res.cloudinary.com/cwx4zame/image/upload/f_jpg,w_150,h_150,c_fill/v1783178917/whbmflasdurxiag7au7t.jpg";
      https.get(fallbackUrl, res2 => {
        const chunks = [];
        res2.on('data', c => chunks.push(c));
        res2.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', () => resolve(null));
    });
  });
}

async function createPDFKitPhotoSlip(order, items) {
  const imageBuffers = await Promise.all(items.map(item => fetchImageBuffer(item.img)));

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];

    doc.on('data', b => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    const GOLD = '#D4AF37';
    const DARK = '#1A1A1A';
    const GRAY = '#666666';

    // 1. Top Accent Bar
    doc.rect(0, 0, 595, 10).fill(GOLD);

    // 2. Branding Header
    doc.fillColor(DARK).fontSize(22).font('Helvetica-Bold').text('VFS JEWELS', 40, 25, { continued: true });
    doc.fillColor(GOLD).text('.');
    doc.fillColor(GRAY).fontSize(8.5).font('Helvetica-Bold').text('OFFICIAL FULFILLMENT PHOTO SLIP & ITEM MANIFEST', 40, 52);

    // Dispatch Badge Right
    doc.rect(360, 25, 195, 30).fillAndStroke('#E8F5E9', '#2E7D32');
    doc.fillColor('#2E7D32').fontSize(12).font('Helvetica-Bold').text('DISPATCH PHOTO SLIP', 370, 34, { width: 175, align: 'center' });

    const cleanId = (order.id || '#J7001').replace('#', '');
    doc.fillColor(DARK).fontSize(8.5).font('Helvetica').text(`Slip ID: PS-${cleanId}`, 370, 62);
    doc.font('Helvetica-Bold').text(`Order ID: ${order.id || '#J7001'}`, 370, 74);
    doc.font('Helvetica').text(`Date: ${order.date || new Date().toLocaleDateString('en-IN')}`, 370, 86);
    doc.fillColor(GOLD).font('Helvetica-Bold').text(`Tracking: ${order.trackingId || ('TRK' + cleanId + 'VFS')}`, 370, 98);

    doc.moveTo(40, 112).lineTo(555, 112).lineWidth(1.5).stroke(GOLD);

    // 3. Customer Info
    doc.fillColor(GRAY).fontSize(8.5).font('Helvetica-Bold').text('SHIP TO CUSTOMER:', 40, 122);
    doc.fillColor(DARK).fontSize(10).font('Helvetica-Bold').text(order.name || 'Valued Customer', 40, 134);
    doc.fillColor(DARK).fontSize(8.5).font('Helvetica').text(`Address: ${order.address || 'Chennai, Tamil Nadu'}`, 40, 146);
    doc.fillColor('#2E7D32').fontSize(8.5).font('Helvetica-Bold').text(`Phone: +91 ${(order.phone || '').toString().replace(/^91/, '')} | Status: CONFIRMED & PAID`, 40, 158);

    doc.moveTo(40, 172).lineTo(555, 172).lineWidth(0.8).stroke('#DDDDDD');

    // 4. Table Header
    let y = 182;
    doc.rect(40, y, 515, 20).fill('#F2F2F2');
    doc.fillColor(DARK).fontSize(8.5).font('Helvetica-Bold');
    doc.text('#', 48, y + 5);
    doc.text('PRODUCT PHOTO', 70, y + 5);
    doc.text('SKU CODE & ITEM SPECIFICATION', 170, y + 5);
    doc.text('QTY', 400, y + 5);
    doc.text('PRICE', 445, y + 5);
    doc.text('TOTAL', 500, y + 5);

    y += 24;
    let subtotal = 0;

    items.forEach((item, idx) => {
      if (y > 740) {
        doc.addPage();
        doc.rect(0, 0, 595, 10).fill(GOLD);
        y = 30;
      }

      const price = Number(item.price || 0);
      const qty = Number(item.qty || 1);
      const total = price * qty;
      subtotal += total;
      const sku = item.sku || `ZU1-${item.id || idx + 1}`;
      const name = item.name || 'Anti-Tarnish Jewellery';
      const imgBuf = imageBuffers[idx];

      // Index
      doc.fillColor(DARK).fontSize(9).font('Helvetica').text(String(idx + 1), 48, y + 18);

      // Embedded Product Image
      if (imgBuf) {
        try {
          doc.rect(70, y, 46, 46).stroke(GOLD);
          doc.image(imgBuf, 71, y + 1, { width: 44, height: 44 });
        } catch (e) {
          doc.rect(70, y, 46, 46).fillAndStroke('#F9F9F9', GOLD);
          doc.fillColor(GRAY).fontSize(7).text('VFS JEWELS', 73, y + 18);
        }
      } else {
        doc.rect(70, y, 46, 46).fillAndStroke('#F9F9F9', GOLD);
        doc.fillColor(GRAY).fontSize(7).text('VFS JEWELS', 73, y + 18);
      }

      // SKU & Name
      doc.fillColor(GOLD).fontSize(9).font('Helvetica-Bold').text(`SKU: ${sku}`, 170, y + 5);
      doc.fillColor(DARK).fontSize(8.5).font('Helvetica').text(name.substring(0, 38), 170, y + 18);
      doc.fillColor(GRAY).fontSize(7.5).font('Helvetica').text('Anti-Tarnish Premium Jewellery', 170, y + 30);

      // Qty, Price, Total
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(String(qty), 405, y + 18);
      doc.fillColor(DARK).fontSize(8.5).font('Helvetica').text(fmt(price), 440, y + 18);
      doc.fillColor(DARK).fontSize(9).font('Helvetica-Bold').text(fmt(total), 495, y + 18);

      y += 50;
      doc.moveTo(40, y - 2).lineTo(555, y - 2).lineWidth(0.5).stroke('#EEEEEE');
    });

    // Summary & Quality Checklist Seal
    const shipping = Number(order.shipping || 90);
    const grandTotal = Number(order.total || (subtotal + shipping));

    y += 10;
    if (y > 740) {
      doc.addPage();
      y = 40;
    }

    doc.rect(40, y, 240, 50).fillAndStroke('#FAF8F0', GOLD);
    doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold').text('PACKING & QUALITY CHECKLIST:', 50, y + 8);
    doc.fillColor(DARK).fontSize(7.5).font('Helvetica').text('[OK] Items Count Checked    [OK] Bubble Wrap Protected', 50, y + 22);
    doc.text('[OK] GST Invoice Attached   [OK] Sealed Box Container', 50, y + 34);

    doc.fillColor(DARK).fontSize(8.5).font('Helvetica').text(`Total Items: ${items.length} SKUs`, 340, y + 5);
    doc.text(`Subtotal: ${fmt(subtotal)}`, 340, y + 18);
    doc.text(`Shipping: ${fmt(shipping)}`, 340, y + 31);

    doc.moveTo(340, y + 43).lineTo(555, y + 43).lineWidth(1).stroke(GOLD);
    doc.fontSize(10).font('Helvetica-Bold').text('GRAND TOTAL:', 340, y + 48);
    doc.fillColor(GOLD).fontSize(11).font('Helvetica-Bold').text(fmt(grandTotal), 460, y + 48);

    doc.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const query = req.method === 'POST' ? req.body : req.query;
    const rawId = query.id || query.order || 'J7001';

    let fsOrder = await fetchOrderFromFirestore(rawId);
    let orderPayload = fsOrder || {};

    let items = orderPayload.items || [];
    if (!items || items.length === 0) {
      if (query.items) {
        try {
          items = typeof query.items === 'string' ? JSON.parse(query.items) : query.items;
        } catch(e) {
          items = [];
        }
      }
    }

    if (!items || items.length === 0) {
      items = [
        { name: 'VFS Designer Kada #01 (Anti-Tarnish)', qty: 1, price: 499, sku: 'SN-K001', img: 'https://res.cloudinary.com/cwx4zame/image/upload/v1783178917/whbmflasdurxiag7au7t.jpg' },
        { name: 'VFS Designer Earring #12', qty: 2, price: 499, sku: 'SN-E012', img: 'https://res.cloudinary.com/cwx4zame/image/upload/v1783178917/whbmflasdurxiag7au7t.jpg' }
      ];
    }

    const fullOrder = {
      id: orderPayload.id || (rawId.startsWith('#') ? rawId : '#' + rawId),
      name: orderPayload.name || query.name || 'Valued Customer',
      phone: orderPayload.phone || query.phone || '',
      address: orderPayload.address || query.address || 'Chennai, Tamil Nadu',
      city: orderPayload.city || query.city || 'Chennai',
      pincode: orderPayload.pincode || query.pincode || '',
      date: orderPayload.date || query.date || new Date().toLocaleDateString('en-IN'),
      carrier: orderPayload.carrier || query.carrier || 'DTDC Express Air',
      trackingId: orderPayload.trackingId || query.trackingId || '',
      total: orderPayload.total || query.total || 91,
      subtotal: orderPayload.subtotal || query.subtotal || 1,
      shipping: orderPayload.shipping || query.shipping || 90
    };

    const pdfBuffer = await createPDFKitPhotoSlip(fullOrder, items);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="VFS_Photo_Slip_${rawId.replace('#', '')}.pdf"`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('Error generating photo slip PDF:', err);
    return res.status(500).json({ error: 'Failed to generate photo slip PDF', details: err.message });
  }
};
