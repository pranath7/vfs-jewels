import os

js_code = """
/* ===== FEATURE EXTENSIONS: THEME, WELCOME MODAL, KEYBOARD NAV, SLOT BOOKING ===== */

function initThemeToggle() {
  const savedTheme = localStorage.getItem('vfs_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  document.querySelectorAll('#themeToggleBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('vfs_theme', next);
      if (typeof toast === 'function') toast(next === 'dark' ? '🌙 Dark Mode Activated' : '☀️ Light Mode Activated');
    });
  });
}

function initWelcomeModeModal() {
  const savedMode = localStorage.getItem('vfs_user_mode');
  const modal = document.getElementById('welcomeModeModal');
  const openBtn = document.getElementById('openModeModal');
  
  if (!savedMode && modal) {
    modal.style.display = 'flex';
  }
  
  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }
  
  const wholesaleBtn = document.getElementById('chooseWholesaleBtn');
  const retailBtn = document.getElementById('chooseRetailBtn');
  
  if (wholesaleBtn) {
    wholesaleBtn.addEventListener('click', () => {
      localStorage.setItem('vfs_user_mode', 'wholesale');
      if (modal) modal.style.display = 'none';
      if (!window.location.pathname.includes('wholesale.html')) {
        window.location.href = 'wholesale.html';
      } else {
        window.location.reload();
      }
    });
  }
  
  if (retailBtn) {
    retailBtn.addEventListener('click', () => {
      localStorage.setItem('vfs_user_mode', 'retail');
      if (modal) modal.style.display = 'none';
      if (window.location.pathname.includes('wholesale.html')) {
        window.location.href = 'index.html';
      }
    });
  }
}

function initKeyboardArrowNav() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const dir = e.key === 'ArrowRight' ? 300 : -300;
      const catScroll = document.getElementById('catScroll');
      if (catScroll) {
        catScroll.scrollBy({ left: dir, behavior: 'smooth' });
      }
    }
  });
}

async function initLiveSlotBooking() {
  const container = document.getElementById('slotStatusContainer');
  if (!container) return;
  
  let slotData = { enabled: false, registeredCount: 0, maxSlots: 24, date: new Date().toISOString().split('T')[0] };
  
  try {
    if (window.db) {
      const doc = await window.db.collection('settings').doc('live_slot_settings').get();
      if (doc.exists) {
        slotData = Object.assign(slotData, doc.data());
      }
    }
  } catch (e) {
    console.warn('Slot settings fetch error:', e);
  }
  
  const remaining = Math.max(0, slotData.maxSlots - (slotData.registeredCount || 0));
  
  if (!slotData.enabled) {
    container.innerHTML = `
      <div style="text-align:center; padding:20px; background:var(--bg-secondary); border-radius:12px; border:1px solid var(--border-color);">
        <div style="font-size:2.5rem; margin-bottom:8px;">🙏</div>
        <h3 style="font-size:1.5rem; color:var(--text-primary); margin-bottom:6px;">Session Unavailable Today</h3>
        <p style="font-size:1.2rem; color:var(--text-muted); line-height:1.5;">We are currently unavailable to connect for a live show today. Please check back tomorrow!</p>
      </div>`;
    return;
  }
  
  container.innerHTML = `
    <div style="text-align:center; margin-bottom:16px; padding:12px; background:var(--color-primary-10); border-radius:8px; border:1px solid var(--color-secondary);">
      <strong style="font-size:1.3rem; color:var(--color-secondary); display:block;">⚡ ONLY ${remaining} OF 24 SLOTS REMAINING FOR TODAY'S 8:30 PM SESSION</strong>
    </div>
    <form id="slotBookingForm" style="display:flex; flex-direction:column; gap:12px;">
      <input type="text" id="slotName" placeholder="Your Full Name" required style="padding:12px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary);">
      <input type="tel" id="slotPhone" placeholder="WhatsApp Phone Number (+91...)" required style="padding:12px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary);">
      <input type="text" id="slotCity" placeholder="City" required style="padding:12px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary);">
      <button type="submit" class="btn-primary" style="padding:14px; font-weight:800; text-transform:uppercase; margin-top:8px;">Confirm 8:30 PM Booking →</button>
    </form>`;
    
  const form = document.getElementById('slotBookingForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('slotName').value.trim();
      const phone = document.getElementById('slotPhone').value.trim();
      const city = document.getElementById('slotCity').value.trim();
      
      try {
        if (window.db) {
          await window.db.collection('live_slot_bookings').add({
            name, phone, city,
            date: slotData.date,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          await window.db.collection('settings').doc('live_slot_settings').set({
            registeredCount: firebase.firestore.FieldValue.increment(1)
          }, { merge: true });
        }
        container.innerHTML = `
          <div style="text-align:center; padding:20px; background:var(--bg-secondary); border-radius:12px; border:1px solid var(--color-secondary);">
            <div style="font-size:3rem; margin-bottom:8px;">✅</div>
            <h3 style="font-size:1.6rem; color:var(--text-primary); margin-bottom:6px;">Slot Booked Successfully!</h3>
            <p style="font-size:1.2rem; color:var(--text-muted); line-height:1.5;">You are registered for today's 8:30 PM live preview. Your Google Meet link will be sent to your WhatsApp (${phone}) at 8:00 PM.</p>
          </div>`;
      } catch (err) {
        if (typeof toast === 'function') toast('Booking failed: ' + err.message);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initWelcomeModeModal();
  initKeyboardArrowNav();
  initLiveSlotBooking();
  
  document.querySelectorAll('.open-slot-modal-btn').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      const slotModal = document.getElementById('slotBookingModal');
      if (slotModal) slotModal.style.display = 'flex';
    });
  });
  const closeSlotBtn = document.getElementById('closeSlotModalBtn');
  if (closeSlotBtn) {
    closeSlotBtn.addEventListener('click', () => {
      const slotModal = document.getElementById('slotBookingModal');
      if (slotModal) slotModal.style.display = 'none';
    });
  }
});
"""

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'a', encoding='utf-8') as f:
        f.write('\n' + js_code + '\n')
    print('Appended features to', fname)
