// ============================================================
//  VFS Jewels — WhatsApp Order Confirmation API (Vercel Serverless)
//  Exposed at https://www.vfsjewels.store/api/send-order-whatsapp
//  Sends automated WhatsApp text summary + PDF Tax Invoice + PDF Photo Slip
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
        'Content-Type': `application/json`,
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
        type: { stringValue: logData.type || 'Order Notification' },
        orderId: { stringValue: logData.orderId || '' },
        status: { stringValue: logData.status || 'SENT' },
        messageId: { stringValue: logData.messageId || '' },
        preview: { stringValue: (logData.preview || '').substring(0, 150) }
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

    const order = req.body;

    if (!order || !order.phone || !order.id || !order.total) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    let customerPhone = order.phone.toString().replace(/\D/g, '');
    if (customerPhone.length === 10) {
      customerPhone = '91' + customerPhone;
    }

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
📦 *Items Ordered (${order.items ? order.items.length : 1} Products):*
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
🚛 *Carrier:* ${order.carrier || 'DTDC Express'}

📄 _Your official PDF Tax Invoice & Photo Slip are attached below!_

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

    const textMsgId = textResult.messages?.[0]?.id || '';
    await logToFirestore({
      recipient: order.name || 'Customer',
      phone: customerPhone,
      type: 'Order Confirmation',
      orderId: order.id,
      status: 'SENT',
      messageId: textMsgId,
      preview: `Order ${order.id} confirmed for ${order.name} (Total: ₹${order.total})`
    });

    const cleanId = order.id.replace('#', '');

    // 2. Build PDF Invoice Link & Send PDF Tax Invoice Document
    const invoiceUrl = `https://www.vfsjewels.store/api/invoice?id=${encodeURIComponent(order.id)}&name=${encodeURIComponent(order.name || '')}&phone=${customerPhone}&total=${order.total}&subtotal=${order.subtotal || order.total}&gstAmount=${order.gstAmount || 0}&shipping=${order.shipping || 90}&address=${encodeURIComponent(order.address || '')}&city=${encodeURIComponent(order.city || '')}&pincode=${order.pincode || ''}&carrier=${encodeURIComponent(order.carrier || '')}`;

    console.log(`📄 Sending WhatsApp PDF Tax Invoice to +${customerPhone}`);
    let invoiceResult = null;
    try {
      invoiceResult = await sendWhatsAppPayload({
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'document',
        document: {
          link: invoiceUrl,
          filename: `VFS_Jewels_Invoice_${cleanId}.pdf`,
          caption: `📄 Tax Invoice for Order ${order.id} - VFS Jewels`
        }
      });
      
      const docMsgId = invoiceResult?.messages?.[0]?.id || '';
      await logToFirestore({
        recipient: order.name || 'Customer',
        phone: customerPhone,
        type: 'PDF Invoice Attachment',
        orderId: order.id,
        status: 'SENT',
        messageId: docMsgId,
        preview: `Attached PDF Invoice VFS_Jewels_Invoice_${cleanId}.pdf`
      });
    } catch (docErr) {
      console.warn('⚠️ PDF Invoice sending warning:', docErr.message || docErr);
    }

    // 3. Build Photo Slip PDF Link & Send PDF Photo Slip Document
    const photoSlipUrl = `https://www.vfsjewels.store/api/photo-slip?id=${encodeURIComponent(order.id)}&name=${encodeURIComponent(order.name || '')}&phone=${customerPhone}&total=${order.total}&subtotal=${order.subtotal || order.total}&shipping=${order.shipping || 90}&address=${encodeURIComponent(order.address || '')}&city=${encodeURIComponent(order.city || '')}&pincode=${order.pincode || ''}&carrier=${encodeURIComponent(order.carrier || '')}`;

    console.log(`🖼️ Sending WhatsApp PDF Photo Slip to +${customerPhone}`);
    let photoSlipResult = null;
    try {
      photoSlipResult = await sendWhatsAppPayload({
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'document',
        document: {
          link: photoSlipUrl,
          filename: `VFS_Jewels_PhotoSlip_${cleanId}.pdf`,
          caption: `🖼️ Photo Slip & Fulfillment Manifest for Order ${order.id} - VFS Jewels`
        }
      });

      const psMsgId = photoSlipResult?.messages?.[0]?.id || '';
      await logToFirestore({
        recipient: order.name || 'Customer',
        phone: customerPhone,
        type: 'PDF Photo Slip Attachment',
        orderId: order.id,
        status: 'SENT',
        messageId: psMsgId,
        preview: `Attached PDF Photo Slip VFS_Jewels_PhotoSlip_${cleanId}.pdf`
      });
    } catch (psErr) {
      console.warn('⚠️ PDF Photo Slip sending warning:', psErr.message || psErr);
    }

    return res.status(200).json({
      success: true,
      orderId: order.id,
      textMessageId: textMsgId,
      invoicePdfMessageId: invoiceResult?.messages?.[0]?.id || null,
      photoSlipPdfMessageId: photoSlipResult?.messages?.[0]?.id || null,
      invoiceUrl: invoiceUrl,
      photoSlipUrl: photoSlipUrl,
      message: `Order confirmation, PDF Invoice, and PDF Photo Slip sent to +${customerPhone}`
    });

  } catch (err) {
    console.error('❌ Error sending WhatsApp notification:', err);
    return res.status(500).json({
      error: 'Failed to send WhatsApp notification',
      details: err.error?.message || err.message || JSON.stringify(err)
    });
  }
};
