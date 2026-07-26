import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace('z-index: 99;', 'z-index: 99999 !important;')

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('Updated floating-guide-btn z-index to 99999 !important;')
