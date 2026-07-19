// ============================================================
//  VFS Jewels — Razorpay Webhook Handler (Vercel Serverless)
//  Exposed at https://vfsjewels.store/api/razorpay-webhook
//  Validates signature using RAZORPAY_WEBHOOK_SECRET and updates Firestore
// ============================================================

const crypto = require('crypto');

// Disable Vercel's default body parser so we can extract the raw request body
// needed for accurate cryptographic signature verification.
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err) => reject(err));
  });
}

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
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature) {
      console.error('❌ Webhook: Missing x-razorpay-signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    if (!webhookSecret) {
      console.error('❌ Webhook: RAZORPAY_WEBHOOK_SECRET environment variable is not set');
      return res.status(500).json({ error: 'Internal configuration error' });
    }

    // Extract raw body buffer
    const rawBody = await getRawBody(req);
    
    // Generate HMAC-SHA256 signature using the raw body
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('❌ Webhook: Cryptographic signature mismatch');
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    // Parse payload body string to JSON object
    const bodyText = rawBody.toString('utf8');
    const payload = JSON.parse(bodyText);
    const event = payload.event;

    console.log(`📬 Webhook signature verified successfully. Event: ${event}`);

    // Listen to order.paid event (triggered when payment is verified and captured)
    if (event === 'order.paid') {
      const orderEntity = payload.payload.order.entity;
      const receipt = orderEntity.receipt; // e.g., "order_VF-1002"

      if (receipt && receipt.startsWith('order_')) {
        const orderId = receipt.substring(6); // Extract e.g. "VF-1002"
        console.log(`🎯 Webhook matching order receipt: ${receipt} -> Firestore ID: ${orderId}`);

        // Update status in Firestore using REST API to keep Vercel startup instant (cold-start friendly)
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/vfs-jewellery/databases/(default)/documents/orders/${orderId}?updateMask.fieldPaths=status`;

        const updateRes = await fetch(firestoreUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              status: {
                stringValue: 'paid'
              }
            }
          })
        });

        if (updateRes.ok) {
          console.log(`✅ Firestore update succeeded: Order ${orderId} transitioned to 'paid'.`);
        } else {
          const errMsg = await updateRes.text();
          console.error(`❌ Firestore update failed via REST API: ${errMsg}`);
        }
      }
    }

    return res.status(200).json({ status: 'ok', processed: true });
  } catch (err) {
    console.error('❌ Error executing Webhook serverless handler:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
