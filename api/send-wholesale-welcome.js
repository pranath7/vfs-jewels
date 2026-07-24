// ============================================================
//  VFS Jewels — WhatsApp Wholesale Welcome API (Vercel Serverless)
//  Exposed at https://www.vfsjewels.store/api/send-wholesale-welcome
//  Sends automated WhatsApp welcome notification when a user joins Wholesale Business Club
// ============================================================

const https = require('https');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERSION = 'v19.0';

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

    const { name = 'Valued Reseller', shopName = '', phone } = req.body || {};

    if (!phone) {
      return res.status(400).json({ error: 'Missing phone number' });
    }

    let customerPhone = phone.toString().replace(/\D/g, '');
    if (customerPhone.length === 10) {
      customerPhone = '91' + customerPhone;
    }

    const welcomeMessage = 
`👑 *VFS JEWELS — WELCOME TO THE BUSINESS CLUB!* 👑
━━━━━━━━━━━━━━━━━━━━━━━
Hello *${name}*! 🎉

Congratulations! Your **VFS Jewels Wholesale Business Club** membership is now **ACTIVATED**${shopName ? ` for *${shopName}*` : ''}.

💎 *Member Benefits Unlocked:*
• Exclusive Wholesale Tier Pricing
• Direct Factory Bulk Ordering
• Priority Dispatch & Customer Support

🌐 *Access Wholesale Catalog Now:*
https://www.vfsjewels.store/wholesale

━━━━━━━━━━━━━━━━━━━━━━━
_Thank you for partnering with VFS Jewels!_
📞 Support: +91 98407 57363`;

    console.log(`📤 Sending Wholesale Welcome WhatsApp message to +${customerPhone}`);
    const result = await sendWhatsAppPayload({
      messaging_product: 'whatsapp',
      to: customerPhone,
      type: 'text',
      text: { body: welcomeMessage }
    });

    return res.status(200).json({
      success: true,
      messageId: result.messages?.[0]?.id || null,
      message: `Wholesale Welcome WhatsApp message sent to +${customerPhone}`
    });

  } catch (err) {
    console.error('❌ Error sending Wholesale Welcome WhatsApp message:', err);
    return res.status(500).json({
      error: 'Failed to send WhatsApp notification',
      details: err.error?.message || err.message || JSON.stringify(err)
    });
  }
};
