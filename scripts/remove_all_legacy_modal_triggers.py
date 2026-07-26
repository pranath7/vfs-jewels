import re

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Neutralize wholesaleTermsModal.classList.add('active')
    content = content.replace("wholesaleTermsModal.classList.add('active')", "// disabled modal auto-popup")
    content = content.replace("wholesaleLoginModal.classList.add('active')", "// disabled modal auto-popup")
    content = content.replace("wholesaleUnlockModal.classList.add('active')", "// disabled modal auto-popup")
    content = content.replace("modeSelectorModal.classList.add('active')", "// disabled modal auto-popup")
    content = content.replace("openWholesaleUnlockModal()", "// disabled modal auto-popup")

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Neutralized legacy wholesale modal auto-triggers in', fname)

# Also ensure CSS hides them permanently
with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

hide_all_legacy_modals = """
/* Permanently disable legacy wholesale T&C, login, and unlock popups */
#wholesaleTermsModal,
#wholesaleLoginModal,
#wholesaleUnlockModal,
#modeSelectorModal {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}
"""

if '/* Permanently disable legacy wholesale T&C' not in css:
    css += '\n' + hide_all_legacy_modals + '\n'
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print('Added CSS rule hiding legacy wholesale modals in style.css')
