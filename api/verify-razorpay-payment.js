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
      return res.status(200).json({ status: 'success', verified: true });
    } else {
      return res.status(400).json({ status: 'failed', verified: false, error: 'Signature verification failed' });
    }
  } catch (err) {
    console.error('❌ Error verifying Razorpay signature:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
