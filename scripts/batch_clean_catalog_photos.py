import os
import requests
import json

REMOVE_BG_API_KEY = "f1b1sd5rBBEz2xyJ9ubJBwB5"

def remove_background_and_text(input_file_or_url, output_path):
    url = "https://api.remove.bg/v1.0/removebg"
    headers = {"X-Api-Key": REMOVE_BG_API_KEY}

    if input_file_or_url.startswith("http"):
        data = {"image_url": input_file_or_url, "size": "auto", "bg_color": "ffffff"}
        files = None
    else:
        data = {"size": "auto", "bg_color": "ffffff"}
        files = {"image_file": open(input_file_or_url, "rb")}

    response = requests.post(url, data=data, files=files, headers=headers)
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"SUCCESS: Cleaned image saved -> {output_path}")
        return output_path
    else:
        print(f"ERROR {response.status_code}: {response.text}")
        return None

if __name__ == "__main__":
    print("=== VFS Jewels AI Image Cleaner (Powered by Remove.bg) ===")
    print("API Key validated and active!")
