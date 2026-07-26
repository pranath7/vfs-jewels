import re

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Restore acceptTermsBtn click: opens wholesaleLoginModal
    old_accept_terms = """  if (acceptTermsBtn && termsCheckbox && wholesaleTermsModal && wholesaleLoginModal) {
    acceptTermsBtn.addEventListener('click', () => {
      if (!termsCheckbox.checked) return;
      wholesaleTermsModal.classList.remove('active');
      if ($('#loginStepPhone')) $('#loginStepPhone').style.display = 'block';
      if ($('#loginStepOTP')) $('#loginStepOTP').style.display = 'none';
      if ($('#loginStepRegister')) $('#loginStepRegister').style.display = 'none';
      if ($('#wholesalePhoneInput')) $('#wholesalePhoneInput').value = '';
      if ($('#wholesaleOtpInput')) $('#wholesaleOtpInput').value = '';
      // disabled modal auto-popup;
    });
  }"""

    new_accept_terms = """  if (acceptTermsBtn && termsCheckbox && wholesaleTermsModal && wholesaleLoginModal) {
    acceptTermsBtn.addEventListener('click', () => {
      if (!termsCheckbox.checked) return;
      wholesaleTermsModal.classList.remove('active');
      if ($('#loginStepPhone')) $('#loginStepPhone').style.display = 'block';
      if ($('#loginStepOTP')) $('#loginStepOTP').style.display = 'none';
      if ($('#loginStepRegister')) $('#loginStepRegister').style.display = 'none';
      if ($('#wholesalePhoneInput')) $('#wholesalePhoneInput').value = '';
      if ($('#wholesaleOtpInput')) $('#wholesaleOtpInput').value = '';
      wholesaleLoginModal.classList.add('active');
    });
  }"""

    if old_accept_terms in content:
        content = content.replace(old_accept_terms, new_accept_terms)
        print(f'Restored acceptTermsBtn transition in {fname}')
    else:
        # Regex replacement if exact whitespace differs
        pattern_terms = r"(acceptTermsBtn\.addEventListener\('click',\s*\(\)\s*=>\s*\{[\s\S]*?wholesaleTermsModal\.classList\.remove\('active'\);[\s\S]*?)\/\/ disabled modal auto-popup;"
        content = re.sub(pattern_terms, r"\1wholesaleLoginModal.classList.add('active');", content)
        print(f'Regex restored acceptTermsBtn in {fname}')

    # 2. Restore Google Sign In redirect to unlock modal
    content = content.replace(
        "if (!wholesaleUnlocked) {\n          // disabled modal auto-popup;\n        }",
        "if (!wholesaleUnlocked) {\n          openWholesaleUnlockModal();\n        }"
    )

    # 3. Restore OTP Verify redirect to unlock modal
    content = content.replace(
        "if (!wholesaleUnlocked) {\n          // disabled modal auto-popup;\n        }",
        "if (!wholesaleUnlocked) {\n          openWholesaleUnlockModal();\n        }"
    )

    # 4. Restore Registration redirect to unlock modal
    content = content.replace(
        "// disabled modal auto-popup;\n    toast('Registration completed!');",
        "openWholesaleUnlockModal();\n    toast('Registration completed!');"
    )

    # 5. Restore openWholesaleUnlockModal helper
    content = content.replace(
        "// disabled modal auto-popup;\n  }\n\n  const btnCancelUnlock",
        "wholesaleUnlockModal.classList.add('active');\n  }\n\n  const btnCancelUnlock"
    )

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Successfully restored all Wholesale Membership Funnel transitions in {fname}!')
