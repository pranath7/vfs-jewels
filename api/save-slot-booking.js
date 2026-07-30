// ============================================================
//  VFS Jewels — Save Live Video Slot Booking API
//  Exposed at https://www.vfsjewels.store/api/save-slot-booking
// ============================================================

const https = require('https');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERSION = 'v19.0';
const ADMIN_PHONE = '919840757363';

function sendWhatsAppText(toPhone, message) {
  return new Promise((resolve) => {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) return resolve();
    const payload = JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'text',
      text: { body: message }
    });

    const options = {
      hostname: 'graph.facebook.com',
      path: `/${VERSION}/${PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve());
    });
    req.on('error', () => resolve());
    req.write(payload);
    req.end();
  });
}

function saveSlotToFirestore(slotData) {
  return new Promise((resolve) => {
    const cleanPhone = (slotData.phone || '').replace(/\D/g, '');
    const docId = 'SLOT_' + cleanPhone + '_' + Date.now();
    const todayStr = new Date().toISOString().split('T')[0];
    const fields = {
      date: { stringValue: slotData.date || todayStr },
      name: { stringValue: slotData.name || '' },
      phone: { stringValue: cleanPhone },
      city: { stringValue: slotData.city || '' },
      slotFee: { doubleValue: Number(slotData.slotFee) || 1 },
      paymentId: { stringValue: slotData.paymentId || 'SLOT_PAID_CONFIRMED' },
      bookedAt: { integerValue: Date.now() }
    };
    const data = JSON.stringify({ fields });
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/vfs-jewellery/databases/(default)/documents/live_slot_bookings?documentId=${docId}`,
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
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { name, phone, city, paymentId, slotFee } = req.body || {};
    const cleanPhone = (phone || '').replace(/\D/g, '');

    await saveSlotToFirestore({ name, phone: cleanPhone, city, paymentId, slotFee: slotFee || 1 });

    const adminMsg = `📹 *NEW LIVE SESSION SLOT BOOKING!*
━━━━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${name || 'Valued Customer'}
📱 *Phone:* +${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}
📍 *City:* ${city || 'Not specified'}
💳 *Slot Fee:* ₹${slotFee || 1} (PAID ✅)
🕒 *Session:* Today 8:30 PM Live Preview
━━━━━━━━━━━━━━━━━━━━━━━`;

    await sendWhatsAppText(ADMIN_PHONE, adminMsg);

    return res.status(200).json({ success: true, message: 'Slot booking saved and admin notified via WhatsApp' });
  } catch (err) {
    console.error('Error saving slot:', err);
    return res.status(500).json({ error: err.message });
  }
};
