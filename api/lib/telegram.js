const fs = require('fs');
const path = require('path');
const https = require('https');

let config = {};
try {
  const configPath = path.join(process.cwd(), 'vfs-config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch(e) {}

function getTelegramCredentials() {
  const token = process.env.TELEGRAM_BOT_TOKEN || config.telegram?.botToken || '8868419611:AAHDfN0KMVcyGqbiNu8qV8x-t0UkN0sUzzg';
  const chatId = process.env.TELEGRAM_CHAT_ID || config.telegram?.chatId || '';
  return { token, chatId };
}

/**
 * Send Markdown or HTML formatted text message to Telegram
 */
function sendTelegramMessage(text, parseMode = 'HTML') {
  return new Promise((resolve) => {
    const { token, chatId } = getTelegramCredentials();

    if (!token || !chatId) {
      console.warn("⚠️ Telegram: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing.");
      return resolve({ warning: 'Telegram credentials missing' });
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: parseMode,
      disable_web_page_preview: false
    });

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
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
    const { token, chatId } = getTelegramCredentials();

    if (!token || !chatId) {
      return resolve({ warning: 'Telegram credentials missing' });
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      document: documentUrl,
      caption: caption,
      parse_mode: 'HTML'
    });

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendDocument`,
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
