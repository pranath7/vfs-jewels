/**
 * import-vfskada04.js
 * -------------------
 * 1. Uploads every image in vfskada04_extracted/ to Cloudinary
 * 2. Appends new product records to vfs-products.json
 * 3. Writes each product to Firestore (vfs-jewellery project)
 *
 * Run from project root:
 *   node scripts/import-vfskada04.js
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

// ── Config ──────────────────────────────────────────────────────────────
const CLOUD_NAME   = 'cwx4zame';
const UPLOAD_PRESET = 'vfs_preset';
const FIREBASE_PROJECT = 'vfs-jewellery';
const FIREBASE_API_KEY  = 'AIzaSyD6h-kC0Afqd20pLASwUC1smMCdjUfQLes';

const INPUT_DIR      = path.join(__dirname, '..', 'vfskada04_extracted');
const PRODUCTS_FILE  = path.join(__dirname, '..', 'vfs-products.json');
const URLS_FILE      = path.join(__dirname, '..', 'cloudinary_urls.json');
const START_ID       = 557;   // next after current max 556
const CATEGORY       = 'kadas';
const META           = 'Premium Kada';
const BADGE          = 'New Arrival';

// ── Helpers ──────────────────────────────────────────────────────────────
function httpsPost(url, formData) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    let body = '';
    const fields = {};
    const files  = {};

    for (const [k, v] of formData.entries()) {
      if (v && v._isBuffer) files[k] = v;
      else fields[k] = v;
    }

    // Build multipart body manually (pure Node, no form-data lib)
    let rawBody = '';
    for (const [k, v] of Object.entries(fields)) {
      rawBody += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
    }

    // file part
    const fileEntry = formData._file;
    const fileBuf   = formData._fileBuf;
    const fileName  = formData._fileName;
    rawBody += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: image/jpeg\r\n\r\n`;

    const bodyPrefix = Buffer.from(rawBody, 'utf-8');
    const bodySuffix = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const fullBody   = Buffer.concat([bodyPrefix, fileBuf, bodySuffix]);

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('Parse error: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

async function uploadToCloudinary(filePath) {
  const fileName = path.basename(filePath);
  const fileBuf  = fs.readFileSync(filePath);
  const url      = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  // Build a simple multipart request
  const boundary = '----VFSBoundary' + Date.now();
  const fieldPart = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="upload_preset"\r\n\r\n${UPLOAD_PRESET}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="folder"\r\n\r\nkadas\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: image/jpeg\r\n\r\n`,
    'utf-8'
  );
  const closePart = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const body      = Buffer.concat([fieldPart, fileBuf, closePart]);

  return new Promise((resolve, reject) => {
    const urlObj  = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':   `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) resolve(json.secure_url);
          else reject(new Error(JSON.stringify(json)));
        } catch(e) { reject(new Error('Parse error: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function saveToFirestore(product) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/products/${product.id}?key=${FIREBASE_API_KEY}`;
  const docBody = JSON.stringify({
    fields: {
      id:             { integerValue: product.id },
      sku:            { stringValue: product.sku },
      name:           { stringValue: product.name },
      cat:            { stringValue: product.cat },
      meta:           { stringValue: product.meta },
      price:          { integerValue: product.price },
      mrp:            { integerValue: product.mrp },
      img:            { stringValue: product.img },
      rating:         { stringValue: product.rating },
      reviews:        { integerValue: product.reviews },
      badge:          { stringValue: product.badge },
      priceOnRequest: { booleanValue: product.priceOnRequest }
    }
  });

  return new Promise((resolve, reject) => {
    const urlObj  = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      method:   'PATCH',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(docBody)
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.name) resolve(json.name);
          else { console.warn('  ⚠ Firestore response:', data.slice(0, 200)); resolve(null); }
        } catch(e) { reject(new Error('Firestore parse error: ' + data)); }
      });
    });
    req.on('error', reject);
    req.write(docBody);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  // Read input images
  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();

  console.log(`\n📂 Found ${files.length} images in vfskada04_extracted/\n`);

  // Load existing products
  const existingProducts = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf-8'));
  const existingUrls     = fs.existsSync(URLS_FILE)
    ? JSON.parse(fs.readFileSync(URLS_FILE, 'utf-8'))
    : {};

  const newProducts = [];
  const ratings     = ['4.5', '4.6', '4.7', '4.8', '4.9', '5.0'];
  const reviewCounts= [8, 10, 12, 14, 16, 18, 20, 22, 24];

  for (let i = 0; i < files.length; i++) {
    const file     = files[i];
    const filePath = path.join(INPUT_DIR, file);
    const id       = START_ID + i;
    const num      = String(existingProducts.filter(p => p.cat === CATEGORY).length + i + 1).padStart(2, '0');
    const sku      = `SN-K${String(id).padStart(3,'0')}`;

    console.log(`⬆️  [${i+1}/${files.length}] Uploading ${file}...`);

    let imageUrl;
    try {
      imageUrl = await uploadToCloudinary(filePath);
      console.log(`   ✅ ${imageUrl}`);
    } catch (err) {
      console.error(`   ❌ Upload failed: ${err.message}`);
      continue;
    }

    const product = {
      id,
      sku,
      name:           `VFS Designer Kada #${num}`,
      cat:            CATEGORY,
      meta:           META,
      price:          0,
      mrp:            0,
      img:            imageUrl,
      rating:         ratings[i % ratings.length],
      reviews:        reviewCounts[i % reviewCounts.length],
      badge:          BADGE,
      priceOnRequest: true
    };

    // Save to Firestore
    console.log(`   🔥 Saving to Firestore (id: ${id})...`);
    try {
      const ref = await saveToFirestore(product);
      console.log(`   ✅ Firestore: ${ref}`);
    } catch (err) {
      console.error(`   ❌ Firestore failed: ${err.message}`);
    }

    newProducts.push(product);
    existingUrls[`vfskada04/${file}`] = imageUrl;

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  // Merge and save products.json
  const merged = [...existingProducts, ...newProducts];
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`\n✅ vfs-products.json updated. Total products: ${merged.length}`);

  // Update cloudinary_urls.json
  fs.writeFileSync(URLS_FILE, JSON.stringify(existingUrls, null, 2), 'utf-8');
  console.log(`✅ cloudinary_urls.json updated.`);

  console.log(`\n🎉 Done! ${newProducts.length} new kadas imported.\n`);
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
