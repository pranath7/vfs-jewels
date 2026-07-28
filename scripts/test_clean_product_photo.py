import os
import requests

API_KEY = 'f1b1sd5rBBEz2xyJ9ubJBwB5'

def clean_image_with_remove_bg(image_url_or_path, output_filename):
    url = "https://api.remove.bg/v1.0/removebg"
    headers = {"X-Api-Key": API_KEY}

    if image_url_or_path.startswith("http"):
        data = {
            "image_url": image_url_or_path,
            "size": "auto",
            "bg_color": "ffffff"
        }
        files = None
    else:
        data = {
            "size": "auto",
            "bg_color": "ffffff"
        }
        files = {"image_file": open(image_url_or_path, "rb")}

    print(f"Cleaning image: {image_url_or_path}...")
    response = requests.post(url, data=data, files=files, headers=headers)

    if response.status_code == 200:
        with open(output_filename, 'wb') as out:
            out.write(response.content)
        print(f"✅ Success! Clean studio image saved to: {output_filename}")
        return output_filename
    else:
        print(f"❌ Error {response.status_code}: {response.text}")
        return None

if __name__ == '__main__':
    # Test on Cloudinary product image
    test_url = "https://res.cloudinary.com/cwx4zame/image/upload/v1783178917/whbmflasdurxiag7au7t.jpg"
    clean_image_with_remove_bg(test_url, "assets/cleaned_test_product.png")
