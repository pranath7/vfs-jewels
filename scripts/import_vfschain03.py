import os
import json
import requests
import time

CLOUD_NAME = 'cwx4zame'
UPLOAD_PRESET = 'vfs_preset'
FIREBASE_PROJECT = 'vfs-jewellery'
FIREBASE_API_KEY = 'AIzaSyD6h-kC0Afqd20pLASwUC1smMCdjUfQLes'

INPUT_DIR = r'C:\Users\91636\.gemini\antigravity-ide\scratch\cleaned_chains'
PRODUCTS_FILE = r'C:\Users\91636\.gemini\antigravity-ide\scratch\vfs-jewels-git\vfs-products.json'
URLS_FILE = r'C:\Users\91636\.gemini\antigravity-ide\scratch\vfs-jewels-git\cloudinary_urls.json'

CATEGORY = 'chains'
META = '18K Gold Plated Luxury Chain'
BADGE = 'New Arrival'
PRICE = 499
WHOLESALE_PRICE = 148
MRP = 749

def upload_to_cloudinary(file_path):
    file_name = os.path.basename(file_path)
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
    
    for attempt in range(4):
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (file_name, f, 'image/jpeg')}
                data = {
                    'upload_preset': UPLOAD_PRESET,
                    'folder': 'chains'
                }
                res = requests.post(url, files=files, data=data, timeout=25)
                res_json = res.json()
                if 'secure_url' in res_json:
                    return res_json['secure_url']
        except Exception as e:
            print(f"   [RETRY {attempt+1}] Cloudinary error: {e}")
            time.sleep(2)
    raise Exception(f"Failed to upload {file_name}")

def save_to_firestore_product(product):
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents/products/{product['id']}?key={FIREBASE_API_KEY}"
    fields = {
        "id":             {"integerValue": product["id"]},
        "sku":            {"stringValue": product["sku"]},
        "name":           {"stringValue": product["name"]},
        "cat":            {"stringValue": product["cat"]},
        "meta":           {"stringValue": product["meta"]},
        "price":          {"integerValue": product["price"]},
        "wholesalePrice": {"integerValue": product["wholesalePrice"]},
        "mrp":            {"integerValue": product["mrp"]},
        "img":            {"stringValue": product["img"]},
        "rating":         {"stringValue": product["rating"]},
        "reviews":        {"integerValue": product["reviews"]},
        "badge":          {"stringValue": product["badge"]},
        "priceOnRequest": {"booleanValue": product["priceOnRequest"]}
    }
    
    body = json.dumps({"fields": fields})
    for attempt in range(4):
        try:
            res = requests.patch(url, data=body, headers={"Content-Type": "application/json"}, timeout=20)
            if res.status_code == 200:
                return True
        except Exception as e:
            print(f"   [RETRY {attempt+1}] Firestore product error: {e}")
            time.sleep(2)
    return False

def save_to_firestore_stock(product_id, stock_count=25):
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents/product_stock/{product_id}?key={FIREBASE_API_KEY}"
    fields = {
        "stock": {"integerValue": stock_count}
    }
    body = json.dumps({"fields": fields})
    for attempt in range(4):
        try:
            res = requests.patch(url, data=body, headers={"Content-Type": "application/json"}, timeout=20)
            if res.status_code == 200:
                return True
        except Exception as e:
            print(f"   [RETRY {attempt+1}] Firestore stock error: {e}")
            time.sleep(2)
    return False

def main():
    files = sorted([f for f in os.listdir(INPUT_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))])
    print(f"[FILES] Found {len(files)} cleaned chain images in {INPUT_DIR}")
    
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        existing_products = json.load(f)
        
    existing_urls = {}
    if os.path.exists(URLS_FILE):
        with open(URLS_FILE, 'r', encoding='utf-8') as f:
            existing_urls = json.load(f)
            
    max_id = max(p['id'] for p in existing_products)
    start_id = max_id + 1
    
    ratings = ['4.7', '4.8', '4.9', '5.0', '4.8', '4.9']
    review_counts = [14, 18, 22, 16, 20, 25, 12, 19]
    
    new_products = []
    imported_count = 0
    
    for i, file_name in enumerate(files):
        img_key = f"vfschain03/{file_name}"
        if img_key in existing_urls:
            continue
            
        p_id = start_id + imported_count
        imported_count += 1
        num = str(len([p for p in existing_products if p.get('cat') == CATEGORY]) + imported_count).zfill(2)
        sku = f"SN-CH{str(p_id).zfill(3)}"
        file_path = os.path.join(INPUT_DIR, file_name)
        
        print(f"\n[UPLOAD] [{i+1}/{len(files)}] Uploading {file_name} for Product #{p_id} ({sku})...")
        try:
            img_url = upload_to_cloudinary(file_path)
            print(f"   [OK] Cloudinary: {img_url}")
        except Exception as e:
            print(f"   [ERR] Upload failed: {e}")
            continue
            
        product = {
            "id": p_id,
            "sku": sku,
            "name": f"VFS Classic Gold Plated Chain #{num}",
            "cat": CATEGORY,
            "meta": META,
            "price": PRICE,
            "wholesalePrice": WHOLESALE_PRICE,
            "mrp": MRP,
            "img": img_url,
            "rating": ratings[i % len(ratings)],
            "reviews": review_counts[i % len(review_counts)],
            "badge": BADGE,
            "priceOnRequest": False
        }
        
        print(f"   [FIRESTORE] Saving Product #{p_id}...")
        if save_to_firestore_product(product):
            print(f"   [OK] Firestore product document created.")
        
        print(f"   [STOCK] Setting stock (25) for Product #{p_id}...")
        if save_to_firestore_stock(p_id, 25):
            print(f"   [OK] Firestore stock document created.")
            
        new_products.append(product)
        existing_urls[img_key] = img_url
        
        merged = existing_products + new_products
        with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(merged, f, indent=2, ensure_ascii=False)
        with open(URLS_FILE, 'w', encoding='utf-8') as f:
            json.dump(existing_urls, f, indent=2, ensure_ascii=False)
            
        time.sleep(0.3)
        
    print(f"\n[DONE] Import complete. Added {len(new_products)} new chain products. Total catalog size: {len(existing_products) + len(new_products)}")

if __name__ == '__main__':
    main()
