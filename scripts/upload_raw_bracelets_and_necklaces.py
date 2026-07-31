import os
import json
import requests

CLOUD_NAME = 'cwx4zame'
UPLOAD_PRESET = 'vfs_preset'
FIREBASE_PROJECT = 'vfs-jewellery'
FIREBASE_API_KEY = 'AIzaSyD6h-kC0Afqd20pLASwUC1smMCdjUfQLes'

NECKLACES_DIR = r'C:\Users\91636\.gemini\antigravity-ide\scratch\vfsneck01_extracted'
BRACELETS_DIR = r'C:\Users\91636\.gemini\antigravity-ide\scratch\vfsbrac01_extracted'
PRODUCTS_FILE = r'C:\Users\91636\.gemini\antigravity-ide\scratch\vfs-jewels-git\vfs-products.json'

def upload_to_cloudinary(file_path, folder_name):
    file_name = os.path.basename(file_path)
    url = f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload"
    
    with open(file_path, 'rb') as f:
        files = {'file': (file_name, f, 'image/jpeg')}
        data = {
            'upload_preset': UPLOAD_PRESET,
            'folder': folder_name
        }
        res = requests.post(url, files=files, data=data, timeout=30)
        res_json = res.json()
        if 'secure_url' in res_json:
            return res_json['secure_url']
        else:
            raise Exception(f"Cloudinary error: {json.dumps(res_json)}")

def update_firestore_product(product_id, img_url):
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents/products/{product_id}?key={FIREBASE_API_KEY}"
    fields = {
        "img": {"stringValue": img_url}
    }
    body = json.dumps({"fields": fields})
    mask = "updateMask.fieldPaths=img"
    full_url = f"{url}&{mask}"
    try:
        res = requests.patch(full_url, data=body, headers={"Content-Type": "application/json"}, timeout=15)
        return res.status_code == 200
    except Exception as e:
        print(f"Firestore update error for ID {product_id}: {e}")
        return False

def main():
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)

    # 1. Process Necklaces (IDs 587 to 594)
    neck_files = sorted([f for f in os.listdir(NECKLACES_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    neck_products = [p for p in products if p.get('cat') == 'necklaces']
    for idx, p in enumerate(neck_products):
        if idx < len(neck_files):
            file_path = os.path.join(NECKLACES_DIR, neck_files[idx])
            cloudinary_url = upload_to_cloudinary(file_path, 'raw_necklaces')
            p['img'] = cloudinary_url
            if 'imgs' in p and len(p['imgs']) > 0:
                p['imgs'][0] = cloudinary_url
            update_firestore_product(p['id'], cloudinary_url)
            with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(products, f, indent=2)
            print(f"Necklace ID {p['id']} saved -> {cloudinary_url}")

    # 2. Process Bracelets (IDs 595 to 625)
    brac_files = sorted([f for f in os.listdir(BRACELETS_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    brac_products = [p for p in products if p.get('cat') == 'bracelets']
    for idx, p in enumerate(brac_products):
        if idx < len(brac_files):
            file_path = os.path.join(BRACELETS_DIR, brac_files[idx])
            cloudinary_url = upload_to_cloudinary(file_path, 'raw_bracelets')
            p['img'] = cloudinary_url
            if 'imgs' in p and len(p['imgs']) > 0:
                p['imgs'][0] = cloudinary_url
            update_firestore_product(p['id'], cloudinary_url)
            with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
                json.dump(products, f, indent=2)
            print(f"Bracelet ID {p['id']} saved -> {cloudinary_url}")

    print("\nALL RAW NECKLACE AND BRACELET PHOTOS UPLOADED AND SAVED!")

if __name__ == '__main__':
    main()
