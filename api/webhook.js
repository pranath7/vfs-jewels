const https = require('https');

const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_NUMBER_ID || '1306137785911069';

function fetchOrderFromFirestore(orderId) {
  const cleanId = String(orderId).replace('#', '').trim();
  return new Promise((resolve) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/vfs-jewellery/databases/(default)/documents/orders/${encodeURIComponent(cleanId)}`,
      method: 'GET'
    };
    const req = https.get(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const doc = JSON.parse(body);
          if (doc && doc.fields) {
            const order = {};
            for (let k in doc.fields) {
              const f = doc.fields[k];
              if (f.stringValue !== undefined) order[k] = f.stringValue;
              else if (f.doubleValue !== undefined) order[k] = f.doubleValue;
              else if (f.integerValue !== undefined) order[k] = Number(f.integerValue);
              else if (f.arrayValue && f.arrayValue.values) {
                order[k] = f.arrayValue.values.map(v => {
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
            return resolve(order);
          }
          resolve(null);
        } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
  });
}

function sendWhatsAppReply(toPhone, messageBody) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.warn('⚠️ sendWhatsAppReply aborted: Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID');
    return Promise.resolve(false);
  }
  const data = JSON.stringify({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toPhone,
    type: "text",
    text: { preview_url: true, body: messageBody }
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(true);
        } else {
          console.warn(`⚠️ Meta API responded with status ${res.statusCode}:`, body);
          resolve(false);
        }
      });
    });
    req.on('error', (err) => {
      console.error('❌ Network error sending WhatsApp reply:', err);
      resolve(false);
    });
    req.write(data);
    req.end();
  });
}

function extractOrderId(text) {
  if (!text) return null;
  const t = String(text).trim();
  
  // 1. Explicit keyword match: "Order #XYZ" or "Order XYZ"
  const orderWordMatch = t.match(/order\s*#?\s*([A-Za-z0-9\-]+)/i);
  if (orderWordMatch && orderWordMatch[1]) {
    return orderWordMatch[1].toUpperCase().replace(/^#/, '');
  }

  // 2. Hash token: "#J7001", "#S9010", "#VF-1002"
  const hashMatch = t.match(/#([A-Za-z0-9\-]+)/);
  if (hashMatch && hashMatch[1]) {
    return hashMatch[1].toUpperCase();
  }

  // 3. Known format prefixes: VF-XXXX or VFS-XXXX
  const vfMatch = t.match(/(?:VF-?|VFS-?)\d+/i);
  if (vfMatch) {
    return vfMatch[0].toUpperCase().replace('VF', 'VF-').replace('VF--', 'VF-');
  }

  // 4. Monthly code format: single letter month + number e.g. J7001, A8004, S9010
  const monthlyMatch = t.match(/\b([A-Z]\d{3,5})\b/i);
  if (monthlyMatch) {
    return monthlyMatch[1].toUpperCase();
  }

  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const VERIFY_TOKEN = 'vfs_jewels_webhook_secure';

  // 1. Webhook Verification (GET Request from Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook successfully verified by Meta!');
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    } else {
      return res.status(403).json({ error: 'Verification token mismatch' });
    }
  }

  // 2. Incoming WhatsApp Events (POST Request from Meta)
  // Initiated by Customer -> Triggers Free 24-Hour WhatsApp Customer Care Session!
  if (req.method === 'POST') {
    try {
      const payload = req.body;
      if (payload.object === 'whatsapp_business_account' && payload.entry) {
        for (const entry of payload.entry) {
          for (const change of entry.changes) {
            if (change.value && change.value.messages) {
              for (const msg of change.value.messages) {
                const senderPhone = msg.from;
                const textBody = (msg.text?.body || '').trim();
                console.log(`📩 Incoming message from +${senderPhone}: "${textBody}"`);

                // Extract Order ID from message
                const extractedId = extractOrderId(textBody);
                if (extractedId) {
                  const cleanOrderId = extractedId.replace('#', '').trim();
                  console.log(`🔍 Extracted Order ID: "${cleanOrderId}". Fetching from Firestore...`);

                  // Attempt lookup with cleanId first, fallback to #cleanId if needed
                  let order = await fetchOrderFromFirestore(cleanOrderId);
                  if (!order) {
                    order = await fetchOrderFromFirestore('#' + cleanOrderId);
                  }

                  if (order) {
                    const displayOrderId = order.id ? order.id.replace('#', '') : cleanOrderId;
                    let itemsTxt = '';
                    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                      order.items.forEach((it, idx) => {
                        itemsTxt += `${idx + 1}. *${it.name || 'Jewellery Item'}*\n   • Qty: ${it.qty || 1} | Price: ₹${it.price || 0}\n`;
                        if (it.img) itemsTxt += `   • Photo: ${it.img}\n`;
                      });
                    } else {
                      itemsTxt = `1. *Fashion Jewellery Order*\n   • Qty: 1 | Price: ₹${order.total || 0}\n`;
                    }

                    const reply = 
`📄 *VFS JEWELS — TAX INVOICE & PACKING PHOTO SLIP*
━━━━━━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* #${displayOrderId}
👤 *Customer:* ${order.name || 'Valued Customer'}
🚚 *Delivery Address:* ${order.address || 'Standard Address'}, ${order.city || ''} ${order.pincode || ''}

🛍️ *PRODUCTS ORDERED:*
${itemsTxt}━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ₹${order.subtotal || order.total || 0}
🚚 *Shipping:* ₹${order.shipping || 0}
💳 *Advance / Discount:* -₹${(Number(order.advanceAdjusted || 0) + Number(order.walletDiscount || 0) + Number(order.couponDiscount || 0))}
✅ *Total Amount:* ₹${order.total || 0}
💳 *Payment Status:* ${order.status === 'paid' ? 'Paid Online ✅' : 'Payment Verification Pending ⏳'}

🔗 *DOWNLOAD OFFICIAL PDFS (Click to Open):*
📄 *Tax Invoice PDF:*
https://www.vfsjewels.store/api/invoice?id=${encodeURIComponent(displayOrderId)}

📸 *Packing Photo Slip PDF:*
https://www.vfsjewels.store/api/photo-slip?id=${encodeURIComponent(displayOrderId)}

━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for shopping with VFS Jewels! 💎✨
Need help? Reply here anytime.`;

                    const replyStatus = await sendWhatsAppReply(senderPhone, reply);
                    console.log(`📤 WhatsApp Free Session Reply to +${senderPhone} for #${displayOrderId}: ${replyStatus ? 'SUCCESS' : 'FAILED'}`);
                  } else {
                    console.warn(`⚠️ Order not found in Firestore for ID: "${cleanOrderId}"`);
                  }
                }
              }
            }
          }
        }
      }
      return res.status(200).json({ status: 'EVENT_RECEIVED' });
    } catch (err) {
      console.error('❌ Error processing webhook event:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
