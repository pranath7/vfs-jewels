import urllib.parse

phone = "916369142027"
order_id = "#J7002"
customer_name = "Pranath Jain"
address = "B BLOCK 5E, CHENNAI - 600112"

photo_slip_url = f"https://www.vfsjewels.store/api/invoice?id={urllib.parse.quote(order_id)}&name={urllib.parse.quote(customer_name)}&type=photoslip"

wa_photoslip_text = f"""📸 *VFS JEWELS — DISPATCH PHOTO SLIP & VERIFICATION* 📸
━━━━━━━━━━━━━━━━━━━━━━━
Hello *{customer_name}*! 📦

Your dispatch photo slip and package verification details for Order *{order_id}* are ready!

🧾 *Order ID:* {order_id}
📍 *Shipping Address:* {address}
🚚 *Carrier Partner:* DTDC Express / Tracked
🏷️ *Official GSTIN:* 33AAFVC8491A1ZX

📸 *View / Print Full Dispatch Photo Slip & Barcode:*
{photo_slip_url}

━━━━━━━━━━━━━━━━━━━━━━━
Thank you for shopping with VFS Jewels Sowcarpet! 🌸
Web: https://vfsjewels.store"""

wa_photoslip_web_link = f"https://api.whatsapp.com/send?phone={phone}&text={urllib.parse.quote(wa_photoslip_text)}"

print("Direct WhatsApp Link for Photo Slip:")
print(wa_photoslip_web_link)
