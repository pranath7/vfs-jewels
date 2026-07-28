import os
import re

def update_file(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old_str, new_str in replacements:
        content = content.replace(old_str, new_str)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file_path} with GSTIN")

# 1. Update scripts/generate_sample_pdf_and_send_whatsapp.py
generate_script = os.path.join(os.getcwd(), 'scripts', 'generate_sample_pdf_and_send_whatsapp.py')
with open(generate_script, 'r', encoding='utf-8') as f:
    g_code = f.read()

g_code = g_code.replace(
    'Paragraph("Phone: +91 98407 57363 | Email: vfsjewels@gmail.com", store_info)',
    'Paragraph("Phone: +91 98407 57363 | Email: vfsjewels@gmail.com | <b>GSTIN: 33AAFVC8491A1ZX</b>", store_info)'
)

g_code = g_code.replace(
    'Paragraph(f"<b>BILLED FROM :</b> Vikram Fancy Store (VFS) / VFS Jewels (Sowcarpet, Chennai)", meta_info_style),',
    'Paragraph(f"<b>BILLED FROM :</b> Vikram Fancy Store (VFS) / VFS Jewels | <b>GSTIN: 33AAFVC8491A1ZX</b>", meta_info_style),'
)

g_code = g_code.replace(
    'Paragraph(f"<b>BILLED TO :</b> {c[\'name\']} ({c[\'phone\']})", meta_info_style)',
    'Paragraph(f"<b>BILLED TO :</b> {c[\'name\']} ({c[\'phone\']}) | <b>GSTIN: {c.get(\'gstin\', \'33AAACV1234F1Z9\')}</b>", meta_info_style)'
)

g_code = g_code.replace(
    '"email": "client@vfsjewels.store"',
    '"email": "client@vfsjewels.store",\n        "gstin": "33AAACV1234F1Z9"'
)

g_code = g_code.replace(
    'Paragraph("<b>Email:</b> " + c["email"], store_info),',
    'Paragraph("<b>Email:</b> " + c["email"], store_info),\n        Paragraph("<b>GSTIN:</b> " + c.get("gstin", "33AAACV1234F1Z9"), store_info),'
)

with open(generate_script, 'w', encoding='utf-8') as f:
    f.write(g_code)
print("Updated generate_sample_pdf_and_send_whatsapp.py with GSTIN")


# 2. Update admin/admin.js
admin_js = os.path.join(os.getcwd(), 'admin', 'admin.js')
with open(admin_js, 'r', encoding='utf-8') as f:
    a_code = f.read()

a_code = a_code.replace(
    '<div>BILLED FROM : Vikram Fancy Store (VFS) / VFS Jewels (Sowcarpet, Chennai)</div>',
    '<div>BILLED FROM : Vikram Fancy Store (VFS) / VFS Jewels | <strong>GSTIN: 33AAFVC8491A1ZX</strong></div>'
)

a_code = a_code.replace(
    '<div>BILLED TO : ${escapeHtml(order.name || \'Valued Customer\')} (${escapeHtml(order.phone || \'N/A\')})</div>',
    '<div>BILLED TO : ${escapeHtml(order.name || \'Valued Customer\')} (${escapeHtml(order.phone || \'N/A\')}) ${order.gstNumber || order.gstin ? `| <strong>GSTIN: ${escapeHtml(order.gstNumber || order.gstin)}</strong>` : \'\'}</div>'
)

a_code = a_code.replace(
    '<div>BILLED TO : ${order.name} (${order.phone})</div>',
    '<div>BILLED TO : ${order.name} (${order.phone}) ${order.gstNumber || order.gstin ? `| <strong>GSTIN: ${order.gstNumber || order.gstin}</strong>` : \'\'}</div>'
)

with open(admin_js, 'w', encoding='utf-8') as f:
    f.write(a_code)
print("Updated admin/admin.js with GSTIN in Photo Slip and Invoices")

# 3. Update app.js
app_js = os.path.join(os.getcwd(), 'app.js')
with open(app_js, 'r', encoding='utf-8') as f:
    app_code = f.read()

app_code = app_code.replace(
    '<div>BILLED FROM : Vikram Fancy Store (VFS) / VFS Jewels (Sowcarpet, Chennai)</div>',
    '<div>BILLED FROM : Vikram Fancy Store (VFS) / VFS Jewels | <strong>GSTIN: 33AAFVC8491A1ZX</strong></div>'
)

with open(app_js, 'w', encoding='utf-8') as f:
    f.write(app_code)
print("Updated app.js with GSTIN")

# 4. Update wholesale.js
wholesale_js = os.path.join(os.getcwd(), 'wholesale.js')
with open(wholesale_js, 'r', encoding='utf-8') as f:
    w_code = f.read()

w_code = w_code.replace(
    '<div>BILLED FROM : Vikram Fancy Store (VFS) / VFS Jewels (Sowcarpet, Chennai)</div>',
    '<div>BILLED FROM : Vikram Fancy Store (VFS) / VFS Jewels | <strong>GSTIN: 33AAFVC8491A1ZX</strong></div>'
)

with open(wholesale_js, 'w', encoding='utf-8') as f:
    f.write(w_code)
print("Updated wholesale.js with GSTIN")
