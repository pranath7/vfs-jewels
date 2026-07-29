import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

api_file_path = os.path.join('api', 'create-razorpay-order.js')
app_js_path = 'app.js'
wholesale_js_path = 'wholesale.js'
index_html_path = 'index.html'
wholesale_html_path = 'wholesale.html'

# 1. Update api/create-razorpay-order.js
with open(api_file_path, 'r', encoding='utf-8') as f:
    api_code = f.read()

old_amount_calc = "amount: Math.round(amount * 100),"
new_amount_calc = '''// Intelligently handle amount passed in Rupees (e.g. 1 for ₹1) or Paise (e.g. 100 for ₹1)
        amount: (amount >= 100 && Number.isInteger(amount)) ? amount : Math.round(amount * 100),'''

if old_amount_calc in api_code:
    api_code = api_code.replace(old_amount_calc, new_amount_calc)
    with open(api_file_path, 'w', encoding='utf-8') as f:
        f.write(api_code)
    print("Updated api/create-razorpay-order.js amount calculation")


# 2. Update triggerRazorpayUnlock in app.js and wholesale.js to pass 1 (₹1)
def update_js_trigger(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = code.replace('window.triggerRazorpayUnlock(100)', 'window.triggerRazorpayUnlock(1)')
    code = code.replace('triggerRazorpayUnlock(amountInPaise = 100)', 'triggerRazorpayUnlock(amountInRupees = 1)')
    code = code.replace('amount: amountInPaise,', 'amount: (amountInRupees >= 100) ? amountInRupees : Math.round(amountInRupees * 100),')
    code = code.replace('amount: amountInRupees,', 'amount: (amountInRupees >= 100) ? amountInRupees : Math.round(amountInRupees * 100),')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} for ₹1 Razorpay trigger")

update_js_trigger(app_js_path)
update_js_trigger(wholesale_js_path)


# 3. Update HTML onclicks in index.html and wholesale.html
def update_html_trigger(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = code.replace('window.triggerRazorpayUnlock(100)', 'window.triggerRazorpayUnlock(1)')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Updated {file_path} HTML onclicks to triggerRazorpayUnlock(1)")

update_html_trigger(index_html_path)
update_html_trigger(wholesale_html_path)
