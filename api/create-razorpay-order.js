// ============================================================
//  VFS Jewels — Create Razorpay Order Serverless Function
//  Exposed at https://vfsjewels.store/api/create-razorpay-order
//  Handles secure order ID creation on Razorpay using Key Secret
// ============================================================

const fs = require('fs');
const path = require('path');

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
    const { amount, receipt } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Load credentials from local config file
    const configPath = path.join(process.cwd(), 'vfs-config.json');
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    const keyId = process.env.RAZORPAY_KEY_ID || config.razorpay?.keyId;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || config.razorpay?.keySecret;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay credentials not configured' });
    }

    // Basic Auth header
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert ₹ rupees → paise (Razorpay requires paise)
        currency: 'INR',
        receipt: receipt || `receipt_${Date.now()}`
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Failed to create Razorpay order' });
    }

    // Return keyId dynamically to the client so that no keys need to be hardcoded in public repository files
    data.keyId = keyId;

    return res.status(200).json(data);
  } catch (err) {
    console.error('❌ Error creating Razorpay order:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
