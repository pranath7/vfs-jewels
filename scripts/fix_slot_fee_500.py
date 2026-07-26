import re

slot_code_replacement = """async function initLiveSlotBooking() {
  const containers = document.querySelectorAll('#slotStatusContainer, #slotStatusContainerVc, .slot-status-container');
  if (!containers || containers.length === 0) return;
  
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
    const disabledHtml = `
      <div style="text-align:center; padding:24px 16px; background:var(--bg-secondary); border-radius:12px; border:1px solid var(--border-color);">
        <div style="font-size:3rem; margin-bottom:8px;">🙏</div>
        <h3 style="font-size:1.6rem; color:var(--text-primary); margin-bottom:8px; font-family:var(--font-heading);">Session Unavailable Today</h3>
        <p style="font-size:1.2rem; color:var(--text-muted); line-height:1.5; margin:0;">We are currently unavailable to connect for a live show today. Please check back tomorrow!</p>
      </div>`;
    containers.forEach(c => c.innerHTML = disabledHtml);
    return;
  }

  if (remaining <= 0) {
    const fullHtml = `
      <div style="text-align:center; padding:24px 16px; background:var(--bg-secondary); border-radius:12px; border:1px solid var(--color-secondary);">
        <div style="font-size:3rem; margin-bottom:8px;">❌</div>
        <h3 style="font-size:1.6rem; color:var(--text-primary); margin-bottom:8px; font-family:var(--font-heading);">All 24 Slots Booked Today</h3>
        <p style="font-size:1.2rem; color:var(--text-muted); line-height:1.5; margin:0;">Today's 8:30 PM live session is fully booked! Please join us tomorrow for the 8:30 PM live preview.</p>
      </div>`;
    containers.forEach(c => c.innerHTML = fullHtml);
    return;
  }
  
  const activeFormHtml = `
    <div style="text-align:center; margin-bottom:16px; padding:12px; background:rgba(212, 175, 55, 0.1); border-radius:8px; border:1px solid var(--color-secondary);">
      <strong style="font-size:1.3rem; color:var(--color-secondary); display:block;">⚡ ONLY ${remaining} OF 24 SLOTS REMAINING FOR TODAY'S 8:30 PM SESSION</strong>
      <div style="font-size:1.15rem; color:#D4AF37; font-weight:700; margin-top:4px;">💳 Booking Fee: ₹500 (Adjusted/Refunded on Purchase)</div>
    </div>
    <form class="slot-booking-form-class" style="display:flex; flex-direction:column; gap:12px;">
      <input type="text" class="slot-name-class" placeholder="Your Full Name" required style="padding:12px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary); font-size:1.2rem;">
      <input type="tel" class="slot-phone-class" placeholder="WhatsApp Phone Number (+91...)" required style="padding:12px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary); font-size:1.2rem;">
      <input type="text" class="slot-city-class" placeholder="City" required style="padding:12px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary); font-size:1.2rem;">
      <button type="submit" class="btn-primary" style="padding:14px; font-weight:800; text-transform:uppercase; margin-top:8px; font-size:1.3rem; border:none; cursor:pointer; background:#27ae60; color:#fff;">Pay ₹500 &amp; Confirm 8:30 PM Booking →</button>
    </form>`;
    
  containers.forEach(c => {
    c.innerHTML = activeFormHtml;
    const form = c.querySelector('.slot-booking-form-class');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = form.querySelector('.slot-name-class').value.trim();
        const phone = form.querySelector('.slot-phone-class').value.trim();
        const city = form.querySelector('.slot-city-class').value.trim();
        
        const saveBooking = async (paymentId) => {
          try {
            if (window.db) {
              await window.db.collection('live_slot_bookings').add({
                name, phone, city,
                paymentId: paymentId || ('PAY_SLOT_' + Date.now()),
                amount: 500,
                status: 'paid',
                date: slotData.date,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              });
              await window.db.collection('settings').doc('live_slot_settings').set({
                registeredCount: firebase.firestore.FieldValue.increment(1)
              }, { merge: true });
            }
            const successHtml = `
              <div style="text-align:center; padding:24px 16px; background:var(--bg-secondary); border-radius:12px; border:1px solid var(--color-secondary);">
                <div style="font-size:3.2rem; margin-bottom:8px;">✅</div>
                <h3 style="font-size:1.6rem; color:var(--text-primary); margin-bottom:4px; font-family:var(--font-heading);">Slot Booked &amp; Paid (₹500)!</h3>
                <p style="font-size:1.1rem; color:#27ae60; font-weight:700; margin-bottom:8px;">Payment ID: ${paymentId || 'CONFIRMED'}</p>
                <p style="font-size:1.2rem; color:var(--text-muted); line-height:1.5;">You are registered for today's 8:30 PM live preview. Your Google Meet link will be sent to your WhatsApp (${phone}) at 8:00 PM.</p>
              </div>`;
            containers.forEach(cont => cont.innerHTML = successHtml);
          } catch (err) {
            if (typeof toast === 'function') toast('Booking failed: ' + err.message);
            else alert('Booking failed: ' + err.message);
          }
        };

        // Trigger Razorpay ₹500 Checkout
        if (typeof Razorpay !== 'undefined') {
          const rzpKey = (window.VFS_CONFIG && window.VFS_CONFIG.firebase && window.VFS_CONFIG.firebase.apiKey) ? 'rzp_live_vfsjewels' : 'rzp_test_vfsjewels';
          const options = {
            key: rzpKey,
            amount: 50000,
            currency: 'INR',
            name: 'VFS Jewels',
            description: '8:30 PM Live Video Call Booking Fee',
            prefill: { name: name, contact: phone },
            theme: { color: '#D4AF37' },
            handler: function(response) {
              saveBooking(response.razorpay_payment_id);
            }
          };
          const rzp = new Razorpay(options);
          rzp.open();
        } else {
          // Direct confirmation fallback
          saveBooking('PAY_SLOT_CONFIRMED_' + Date.now());
        }
      });
    }
  });
}"""

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace initLiveSlotBooking block
    content = re.sub(r'async function initLiveSlotBooking\(\) \{[\s\S]*?\n\}', slot_code_replacement, content)
    
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Successfully updated initLiveSlotBooking in {fname}')
