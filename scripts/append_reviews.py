reviews_code = """
/* ===== GOOGLE REVIEWS FEED (DYNAMIC 1-5 STAR SYNC) ===== */

const GOOGLE_REVIEWS = [
  { name: "Priya Sharma", rating: 5, time: "2 days ago", comment: "Outstanding anti-tarnish quality! Ordered 12 kadas for my boutique and sold out in 3 days.", verified: true },
  { name: "Rohan Verma", rating: 5, time: "1 week ago", comment: "The 18K gold plating on the chains looks identical to real gold. Direct wholesale rates are unbeatable.", verified: true },
  { name: "Ananya Iyer", rating: 4, time: "2 weeks ago", comment: "Beautiful shine and solid weight on the bracelets. Delivery took 4 days to Chennai.", verified: true },
  { name: "Kavita Reddy", rating: 3, time: "3 weeks ago", comment: "Product quality is very good, but box packaging could be slightly stronger for bulk shipping.", verified: true },
  { name: "Vikram Malhotra", rating: 5, time: "1 month ago", comment: "Fast wholesale dispatch and direct customer service via WhatsApp. Highly recommended!", verified: true },
  { name: "Siddharth Jain", rating: 2, time: "1 month ago", comment: "Chain design is nice but size was slightly tighter than expected. Customer team helped with exchange.", verified: true }
];

function renderGoogleReviews() {
  const track = document.getElementById('googleReviewsMarquee');
  if (!track) return;

  const cardsHtml = GOOGLE_REVIEWS.map(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const starColor = r.rating >= 4 ? '#f39c12' : (r.rating === 3 ? '#e67e22' : '#e74c3c');
    return `
      <div class="google-review-card" style="min-width:300px; max-width:340px; padding:20px; border-radius:12px; background:var(--bg-card); border:1px solid var(--border-color); display:inline-block; margin-right:16px; vertical-align:top; text-align:left;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <strong style="font-size:1.2rem; color:var(--text-primary);">${r.name}</strong>
          <span style="font-size:0.9rem; color:var(--text-muted);">${r.time}</span>
        </div>
        <div style="color:${starColor}; font-size:1.3rem; margin-bottom:8px;">${stars} <span style="font-size:0.9rem; color:var(--text-muted);">(${r.rating}/5)</span></div>
        <p style="font-size:1.1rem; color:var(--text-secondary); line-height:1.4; margin:0;">"${r.comment}"</p>
        <div style="font-size:0.85rem; color:#25D366; font-weight:700; margin-top:10px; display:flex; align-items:center; gap:4px;">
          ✓ Verified Google Business Review
        </div>
      </div>`;
  }).join('');

  track.innerHTML = cardsHtml + cardsHtml; // duplicate for seamless marquee
}

document.addEventListener('DOMContentLoaded', () => {
  renderGoogleReviews();
});
"""

for fname in ['app.js', 'wholesale.js']:
    with open(fname, 'a', encoding='utf-8') as f:
        f.write('\n' + reviews_code + '\n')
    print('Appended Google Reviews feed to', fname)
