import re

for fname in ['index.html', 'wholesale.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match brand-story-section block
    pattern_story = r'<!-- BRAND STORY SECTION -->[\s\S]*?</section>\s*'
    match = re.search(pattern_story, content)
    
    if match:
        story_block = match.group(0)
        # Remove story_block from its original position
        content_without_story = content[:match.start()] + content[match.end():]
        
        # Find google-reviews-marquee-section and insert story_block right before it
        target = '<section class="google-reviews-marquee-section">'
        if target in content_without_story:
            new_content = content_without_story.replace(target, story_block + '\n  ' + target)
            with open(fname, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Successfully moved Our Story section right before Google Reviews in {fname}!')
        else:
            print(f'Could not find google-reviews-marquee-section in {fname}')
    else:
        print(f'Could not find BRAND STORY SECTION in {fname}')
