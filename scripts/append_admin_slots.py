import os

admin_code = """
/* ===== ADMIN SLOT MANAGEMENT HANDLERS ===== */

function updateSlotToggleBadge() {
  const toggle = document.getElementById('adminSlotToggle');
  const badge = document.getElementById('adminSlotStatusBadge');
  if (toggle && badge) {
    if (toggle.checked) {
      badge.textContent = 'ON (Slots Available)';
      badge.style.background = '#27ae60';
    } else {
      badge.textContent = 'OFF (Unavailable)';
      badge.style.background = '#e74c3c';
    }
  }
}

async function saveSlotSettings() {
  const enabled = document.getElementById('adminSlotToggle').checked;
  const meetLink = document.getElementById('adminMeetLinkInput').value.trim();
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    if (window.db) {
      await window.db.collection('settings').doc('live_slot_settings').set({
        enabled,
        meetLink,
        date: todayStr
      }, { merge: true });
      alert('Slot settings saved successfully!');
    } else {
      alert('Firestore DB connection required to save slot settings.');
    }
  } catch (err) {
    alert('Error saving slot settings: ' + err.message);
  }
}

async function loadSlotPanel() {
  updateSlotToggleBadge();
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    if (window.db) {
      const doc = await window.db.collection('settings').doc('live_slot_settings').get();
      if (doc.exists) {
        const data = doc.data();
        const toggle = document.getElementById('adminSlotToggle');
        const meetInput = document.getElementById('adminMeetLinkInput');
        if (toggle) toggle.checked = !!data.enabled;
        if (meetInput) meetInput.value = data.meetLink || '';
        updateSlotToggleBadge();
      }

      // Load registered bookings for today
      const snap = await window.db.collection('live_slot_bookings')
        .where('date', '==', todayStr)
        .get();

      const tbody = document.getElementById('slotBookingsTbody');
      const countSpan = document.getElementById('slotCountSpan');
      if (countSpan) countSpan.textContent = snap.docs.length;

      if (snap.empty) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#888;">No slots booked yet today.</td></tr>';
        return;
      }

      let rowsHtml = '';
      const meetUrl = document.getElementById('adminMeetLinkInput').value.trim();

      snap.docs.forEach((d, idx) => {
        const b = d.data();
        const cleanPhone = (b.phone || '').replace(/[^0-9]/g, '');
        const waMsg = encodeURIComponent(`Hi ${b.name}! Here is your Google Meet link for today's 8:30 PM VFS Jewels Live Session: ${meetUrl || 'https://meet.google.com'}`);
        const waLink = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${waMsg}`;

        rowsHtml += `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>${b.name || 'Customer'}</strong></td>
            <td>${b.phone || '-'}</td>
            <td>${b.city || '-'}</td>
            <td>
              <a href="${waLink}" target="_blank" class="btn-primary" style="padding:6px 12px; font-size:0.9rem; text-decoration:none; background:#25D366; border-color:#25D366; display:inline-block;">
                📱 Send WA Link
              </a>
            </td>
          </tr>`;
      });

      if (tbody) tbody.innerHTML = rowsHtml;
    }
  } catch (err) {
    console.warn('Error loading slot panel:', err);
  }
}

// Hook into admin tab switcher
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tab="slots"]').forEach(b => {
    b.addEventListener('click', () => {
      loadSlotPanel();
    });
  });
});
"""

with open('admin/admin.js', 'a', encoding='utf-8') as f:
  f.write('\n' + admin_code + '\n')

print('Successfully appended admin slot handlers to admin/admin.js!')
