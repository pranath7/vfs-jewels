import re

clean_sw_block = '''  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js?v=20260729_v2000').then(reg => {
          reg.update();
        }).catch(() => {});
      });
    }
  </script>

  <!-- WELCOME SHOPPING PREFERENCE MODAL -->
  <div class="vfs-modal-overlay" id="welcomeModeModal" style="display:none;">'''

def fix_html_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(
        r'<script>\s*if \(\'serviceWorker\' in navigator\)[\s\S]*?(?=<div class="vfs-modal-content welcome-modal-card")',
        clean_sw_block + '\n    ',
        code
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Fixed unclosed script tag in {file_path}")

fix_html_file('index.html')
fix_html_file('wholesale.html')
