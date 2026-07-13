# 👑 Managing VFS Jewels Project

Welcome to the **VFS Jewels** codebase documentation. This document serves as the single source of truth for understanding, managing, running, and deploying the VFS Jewels storefront and administration system.

---

## 🏗️ 1. Project Architecture & Tech Stack

VFS Jewels is built on a high-performance serverless architecture designed to handle thousands of users efficiently with minimal hosting costs:

* **Frontend**: HTML5, Vanilla JavaScript (ES6+), and custom Vanilla CSS.
* **Hosting**: Hosted on **Vercel** with automatic global CDN caching and SSL.
* **Database & Auth**: **Firebase Firestore (Web SDK v9)** for real-time document storage.
* **Media Storage**: **Cloudinary** for lightning-fast product image delivery and transformations.
* **Serverless backend**: **Vercel Serverless Functions** (Node.js) under the `api/` folder for backend logic like Webhooks.

---

## 📂 2. Directory Structure

```text
├── admin/
│   ├── admin.html          # Administration portal interface
│   ├── admin.js            # Dashboard logic, reports, catalog wizard, approvals
│   └── admin.css           # Styling specifications for the dashboard
├── api/
│   └── webhook.js          # WhatsApp cloud API webhook handler (Vercel Serverless)
├── assets/                 # Icons, logo marks, and default placeholder images
├── assets_cloudinary_urls.json # Helper for asset uploads
├── cloudinary_urls.json    # Catalog media link map
├── app.js                  # Storefront shopping cart, checkout, and Firestore sync
├── index.html              # Customer-facing storefront homepage
├── style.css               # Storefront branding & layout stylesheet
├── vercel.json             # Vercel redirection routes and headers configuration
├── vfs-config.json         # Firebase and Cloudinary API credentials (gitignored)
├── vfs-products.json       # Storefront initial fallback product catalog
├── testing_checklist.md    # Manual QA testing guide
└── Managing VFS Jewels Project.md # Project documentation & developer guide (This File)
```

---

## 🗄️ 3. Database Architecture (Firestore)

VFS Jewels utilizes a flat collection structure in Firestore:

### `products`
* Stores the main product details list.
* Key fields: `id` (int), `sku` (string), `name`, `price` (Retail), `wholesalePrice`, `moq` (Minimum Order Quantity), `img` (Cloudinary URL).

### `product_stock`
* Stores stock count ledger mapped by product ID.
* Document ID matches the product ID string (e.g. `doc('1001')`).
* Key fields: `stock` (int).

### `orders`
* Stores customer purchase orders.
* Key fields: `id` (e.g. `#J7001`), `createdAt` (timestamp), `name`, `phone`, `total` (grand total), `status` (`unpaid`, `paid`, `preparing`, `ready`, `dispatched`, `completed`), `items` array:
  * Each item records a snapshot: `stockBefore` and `stockAfter` at the time of purchase.

### `wholesale_users`
* Stores wholesale reseller accounts applying for prices.
* Key fields: `uid` (string), `name`, `phone`, `shopName`, `city`, `unlocked` (boolean), `paymentStatus` (`pending` / `accepted`).

### `settings`
* Dynamic website settings document `settings/instagram_reels`.
* Key fields: `url` (string, holds reel URLs separated by linebreaks).

---

## 🌟 4. Key Upgrades & Features Guide

### 📦 Stock Management & Indicators
* Managed inside the new **Inventory** tab panel in the admin interface.
* Displays all catalog items with direct adjustment fields (`+` / `-` / direct input).
* **Low Stock Alerts**: Orange label for low inventory count (< 5), Red label for out-of-stock count (0). Out-of-stock items automatically show "Sold Out" and block checkouts.

### 📄 Large Photo Dispatch Slip PDF
* Admin can click **"Photo Slip"** next to paid orders.
* Generates a PDF showing **1 product per page** with a large photo, SKU, ordered quantity, and historical indicators for **Stock Before Purchase** & **Stock After Purchase** to ensure packaging accuracy.

### 🏷️ Custom Invoice Numbers (`#J7001`)
* Structured sequentially: `#` + `[Month Letter]` + `[Month Number]` + `[3-digit Sequential Counter]`.
* Formatted globally from `001` onwards (e.g., `#J7001` for the first order in July).

### 📊 Timeframe Sales Reports & Bulk ZIP Export
* **Dashboard Tab**: Filters orders by 30 days, 60 days, 90 days, or 1 year.
* **Bulk Export**: Clicking **"Download Invoices ZIP"** compiles all PDF invoices for the selected timeframe into a single compressed `.zip` archive client-side.

### 🔐 Wholesale Portal lock/unlock & MOQ
* **MOQ**: If a product has a Minimum Order Quantity set (e.g., 10), checkout is blocked unless the customer buys at least that quantity.
* **State locking**: Wholesale prices are hidden unless the admin approves the customer's payment status to `unlocked: true` inside the admin portal.
* **WhatsApp Welcome**: Admin can click "Welcome" to automatically send a pre-formatted WhatsApp greetings link to approved resellers.

### 💬 WhatsApp 1% Referral Discount
* Triggered by appending `?ref=whatsapp` or `?source=wa` to the store link.
* Saves `vfs_wa_referral: true` in the browser's `localStorage` and applies a automatic 1% discount on the subtotal during checkout.

---

## 💻 5. Running the Project Locally

To test storefront or admin panel updates locally:

1. Open a terminal in the root directory: `C:\Users\91636\.gemini\antigravity-ide\scratch\vfs-jewels-git`
2. Boot a local web server:
   ```bash
   npx serve .
   ```
3. Open your browser:
   * Storefront: `http://localhost:3000/index.html` (or port specified by serve).
   * Admin Portal: `http://localhost:3000/admin/admin.html`

---

## 🚀 6. Deploying Changes to Live Site

Changes are pushed to GitHub, which triggers Vercel to automatically rebuild and deploy within 30 seconds:

```bash
# 1. Stage all modifications
git add .

# 2. Commit changes
git commit -m "feat: your descriptive commit message"

# 3. Push to main branch (Triggers Vercel Live Deployment)
git push origin main
```
To monitor your build status or view API logs, visit your Vercel Project dashboard.
