import re

for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Clean malformed comments
    content = content.replace(
        '<!-- Reel Embed Iframe will be injected here via app.js?t=1785055961"google-reviews-marquee-section">',
        '<!-- Reel Embed Iframe will be injected here via app.js -->\n      </div>\n    </div>\n  </section>\n\n  <section class="google-reviews-marquee-section">'
    )
    content = content.replace(
        '<!-- Review cards will be dynamically cloned and loaded via app.js?t=1785055961"page-width" style="margin-top: 30px; text-align: center;">',
        '<!-- Review cards will be dynamically cloned and loaded via app.js -->\n      </div>\n    </div>\n    <div class="page-width" style="margin-top: 30px; text-align: center;">'
    )

    # General regex clean up for any app.js or script string inside comments
    content = re.sub(r'<!--(.*?)app\.js\?t=\d+"(.*?)">', r'<!-- \1 -->', content)

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Fixed broken HTML comments in', fname)
