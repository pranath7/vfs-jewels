// ============================================================
//  VFS Jewels — WhatsApp Order Confirmation API (Vercel Serverless)
//  Exposed at https://vfsjewels.store/api/send-order-whatsapp
//  Sends automated WhatsApp text message + PDF Invoice Document
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return res.status(500).json({ error: 'WhatsApp API credentials not configured in Vercel.' });
    }

    const order = req.body;

    if (!order || !order.phone || !order.id || !order.total) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    // Format phone number
    let customerPhone = order.phone.toString().replace(/\D/g, '');
    if (customerPhone.length === 10) {
      customerPhone = '91' + customerPhone;
    }

    // ── Build Text Message ──
    let itemsList = '';
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item, idx) => {
        itemsList += `${idx + 1}. ${item.name} × ${item.qty} — ₹${item.price * item.qty}\n`;
      });
    }

    let textMessage = 
`💎 *VFS JEWELS — ORDER CONFIRMED!* 💎
━━━━━━━━━━━━━━━━━━━━━━━
Hello *${order.name || 'Valued Customer'}*! 🎉

Your order has been received and confirmed.

🧾 *Order ID:* ${order.id}
📅 *Date:* ${order.date || new Date().toLocaleDateString('en-IN')}
━━━━━━━━━━━━━━━━━━━━━━━
📦 *Items Ordered:*
${itemsList || '1. Jewellery Order\n'}
━━━━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ₹${order.subtotal || order.total}
🏷️ *GST (3%):* ₹${order.gstAmount || 0}
🚚 *Delivery Fee:* ₹${order.shipping || 90}
━━━━━━━━━━━━━━━━━━━━━━━
✅ *Grand Total: ₹${order.total}*
━━━━━━━━━━━━━━━━━━━━━━━

📍 *Delivery Address:*
${order.address || ''}, ${order.city || ''} - ${order.pincode || ''}
🚛 *Carrier:* ${order.carrier || 'DTDC'}

📄 _Your official PDF Tax Invoice is attached below!_

━━━━━━━━━━━━━━━━━━━━━━━
_Thank you for shopping with VFS Jewels!_
🌐 vfsjewels.store`;

    // 1. Send Text Summary Message
    console.log(`📤 Sending WhatsApp order summary to +${customerPhone}`);
    const textResult = await sendWhatsAppPayload({
      messaging_product: 'whatsapp',
      to: customerPhone,
      type: 'text',
      text: { body: textMessage }
    });

    // 2. Build Direct PDF Invoice Link
    const cleanId = order.id.replace('#', '');
    const itemsJson = encodeURIComponent(JSON.stringify(order.items || []));
    const invoiceUrl = `https://vfsjewels.store/api/invoice?id=${encodeURIComponent(order.id)}&name=${encodeURIComponent(order.name || '')}&phone=${customerPhone}&total=${order.total}&subtotal=${order.subtotal || order.total}&gstAmount=${order.gstAmount || 0}&shipping=${order.shipping || 90}&address=${encodeURIComponent(order.address || '')}&city=${encodeURIComponent(order.city || '')}&pincode=${order.pincode || ''}&carrier=${encodeURIComponent(order.carrier || '')}&items=${itemsJson}`;

    // 3. Send PDF Document Attachment directly via Meta API
    console.log(`📄 Sending WhatsApp PDF Document to +${customerPhone}`);
    let docResult = null;
    try {
      docResult = await sendWhatsAppPayload({
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'document',
        document: {
          link: invoiceUrl,
          filename: `VFS_Jewels_Invoice_${cleanId}.pdf`,
          caption: `📄 Tax Invoice for Order ${order.id} - VFS Jewels`
        }
      });
      console.log('✅ PDF Document message sent successfully:', docResult);
    } catch (docErr) {
      console.warn('⚠️ PDF Document sending warning:', docErr.message || docErr);
    }

    return res.status(200).json({
      success: true,
      orderId: order.id,
      textMessageId: textResult.messages?.[0]?.id || null,
      pdfMessageId: docResult?.messages?.[0]?.id || null,
      invoiceUrl: invoiceUrl,
      message: `Order confirmation & PDF Invoice sent to +${customerPhone}`
    });

  } catch (err) {
    console.error('❌ Error sending WhatsApp notification:', err);
    return res.status(500).json({
      error: 'Failed to send WhatsApp notification',
      details: err.error?.message || err.message || JSON.stringify(err)
    });
  }
};
