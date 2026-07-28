import os
import json
import requests
from PIL import Image as PILImage
import io

API_KEY = "f1b1sd5rBBEz2xyJ9ubJBwB5"
PRODUCTS_FILE = "vfs-products.json"
OUTPUT_DIR = os.path.join("assets", "cleaned_bracelets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def remove_bg_and_text(img_url, out_path):
    url = "https://api.remove.bg/v1.0/removebg"
    headers = {"X-Api-Key": API_KEY}
    data = {
        "image_url": img_url,
        "size": "auto",
        "bg_color": "ffffff"
    }

    try:
        resp = requests.post(url, data=data, headers=headers, timeout=25)
        if resp.status_code == 200:
            with open(out_path, "wb") as out:
                out.write(resp.content)
            print(f"SUCCESS: Cleaned image -> {out_path}")
            return True
        else:
            print(f"FAILED ({resp.status_code}): {resp.text}")
            return False
    except Exception as e:
        print(f"ERROR processing {img_url}: {e}")
        return False

def process_bracelets():
    if not os.path.exists(PRODUCTS_FILE):
        print(f"Error: {PRODUCTS_FILE} not found!")
        return

    with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
        products = json.load(f)

    bracelets = [p for p in products if p.get("cat") == "bracelets"]
    print(f"Found {len(bracelets)} bracelet products in {PRODUCTS_FILE}")

    processed_count = 0
    for idx, p in enumerate(bracelets):
        img_url = p.get("img") or ""
        if not img_url.startswith("http"):
            continue

        out_name = f"bracelet_cleaned_{p.get('id', idx)}.png"
        out_path = os.path.join(OUTPUT_DIR, out_name)

        if not os.path.exists(out_path):
            success = remove_bg_and_text(img_url, out_path)
            if success:
                processed_count += 1
                # Point local catalog image to the cleaned asset
                p["img"] = f"assets/cleaned_bracelets/{out_name}"
                if "imgs" in p and isinstance(p["imgs"], list):
                    p["imgs"][0] = f"assets/cleaned_bracelets/{out_name}"
        else:
            print(f"Already cleaned: {out_path}")
            p["img"] = f"assets/cleaned_bracelets/{out_name}"
            if "imgs" in p and isinstance(p["imgs"], list):
                p["imgs"][0] = f"assets/cleaned_bracelets/{out_name}"

    # Save updated catalog
    with open(PRODUCTS_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2)

    print(f"\nProcessing Complete! Cleaned {processed_count} bracelet photos using Remove.bg AI.")

if __name__ == "__main__":
    process_bracelets()
