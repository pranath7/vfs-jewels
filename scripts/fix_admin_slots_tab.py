import re

# 1. Update admin/admin.html
with open('admin/admin.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add 📹 8:30 PM Slots button to top header bar
header_btn = """        <button id="btnOpenSlotAdmin" class="btn-secondary-dark" style="background:#D4AF37 !important; border-color:#D4AF37 !important; color:#121212 !important; font-weight:800; padding:8px 16px;" data-tab="slots">
          📹 8:30 PM Slots
        </button>"""

if 'btnOpenSlotAdmin' not in html:
    html = html.replace('<div class="header-actions">', '<div class="header-actions">\n' + header_btn)

# Remove inline display:none from panelSlots
html = html.replace('<section class="tab-panel" id="panelSlots" style="display:none;">', '<section class="tab-panel" id="panelSlots">')

with open('admin/admin.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('Successfully updated admin/admin.html!')

# 2. Update admin/admin.js
with open('admin/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Make sure tab switcher handles 'slots'
if 'else if (activeTab === \'slots\')' not in js:
    js = js.replace(
        "else if (activeTab === 'banners') {",
        "else if (activeTab === 'slots') {\n      loadSlotPanel();\n    } else if (activeTab === 'banners') {"
    )

# Make sure data-tab buttons click handler opens panelSlots cleanly
slot_tab_handler = """
// Handle top header 8:30 PM Slots button & bottom nav slots button
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tab="slots"]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bottom-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => {
        p.classList.remove('active');
        p.style.display = '';
      });
      const navBtn = document.querySelector('.bottom-nav-btn[data-tab="slots"]');
      if (navBtn) navBtn.classList.add('active');
      const panel = document.getElementById('panelSlots');
      if (panel) panel.classList.add('active');
      const title = document.getElementById('tabTitle');
      const sub = document.getElementById('tabSubtitle');
      if (title) title.textContent = "📹 8:30 PM Live Video Slot Management";
      if (sub) sub.textContent = "Toggle daily live session, set Google Meet URL, and dispatch WhatsApp join links.";
      loadSlotPanel();
    });
  });
});
"""

if 'Handle top header 8:30 PM Slots button' not in js:
    js += '\n' + slot_tab_handler

with open('admin/admin.js', 'w', encoding='utf-8') as f:
    f.write(js)

print('Successfully updated admin/admin.js!')
