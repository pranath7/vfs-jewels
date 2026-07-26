const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf-8');
const wholesaleHtml = fs.readFileSync('wholesale.html', 'utf-8');
const adminHtml = fs.readFileSync('admin/admin.html', 'utf-8');
const products = JSON.parse(fs.readFileSync('vfs-products.json', 'utf-8'));

console.log('--- 1. Catalog Integrity Audit ---');
let catalogErrors = 0;
products.forEach((p, idx) => {
  if (!p.id) { console.error('Product missing ID at index ' + idx); catalogErrors++; }
  if (!p.name) { console.error('Product missing name for ID ' + p.id); catalogErrors++; }
  if (p.price === undefined || p.price === null) { console.error('Product missing price for ID ' + p.id); catalogErrors++; }
  if (p.mrp === undefined || p.mrp === null) { console.error('Product missing mrp for ID ' + p.id); catalogErrors++; }
  if (!p.img) { console.error('Product missing img for ID ' + p.id); catalogErrors++; }
});
if (catalogErrors === 0) {
  console.log('✅ All ' + products.length + ' products have valid schemas & images.');
}

console.log('\n--- 2. Checking HTML Element ID references in JS ---');
function checkMissingIds(jsFile, htmlContent, label) {
  const js = fs.readFileSync(jsFile, 'utf-8');
  const idRegex = /(?:\$|document\.getElementById)\(['"]#?([a-zA-Z0-9_\-]+)['"]/g;
  let match;
  const missing = new Set();
  while ((match = idRegex.exec(js)) !== null) {
    const id = match[1];
    // Exclude dynamically generated or template IDs
    if (id.includes('${') || id.includes('coSum') || id.includes('royal')) {
      // Checked dynamically
    }
    if (!htmlContent.includes('id="' + id + '"') && !htmlContent.includes("id='" + id + "'")) {
      missing.add(id);
    }
  }
  console.log(label + ' potential missing IDs count:', missing.size);
  if (missing.size > 0) {
    console.log('  Items to review:', Array.from(missing));
  }
}

checkMissingIds('app.js', indexHtml, 'app.js -> index.html');
checkMissingIds('wholesale.js', wholesaleHtml, 'wholesale.js -> wholesale.html');
checkMissingIds('admin/admin.js', adminHtml, 'admin.js -> admin.html');
