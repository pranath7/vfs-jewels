// ============================================================
//  VFS Jewels — WhatsApp Order Confirmation API (Vercel Serverless)
//  Exposed at https://vfsjewels.store/api/send-order-whatsapp
//  Sends automated WhatsApp order confirmation + invoice to customer
// ============================================================

const https = require('https');

// WhatsApp Cloud API Configuration — MUST be set as Vercel Environment Variables
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERSION = 'v19.0';

if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
  console.error('❌ WHATSAPP_TOKEN and PHONE_NUMBER_ID must be set as environment variables in Vercel.');
}

function sendWhatsAppMessage(to, messageBody) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: { body: messageBody }
    });

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
  // CORS headers
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
    // Ensure API credentials are configured
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return res.status(500).json({ error: 'WhatsApp API credentials not configured. Set WHATSAPP_TOKEN and PHONE_NUMBER_ID in Vercel Environment Variables.' });
    }

    const order = req.body;

    // Validate required fields
    if (!order || !order.phone || !order.id || !order.items || !order.total) {
      return res.status(400).json({ error: 'Missing required order fields: phone, id, items, total' });
    }

    // Format customer phone to international format (India)
    let customerPhone = order.phone.toString().replace(/\D/g, '');
    if (customerPhone.length === 10) {
      customerPhone = '91' + customerPhone;
    }

    // ── Build Order Confirmation Message ──
    let itemsList = '';
    order.items.forEach((item, idx) => {
      itemsList += `${idx + 1}. ${item.name} × ${item.qty} — ₹${item.price * item.qty}\n`;
    });

    let message = 
`💎 *VFS JEWELS — ORDER CONFIRMED!* 💎
━━━━━━━━━━━━━━━━━━━━━━━
Hello *${order.name}*! 🎉

Your order has been received and confirmed.

🧾 *Order ID:* ${order.id}
📅 *Date:* ${order.date || new Date().toLocaleDateString('en-IN')}
━━━━━━━━━━━━━━━━━━━━━━━
📦 *Items Ordered:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* ₹${order.subtotal}
🏷️ *GST (3%):* ₹${order.gstAmount}
🚚 *Delivery Fee:* ₹${order.shipping}`;

    if (order.walletDiscount && order.walletDiscount > 0) {
      message += `\n💳 *Wallet Discount:* -₹${order.walletDiscount}`;
    }
    if (order.couponCode && order.couponDiscount > 0) {
      message += `\n🎟️ *Coupon (${order.couponCode}):* -₹${order.couponDiscount}`;
    }
    if (order.advanceAdjusted && order.advanceAdjusted > 0) {
      message += `\n📋 *Wholesale Advance:* -₹${order.advanceAdjusted}`;
    }
    if (order.waReferralDiscount && order.waReferralDiscount > 0) {
      message += `\n📱 *WhatsApp Referral (1%):* -₹${order.waReferralDiscount}`;
    }

    message += `
━━━━━━━━━━━━━━━━━━━━━━━
✅ *Grand Total: ₹${order.total}*
━━━━━━━━━━━━━━━━━━━━━━━

📍 *Delivery Address:*
${order.address}, ${order.city} - ${order.pincode}
🚛 *Carrier:* ${order.carrier}`;

    if (order.gstNumber) {
      message += `\n🏢 *GSTIN:* ${order.gstNumber}`;
    }

    message += `

📄 *Download Your Invoice:*
https://vfsjewels.store/track?order=${encodeURIComponent(order.id)}

━━━━━━━━━━━━━━━━━━━━━━━
_Thank you for shopping with VFS Jewels!_
_For any queries, contact us at +91 98407 57363_
🌐 vfsjewels.store`;

    // ── Send WhatsApp Message to Customer ──
    console.log(`📤 Sending WhatsApp order confirmation for ${order.id} to +${customerPhone}`);
    const result = await sendWhatsAppMessage(customerPhone, message);
    console.log(`✅ WhatsApp message sent for order ${order.id}:`, result);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      messageId: result.messages?.[0]?.id || null,
      message: `Order confirmation sent to +${customerPhone} on WhatsApp`
    });

  } catch (err) {
    console.error('❌ Error sending WhatsApp order confirmation:', err);
    return res.status(500).json({
      error: 'Failed to send WhatsApp notification',
      details: err.error?.message || err.message || JSON.stringify(err)
    });
  }
};
