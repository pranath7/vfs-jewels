// ============================================================
//  VFS Jewels — Courier Live Webhook Receiver (Vercel Serverless)
//  Exposed at https://www.vfsjewels.store/api/courier-webhook
//  Receives live delivery webhooks from Shiprocket / Delhivery / DTDC / Trackier
//  Automatically updates website order status to 'completed' & notifies customer via WhatsApp
// ============================================================

const https = require('https');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERSION = 'v19.0';
const PROJECT_ID = 'vfs-jewellery';

function sendWhatsAppPayload(payloadData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payloadData);

    const options = {
      hostname: 'graph.facebook.com',
      path: `/${VERSION}/${PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function logToFirestore(logData) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      fields: {
        timestamp: { integerValue: Date.now() },
        recipient: { stringValue: logData.recipient || 'Customer' },
        phone: { stringValue: logData.phone || '' },
        type: { stringValue: logData.type || 'Delivery Notification' },
        orderId: { stringValue: logData.orderId || '' },
        status: { stringValue: logData.status || 'SENT' },
        messageId: { stringValue: logData.messageId || '' },
        preview: { stringValue: (logData.preview || '').substring(0, 300) }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/whatsapp_logs`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, () => resolve());
    req.on('error', () => resolve());
    req.write(data);
    req.end();
  });
}

function updateOrderStatusInFirestore(orderId, newStatus) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      fields: {
        status: { stringValue: newStatus },
        deliveredAt: { integerValue: Date.now() }
      }
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/orders/${orderId}?updateMask.fieldPaths=status&updateMask.fieldPaths=deliveredAt`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, () => resolve());
    req.on('error', () => resolve());
    req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const body = req.body || {};

    // Extract status & orderId / AWB from webhook payload
    const status = (body.current_status || body.status || body.shipment_status || '').toUpperCase();
    const orderId = body.order_id || body.orderId || body.client_order_id || '';
    const awb = body.awb || body.tracking_number || body.tracking_id || '';
    const customerPhone = (body.customer_phone || body.phone || '').toString().replace(/\D/g, '');
    const customerName = body.customer_name || body.name || 'Customer';

    console.log(`📦 Courier Webhook Received: Order=${orderId}, AWB=${awb}, Status=${status}`);

    if ((status === 'DELIVERED' || status === 'FULFILLED' || status === 'COMPLETED') && orderId) {
      await updateOrderStatusInFirestore(orderId, 'completed');

      if (customerPhone && WHATSAPP_TOKEN && PHONE_NUMBER_ID) {
        let phone = customerPhone.length === 10 ? '91' + customerPhone : customerPhone;

        const msg = 
`🎉 *VFS JEWELS — ORDER DELIVERED!* 🎉
━━━━━━━━━━━━━━━━━━━━━━━
Hello *${customerName}*! 🎉

Great news! Your order *${orderId}* has been successfully **DELIVERED**.

🚚 *Tracking ID:* ${awb || 'N/A'}

We hope you love your handcrafted jewellery pieces! ✨

━━━━━━━━━━━━━━━━━━━━━━━
Thank you for shopping with VFS Jewels!
🌐 vfsjewels.store`;

        const waRes = await sendWhatsAppPayload({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: msg }
        });

        await logToFirestore({
          recipient: customerName,
          phone: phone,
          type: 'Delivery Notification',
          orderId: orderId,
          status: 'SENT',
          messageId: waRes.messages?.[0]?.id || '',
          preview: `Courier webhook marked Order ${orderId} DELIVERED`
        });
      }
    }

    return res.status(200).json({ success: true, received: true });
  } catch (err) {
    console.error('❌ Courier webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
};
