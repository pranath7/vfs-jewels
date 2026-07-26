import re

# 1. Update clOpt in app.js and wholesale.js to stop Cloudinary from cropping images
for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove c_crop,g_north,h_0.74,
    content = content.replace("const cropTransform = !isBannerOrLogo ? 'c_crop,g_north,h_0.74,' : '';", "const cropTransform = '';")
    content = content.replace("${cropTransform}", "")

    # Replace inline object-fit:cover in shelf card image template
    content = content.replace('height:180px;object-fit:cover;', 'height:220px;object-fit:contain;background:#fafafa;')

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Successfully removed image crop transforms from {fname}')

# 2. Update style.css to guarantee object-fit: contain on all product images
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add a explicit global override for product card images
override_css = """
/* Guaranteed 100% Uncropped Product Images */
.p-img img,
.p-card img,
.product-card img,
.shelf-card img,
.tinder-card .tinder-img-box img {
  object-fit: contain !important;
  max-width: 100% !important;
  max-height: 100% !important;
}
"""

if 'Guaranteed 100% Uncropped Product Images' not in css:
    css += '\n' + override_css
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print('Appended uncropped image CSS rules to style.css')
