import requests
import json
import re
import time
import os
import sys

# Firestore Config
FIREBASE_PROJECT = 'vfs-jewellery'
FIREBASE_API_KEY = 'AIzaSyD6h-kC0Afqd20pLASwUC1smMCdjUfQLes'

def save_to_firestore(product):
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents/products/{product['id']}?key={FIREBASE_API_KEY}"
    
    # Construct fields matching Firebase schema
    fields = {
        "id":             {"integerValue": product["id"]},
        "sku":            {"stringValue": product["sku"]},
        "name":           {"stringValue": product["name"]},
        "cat":            {"stringValue": product["cat"]},
        "meta":           {"stringValue": product["meta"]},
        "price":          {"integerValue": product["price"]},
        "mrp":            {"integerValue": product["mrp"]},
        "img":            {"stringValue": product["img"]},
        "rating":         {"stringValue": product["rating"]},
        "reviews":        {"integerValue": product["reviews"]},
        "badge":          {"stringValue": product["badge"]},
        "priceOnRequest": {"booleanValue": product["priceOnRequest"]}
    }
    
    if "wholesalePrice" in product:
        fields["wholesalePrice"] = {"integerValue": product["wholesalePrice"]}
        
    doc_body = json.dumps({"fields": fields})
    
    try:
        r = requests.patch(url, data=doc_body, headers={"Content-Type": "application/json"}, timeout=10)
        if r.status_code == 200:
            return True
        else:
            print(f"  ⚠ Firestore update returned status {r.status_code}: {r.text[:200]}")
            return False
    except Exception as e:
        print(f"  ⚠ Firestore connection error: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/ocr_all_products.py <YOUR_OCR_SPACE_API_KEY>")
        sys.exit(1)
        
    apikey = sys.argv[1]
    url = 'https://api.ocr.space/parse/image'
    progress_file = 'ocr_progress.json'
    
    # Load progress if it exists
    progress = {}
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress = json.load(f)
            
    # Load products
    with open('vfs-products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
        
    # We will modify products in place
    modified_count = 0
    real_products = [p for p in products if p['id'] != 1]
    total = len(real_products)
    
    print(f"Starting price extraction using OCR key: {apikey[:4]}...{apikey[-4:] if len(apikey) > 8 else ''}")
    print(f"Total products to scan: {total}")
    
    for i, p in enumerate(real_products):
        p_id = str(p['id'])
        img_url = p['img']
        
        # 1. OCR Step: Retrieve extracted text
        ocr_text = ""
        extracted_price = None
        
        if p_id in progress and progress[p_id].get('wholesalePrice') is not None:
            # Already successfully scanned
            ocr_text = progress[p_id].get('text', '')
            extracted_price = progress[p_id].get('wholesalePrice')
        else:
            # Need to call OCR API
            print(f"[{i+1}/{total}] Scanning Product ID {p_id} ({p['cat']}) - {img_url}...")
            try:
                img_data = requests.get(img_url, timeout=10).content
                r = requests.post(url, files={'filename': ('img.jpg', img_data)}, data={'apikey': apikey}, timeout=15)
                res = r.json()
                
                if "ParsedResults" in res and len(res["ParsedResults"]) > 0:
                    ocr_text = res["ParsedResults"][0]["ParsedText"].strip()
                    
                    # Pattern 1: VFS <number>
                    m = re.search(r'VFS\s*(\d+)', ocr_text, re.IGNORECASE)
                    if m:
                        extracted_price = int(m.group(1))
                    else:
                        # Pattern 2: Any 3 digit number
                        nums = re.findall(r'\b\d{3}\b', ocr_text)
                        if nums:
                            extracted_price = int(nums[0])
                        else:
                            # Pattern 3: Any 2 digit number
                            nums_2 = re.findall(r'\b\d{2}\b', ocr_text)
                            if nums_2:
                                extracted_price = int(nums_2[0])
                    
                    # Update local progress file
                    progress[p_id] = {
                        'text': ocr_text,
                        'wholesalePrice': extracted_price
                    }
                    with open(progress_file, 'w', encoding='utf-8') as pf:
                        json.dump(progress, pf, indent=2, ensure_ascii=False)
                        
                    print(f"  [OK] OCR Text: {repr(ocr_text.replace('\n',' '))}")
                    print(f"  [OK] Extracted Price: {extracted_price}")
                elif "error" in res or "ErrorMessage" in res:
                    err_msg = res.get("error") or res.get("ErrorMessage")
                    print(f"  [ERR] OCR Error: {err_msg}")
                    if "Rate limit exceeded" in str(err_msg):
                        print("  [STOP] Rate limit hit. Exiting. Please resume later or use a fresh API key.")
                        break
                    continue
                else:
                    print(f"  [ERR] OCR Response Empty: {res}")
                    continue
            except Exception as e:
                print(f"  [ERR] Connection/Request failed: {e}")
                continue
                
            time.sleep(1.5)  # respect rate limits
            
        # 2. Update price fields in the product object
        if extracted_price is not None:
            # We found a price! Let's update the wholesale and retail prices
            ws_price = extracted_price
            
            # Calculate retail price and mrp based on wholesale price
            # Retail is ~1.66x wholesale, MRP is 1.5x retail
            retail_price = int(round(ws_price * 1.66))
            mrp_price = int(round(retail_price * 1.5))
            
            # Map back to the products list element
            target_p = next(x for x in products if x['id'] == p['id'])
            target_p['wholesalePrice'] = ws_price
            target_p['price'] = retail_price
            target_p['mrp'] = mrp_price
            target_p['priceOnRequest'] = False
            
            # Write to Firestore to update cloud DB
            print(f"  [DB] Updating Firestore: wholesalePrice={ws_price}, price={retail_price}, mrp={mrp_price}...")
            db_success = save_to_firestore(target_p)
            if db_success:
                print("  [DB] Firestore updated successfully.")
                modified_count += 1
            else:
                print("  [DB] Firestore update failed.")
        else:
            # OCR succeeded but no numbers found - set default based on category so it has a price
            ws_price = 200 if p['cat'] == 'kadas' else (120 if p['cat'] == 'chains' else 90)
            retail_price = int(round(ws_price * 1.66))
            mrp_price = int(round(retail_price * 1.5))
            
            target_p = next(x for x in products if x['id'] == p['id'])
            target_p['wholesalePrice'] = ws_price
            target_p['price'] = retail_price
            target_p['mrp'] = mrp_price
            target_p['priceOnRequest'] = False
            
            print(f"  [WARN] No price found. Defaulting to wholesalePrice={ws_price}, price={retail_price}...")
            db_success = save_to_firestore(target_p)
            if db_success:
                print("  [DB] Firestore updated successfully (default).")
                modified_count += 1

    # Save final vfs-products.json
    with open('vfs-products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
        
    print(f"\n[DONE] Updated {modified_count} products with dynamic wholesale prices in vfs-products.json and Firestore.")

if __name__ == '__main__':
    main()
