import os
import re

app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'
admin_js_path = os.path.join('admin', 'admin.js')

# 1. Update finalizeOrderAndProceed in app.js and wholesale.js
def update_finalize_status(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    target = "activeCheckoutOrder.status = paymentMethod === 'Online' ? 'paid' : 'unpaid';"
    replacement = "activeCheckoutOrder.status = (paymentMethod === 'Online' || paymentMethod === 'Wallet Credit' || paymentMethod === 'Wallet') ? 'paid' : 'unpaid';"

    if target in code:
        code = code.replace(target, replacement)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(code)
        print(f"Updated finalizeOrderAndProceed status in {file_path}")
    else:
        print(f"Target status string not found in {file_path}")

update_finalize_status(app_js_path)
update_finalize_status(wholesale_js_path)


# 2. Update order status filtering in admin/admin.js
with open(admin_js_path, 'r', encoding='utf-8') as f:
    admin_code = f.read()

target_admin = "} else if (order.status === 'paid') {"
replacement_admin = "} else if (order.status === 'paid' || order.status === 'CONFIRMED' || order.status === 'processing' || order.paymentMethod === 'Wallet Credit' || order.paymentMethod === 'Wallet') {"

if target_admin in admin_code:
    admin_code = admin_code.replace(target_admin, replacement_admin)
    with open(admin_js_path, 'w', encoding='utf-8') as f:
        f.write(admin_code)
    print("Updated order status filter in admin/admin.js to include Wallet Paid & Confirmed orders!")
else:
    print("target_admin not found in admin/admin.js")
