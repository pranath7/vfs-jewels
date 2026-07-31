"""
VFS Jewels — Reset Wholesale Database & Start Fresh Script
Wipes all documents from wholesale_users and wholesale_registrations in Firestore REST API.
"""

import urllib.request
import json
import sys

PROJECT_ID = "vfs-jewellery"
BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def delete_collection_documents(collection_name):
    url = f"{BASE_URL}/{collection_name}?pageSize=300"
    print(f"Fetching documents in '{collection_name}'...")
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read().decode("utf-8"))
        docs = data.get("documents", [])
        if not docs:
            print(f"'{collection_name}' is already completely empty.")
            return

        print(f"Deleting {len(docs)} documents in '{collection_name}'...")
        for d in docs:
            doc_name = d["name"] # full path
            del_url = f"https://firestore.googleapis.com/v1/{doc_name}"
            del_req = urllib.request.Request(del_url, method="DELETE")
            try:
                urllib.request.urlopen(del_req)
                print(f"   Deleted: {doc_name.split('/')[-1]}")
            except Exception as e:
                print(f"   Failed deleting {doc_name}: {e}")

        print(f"Finished cleaning '{collection_name}'!")
    except Exception as err:
        print(f"Error accessing '{collection_name}': {err}")

if __name__ == "__main__":
    print("Starting Fresh Reset for VFS Wholesale Portal Database...")
    delete_collection_documents("wholesale_users")
    delete_collection_documents("wholesale_registrations")
    print("All existing wholesale accounts and access permissions have been wiped. Wholesale Portal is ready for a FRESH START!")
