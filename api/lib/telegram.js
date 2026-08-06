// ============================================================
//  VFS Jewels — Telegram Bot Helper Library (Vercel Serverless)
//  Handles instant text messages and PDF document attachments
// ============================================================

const https = require('https');

/**
 * Send Markdown or HTML formatted text message to Telegram
 */
function sendTelegramMessage(text, parseMode = 'HTML') {
  return new Promise((resolve) => {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      console.warn("⚠️ Telegram: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables missing.");
      return resolve({ warning: 'Telegram credentials missing' });
    }

    const payload = JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: parseMode,
      disable_web_page_preview: false
    });

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (err) => {
      console.error("❌ Telegram send error:", err);
      resolve({ error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Send Document (PDF link) with caption to Telegram
 */
function sendTelegramDocumentUrl(documentUrl, caption = '') {
  return new Promise((resolve) => {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      return resolve({ warning: 'Telegram credentials missing' });
    }

    const payload = JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      document: documentUrl,
      caption: caption,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (err) => {
      console.error("❌ Telegram document send error:", err);
      resolve({ error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

module.exports = {
  sendTelegramMessage,
  sendTelegramDocumentUrl
};
