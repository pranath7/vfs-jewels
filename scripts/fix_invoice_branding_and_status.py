import re

# 1. Update JS files (app.js, wholesale.js, admin/admin.js)
for fname in ['app.js', 'wholesale.js', 'admin/admin.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Update logo branding in invoice HTML
    content = content.replace(
        '<div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #000000;">VFS<span style="color:#D4AF37;">.</span></div>',
        '<div style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #000000;">VFS JEWELS<span style="color:#D4AF37;">.</span></div>'
    )
    content = content.replace(
        '<div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #000000;">VFS<span style="color: #D4AF37;">.</span></div>',
        '<div style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #000000;">VFS JEWELS<span style="color: #D4AF37;">.</span></div>'
    )
    content = content.replace(
        '<div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">VFS<span style="color:#D4AF37;">.</span></div>',
        '<div style="font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">VFS JEWELS<span style="color:#D4AF37;">.</span></div>'
    )

    # Remove status line from invoice HTML using regex
    content = re.sub(r'<p style="margin: 2px 0;">\s*<strong>Status:</strong>[\s\S]*?</p>\s*', '', content)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Successfully updated invoice template in {fname}')

# 2. Update api/invoice.js
with open('api/invoice.js', 'r', encoding='utf-8') as f:
    api_code = f.read()

api_code = api_code.replace("addText('VFS.', 50, 755, 26, 'F2', '0 0 0');", "addText('VFS JEWELS.', 50, 755, 24, 'F2', '0 0 0');")
api_code = api_code.replace("addText('.', 105, 755, 26, 'F2', '0.83 0.68 0.21');", "addText('.', 210, 755, 24, 'F2', '0.83 0.68 0.21');")
api_code = re.sub(r"addText\(`Status: \${status}`[\s\S]*?\);\n", "", api_code)

with open('api/invoice.js', 'w', encoding='utf-8') as f:
    f.write(api_code)

print('Successfully updated api/invoice.js!')
