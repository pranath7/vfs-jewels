// ============================================================
//  VFS Jewels — Verify Razorpay Signature Serverless Function
//  Exposed at https://vfsjewels.store/api/verify-razorpay-payment
//  Validates Razorpay signatures securely on the server side
// ============================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

module.exports = async (req, res) => {
  // Set CORS headers
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required signature parameters' });
    }

    // Load credentials from local config file
    const configPath = path.join(process.cwd(), 'vfs-config.json');
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || config.razorpay?.keySecret;

    if (!keySecret) {
      return res.status(500).json({ error: 'Razorpay Key Secret is not configured' });
    }

    // Construct the payload to verify
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    // Generate HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // ── AUTOMATED WHOLESALE UNLOCK IN FIRESTORE UPON PAYMENT ──
      const rawPhone = req.body.phone || '';
      const cleanPhone = String(rawPhone).replace(/\D/g, '').slice(-10);
      if (cleanPhone && cleanPhone.length === 10) {
        try {
          const https = require('https');
          const paidAmount = Number(req.body.amount) || 1000;
          const patchPayload = JSON.stringify({
            fields: {
              unlocked: { booleanValue: true },
              paymentStatus: { stringValue: 'paid' },
              advancePaid: { integerValue: String(Math.round(paidAmount)) },
              razorpayPaymentId: { stringValue: razorpay_payment_id },
              razorpayOrderId: { stringValue: razorpay_order_id },
              phone: { stringValue: cleanPhone },
              paidAt: { integerValue: String(Date.now()) },
              unlockedAt: { integerValue: String(Date.now()) },
              updatedAt: { integerValue: String(Date.now()) }
            }
          });

          const docKeys = [cleanPhone, 'phone_' + cleanPhone, '91' + cleanPhone];
          await Promise.all(docKeys.map(k => new Promise(resolve => {
            const patchReq = https.request({
              hostname: 'firestore.googleapis.com',
              path: `/v1/projects/vfs-jewellery/databases/(default)/documents/wholesale_users/${k}`,
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(patchPayload)
              }
            }, () => resolve());
            patchReq.on('error', () => resolve());
            patchReq.write(patchPayload);
            patchReq.end();
          })));
          console.log(`⚡ Automatically unlocked wholesale customer in Firestore for phone ${cleanPhone}`);
        } catch(patchErr) {
          console.warn('Auto-unlock Firestore patch warning:', patchErr);
        }
      }

      return res.status(200).json({ status: 'success', verified: true });
    } else {
      return res.status(400).json({ status: 'failed', verified: false, error: 'Signature verification failed' });
    }
  } catch (err) {
    console.error('❌ Error verifying Razorpay signature:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
