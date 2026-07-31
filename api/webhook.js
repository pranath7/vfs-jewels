const https = require('https');

const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID || process.env.PHONE_NUMBER_ID || '641979435655452';

function fetchOrderFromFirestore(orderId) {
  const cleanId = String(orderId).replace('#', '').trim();
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
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return Promise.resolve(false);
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
      path: `/v20.0/${PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = https.request(options, () => resolve(true));
    req.on('error', () => resolve(false));
    req.write(data);
    req.end();
  });
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

                // Look for order ID in incoming message (e.g. VF-1001 or #VF-1001)
                const match = textBody.match(/VF-?\d+/i);
                if (match) {
                  const rawOrderId = match[0].toUpperCase().replace('VF', 'VF-').replace('VF--', 'VF-');
                  const order = await fetchOrderFromFirestore(rawOrderId);

                  if (order && order.items && order.items.length > 0) {
                    let itemsTxt = '';
                    order.items.forEach((it, idx) => {
                      itemsTxt += `${idx + 1}. *${it.name || 'Jewellery Item'}*\n   • Qty: ${it.qty || 1} | Price: ₹${it.price || 0}\n`;
                      if (it.img) itemsTxt += `   • Photo: ${it.img}\n`;
                    });

                    const reply = 
`📄 *VFS JEWELS — ORDER INVOICE & PHOTO SLIP*
━━━━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* #${order.id || rawOrderId}
👤 *Customer:* ${order.name || 'Valued Customer'}
🚚 *Delivery Address:* ${order.address || ''}, ${order.city || ''} ${order.pincode || ''}

🛍️ *PRODUCTS ORDERED:*
${itemsTxt}
━━━━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ₹${order.subtotal || 0}
🚚 *Shipping:* ₹${order.shipping || 0}
💳 *Advance Adjusted:* -₹${order.advanceAdjusted || 0}
✅ *Grand Total:* ₹${order.total || 0}

🔗 *Download Official PDFs:*
📄 Tax Invoice: https://www.vfsjewels.store/api/invoice?id=${rawOrderId.replace('#','')}
📸 Product Photo Slip: https://www.vfsjewels.store/api/photo-slip?id=${rawOrderId.replace('#','')}

Thank you for choosing VFS Jewels! 💎`;

                    await sendWhatsAppReply(senderPhone, reply);
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
