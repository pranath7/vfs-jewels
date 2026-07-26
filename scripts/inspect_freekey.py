import requests
r = requests.get('https://ocr.space/ocrapi/freekey')
for line in r.text.split('\n'):
    if 'form' in line or 'action' in line or 'email' in line or 'mailchimp' in line or 'input' in line:
        print(line.strip()[:150])
