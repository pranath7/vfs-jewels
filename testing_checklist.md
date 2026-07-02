# VFS Jewels — Comprehensive Testing Checklist

Use this checklist to perform end-to-end testing of your customer storefront and admin dashboard.

---

## 🛒 1. Customer Storefront Flows (`vfsjewels.store`)

### Catalog & Navigation
- [x] **Category Filters:** Tap "Rings", "Earrings", "Necklaces", and "Bracelets" at the top or in the mobile sidebar. Verify the product grid filters instantly.
- [x] **Product Details:** Tap on a product. Verify the detail page displays the correct title, description, SKU, price, and images.

### Cart & Checkout
- [x] **Add to Cart:** Add multiple items to the cart. Verify the cart drawer opens, displays the correct quantities, prices, and matches the subtotal.
- [x] **Update Quantities:** Change item quantities inside the cart and delete an item. Verify the subtotal updates instantly.
- [x] **Checkout Form Validation:** Tap **Checkout**. Fill in the fields and test boundaries:
  - Phone number (must be exactly 10 digits).
  - Pincode (must be exactly 6 digits).
  - Ensure missing fields trigger standard browser warnings.
- [x] **Responsive Checkout Dialog:** Verify that the "City" and "Pincode" input fields stay perfectly inside the white card borders on mobile and do not stick out.

### Payment & Order Placement
- [x] **Direct UPI Payment Button:** Tap **Proceed to Payment**. Verify the next step displays:
  - The correct total amount.
  - The direct VFS UPI ID.
  - The payment QR code.
- [x] **QR Code Scanning:** Scan the generated QR code using a phone UPI app (GPay/PhonePe/Paytm) and confirm it auto-populates the exact order total and UPI ID.
- [x] **Confirm Order Placement:** Tap **I Have Paid**. Verify:
  - The order is submitted to Firestore.
  - A success screen appears with your unique Order ID (e.g. `#VF-1001`).
- [x] **Download Invoice PDF:** Click **Download Invoice Receipt**. Verify a clean, professional invoice PDF is generated and downloaded to your device (no blank pages on mobile!).

---

## 🔑 2. Admin Portal Flows (`vfsjewels.store/admin/admin.html`)

### Security Gate (Login)
- [x] **Access Control:** Open the page. Verify the entire admin dashboard is hidden and only the gold/black Login Card is visible.
- [x] **Incorrect Credentials:** Type a wrong username or password. Verify:
  - The card shakes.
  - A red error message appears.
- [x] **Username Conversion:** Type **`admin`** as the username (instead of a full email) and your correct password. Verify it logs in successfully.
- [x] **Sign Out:** Click **Logout** in the top-right header. Verify you are returned to the login screen and the dashboard is locked.

### Unpaid Orders Queue (Tab 1)
- [x] **Real-time Order Sync:** Place a test order on the storefront. Open the Admin dashboard, tap **Sync**, and verify the new order card immediately appears under **Unpaid Orders** with a yellow badge.
- [x] **Confirm Payment:** Click **Confirm Payment Received** on the order card. Verify:
  - The order status updates in Firestore.
  - The card moves out of the Unpaid tab and into the Paid tab.
  - The global KPI counts (Sales, Paid, Awaiting Payment) update instantly.

### Paid Orders & Shipping Dispatch (Tab 2)
- [x] **Barcodes Grid:** Open the **Paid** tab. Verify the paid order displays with its barcode.
- [x] **Print Invoice:** Click **Print Invoice/Receipt** on a paid order. Verify a print-ready window pops up formatted correctly.
- [x] **Dispatch Shipping:**
  - **Option A (Manual tracking):** Enter a tracking ID manually (e.g. `DEL123456`) and click **Save**.
  - **Option B (Barcode Scanner):** Tap **Scan Barcode**, point your mobile camera at a barcode, and verify it scans the tracking ID, updates Firestore, and moves the order to the **Shipped** tab.

### Shipped Orders Archive (Tab 3)
- [x] **Shipped List:** Open the **Shipped** tab. Verify the order displays with its tracking ID and a green "Shipped" status.

### Product Manager (Tab 4: Search & Edit)
- [x] **Product Search:** Go to **Search**. Search for a product name or SKU (e.g., `SN-0001`). Verify the list filters instantly.
- [x] **Inline Editing:** Click **Edit** on a product card. Change the price or category, click **Save**, and verify it updates in Firestore.
- [x] **No Bottom Cutoff:** Scroll to the bottom of the product list. Verify you can scroll the last product ("Floral Statement Ring") and its edit buttons all the way up above the bottom navigation bar.

### Wallet Ledger Lookup (Tab 5: Returns)
- [x] **Wallet Search:** Go to **Returns**. Enter a customer's phone number in the Ledger lookup. Verify their wallet balance and transaction logs load cleanly from Firestore.
