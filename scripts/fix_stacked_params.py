import re, time

ts = str(int(time.time()))

for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    fixed_lines = []
    for line in lines:
        # Only replace app.js/style.css/wholesale.js in actual src= or href= attributes, NOT in comments
        if '<!--' in line:
            # This is a comment line - fix any corrupted app.js references back to plain text
            line = re.sub(r'app\.js\?[^">\s]+', 'app.js', line)
            line = re.sub(r'style\.css\?[^">\s]+', 'style.css', line)
            line = re.sub(r'wholesale\.js\?[^">\s]+', 'wholesale.js', line)
            line = re.sub(r'sw\.js\?[^">\s]+', 'sw.js', line)
        fixed_lines.append(line)

    content = ''.join(fixed_lines)

    # Now fix the specific broken comment patterns
    content = content.replace(
        '<!-- Reel Embed Iframe will be injected here via app.js"google-reviews-marquee-section">',
        '<!-- Reel Embed Iframe will be injected here via app.js -->\n      </div>\n    </div>\n  </section>\n\n  <section class="google-reviews-marquee-section">'
    )
    content = content.replace(
        '<!-- Review cards will be dynamically cloned and loaded via app.js"page-width" style="margin-top: 30px; text-align: center;">',
        '<!-- Review cards will be dynamically cloned and loaded via app.js -->\n      </div>\n    </div>\n    <div class="page-width" style="margin-top: 30px; text-align: center;">'
    )
    content = content.replace(
        '<!-- Loaded dynamically in app.js"https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"',
        '<!-- Loaded dynamically in app.js -->\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"'
    )

    # Now set clean single-query cache busting ONLY on actual script/link tags
    content = re.sub(r'(src="app\.js)(\?[^"]*)?(")', f'\\1?t={ts}\\3', content)
    content = re.sub(r'(href="style\.css)(\?[^"]*)?(")', f'\\1?t={ts}\\3', content)
    content = re.sub(r'(src="wholesale\.js)(\?[^"]*)?(")', f'\\1?t={ts}\\3', content)
    content = re.sub(r'(src="sw\.js)(\?[^"]*)?(")', f'\\1?t={ts}\\3', content)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Properly fixed all asset URLs and HTML comments in {fname}')
