// ============================================================
//  VFS Jewels — WhatsApp Webhook Handler (Vercel Serverless)
//  Exposed at https://vfsjewels.store/api/webhook
//  Handles verification (GET) and incoming event notifications (POST)
// ============================================================

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const VERIFY_TOKEN = 'vfs_jewels_webhook_secure';

  // 1. Webhook Verification (GET Request from Meta)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook successfully verified by Meta!');
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    } else {
      console.warn('❌ Webhook verification failed: Invalid verify token.');
      return res.status(403).json({ error: 'Verification token mismatch' });
    }
  }

  // 2. Incoming WhatsApp Events (POST Request from Meta)
  if (req.method === 'POST') {
    try {
      const payload = req.body;
      console.log('📬 Incoming WhatsApp Event Payload:', JSON.stringify(payload, null, 2));

      // Check if this is a message status update or text message
      if (payload.object === 'whatsapp_business_account' && payload.entry) {
        for (const entry of payload.entry) {
          for (const change of entry.changes) {
            if (change.value) {
              const value = change.value;
              
              // Handle incoming messages
              if (value.messages) {
                for (const msg of value.messages) {
                  console.log(`💬 Message received from ${msg.from}:`, msg.text?.body || msg.type);
                }
              }
              
              // Handle delivery/read status updates
              if (value.statuses) {
                for (const status of value.statuses) {
                  console.log(`📈 Message Status ID ${status.id}: ${status.status} for recipient ${status.recipient_id}`);
                }
              }
            }
          }
        }
      }

      return res.status(200).json({ status: 'EVENT_RECEIVED' });
    } catch (err) {
      console.error('❌ Error processing webhook event:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
