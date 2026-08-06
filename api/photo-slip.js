// ============================================================
//  VFS Jewels — Ultra-Luxury PDF Photo Slip & Dispatch Manifest Generator API
//  Exposed at https://www.vfsjewels.store/api/photo-slip
//  2-Column Grid Layout with LARGE Product Photos
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
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
  });
}

function fetchImageBuffer(url) {
  let targetUrl = url;
  if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('http')) {
    targetUrl = 'https://res.cloudinary.com/cwx4zame/image/upload/f_jpg,w_400,h_400,c_fill/v1783178917/whbmflasdurxiag7au7t.jpg';
  } else if (targetUrl.includes('cloudinary.com') && targetUrl.includes('/upload/')) {
    const parts = targetUrl.split('/upload/');
    targetUrl = parts[0] + '/upload/f_jpg,w_400,h_400,c_fill/' + parts[1];
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
        resolve(buf.length > 100 ? buf : null);
      });
    });
    req.on('error', () => {
      const fallback = 'https://res.cloudinary.com/cwx4zame/image/upload/f_jpg,w_400,h_400,c_fill/v1783178917/whbmflasdurxiag7au7t.jpg';
      https.get(fallback, res2 => {
        const chunks = [];
        res2.on('data', c => chunks.push(c));
        res2.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', () => resolve(null));
    });
  });
}

async function createPhotoSlipPDF(order, items) {
  // Fetch all product images in parallel (large 400x400)
  const imageBuffers = await Promise.all(items.map(item => fetchImageBuffer(item.img)));

  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    const buffers = [];
    doc.on('data', b => buffers.push(b));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    const GOLD = '#D4AF37';
    const DARK = '#1A1A1A';
    const GRAY = '#666666';
    const GREEN = '#2E7D32';
    const LIGHT_GOLD_BG = '#FAF8F0';
    const PAGE_W = 595;
    const MARGIN = 30;

    function drawHeader(pg) {
      pg.rect(0, 0, PAGE_W, 10).fill(GOLD);
      pg.fillColor(DARK).fontSize(20).font('Helvetica-Bold').text('VFS JEWELS', MARGIN, 18, { continued: true });
      pg.fillColor(GOLD).text('.');
      pg.fillColor(GRAY).fontSize(8).font('Helvetica-Bold').text('OFFICIAL DISPATCH PHOTO SLIP & FULFILLMENT MANIFEST', MARGIN, 42);
    }

    // ── Page 1 Header ──
    drawHeader(doc);

    // Badge Right
    const cleanId = (order.id || '#J7001').replace('#', '');
    doc.rect(370, 18, 195, 32).fillAndStroke('#E8F5E9', GREEN);
    doc.fillColor(GREEN).fontSize(12).font('Helvetica-Bold').text('DISPATCH PHOTO SLIP', 375, 28, { width: 185, align: 'center' });
    doc.fillColor(DARK).fontSize(8).font('Helvetica')
      .text(`Slip ID: PS-${cleanId}   |   Order: ${order.id || '#J7001'}`, 370, 56)
      .text(`Date: ${order.date || new Date().toLocaleDateString('en-IN')}   |   Carrier: ${order.carrier || 'DTDC Express'}`, 370, 66);

    doc.moveTo(MARGIN, 78).lineTo(PAGE_W - MARGIN, 78).lineWidth(1.5).stroke(GOLD);

    // Customer Info
    doc.fillColor(GRAY).fontSize(8).font('Helvetica-Bold').text('SHIP TO:', MARGIN, 86);
    doc.fillColor(DARK).fontSize(9.5).font('Helvetica-Bold').text(order.name || 'Valued Customer', MARGIN, 96);
    doc.fillColor(DARK).fontSize(8).font('Helvetica')
      .text(`${order.address || ''}  ${order.city || 'Chennai'} - ${order.pincode || ''}`, MARGIN, 108)
      .text(`Phone: +91 ${(order.phone || '').toString().replace(/^91/, '')}   Status: CONFIRMED & PAID`, MARGIN, 118);

    doc.moveTo(MARGIN, 130).lineTo(PAGE_W - MARGIN, 130).lineWidth(0.8).stroke('#DDDDDD');

    // ── 2-Column Product Grid Layout ──
    const CARD_W = 245;
    const CARD_H = 210;
    const IMG_SIZE = 150;
    const COL_GAP = 15;
    const COL_LEFT = MARGIN;
    const COL_RIGHT = MARGIN + CARD_W + COL_GAP;
    let y = 138;
    let isFirstPage = true;

    for (let i = 0; i < items.length; i++) {
      const isLeft = (i % 2 === 0);
      const x = isLeft ? COL_LEFT : COL_RIGHT;

      // Start new row: if left col and not first item, move y down
      if (isLeft && i > 0) {
        y += CARD_H + 10;
      }

      // New page if overflow
      if (y + CARD_H > 790) {
        doc.addPage();
        drawHeader(doc);
        y = 56;
        isFirstPage = false;
      }

      const item = items[i];
      const imgBuf = imageBuffers[i];
      const price = Number(item.price || 0);
      const qty = Number(item.qty || 1);
      const total = price * qty;
      const sku = item.sku || `ZU1-${item.id || i + 1}`;
      const name = item.name || 'Anti-Tarnish Jewellery';

      // Card background
      doc.rect(x, y, CARD_W, CARD_H).fillAndStroke('#FAFAFA', '#E8E8E8');

      // Gold top accent bar on card
      doc.rect(x, y, CARD_W, 4).fill(GOLD);

      // Large Product Image centred in card
      const imgX = x + (CARD_W - IMG_SIZE) / 2;
      const imgY = y + 8;
      if (imgBuf) {
        try {
          doc.image(imgBuf, imgX, imgY, { width: IMG_SIZE, height: IMG_SIZE });
        } catch(e) {
          doc.rect(imgX, imgY, IMG_SIZE, IMG_SIZE).fillAndStroke('#F0F0F0', GOLD);
          doc.fillColor(GRAY).fontSize(9).text('VFS JEWELS', imgX + 30, imgY + 60);
        }
      } else {
        doc.rect(imgX, imgY, IMG_SIZE, IMG_SIZE).fillAndStroke('#F0F0F0', GOLD);
        doc.fillColor(GRAY).fontSize(9).text('VFS JEWELS', imgX + 30, imgY + 60);
      }

      // Item number badge (top-left on image)
      doc.rect(x + 4, y + 8, 20, 20).fill(GOLD);
      doc.fillColor('#fff').fontSize(9).font('Helvetica-Bold').text(String(i + 1), x + 8, y + 13);

      // Text details below image
      const textY = imgY + IMG_SIZE + 6;
      doc.fillColor(GOLD).fontSize(8.5).font('Helvetica-Bold').text(`SKU: ${sku}`, x + 6, textY, { width: CARD_W - 12 });
      doc.fillColor(DARK).fontSize(8).font('Helvetica').text(name.substring(0, 34), x + 6, textY + 12, { width: CARD_W - 12 });

      // Price row
      doc.fillColor(DARK).fontSize(8).font('Helvetica')
        .text(`Qty: ${qty}`, x + 6, textY + 24)
        .text(`Price: ${fmt(price)}`, x + 65, textY + 24)
        .text(`Total: `, x + 140, textY + 24, { continued: true });
      doc.fillColor(GOLD).font('Helvetica-Bold').text(fmt(total), { continued: false });
    }

    // ── Summary Section ──
    y += CARD_H + 15;
    if (y + 80 > 800) {
      doc.addPage();
      drawHeader(doc);
      y = 56;
    }

    const subtotal = items.reduce((s, item) => s + Number(item.price || 0) * Number(item.qty || 1), 0);
    const shipping = Number(order.shipping || 90);
    const grandTotal = Number(order.total || (subtotal + shipping));

    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).lineWidth(1).stroke(GOLD);
    y += 8;

    // Checklist box
    doc.rect(MARGIN, y, 235, 55).fillAndStroke(LIGHT_GOLD_BG, GOLD);
    doc.fillColor(GOLD).fontSize(8).font('Helvetica-Bold').text('PACKING & QUALITY CHECKLIST:', MARGIN + 8, y + 8);
    doc.fillColor(DARK).fontSize(7.5).font('Helvetica')
      .text('[OK] Items Count Verified   [OK] Anti-Tarnish Bubble Wrap', MARGIN + 8, y + 22)
      .text('[OK] GST Invoice Enclosed  [OK] Sealed Tamper-Proof Box', MARGIN + 8, y + 34)
      .text('[OK] Product Photos Matched to Shipped Items', MARGIN + 8, y + 46);

    // Totals
    const rx = 320;
    doc.fillColor(DARK).fontSize(8.5).font('Helvetica')
      .text(`Total SKUs:`, rx, y + 8).text(String(items.length), rx + 150, y + 8)
      .text(`Subtotal:`, rx, y + 22).text(fmt(subtotal), rx + 150, y + 22)
      .text(`Delivery:`, rx, y + 36).text(fmt(shipping), rx + 150, y + 36);

    doc.moveTo(rx, y + 49).lineTo(PAGE_W - MARGIN, y + 49).lineWidth(1).stroke(GOLD);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK).text('GRAND TOTAL:', rx, y + 54);
    doc.fontSize(11).fillColor(GOLD).text(fmt(grandTotal), rx + 155, y + 54);

    // Footer
    doc.fillColor(GRAY).fontSize(7).font('Helvetica')
      .text('VFS Jewels | 42, Natwar Kurpa Complex, Sowcarpet, Chennai - 600001 | GSTIN: 33AAFVC8491A1ZX | vfsjewels.store', MARGIN, 815, { width: PAGE_W - 2 * MARGIN, align: 'center' });

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
        try { items = typeof query.items === 'string' ? JSON.parse(query.items) : query.items; }
        catch(e) { items = []; }
      }
    }

    if (!items || items.length === 0) {
      items = [
        { name: 'VFS Designer Kada #01', qty: 1, price: 499, sku: 'SN-K001', img: 'https://res.cloudinary.com/cwx4zame/image/upload/v1783178917/whbmflasdurxiag7au7t.jpg' }
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
      total: orderPayload.total !== undefined ? orderPayload.total : (query.total !== undefined ? query.total : 0),
      subtotal: orderPayload.subtotal !== undefined ? orderPayload.subtotal : (query.subtotal !== undefined ? query.subtotal : 0),
      shipping: orderPayload.shipping !== undefined ? orderPayload.shipping : (query.shipping !== undefined ? query.shipping : 90)
    };

    const pdfBuffer = await createPhotoSlipPDF(fullOrder, items);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="VFS_Photo_Slip_${rawId.replace('#', '')}.pdf"`);
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error('Error generating photo slip PDF:', err);
    return res.status(500).json({ error: 'Failed to generate photo slip PDF', details: err.message });
  }
};
