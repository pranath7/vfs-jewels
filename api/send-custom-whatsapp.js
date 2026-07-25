// ============================================================
//  VFS Jewels — WhatsApp Custom Direct Chat API (Vercel Serverless)
//  Exposed at https://www.vfsjewels.store/api/send-custom-whatsapp
//  Allows admin to send custom WhatsApp messages directly to customers
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
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(parsed);
          }
        } catch (e) {
          reject({ error: body });
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
        type: { stringValue: logData.type || 'Custom Message' },
        orderId: { stringValue: logData.orderId || '' },
        status: { stringValue: logData.status || 'SENT' },
        messageId: { stringValue: logData.messageId || '' },
        preview: { stringValue: (logData.preview || '').substring(0, 500) }
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return res.status(500).json({ error: 'WhatsApp API credentials not configured in Vercel.' });
    }

    const { phone, message, recipientName = 'Customer', orderId = '' } = req.body || {};

    if (!phone || !message || !message.trim()) {
      return res.status(400).json({ error: 'Missing phone number or message content' });
    }

    let customerPhone = phone.toString().replace(/\D/g, '');
    if (customerPhone.length === 10) {
      customerPhone = '91' + customerPhone;
    }

    console.log(`📤 Sending custom admin WhatsApp message to +${customerPhone}`);
    const result = await sendWhatsAppPayload({
      messaging_product: 'whatsapp',
      to: customerPhone,
      type: 'text',
      text: { body: message.trim() }
    });

    const msgId = result.messages?.[0]?.id || '';
    await logToFirestore({
      recipient: recipientName,
      phone: customerPhone,
      type: 'Custom Message',
      orderId: orderId,
      status: 'SENT',
      messageId: msgId,
      preview: message.trim()
    });

    return res.status(200).json({
      success: true,
      messageId: msgId,
      message: `WhatsApp message sent to +${customerPhone}`
    });

  } catch (err) {
    console.error('❌ Error sending custom WhatsApp message:', err);
    return res.status(500).json({
      error: 'Failed to send WhatsApp message',
      details: err.error?.message || err.message || JSON.stringify(err)
    });
  }
};
