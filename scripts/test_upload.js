const fs = require('fs');
const https = require('https');
const path = require('path');

const CLOUD_NAME = 'cwx4zame';
const UPLOAD_PRESET = 'vfs_preset';
const filePath = 'C:/Users/91636/.gemini/antigravity-ide/scratch/cleaned_necklaces/IMG-20260725-WA0033.jpg';

const fileName = path.basename(filePath);
const fileBuf = fs.readFileSync(filePath);
const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

const boundary = '----VFSTest' + Date.now();
const fieldPart = Buffer.from(
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="upload_preset"\r\n\r\n${UPLOAD_PRESET}\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="folder"\r\n\r\nnecklaces\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
  `Content-Type: image/jpeg\r\n\r\n`,
  'utf-8'
);
const closePart = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
const body = Buffer.concat([fieldPart, fileBuf, closePart]);

const urlObj = new URL(url);
const req = https.request({
  hostname: urlObj.hostname,
  path: urlObj.pathname,
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  }
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('Upload Result:', data));
});
req.on('error', console.error);
req.write(body);
req.end();
