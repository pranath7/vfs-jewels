import os
import re

admin_js_path = os.path.join(os.getcwd(), 'admin', 'admin.js')

with open(admin_js_path, 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Upgrade Edit Product Inline Form to include all categories + Featured Section/Tag dropdown
old_edit_fields = r'''                    <div class="edit-group">
                      <label>Category</label>
                      <select id="editCat_\${p\.id}">
                        <option value="kadas" \${p\.cat === 'kadas' \? 'selected' : ''}>Kadas</option>
                        <option value="chains" \${p\.cat === 'chains' \? 'selected' : ''}>Chains</option>
                      </select>
                    </div>'''

new_edit_fields = '''                    <div class="edit-group">
                      <label>Category</label>
                      <select id="editCat_${p.id}">
                        <option value="kadas" ${p.cat === 'kadas' ? 'selected' : ''}>Kadas</option>
                        <option value="chains" ${p.cat === 'chains' ? 'selected' : ''}>Chains</option>
                        <option value="necklaces" ${p.cat === 'necklaces' ? 'selected' : ''}>Necklaces</option>
                        <option value="bracelets" ${p.cat === 'bracelets' ? 'selected' : ''}>Bracelets</option>
                        <option value="earrings" ${p.cat === 'earrings' ? 'selected' : ''}>Ear Rings</option>
                        <option value="rings" ${p.cat === 'rings' ? 'selected' : ''}>Rings</option>
                      </select>
                    </div>
                    <div class="edit-group">
                      <label>Featured Tag / Section</label>
                      <select id="editBadge_${p.id}">
                        <option value="" ${!p.badge ? 'selected' : ''}>None (Standard)</option>
                        <option value="Best Seller" ${p.badge === 'Best Seller' ? 'selected' : ''}>🔥 Best Seller</option>
                        <option value="New Arrival" ${p.badge === 'New Arrival' ? 'selected' : ''}>✨ New Arrival</option>
                        <option value="Offer Stock" ${p.badge === 'Offer Stock' || p.badge === 'Sale' ? 'selected' : ''}>🏷️ Offer Stock / Sale</option>
                        <option value="Featured" ${p.badge === 'Featured' ? 'selected' : ''}>⭐ Featured</option>
                      </select>
                    </div>'''

code = re.sub(old_edit_fields, new_edit_fields, code)

# 2. Robust saveProductInline function with try/catch, button loading spinner, and catalog sync
new_save_inline = '''window.saveProductInline = async function(id) {
  const editContainer = document.getElementById(`editMode_${id}`);
  const saveBtn = editContainer ? editContainer.querySelector('.btn-card-primary') : null;
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  try {
    const newName = document.getElementById(`editTitle_${id}`).value.trim();
    const newPrice = parseFloat(document.getElementById(`editPrice_${id}`).value);
    const newWsPrice = parseFloat(document.getElementById(`editWsPrice_${id}`).value);
    const newMoq = parseInt(document.getElementById(`editMoq_${id}`).value) || 1;
    const newStock = parseInt(document.getElementById(`editStock_${id}`).value) || 0;
    const newCat = document.getElementById(`editCat_${id}`).value;
    const newBadge = document.getElementById(`editBadge_${id}`) ? document.getElementById(`editBadge_${id}`).value : '';
    
    if (!newName || isNaN(newPrice) || isNaN(newWsPrice)) {
      adminToast('Please fill out all fields correctly!', 'error');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
      return;
    }
    
    let products = (window.VFS_PRODUCTS_CACHE && window.VFS_PRODUCTS_CACHE.length > 0)
      ? window.VFS_PRODUCTS_CACHE
      : getAdminCatalog();

    let index = products.findIndex(p => String(p.id) === String(id) || String(p.sku) === String(id));

    if (index === -1) {
      // Fallback search in DEFAULT_PRODUCTS
      products = [...getAdminCatalog()];
      index = products.findIndex(p => String(p.id) === String(id) || String(p.sku) === String(id));
    }
    
    if (index !== -1) {
      products[index].name = newName;
      products[index].price = newPrice;
      products[index].mrp = newPrice;
      products[index].wholesalePrice = newWsPrice;
      products[index].moq = newMoq;
      products[index].cat = newCat;
      products[index].badge = newBadge;
      
      // Save Product Details to Firestore & LocalStorage
      await window.VFS_DB.saveProductsList(products);
      window.VFS_PRODUCTS_CACHE = products;

      // Save Stock details directly to Firestore
      await window.VFS_DB.saveProductStock(id, newStock);
      window.VFS_STOCK_CACHE[id] = newStock;
      
      adminToast('Product updated successfully! 🌸');
      await renderSearchCatalog();
    } else {
      adminToast('Product not found in catalog cache!', 'error');
    }
  } catch (err) {
    console.error("Error saving product inline:", err);
    adminToast("Failed to save product: " + err.message, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  }
};'''

code = re.sub(
    r'window\.saveProductInline\s*=\s*async\s*function\s*\([^)]*\)\s*\{[\s\S]*?\};\s*(?=window\.|function|\n\n|$)',
    new_save_inline + '\n\n',
    code
)

# 3. Add Tag/Badge dropdown to Single Product Add Wizard
old_sing_category = '''          <select id="singCategory" onchange="toggleCustomCategoryInput('sing', this)" required>
            <option value="kadas">Kadas</option>
            <option value="chains">Chains</option>
            <option value="__new__">+ Add New Category</option>
          </select>'''

new_sing_category = '''          <select id="singCategory" onchange="toggleCustomCategoryInput('sing', this)" required>
            <option value="kadas">Kadas</option>
            <option value="chains">Chains</option>
            <option value="necklaces">Necklaces</option>
            <option value="bracelets">Bracelets</option>
            <option value="earrings">Ear Rings</option>
            <option value="rings">Rings</option>
            <option value="__new__">+ Add New Category</option>
          </select>
        </div>
        <div class="form-group">
          <label>Featured Section / Tag</label>
          <select id="singBadge">
            <option value="">None (Standard Catalog)</option>
            <option value="Best Seller">🔥 Best Seller</option>
            <option value="New Arrival">✨ New Arrival</option>
            <option value="Offer Stock">🏷️ Offer Stock / Sale</option>
            <option value="Featured">⭐ Featured</option>
          </select>'''

code = code.replace(old_sing_category, new_sing_category)

# Save updated admin.js
with open(admin_js_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Successfully updated admin/admin.js with edit fix and Tag/Badge selector!")
