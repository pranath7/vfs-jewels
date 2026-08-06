// ============================================================
//  VFS Jewels — Telegram Daily Sales & Dispatch Executive Summary
//  Exposed at https://www.vfsjewels.store/api/telegram-daily-report
//  Triggers via Vercel Cron or manual request
// ============================================================

const https = require('https');
const { sendTelegramMessage } = require('./lib/telegram');

function parseFirestoreField(field) {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue !== undefined) return parseFloat(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.mapValue !== undefined) {
    const mapObj = {};
    const mapFields = field.mapValue.fields || {};
    for (let k in mapFields) mapObj[k] = parseFirestoreField(mapFields[k]);
    return mapObj;
  }
  if (field.arrayValue !== undefined) {
    const arr = field.arrayValue.values || [];
    return arr.map(v => parseFirestoreField(v));
  }
  return null;
}

function fetchFirestoreCollection(collectionName) {
  return new Promise((resolve) => {
    const url = `https://firestore.googleapis.com/v1/projects/vfs-jewellery/databases/(default)/documents/${collectionName}?pageSize=300`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const docs = (json.documents || []).map(doc => {
            const fields = doc.fields || {};
            const obj = { _id: doc.name.split('/').pop() };
            for (let k in fields) {
              obj[k] = parseFirestoreField(fields[k]);
            }
            return obj;
          });
          resolve(docs);
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const now = new Date();
    // India Standard Time (UTC+5:30) date string
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    const dateStr = istDate.toISOString().split('T')[0];

    // Fetch orders & wholesale buyers from Firestore
    const [orders, wholesaleUsers] = await Promise.all([
      fetchFirestoreCollection('orders'),
      fetchFirestoreCollection('wholesale_users')
    ]);

    // Calculate metrics
    let totalSalesRevenue = 0;
    let todayOrdersCount = 0;
    let todayDispatchedCount = 0;
    let wholesalePaymentsCount = 0;
    let wholesaleRevenue = 0;

    const productCounts = {};

    orders.forEach(order => {
      const orderDate = order.date ? order.date.split('T')[0] : (order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : '');
      const isToday = orderDate === dateStr || !orderDate; // Include recent if date missing

      if (isToday) {
        todayOrdersCount++;
        totalSalesRevenue += (order.total || order.amount || 0);

        if (order.status === 'dispatched' || order.status === 'shipped' || order.courierStatus === 'Delivered') {
          todayDispatchedCount++;
        }

        // Tally items
        if (Array.isArray(order.items)) {
          order.items.forEach(item => {
            const name = item.name || `Product #${item.id}`;
            productCounts[name] = (productCounts[name] || 0) + (item.qty || 1);
          });
        }
      }
    });

    wholesaleUsers.forEach(user => {
      const regDate = user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '';
      if (regDate === dateStr || user.paidToday) {
        wholesalePaymentsCount++;
        wholesaleRevenue += (user.feePaid || 2000);
      }
    });

    // Top selling product
    const topProductEntry = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
    const topProductStr = topProductEntry ? `${topProductEntry[0]} (${topProductEntry[1]} pcs)` : 'N/A';

    // Format Executive Summary Markdown / HTML
    const reportMessage = `
📊 <b>VFS JEWELS — DAILY EXECUTIVE SUMMARY REPORT</b>
📅 <b>Date:</b> ${dateStr}

🛍️ <b>Retail & Wholesale Sales:</b>
• <b>Total Sales Revenue:</b> ₹${totalSalesRevenue.toLocaleString('en-IN')}
• <b>Total Orders Received:</b> ${todayOrdersCount} orders
• <b>Top Sold Product:</b> ${topProductStr}

🚚 <b>Order Fulfilment & Logistics:</b>
• <b>Orders Dispatched Today:</b> ${todayDispatchedCount} orders

👑 <b>Wholesale Portal Access:</b>
• <b>Wholesale Buyers Paid Today:</b> ${wholesalePaymentsCount} member(s)
• <b>Wholesale Revenue Collected:</b> ₹${wholesaleRevenue.toLocaleString('en-IN')}

<i>✨ Live report generated automatically by VFS Bot.</i>
    `.trim();

    // Send to Telegram
    const telegramRes = await sendTelegramMessage(reportMessage, 'HTML');

    return res.status(200).json({
      status: 'success',
      date: dateStr,
      metrics: {
        totalSalesRevenue,
        todayOrdersCount,
        todayDispatchedCount,
        wholesalePaymentsCount,
        wholesaleRevenue
      },
      telegramRes
    });

  } catch(err) {
    console.error("❌ Telegram Daily Report Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
