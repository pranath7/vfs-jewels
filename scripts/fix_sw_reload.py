import re

for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove window.location.reload() from service worker listener
    old_sw = """      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });"""

    content = content.replace(old_sw, "// disabled auto reload on SW controllerchange")
    content = content.replace("window.location.reload();", "// disabled reload")

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Disabled service worker auto-reload in', fname)
