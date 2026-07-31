// ============================================================
//  VFS Jewels — Wholesale Registration WhatsApp Welcome API
//  Exposed at https://www.vfsjewels.store/api/send-wholesale-welcome
//  Sends:
//    1. Welcome message to new wholesale registrant
//    2. Admin alert to VFS owner (+91 9025327860)
// ============================================================

const https = require('https');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERSION = 'v19.0';
const ADMIN_PHONE = '919025327860'; // VFS Owner number

function sendWhatsAppText(toPhone, message) {
  return new Promise((resolve, reject) => {
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
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { resolve({ raw: body }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function saveWholesaleUserToFirestore(user) {
  const cleanPhone = (user.phone || '').replace(/\D/g, '').slice(-10);
  const isPaid = user.paymentStatus === 'paid';

  const fields = {
    name:          { stringValue: user.name || '' },
    businessName:  { stringValue: user.businessName || '' },
    phone:         { stringValue: cleanPhone },
    address:       { stringValue: user.address || '' },
    email:         { stringValue: user.email || '' },
    registeredAt:  { integerValue: Date.now() },
    unlocked:      { booleanValue: isPaid },
    paymentStatus: { stringValue: isPaid ? 'paid' : 'pending' },
    advancePaid:   { doubleValue: isPaid ? 1 : 0 },
    type:          { stringValue: 'wholesale' }
  };

  if (user.razorpayPaymentId) {
    fields.razorpayPaymentId = { stringValue: user.razorpayPaymentId };
  }

  const data = JSON.stringify({ fields });

  // Save to wholesale_users (patching cleanPhone, phone_cleanPhone, 91cleanPhone)
  const docVariants = [cleanPhone, 'phone_' + cleanPhone, '91' + cleanPhone];
  const saveToWholesaleUsers = Promise.all(docVariants.map(docId => new Promise((resolve) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/vfs-jewellery/databases/(default)/documents/wholesale_users/${docId}`,
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
  })));

  // Also log to wholesale_registrations as an audit trail
  const logData = JSON.stringify({ fields: { ...fields, loggedAt: { integerValue: Date.now() } } });
  const saveLog = new Promise((resolve) => {
    const logDocId = 'REG_' + cleanPhone + '_' + Date.now();
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/vfs-jewellery/databases/(default)/documents/wholesale_registrations?documentId=${logDocId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(logData)
      }
    };
    const req = https.request(options, () => resolve());
    req.on('error', () => resolve());
    req.write(logData);
    req.end();
  });

  // Automatically credit paid unlock fee to customer's wallet in wallet_credits collection
  const shortPhone = cleanPhone.slice(-10);
  const creditAmount = isPaid ? (user.advancePaid || 1) : 0;
  const walletData = JSON.stringify({
    fields: {
      balance: { doubleValue: creditAmount },
      updatedAt: { integerValue: Date.now() },
      phone: { stringValue: shortPhone }
    }
  });
  const saveWalletCredit = isPaid ? new Promise((resolve) => {
    const options = {
      hostname: 'firestore.googleapis.com',
      path: `/v1/projects/vfs-jewellery/databases/(default)/documents/wallet_credits/${shortPhone}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(walletData)
      }
    };
    const req = https.request(options, () => resolve());
    req.on('error', () => resolve());
    req.write(walletData);
    req.end();
  }) : Promise.resolve();

  return Promise.all([saveToWholesaleUsers, saveLog, saveWalletCredit]);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { name, businessName, phone, address, email } = req.body || {};

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    let cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);

    // ── 1. ALWAYS Save to Firestore first ──
    try {
      await saveWholesaleUserToFirestore(req.body || {});
      console.log('✅ Server-side Firestore save completed for:', cleanPhone);
    } catch(fsErr) {
      console.error('Server-side Firestore save error:', fsErr);
    }

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return res.status(200).json({ success: true, firestoreSynced: true, note: 'WhatsApp credentials not set' });
    }

    const displayName = name || 'Valued Reseller';
    const displayBiz = businessName || 'Your Business';
    const isPaid = (req.body.paymentStatus === 'paid');
    const paymentId = req.body.razorpayPaymentId || '';

    // ── 1. Save to Firestore ──
    await saveWholesaleUserToFirestore({ name, businessName, phone: cleanPhone, address, email });

    // ── 2. Welcome / Confirmation message to registrant ──
    const welcomeMsg = isPaid ?
`💼 *VFS JEWELS — WHOLESALE PORTAL ACTIVATED!* 💼
━━━━━━━━━━━━━━━━━━━━━━━
🎉 Congratulations, *${displayName}*!

Your wholesale portal payment is *CONFIRMED* and your Business Club membership is now *ACTIVE*!

✅ *Business:* ${displayBiz}
💳 *Payment ID:* ${paymentId || 'Verified'}
📱 *Registered Phone:* +${cleanPhone}

━━━━━━━━━━━━━━━━━━━━━━━
🏷️ *Your Wholesale Benefits (NOW UNLOCKED):*
• Up to 40% off retail prices
• Direct factory wholesale rates
• Anti-Tarnish premium collection
• COD available for bulk orders
• Priority dispatch from Sowcarpet

🛍️ Start shopping at wholesale prices now:
👉 vfsjewels.store

📞 *Dedicated Wholesale Support:*
+91 98407 57363 (Mon–Sat, 9 AM–8 PM)

Welcome to the VFS Jewels Business Club! 💎
━━━━━━━━━━━━━━━━━━━━━━━`
:
`💼 *VFS JEWELS — WHOLESALE PORTAL* 💼
━━━━━━━━━━━━━━━━━━━━━━━
Welcome, *${displayName}*! 🎉

Your Wholesale Business Club registration for *${displayBiz}* has been received successfully.

✅ *Next Step:* Complete the ₹1 portal fee payment to unlock exclusive reseller prices.

━━━━━━━━━━━━━━━━━━━━━━━
🏪 *VFS Jewels Wholesale Benefits:*
• Up to 40% off retail prices
• Direct factory wholesale rates
• Anti-Tarnish premium collection
• COD available for bulk orders
• Priority dispatch from Sowcarpet

📞 *Dedicated Wholesale Support:*
+91 98407 57363 (Mon–Sat, 9 AM–8 PM)

🌐 vfsjewels.store

Thank you for choosing VFS Jewels! 💎
━━━━━━━━━━━━━━━━━━━━━━━`;

    // ── 3. Admin alert to VFS owner ──
    const adminMsg =
`🔔 *${isPaid ? 'NEW WHOLESALE MEMBER PAID!' : 'NEW WHOLESALE REGISTRATION'}*
━━━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${displayName}
🏪 *Business:* ${displayBiz}
📱 *Phone:* +${cleanPhone}
📧 *Email:* ${email || 'Not provided'}
📍 *Address:* ${address || 'Not provided'}
💳 *Payment:* ${isPaid ? 'PAID ✅ | ID: ' + paymentId : 'PENDING — Awaiting ₹1'}
🕐 *Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
━━━━━━━━━━━━━━━━━━━━━━━`;

    const [welcomeResult, adminResult] = await Promise.allSettled([
      sendWhatsAppText(cleanPhone, welcomeMsg),
      sendWhatsAppText(ADMIN_PHONE, adminMsg)
    ]);

    const welcomeId = welcomeResult.value?.messages?.[0]?.id || null;
    const adminId = adminResult.value?.messages?.[0]?.id || null;

    return res.status(200).json({
      success: true,
      phone: '+' + cleanPhone,
      welcomeMessageId: welcomeId,
      adminAlertId: adminId,
      message: `Welcome WhatsApp sent to +${cleanPhone} and admin alerted`
    });

  } catch (err) {
    console.error('Wholesale welcome WhatsApp error:', err);
    return res.status(500).json({ error: 'Failed to send wholesale welcome', details: err.message });
  }
};
