import re

for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove <section class="banners-section">...</section>
    pattern = r'<!-- COLLECTION BANNERS -->\s*<section class="banners-section">.*?</section>'
    content = re.sub(pattern, '', content, flags=re.DOTALL)

    # Also backup regex if comment missing
    pattern2 = r'<section class="banners-section">.*?</section>'
    content = re.sub(pattern2, '', content, flags=re.DOTALL)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Removed banners-section from', fname)
