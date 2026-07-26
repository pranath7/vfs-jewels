import re

clean_fn = """function initWelcomeModeModal() {
  const savedMode = localStorage.getItem('vfs_user_mode');
  const sessionShown = sessionStorage.getItem('vfs_welcome_session_shown');
  const modal = document.getElementById('welcomeModeModal');
  const openBtn = document.getElementById('openModeModal');
  
  if ((!savedMode || !sessionShown) && modal) {
    modal.style.display = 'flex';
  }
  
  if (openBtn && modal) {
    openBtn.onclick = (e) => {
      e.preventDefault();
      modal.style.display = 'flex';
    };
  }
  
  const wholesaleBtn = document.getElementById('chooseWholesaleBtn');
  const retailBtn = document.getElementById('chooseRetailBtn');
  
  if (wholesaleBtn) {
    wholesaleBtn.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.style.display = 'none';
      openWholesaleFunnel();
    };
  }
  
  if (retailBtn) {
    retailBtn.onclick = (e) => {
      e.preventDefault();
      if (modal) modal.style.display = 'none';
      switchModeSeamlessly('retail');
    };
  }
}"""

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all occurrences of function initWelcomeModeModal() { ... }
    # Replace all with empty except keep only 1 clean copy
    pattern = r'function initWelcomeModeModal\(\) \{[\s\S]*?\n\}'
    matches = list(re.finditer(pattern, content))
    print(f'{fname}: found {len(matches)} initWelcomeModeModal functions')

    if len(matches) > 0:
        # Replace first match with clean_fn and remove all subsequent matches
        first_start = matches[0].start()
        first_end = matches[0].end()
        
        # Build new content
        new_content = content[:first_start] + clean_fn
        last_end = first_end
        
        for m in matches[1:]:
            new_content += content[last_end:m.start()]
            last_end = m.end()
            
        new_content += content[last_end:]
        
        with open(fname, 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print(f'Successfully updated {fname} with single clean initWelcomeModeModal() function!')
