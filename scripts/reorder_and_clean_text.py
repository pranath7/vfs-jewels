import re

def process_file(fname):
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace Jewellery / Jewelry / gift / gifting / handicraft
    content = re.sub(r'\b(Jewellery|Jewelry)\b', 'Imitation Jewels', content, flags=re.IGNORECASE)
    content = re.sub(r'\b(Handicraft|Handcrafted)\b', 'Anti-Tarnish Fine', content, flags=re.IGNORECASE)
    content = re.sub(r'\bMost Gifted\b', 'Bestsellers', content, flags=re.IGNORECASE)
    content = re.sub(r'\bGift Cards?\b', 'Exclusive Collections', content, flags=re.IGNORECASE)

    # 2. Extract sections for reordering
    # Sections: #trust (Promise), #instaReelsSection (Reel), #brand-story & .seo-about-section (Story)
    
    # Check if section tags exist
    trust_match = re.search(r'(<!-- TRUST BADGES / PROMISE -->\s*<section class="trust-section"[^>]*>.*?</section>)', content, re.DOTALL)
    reels_match = re.search(r'(<!-- INSTAGRAM REELS SHOWCASE -->\s*<section class="reels-showcase-section"[^>]*>.*?</section>)', content, re.DOTALL)
    story_match = re.search(r'(<!-- BRAND STORY -->\s*<section class="brand-story-section"[^>]*>.*?</section>)', content, re.DOTALL)
    seo_match = re.search(r'(<!-- SEO ABOUT SECTION -->\s*<section class="seo-about-section"[^>]*>.*?</section>)', content, re.DOTALL)

    if trust_match and reels_match and (story_match or seo_match):
        trust_html = trust_match.group(1)
        reels_html = reels_match.group(1)
        story_html = (story_match.group(1) if story_match else '') + '\n' + (seo_match.group(1) if seo_match else '')

        # Remove original blocks
        content = content.replace(trust_html, '')
        content = content.replace(reels_html, '')
        if story_match: content = content.replace(story_match.group(1), '')
        if seo_match: content = content.replace(seo_match.group(1), '')

        # Construct new ordered block
        ordered_block = f"\n\n<!-- 1. OUR PROMISE -->\n{trust_html}\n\n<!-- 2. INSTAGRAM REELS SHOWCASE -->\n{reels_html}\n\n<!-- 3. OUR STORY -->\n{story_html}\n\n"

        # Place right after products section
        prod_end = content.find('</section>', content.find('id="products"'))
        if prod_end != -1:
            prod_end_idx = prod_end + len('</section>')
            content = content[:prod_end_idx] + ordered_block + content[prod_end_idx:]

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print('Processed and reordered sections in', fname)

process_file('index.html')
process_file('wholesale.html')
