import re

bind_fn = """/* ===== GUARANTEED WHOLESALE T&C MODAL HANDLERS ===== */
function bindWholesaleTermsModal() {
  const termsCheckbox = document.getElementById('agreeWholesaleTerms');
  const acceptTermsBtn = document.getElementById('btnAcceptTerms');
  const cancelTermsBtn = document.getElementById('btnCancelTerms');
  const termsModal = document.getElementById('wholesaleTermsModal');
  const loginModal = document.getElementById('wholesaleLoginModal');
  const welcomeModal = document.getElementById('welcomeModeModal');

  if (termsCheckbox && acceptTermsBtn) {
    termsCheckbox.onchange = () => {
      if (termsCheckbox.checked) {
        acceptTermsBtn.removeAttribute('disabled');
        acceptTermsBtn.disabled = false;
        acceptTermsBtn.style.opacity = '1';
        acceptTermsBtn.style.cursor = 'pointer';
        acceptTermsBtn.style.background = '#D4AF37';
        acceptTermsBtn.style.color = '#121212';
      } else {
        acceptTermsBtn.setAttribute('disabled', 'true');
        acceptTermsBtn.disabled = true;
        acceptTermsBtn.style.opacity = '0.6';
        acceptTermsBtn.style.cursor = 'not-allowed';
        acceptTermsBtn.style.background = '#121212';
        acceptTermsBtn.style.color = '#D4AF37';
      }
    };

    acceptTermsBtn.onclick = (e) => {
      e.preventDefault();
      if (!termsCheckbox.checked) return;
      if (termsModal) {
        termsModal.classList.remove('active');
        termsModal.style.display = 'none';
      }
      if (loginModal) {
        const phoneStep = document.getElementById('loginStepPhone');
        const otpStep = document.getElementById('loginStepOTP');
        const regStep = document.getElementById('loginStepRegister');
        if (phoneStep) phoneStep.style.display = 'block';
        if (otpStep) otpStep.style.display = 'none';
        if (regStep) regStep.style.display = 'none';
        loginModal.classList.add('active');
        loginModal.style.display = 'flex';
      } else {
        if (typeof openWholesaleLoginModal === 'function') openWholesaleLoginModal();
      }
    };
  }

  if (cancelTermsBtn) {
    cancelTermsBtn.onclick = (e) => {
      e.preventDefault();
      if (termsModal) {
        termsModal.classList.remove('active');
        termsModal.style.display = 'none';
      }
      if (welcomeModal) {
        welcomeModal.style.display = 'flex';
      }
    };
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindWholesaleTermsModal);
} else {
  bindWholesaleTermsModal();
}
"""

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # Append bind_fn at end of file if not already present
    if 'bindWholesaleTermsModal' not in content:
        content += '\n\n' + bind_fn
        print(f'Appended bindWholesaleTermsModal to {fname}')

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Successfully updated {fname}!')
