import os

def update_html_modal_onclick(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Add inline onclick to btnGoogleSignIn
    code = code.replace(
        'id="btnGoogleSignIn"',
        'id="btnGoogleSignIn" onclick="window.handleUniversalGoogleSignIn()"'
    )
    code = code.replace(
        'id="royalBtnGoogleSignIn"',
        'id="royalBtnGoogleSignIn" onclick="window.handleUniversalGoogleSignIn()"'
    )

    # Add inline onclick to btnCancelLogin
    code = code.replace(
        'id="btnCancelLogin"',
        'id="btnCancelLogin" onclick="window.closeWholesaleLoginModal()"'
    )
    code = code.replace(
        'id="royalBtnCancelAuth"',
        'id="royalBtnCancelAuth" onclick="window.closeWholesaleLoginModal()"'
    )
    code = code.replace(
        'id="royalBtnCancelTerms"',
        'id="royalBtnCancelTerms" onclick="window.closeWholesaleLoginModal()"'
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"Added inline onclick handlers to {file_path}")

update_html_modal_onclick('index.html')
update_html_modal_onclick('wholesale.html')
