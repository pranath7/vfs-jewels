/* =========================================================
   VFS Jewellery — App Logic
   ========================================================= */

// ── Product Data ──
const PRODUCTS = [
  { id: 1, name: 'Celestial Halo Ring', cat: 'rings', meta: 'Gold Plated', price: 899, mrp: 1799, img: 'assets/rings.webp', rating: 4.8, reviews: 312, badge: 'Bestseller' },
  { id: 2, name: 'Aurora Drop Earrings', cat: 'earrings', meta: 'CZ Crystal', price: 749, mrp: 1499, img: 'assets/earrings.webp', rating: 4.7, reviews: 287, badge: 'New' },
  { id: 3, name: 'Eternal Love Pendant', cat: 'necklaces', meta: 'Gold Plated', price: 1199, mrp: 2399, img: 'assets/necklaces.webp', rating: 4.9, reviews: 456, badge: 'Most Gifted' },
  { id: 4, name: 'Twisted Rope Bracelet', cat: 'bracelets', meta: 'Rose Gold', price: 649, mrp: 1299, img: 'assets/bracelets.webp', rating: 4.6, reviews: 198, badge: '' },
  { id: 5, name: 'CZ Solitaire Studs', cat: 'earrings', meta: 'Gold Plated', price: 599, mrp: 1199, img: 'assets/earrings.webp', rating: 4.9, reviews: 524, badge: 'Bestseller' },
  { id: 6, name: 'Infinity Band Ring', cat: 'rings', meta: 'Rose Gold', price: 799, mrp: 1599, img: 'assets/rings.webp', rating: 4.5, reviews: 176, badge: '' },
  { id: 7, name: 'Pearl Chain Necklace', cat: 'necklaces', meta: 'Gold Plated', price: 1399, mrp: 2799, img: 'assets/necklaces.webp', rating: 4.8, reviews: 389, badge: 'Trending' },
  { id: 8, name: 'Charm Link Bracelet', cat: 'bracelets', meta: 'Gold Plated', price: 849, mrp: 1699, img: 'assets/bracelets.webp', rating: 4.7, reviews: 243, badge: 'New' },
  { id: 9, name: 'Diamond Cut Hoops', cat: 'earrings', meta: 'CZ Crystal', price: 699, mrp: 1399, img: 'assets/earrings.webp', rating: 4.6, reviews: 167, badge: '' },
  { id: 10, name: 'Floral Statement Ring', cat: 'rings', meta: 'Oxidised', price: 549, mrp: 1099, img: 'assets/rings.webp', rating: 4.4, reviews: 134, badge: '' },
  { id: 11, name: 'Layered Chain Set', cat: 'necklaces', meta: 'Gold Plated', price: 1599, mrp: 3199, img: 'assets/necklaces.webp', rating: 4.9, reviews: 412, badge: 'Most Gifted' },
  { id: 12, name: 'Tennis Bracelet CZ', cat: 'bracelets', meta: 'Rose Gold', price: 1099, mrp: 2199, img: 'assets/bracelets.webp', rating: 4.8, reviews: 298, badge: 'Trending' },
];

// ── Cloud Persistence & File Upload wrappers ──
window.VFS_CLOUD_ACTIVE = false;
window.VFS_CONFIG = {
  firebase: null,
  cloudinary: null
};
window.VFS_PRODUCTS_CACHE = [];

// Initialize Cloud configuration from public vfs-config.json
async function initCloudConfig() {
  try {
    const res = await fetch('vfs-config.json');
    if (res.ok) {
      const config = await res.json();
      if (config.firebase && config.firebase.apiKey && !config.firebase.apiKey.startsWith("YOUR_")) {
        window.VFS_CONFIG = config;
        firebase.initializeApp(config.firebase);
        window.db = firebase.firestore();
        window.VFS_CLOUD_ACTIVE = true;
        console.log("🔥 VFS Cloud: Connected to Firebase Firestore.");
        
        // Sync catalog from Firestore
        const dbProducts = await window.VFS_DB.getProducts();
        if (dbProducts && dbProducts.length > 0) {
          window.VFS_PRODUCTS_CACHE = dbProducts;
          renderProducts(null);
        }
      }
    }
  } catch (e) {
    console.warn("⚠️ VFS Cloud: Falling back to localStorage mode.", e);
  }
}

// Call config initialization asynchronously
initCloudConfig();

window.uploadToCloudinary = async function(file) {
  if (!window.VFS_CONFIG.cloudinary || !window.VFS_CONFIG.cloudinary.cloudName || window.VFS_CONFIG.cloudinary.cloudName.startsWith("YOUR_")) {
    throw new Error("Cloudinary not configured");
  }
  const cloudName = window.VFS_CONFIG.cloudinary.cloudName;
  const preset = window.VFS_CONFIG.cloudinary.uploadPreset;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', preset);
  
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Upload failed");
  }
  const data = await res.json();
  return data.secure_url;
};

window.VFS_DB = {
  // ── Orders ──
  getOrders: async function() {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const snap = await window.db.collection('orders').get();
        const orders = [];
        snap.forEach(doc => {
          orders.push(doc.data());
        });
        return orders;
      } catch(e) {
        console.error("Firestore read error:", e);
      }
    }
    const local = localStorage.getItem('vfs_orders');
    return local ? JSON.parse(local) : [];
  },
  
  saveOrder: async function(order) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('orders').doc(order.id).set(order);
        return;
      } catch(e) {
        console.error("Firestore write error:", e);
      }
    }
    const local = localStorage.getItem('vfs_orders');
    let list = local ? JSON.parse(local) : [];
    list.push(order);
    localStorage.setItem('vfs_orders', JSON.stringify(list));
  },

  updateOrder: async function(orderId, updates) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('orders').doc(orderId).update(updates);
        return;
      } catch(e) {
        console.error("Firestore update error:", e);
      }
    }
    const local = localStorage.getItem('vfs_orders');
    if (local) {
      const list = JSON.parse(local);
      const idx = list.findIndex(o => o.id === orderId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem('vfs_orders', JSON.stringify(list));
      }
    }
  },

  // ── Returns ──
  getReturns: async function() {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const snap = await window.db.collection('returns').get();
        const returns = [];
        snap.forEach(doc => {
          returns.push(doc.data());
        });
        return returns;
      } catch(e) {
        console.error("Firestore read error:", e);
      }
    }
    const local = localStorage.getItem('vfs_returns');
    return local ? JSON.parse(local) : [];
  },

  saveReturn: async function(retObj) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('returns').doc(retObj.id).set(retObj);
        return;
      } catch(e) {
        console.error("Firestore write error:", e);
      }
    }
    const local = localStorage.getItem('vfs_returns');
    let list = local ? JSON.parse(local) : [];
    list.push(retObj);
    localStorage.setItem('vfs_returns', JSON.stringify(list));
  },

  // ── Wallet Credits ──
  getWalletCredits: async function() {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const snap = await window.db.collection('wallet_credits').get();
        const credits = {};
        snap.forEach(doc => {
          credits[doc.id] = doc.data().balance || 0;
        });
        return credits;
      } catch(e) {
        console.error("Firestore read error:", e);
      }
    }
    const local = localStorage.getItem('vfs_customer_credits');
    return local ? JSON.parse(local) : {};
  },

  getCustomerWalletBalance: async function(phone) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const doc = await window.db.collection('wallet_credits').doc(phone).get();
        if (doc.exists) {
          return doc.data().balance || 0;
        }
        return 0;
      } catch(e) {
        console.error("Firestore read error:", e);
      }
    }
    const local = localStorage.getItem('vfs_customer_credits');
    let credits = local ? JSON.parse(local) : {};
    return credits[phone] || 0;
  },

  saveWalletBalance: async function(phone, balance) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('wallet_credits').doc(phone).set({ balance: balance });
        return;
      } catch(e) {
        console.error("Firestore write error:", e);
      }
    }
    const local = localStorage.getItem('vfs_customer_credits');
    let credits = local ? JSON.parse(local) : {};
    credits[phone] = balance;
    localStorage.setItem('vfs_customer_credits', JSON.stringify(credits));
  },

  // ── Catalog Products ──
  getProducts: async function() {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const snap = await window.db.collection('products').get();
        const products = [];
        snap.forEach(doc => {
          products.push(doc.data());
        });
        if (products.length > 0) return products;
      } catch(e) {
        console.error("Firestore read products error:", e);
      }
    }
    const local = localStorage.getItem('vfs_custom_products');
    return local ? JSON.parse(local) : null;
  }
};

function getFullCatalog() {
  if (window.VFS_PRODUCTS_CACHE && window.VFS_PRODUCTS_CACHE.length > 0) {
    return window.VFS_PRODUCTS_CACHE;
  }
  const stored = localStorage.getItem('vfs_products');
  let defaults = [];
  if (stored) {
    try { defaults = JSON.parse(stored); } catch(e) {}
  }
  if (!defaults.length) {
    defaults = PRODUCTS.map((p, idx) => ({
      ...p,
      sku: p.sku || `SN-${String(idx + 1).padStart(4, '0')}`
    }));
    localStorage.setItem('vfs_products', JSON.stringify(defaults));
  }
  window.VFS_PRODUCTS_CACHE = defaults;
  return defaults;
}

const CATEGORY_BANNERS = {
  rings: { title: "Rings Collection", desc: "18K Gold Plated stackable bands and statement rings.", img: "assets/rings.webp" },
  earrings: { title: "Earrings & Studs", desc: "A++ Austrian crystals that catch light beautifully.", img: "assets/earrings.webp" },
  necklaces: { title: "Necklaces & Pendants", desc: "Elegant chains and pendants designed for layering.", img: "assets/necklaces.webp" },
  bracelets: { title: "Bracelets & Bands", desc: "Dainty rope chains and classic tennis bracelets.", img: "assets/bracelets.webp" },
  mangalsutra: { title: "Mangalsutra Edit", desc: "Traditional symbols crafted in modern luxury shapes.", img: "assets/necklaces.webp" },
  anklets: { title: "Anklets & Toe Rings", desc: "Elegant daily-wear charms for your feet.", img: "assets/bracelets.webp" }
};

const TESTIMONIALS = [
  { name: 'Priya M.', text: 'The quality is amazing for this price! My friends thought it was real gold. The anti-tarnish coating really works — been wearing it daily for 3 months.', stars: 5 },
  { name: 'Ananya S.', text: 'Ordered the pendant set as a gift for my mom. The packaging was so premium, she was thrilled! The CZ stones genuinely sparkle.', stars: 5 },
  { name: 'Riya K.', text: 'Best imitation jewellery brand I\'ve found. No skin irritation, gorgeous designs, and delivery was super fast. Already ordered my 4th piece!', stars: 5 },
  { name: 'Sneha P.', text: 'The halo ring looks exactly like the ones I saw at Tanishq but at a fraction of the cost. VFS has earned a loyal customer.', stars: 4 },
  { name: 'Kavya D.', text: 'I was skeptical about online jewellery but VFS exceeded expectations. The gold plating is thick and the weight feels premium.', stars: 5 },
  { name: 'Meera R.', text: 'Bought couple rings for our anniversary. Perfect fit, beautiful finish, and the gift box made it extra special. Highly recommend!', stars: 5 },
];

// ── State ──
let cart = [];
try {
  const storedCart = localStorage.getItem('vfs_cart');
  cart = storedCart ? JSON.parse(storedCart) : [];
  if (!Array.isArray(cart)) cart = [];
} catch (e) {
  cart = [];
}

let wishlist = [];
try {
  const storedWl = localStorage.getItem('vfs_wl');
  wishlist = storedWl ? JSON.parse(storedWl) : [];
  if (!Array.isArray(wishlist)) wishlist = [];
} catch (e) {
  wishlist = [];
}

// ── Helpers ──
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const fmt = (n) => '₹' + n.toLocaleString('en-IN');
const pct = (price, mrp) => Math.round(((mrp - price) / mrp) * 100);
const stars = (r) => '★'.repeat(Math.floor(r)) + (r % 1 >= 0.5 ? '½' : '');

function saveState() {
  localStorage.setItem('vfs_cart', JSON.stringify(cart));
  localStorage.setItem('vfs_wl', JSON.stringify(wishlist));
}

// ── Toast ──
function toast(msg) {
  const box = $('#toastBox');
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>${msg}`;
  box.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2800);
}

// ── Announcement Bar Rotation ──
(function initAnnouncement() {
  const slides = $$('#annSlider .announcement-slide');
  if (slides.length < 2) return;
  let idx = 0;
  setInterval(() => {
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
  }, 3000);
})();

// ── Sticky Header Shadow ──
window.addEventListener('scroll', () => {
  $('#siteHeader').classList.toggle('scrolled', window.scrollY > 10);
});

// ── Hero Slider ──
(function initHero() {
  const slides = $$('#heroSlider .hero-slide');
  const dotsContainer = $('#heroDots');
  if (!slides.length) return;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goSlide(i));
    dotsContainer.appendChild(dot);
  });

  let cur = 0;
  function goSlide(n) {
    slides[cur].classList.remove('active');
    dotsContainer.children[cur].classList.remove('active');
    cur = n;
    slides[cur].classList.add('active');
    dotsContainer.children[cur].classList.add('active');
  }

  setInterval(() => goSlide((cur + 1) % slides.length), 5000);
})();

// ── Render Product Grid (Horizontal Scrolling Categories) ──
function renderProducts(filter) {
  const container = $('#categoryTracksContainer');
  if (!container) return;
  container.innerHTML = "";

  const fullCatalog = getFullCatalog();
  
  let categories = [];
  if (filter && filter !== 'all') {
    categories = [filter];
  } else {
    // Extract unique categories present in the catalog dynamically
    const uniqueCats = new Set(fullCatalog.map(p => p.cat).filter(Boolean));
    categories = Array.from(uniqueCats);
    
    // Sort standard ones first
    const standardOrder = ['rings', 'earrings', 'necklaces', 'bracelets', 'mangalsutra', 'anklets'];
    categories.sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  categories.forEach(cat => {
    const list = fullCatalog.filter(p => p.cat === cat);
    if (list.length === 0) return;

    const bannerInfo = CATEGORY_BANNERS[cat] || { 
      title: cat.charAt(0).toUpperCase() + cat.slice(1) + " Collection", 
      desc: "Premium handcrafted VFS creations.", 
      img: "assets/hero_banner.webp" 
    };

    const trackHtml = `
      <div class="category-track-row" data-category="${cat}">
        <!-- Category Banner -->
        <div class="category-banner" style="background-image: url('${bannerInfo.img}')">
          <div class="category-banner-overlay">
            <h2>${bannerInfo.title}</h2>
            <p>${bannerInfo.desc}</p>
          </div>
        </div>
        
        <!-- Horizontal Scroll Row -->
        <div class="product-row-scroll" id="scrollRow_${cat}">
          ${list.map(p => {
            const isWL = wishlist.includes(p.id);
            const isDiscounted = p.mrp && p.mrp > p.price;
            const off = isDiscounted ? pct(p.price, p.mrp) : 0;
            return `
              <div class="p-card" data-id="${p.id}">
                ${p.badge ? `<span class="p-badge${p.badge === 'Sale' ? ' sale' : ''}">${p.badge}</span>` : ''}
                <button class="p-wish${isWL ? ' active' : ''}" data-wl="${p.id}" aria-label="Wishlist">
                  <svg viewBox="0 0 24 24" fill="${isWL ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
                </button>
                <div class="p-img">
                  <img src="${p.img}" alt="${p.name}" loading="lazy">
                  <div class="p-quick" data-add="${p.id}">Add to Cart</div>
                </div>
                <div class="p-info">
                  <div class="p-meta">${p.meta}</div>
                  <div class="p-name">${p.name}</div>
                  <div class="p-rating"><span class="stars">${stars(p.rating)}</span><span class="count">(${p.reviews})</span></div>
                  <div class="p-prices">
                    <span class="price-now">${fmt(p.price)}</span>
                    ${isDiscounted ? `
                      <span class="price-was">${fmt(p.mrp)}</span>
                      <span class="price-off">${off}% OFF</span>
                    ` : ''}
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', trackHtml);
  });

  // Attach action event listeners to both wishlists, quick adds, and pdp modal triggers
  container.querySelectorAll('[data-wl]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = +btn.dataset.wl;
      if (wishlist.includes(id)) {
        wishlist = wishlist.filter(x => x !== id);
        toast('Removed from wishlist');
      } else {
        wishlist.push(id);
        toast('Added to wishlist ♡');
      }
      saveState();
      updateCounts();
      renderProducts(currentFilter);
    });
  });

  container.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(+btn.dataset.add);
    });
  });

  container.querySelectorAll('.p-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = +card.dataset.id;
      openPDP(id);
    });
  });
}

let currentFilter = null;

// ── Category Click ──
$$('.cat-item').forEach(el => {
  el.addEventListener('click', () => {
    currentFilter = el.dataset.cat;
    renderProducts(currentFilter);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });
});

// Mega menu filter links
$$('.mega-menu a[data-filter]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    currentFilter = a.dataset.filter;
    renderProducts(currentFilter);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });
});

// ── Cart Logic ──
function addToCart(id, qty = 1) {
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, qty });
  }
  saveState();
  updateCounts();
  renderCart();
  openDrawer('cart');
  toast('Added to cart ✓');
}

function renderCart() {
  const body = $('#cartBody');
  const foot = $('#cartFoot');

  if (!cart.length) {
    body.innerHTML = `<div class="dw-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><p>Your cart is empty</p></div>`;
    foot.style.display = 'none';
    return;
  }

  foot.style.display = '';
  let total = 0;
  const fullCatalog = getFullCatalog();

  body.innerHTML = cart.map(ci => {
    const p = fullCatalog.find(x => x.id === ci.id);
    if (!p) return '';
    total += p.price * ci.qty;
    return `
      <div class="dw-item" data-id="${p.id}">
        <img class="dw-item-img dw-pdp-link" src="${p.img}" alt="${p.name}" style="cursor:pointer">
        <div>
          <div class="dw-item-meta">${p.meta}</div>
          <div class="dw-item-name dw-pdp-link" style="cursor:pointer">${p.name}</div>
          <div class="dw-item-price">${fmt(p.price)}</div>
          <div class="qty-ctrl">
            <button data-qty="${p.id}" data-d="-1">−</button>
            <span>${ci.qty}</span>
            <button data-qty="${p.id}" data-d="1">+</button>
          </div>
        </div>
        <button class="dw-rm" data-rm="${p.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>`;
  }).join('');

  $('#cartTotal').textContent = fmt(total);

  // Qty buttons
  body.querySelectorAll('[data-qty]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = +btn.dataset.qty;
      const d = +btn.dataset.d;
      const ci = cart.find(c => c.id === id);
      if (ci) {
        ci.qty += d;
        if (ci.qty < 1) cart = cart.filter(c => c.id !== id);
      }
      saveState();
      updateCounts();
      renderCart();
    });
  });

  // Remove buttons
  body.querySelectorAll('[data-rm]').forEach(btn => {
    btn.addEventListener('click', () => {
      cart = cart.filter(c => c.id !== +btn.dataset.rm);
      saveState();
      updateCounts();
      renderCart();
      toast('Item removed');
    });
  });

  // PDP links click
  body.querySelectorAll('.dw-pdp-link').forEach(el => {
    el.addEventListener('click', () => {
      const id = +el.closest('.dw-item').dataset.id;
      if (id === 99) return; // ignore gift wrap item
      closeDrawer('cart');
      openPDP(id);
    });
  });
}

// ── Wishlist Drawer ──
function renderWishlist() {
  const body = $('#wlBody');
  if (!wishlist.length) {
    body.innerHTML = `<div class="dw-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg><p>Your wishlist is empty</p></div>`;
    return;
  }

  const fullCatalog = getFullCatalog();
  body.innerHTML = wishlist.map(id => {
    const p = fullCatalog.find(x => x.id === id);
    if (!p) return '';
    return `
      <div class="dw-item" data-id="${p.id}">
        <img class="dw-item-img dw-pdp-link" src="${p.img}" alt="${p.name}" style="cursor:pointer">
        <div>
          <div class="dw-item-meta">${p.meta}</div>
          <div class="dw-item-name dw-pdp-link" style="cursor:pointer">${p.name}</div>
          <div class="dw-item-price">${fmt(p.price)} <span class="price-was" style="font-weight:400">${fmt(p.mrp)}</span></div>
          <button style="margin-top:6px;padding:6px 16px;background:#121212;color:#D4AF37;border-radius:4px;font-size:1.1rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em" data-wl-add="${p.id}">Add to Cart</button>
        </div>
        <button class="dw-rm" data-wl-rm="${p.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </div>`;
  }).join('');

  body.querySelectorAll('[data-wl-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart(+btn.dataset.wlAdd);
    });
  });

  body.querySelectorAll('[data-wl-rm]').forEach(btn => {
    btn.addEventListener('click', () => {
      wishlist = wishlist.filter(x => x !== +btn.dataset.wlRm);
      saveState();
      updateCounts();
      renderWishlist();
      renderProducts(currentFilter);
      toast('Removed from wishlist');
    });
  });

  // PDP links click
  body.querySelectorAll('.dw-pdp-link').forEach(el => {
    el.addEventListener('click', () => {
      const id = +el.closest('.dw-item').dataset.id;
      closeDrawer('wl');
      openPDP(id);
    });
  });
}

// ── Testimonials ──
// ── Google Reviews Auto-Scroll Marquee ──
function renderTestimonials() {
  const container = $('#googleReviewsMarquee');
  if (!container) return;
  
  // Duplicate list to achieve continuous infinite scroll loop
  const list = [...TESTIMONIALS, ...TESTIMONIALS];
  container.innerHTML = list.map(t => `
    <div class="review-marquee-card">
      <div class="rev-card-head">
        <span class="rev-card-name">${t.name}</span>
        <span class="rev-card-badge">Verified Buyer</span>
      </div>
      <div class="rev-card-stars">★★★★★</div>
      <div class="rev-card-text">"${t.text}"</div>
    </div>`).join('');
}

// ── Update Badge Counts ──
function updateCounts() {
  const cCount = cart.reduce((s, c) => s + c.qty, 0);
  $('#cartCount').textContent = cCount;
  $('#cartCT').textContent = cCount;
  $('#wlCount').textContent = wishlist.length;
  $('#wlCT').textContent = wishlist.length;
}

// ── Drawer Open/Close ──
function openDrawer(type) {
  if (type === 'cart') {
    renderCart();
    $('#cartBG').classList.add('active');
    $('#cartDW').classList.add('active');
  } else {
    renderWishlist();
    $('#wlBG').classList.add('active');
    $('#wlDW').classList.add('active');
  }
  document.body.style.overflow = 'hidden';
}

function closeDrawer(type) {
  if (type === 'cart') {
    $('#cartBG').classList.remove('active');
    $('#cartDW').classList.remove('active');
  } else {
    $('#wlBG').classList.remove('active');
    $('#wlDW').classList.remove('active');
  }
  document.body.style.overflow = '';
}

$('#openCart').addEventListener('click', () => openDrawer('cart'));
$('#closeCartDW').addEventListener('click', () => closeDrawer('cart'));
$('#cartBG').addEventListener('click', () => closeDrawer('cart'));

$('#openWL').addEventListener('click', () => openDrawer('wl'));
$('#closeWLDW').addEventListener('click', () => closeDrawer('wl'));
$('#wlBG').addEventListener('click', () => closeDrawer('wl'));

// ── Search ──
$('#openSearch').addEventListener('click', () => {
  $('#searchOL').classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#searchInput').focus(), 100);
});

$('#closeSearch').addEventListener('click', () => {
  $('#searchOL').classList.remove('active');
  document.body.style.overflow = '';
});

$('#searchOL').addEventListener('click', (e) => {
  if (e.target === $('#searchOL')) {
    $('#searchOL').classList.remove('active');
    document.body.style.overflow = '';
  }
});

$('#searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  const results = $('#searchResults');
  if (!q) { results.innerHTML = ''; return; }

  const fullCatalog = getFullCatalog();
  const matches = fullCatalog.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.cat.includes(q) ||
    p.meta.toLowerCase().includes(q)
  );

  results.innerHTML = matches.length
    ? matches.map(p => `
        <div class="sr-item" data-sr="${p.id}">
          <img class="sr-img" src="${p.img}" alt="${p.name}">
          <div class="sr-info"><h4>${p.name}</h4><span>${fmt(p.price)}</span></div>
        </div>`).join('')
    : '<div style="padding:16px;text-align:center;color:#999;font-size:1.3rem">No results found</div>';

  results.querySelectorAll('[data-sr]').forEach(el => {
    el.addEventListener('click', () => {
      const id = +el.dataset.sr;
      $('#searchOL').classList.remove('active');
      document.body.style.overflow = '';
      $('#searchInput').value = '';
      results.innerHTML = '';
      openPDP(id);
    });
  });
});

// ── Pincode ──
const openPinBtn = $('#openPin');
if (openPinBtn) {
  openPinBtn.addEventListener('click', () => {
    $('#pinModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#pinInput').focus(), 100);
  });
}

const closePinBtn = $('#closePin');
if (closePinBtn) {
  closePinBtn.addEventListener('click', () => {
    $('#pinModal').classList.remove('active');
    document.body.style.overflow = '';
  });
}

const pinModalEl = $('#pinModal');
if (pinModalEl) {
  pinModalEl.addEventListener('click', (e) => {
    if (e.target === pinModalEl) {
      pinModalEl.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

const checkPinBtn = $('#checkPin');
if (checkPinBtn) {
  checkPinBtn.addEventListener('click', () => {
    const val = $('#pinInput').value.trim();
    const res = $('#pinResult');
    if (!/^\d{6}$/.test(val)) {
      res.className = 'pin-result err';
      res.textContent = 'Please enter a valid 6-digit pincode';
      return;
    }
    // Simulate check
    const days = 2 + Math.floor(Math.random() * 4);
    res.className = 'pin-result ok';
    res.innerHTML = `✓ Delivery available! Estimated ${days}–${days + 2} business days.<br><span style="font-weight:700;color:var(--color-secondary)">Express Shipping: ₹200 applies!</span>`;
  });
}


// ── Dynamic Checkout & Payments ──
let activeCheckoutOrder = null;

function openCheckout() {
  if (!cart.length) {
    toast('Your cart is empty! Add products first.');
    return;
  }
  closeDrawer('cart');
  
  // Show shipping form (step 1)
  $('#coStep1').style.display = 'block';
  $('#coStep2').style.display = 'none';
  $('#coForm').reset();
  
  // Open checkout modal
  $('#checkoutModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  $('#checkoutModal').classList.remove('active');
  document.body.style.overflow = '';
}

$('#checkoutBtn').addEventListener('click', openCheckout);
$('#closeCheckout').addEventListener('click', closeCheckout);
$('#checkoutModal').addEventListener('click', (e) => {
  if (e.target === $('#checkoutModal')) closeCheckout();
});
// Automatically check wallet balance when phone number is entered
async function checkWalletBalance() {
  const phoneVal = $('#coPhone').value.trim();
  const cleanPhone = phoneVal.replace(/\D/g, '').slice(-10);
  const walletContainer = $('#coWalletContainer');
  const walletBalanceSpan = $('#coWalletBalance');
  const walletCheckbox = $('#coUseWallet');
  
  if (cleanPhone.length === 10) {
    try {
      const balance = await window.VFS_DB.getCustomerWalletBalance(cleanPhone);
      if (balance > 0) {
        walletBalanceSpan.textContent = fmt(balance);
        walletContainer.style.display = 'block';
      } else {
        walletContainer.style.display = 'none';
        walletCheckbox.checked = false;
      }
    } catch (err) {
      console.warn("Wallet check failed:", err);
      walletContainer.style.display = 'none';
      walletCheckbox.checked = false;
    }
  } else {
    walletContainer.style.display = 'none';
    walletCheckbox.checked = false;
  }
}
$('#coPhone').addEventListener('input', checkWalletBalance);
$('#coPhone').addEventListener('change', checkWalletBalance);

// Checkout Step 1 Shipping form submission
$('#coForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const fullCatalog = getFullCatalog();
  let subtotal = 0;
  
  const itemsList = cart.map(ci => {
    const p = fullCatalog.find(x => x.id === ci.id);
    subtotal += p.price * ci.qty;
    return { id: p.id, sku: p.sku || `SN-${String(p.id).padStart(4, '0')}`, name: p.name, price: p.price, qty: ci.qty };
  });
  
  const shippingCost = 200;
  let grandTotal = subtotal + shippingCost;
  
  // Calculate Wallet Discount
  let walletDiscount = 0;
  const phoneVal = $('#coPhone').value.trim();
  const cleanPhone = phoneVal.replace(/\D/g, '').slice(-10);
  
  const useWalletCheckbox = $('#coUseWallet');
  if (useWalletCheckbox && useWalletCheckbox.checked) {
    try {
      const balance = await window.VFS_DB.getCustomerWalletBalance(cleanPhone);
      walletDiscount = Math.min(balance, grandTotal);
      grandTotal -= walletDiscount;
    } catch (err) {
      console.warn("Deducting wallet credits failed:", err);
    }
  }
  
  // Create Order Structure
  const newOrder = {
    id: '#VF-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toLocaleDateString('en-IN'),
    name: $('#coName').value.trim(),
    phone: cleanPhone,
    address: $('#coAddress').value.trim(),
    city: $('#coCity').value.trim(),
    pincode: $('#coPincode').value.trim(),
    carrier: $('#coCarrier').value,
    items: itemsList,
    subtotal: subtotal,
    shipping: shippingCost,
    walletDiscount: walletDiscount,
    total: grandTotal,
    status: 'unpaid', // unpaid/paid
    trackingId: ''
  };
  
  activeCheckoutOrder = newOrder;

  // Render Step 2 Payment details
  $('#coSumSubtotal').textContent = fmt(subtotal);
  $('#coSumShipping').textContent = fmt(shippingCost);
  if (walletDiscount > 0) {
    $('#coSumDiscountRow').style.display = 'flex';
    $('#coSumDiscount').textContent = `-${fmt(walletDiscount)}`;
  } else {
    $('#coSumDiscountRow').style.display = 'none';
  }
  $('#coSumTotal').textContent = fmt(grandTotal);
  
  // Create UPI URI using your real payment receiver details (8939086608@fam)
  const upiURI = `upi://pay?pa=8939086608@fam&pn=VFS%20Jewels&am=${grandTotal}&cu=INR&tn=Order%20${newOrder.id}`;

  // Use custom static QR code image uploaded by user
  $('#coQRWrapper').innerHTML = `<img src="assets/payment_qr.png" alt="UPI QR Code" style="width:180px;height:180px;display:block;margin:0 auto;object-fit:contain;">`;
  
  // Detect mobile intent pay drawer support
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const mobilePayEl = $('#coMobilePayBtn');
  if (isMobile) {
    mobilePayEl.style.display = 'flex';
    mobilePayEl.href = upiURI;
  } else {
    mobilePayEl.style.display = 'none';
  }

  // Display step 2
  $('#coStep1').style.display = 'none';
  $('#coStep2').style.display = 'block';
});

// Confirm and Order via WhatsApp
$('#coConfirmBtn').addEventListener('click', async () => {
  if (!activeCheckoutOrder) return;
  
  const submitBtn = $('#coConfirmBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Placing Order...';
  
  try {
    // Save order via VFS_DB wrapper
    await window.VFS_DB.saveOrder(activeCheckoutOrder);
    
    // Deduct wallet balance if a discount was applied!
    if (activeCheckoutOrder.walletDiscount && activeCheckoutOrder.walletDiscount > 0) {
      const balance = await window.VFS_DB.getCustomerWalletBalance(activeCheckoutOrder.phone);
      const newBalance = Math.max(0, balance - activeCheckoutOrder.walletDiscount);
      await window.VFS_DB.saveWalletBalance(activeCheckoutOrder.phone, newBalance);
    }
  } catch (err) {
    console.error("Order submission or wallet debit failed:", err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirm & Place Order on WhatsApp';
  }
  
  // Create Formatted WhatsApp Message
  let itemsSummaryText = "";
  activeCheckoutOrder.items.forEach((item, idx) => {
    itemsSummaryText += `${idx+1}. *${item.name}* x ${item.qty} - ₹${item.price * item.qty}\n`;
  });
  
  let waMessage = 
`🌸 *VFS JEWELLERY - NEW ORDER* 🌸
----------------------------------
*Order ID:* ${activeCheckoutOrder.id}
*Customer:* ${activeCheckoutOrder.name}
*Phone:* ${activeCheckoutOrder.phone}
*Address:* ${activeCheckoutOrder.address}, ${activeCheckoutOrder.city} - ${activeCheckoutOrder.pincode}
*Carrier Partner:* ${activeCheckoutOrder.carrier}

*Items Ordered:*
${itemsSummaryText}
----------------------------------
*Subtotal:* ₹${activeCheckoutOrder.subtotal}
*Delivery Fee:* ₹${activeCheckoutOrder.shipping}\n`;

  if (activeCheckoutOrder.walletDiscount && activeCheckoutOrder.walletDiscount > 0) {
    waMessage += `*Wallet Discount:* -₹${activeCheckoutOrder.walletDiscount}\n`;
  }
  
  waMessage += `*Grand Total:* *₹${activeCheckoutOrder.total}*

*Payment Method:* UPI Transfer
----------------------------------
_I have attached my UPI Transaction Screenshot below to verify payment._`;

  const waLink = `https://wa.me/919840757363?text=${encodeURIComponent(waMessage)}`;
  window.open(waLink, '_blank');
  
  // Populate Order Success Step UI elements
  $('#successOrderId').textContent = activeCheckoutOrder.id;
  $('#successOrderTotal').textContent = fmt(activeCheckoutOrder.total);

  // Show Success step
  $('#coStep2').style.display = 'none';
  $('#coStep3').style.display = 'block';

  // Attach open link event to the success button
  const waBtn = $('#successWaBtn');
  const newWaBtn = waBtn.cloneNode(true);
  waBtn.parentNode.replaceChild(newWaBtn, waBtn);
  newWaBtn.addEventListener('click', () => {
    window.open(waLink, '_blank');
  });

  // Attach close listener to success close button
  const closeBtn = $('#successCloseBtn');
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  newCloseBtn.addEventListener('click', () => {
    closeCheckout();
    setTimeout(() => {
      $('#coStep1').style.display = 'block';
      $('#coStep2').style.display = 'none';
      $('#coStep3').style.display = 'none';
    }, 400);
  });

  // Reset cart
  cart = [];
  saveState();
  updateCounts();
  toast('Order placed! Opening WhatsApp to send payment screenshot 🌸');
});

// ── Newsletter ──
$('#nlForm').addEventListener('submit', (e) => {
  e.preventDefault();
  toast('Subscribed! Welcome to VFS Circle ✉️');
  e.target.reset();
});

// ── Keyboard: Escape closes overlays ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $('#searchOL').classList.remove('active');
    $('#pinModal').classList.remove('active');
    closePDP();
    closeStoreLocator();
    closeGuideModal();
    closeDrawer('cart');
    closeDrawer('wl');
  }
});

// ── PDP Overlay Logic ──
let currentPdpScrollListener = null;

function openPDP(id) {
  const p = getFullCatalog().find(x => x.id === id);
  if (!p) return;

  const overlay = $('#pdpOverlay');
  if (currentPdpScrollListener) {
    overlay.removeEventListener('scroll', currentPdpScrollListener);
  }
  
  // 1. Image Gallery
  const mainImgContainer = $('#pdpMainImg');
  
  // Resolve image list
  let images = [];
  if (p.imgs && Array.isArray(p.imgs)) {
    images = p.imgs;
  } else if (p.img) {
    images = [
      p.img,
      'assets/hero_banner.webp',
      p.img
    ];
  } else {
    images = ['assets/hero_banner.webp'];
  }
  
  // Render scrollable images slider
  mainImgContainer.innerHTML = `
    <div class="pdp-images-slider" style="display:flex; overflow-x:auto; scroll-snap-type:x mandatory; width:100%; height:100%; scrollbar-width:none; -ms-overflow-style:none;">
      ${images.map((imgSrc, idx) => `
        <img src="${imgSrc}" alt="${p.name} - Image ${idx+1}" style="flex:0 0 100%; width:100%; height:100%; object-fit:cover; scroll-snap-align:start;">
      `).join('')}
    </div>
  `;

  const thumbsContainer = $('#pdpThumbs');
  thumbsContainer.innerHTML = images.map((imgSrc, idx) => `
    <div class="pdp-thumb ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
      <img src="${imgSrc}" alt="${p.name} - Angle ${idx + 1}">
    </div>
  `).join('');

  const slider = mainImgContainer.querySelector('.pdp-images-slider');
  thumbsContainer.querySelectorAll('.pdp-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbsContainer.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const idx = +thumb.dataset.idx;
      slider.scrollTo({ left: slider.clientWidth * idx, behavior: 'smooth' });
    });
  });
  
  slider.addEventListener('scroll', () => {
    const idx = Math.round(slider.scrollLeft / slider.clientWidth);
    thumbsContainer.querySelectorAll('.pdp-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
    });
  });

  // 2. Details Info
  const isWL = wishlist.includes(p.id);
  const isDiscounted = p.mrp && p.mrp > p.price;
  const off = isDiscounted ? pct(p.price, p.mrp) : 0;
  const infoContainer = $('#pdpInfo');
  
  const catLabel = p.cat ? p.cat.charAt(0).toUpperCase() + p.cat.slice(1) : 'Jewellery';
  const sku = `ZU1-${p.id}`;
  
  infoContainer.innerHTML = `
    <h1 class="pdp-title">${p.name} ( ${sku} )</h1>
    
    <div class="pdp-price-box">
      <span class="pdp-price-now">${fmt(p.price)}</span>
      ${isDiscounted ? `
        <span class="pdp-price-was">${fmt(p.mrp)}</span>
        <span class="pdp-price-off">${off}% OFF</span>
      ` : ''}
    </div>
    
    <div class="pdp-swipe-helper">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m17 7 5 5-5 5M7 7l-5 5 5 5M2 12h20"/></svg>
      <span>Swipe to see more products</span>
    </div>
    
    <div class="pdp-qty-cart-row">
      <div class="pdp-qty-selector">
        <button id="pdpQtyDec" class="pdp-qty-btn">−</button>
        <input type="number" id="pdpQtyInput" class="pdp-qty-input" value="1" min="1" readonly>
        <button id="pdpQtyInc" class="pdp-qty-btn">+</button>
      </div>
      <button class="pdp-btn-add-new" id="pdpBtnAdd" data-id="${p.id}">
        ADD TO CART
      </button>
    </div>
    
    <div class="pdp-wishlist-row">
      <button class="pdp-btn-wish-text ${isWL ? 'active' : ''}" id="pdpBtnWish" data-id="${p.id}">
        <svg class="pdp-wish-icon" viewBox="0 0 24 24" fill="${isWL ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
        <span id="pdpWishText">${isWL ? 'Added to wishlist' : 'Add to wishlist'}</span>
      </button>
    </div>
    
    <hr class="pdp-divider">
    
    <div class="pdp-metadata-block">
      <div class="pdp-meta-item"><strong>SKU:</strong> <span class="pdp-meta-val">${sku}</span></div>
      <div class="pdp-meta-item"><strong>Categories:</strong> <span class="pdp-meta-val">${catLabel}, VFS Jewellery</span></div>
    </div>
    
    <div class="pdp-share-block">
      <strong>Share:</strong>
      <div class="pdp-share-links" id="pdpShareLinks">
        <!-- Dynamically filled with hrefs -->
      </div>
    </div>
    
    <p class="pdp-desc" style="margin-top: 24px;">
      Upgrade your styling with this premium handcrafted VFS creation. Featuring a brilliant A++ Austrian CZ crystal centerpiece that captures light like real diamonds. Built with hypoallergenic, nickel-free brass alloy and finished with an anti-tarnish protective shield.
    </p>
    
    <label class="pdp-gift-wrap" style="margin-top: 16px;">
      <input type="checkbox" id="pdpGiftWrap">
      <span>Add Premium VFS Gift Box & Ribbon (+₹49)</span>
    </label>
    
    <div class="pdp-delivery" style="margin-top: 20px;">
      <h4><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>Delivery Availability Check</h4>
      <div class="pdp-delivery-checker">
        <input type="text" placeholder="Enter Pincode" id="pdpPinInput" maxlength="6">
        <button id="pdpPinCheck">Check</button>
      </div>
      <div id="pdpPinResult" class="pdp-pin-result"></div>
    </div>
  `;

  // Attach action event listeners
  const qtyInput = $('#pdpQtyInput');
  const btnDec = $('#pdpQtyDec');
  const btnInc = $('#pdpQtyInc');
  
  btnDec.addEventListener('click', () => {
    let currentVal = parseInt(qtyInput.value) || 1;
    if (currentVal > 1) {
      qtyInput.value = currentVal - 1;
    }
  });
  
  btnInc.addEventListener('click', () => {
    let currentVal = parseInt(qtyInput.value) || 1;
    qtyInput.value = currentVal + 1;
  });

  $('#pdpBtnAdd').addEventListener('click', () => {
    const isGiftChecked = $('#pdpGiftWrap').checked;
    const qty = parseInt(qtyInput.value) || 1;
    addToCart(p.id, qty);
    if (isGiftChecked) {
      addGiftWrapToCart();
    }
  });

  const btnWish = $('#pdpBtnWish');
  const wishTextSpan = $('#pdpWishText');
  btnWish.addEventListener('click', () => {
    if (wishlist.includes(p.id)) {
      wishlist = wishlist.filter(x => x !== p.id);
      btnWish.classList.remove('active');
      btnWish.querySelector('svg').setAttribute('fill', 'none');
      wishTextSpan.textContent = 'Add to wishlist';
      toast('Removed from wishlist');
    } else {
      wishlist.push(p.id);
      btnWish.classList.add('active');
      btnWish.querySelector('svg').setAttribute('fill', 'currentColor');
      wishTextSpan.textContent = 'Added to wishlist';
      toast('Added to wishlist ♡');
    }
    saveState();
    updateCounts();
    renderProducts(currentFilter);
  });

  $('#pdpPinCheck').addEventListener('click', () => {
    const val = $('#pdpPinInput').value.trim();
    const res = $('#pdpPinResult');
    if (!/^\d{6}$/.test(val)) {
      res.className = 'pdp-pin-result err';
      res.textContent = 'Please enter a valid 6-digit pincode';
      return;
    }
    const days = 2 + Math.floor(Math.random() * 4);
    res.className = 'pdp-pin-result ok';
    res.innerHTML = `✓ Delivery available! Estimated ${days}–${days + 2} business days.`;
  });

  // Setup Social Sharing links dynamically
  (function setupSharing() {
    const shareUrl = window.location.origin + window.location.pathname + '#product/' + p.id;
    const shareTitle = `${p.name} (SKU: ${sku})`;
    const shareImgUrl = window.location.origin + '/' + p.img;
    
    const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareTitle + ' - ' + shareUrl)}`;
    const fbLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const twitterLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
    const pinLink = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(shareImgUrl)}&description=${encodeURIComponent(shareTitle)}`;
    const liLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    const tgLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;

    $('#pdpShareLinks').innerHTML = `
      <a href="${waLink}" class="share-icon share-whatsapp" title="Share on WhatsApp" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <a href="${fbLink}" class="share-icon share-facebook" title="Share on Facebook" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
      <a href="${twitterLink}" class="share-icon share-twitter" title="Share on X (Twitter)" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href="${pinLink}" class="share-icon share-pinterest" title="Share on Pinterest" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.948-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.907 2.17-2.907 1.025 0 1.52.771 1.52 1.691 0 1.031-.655 2.572-.994 4.002-.285 1.195.592 2.171 1.769 2.171 2.124 0 3.758-2.242 3.758-5.479 0-2.861-2.062-4.86-5.005-4.86-3.411 0-5.413 2.561-5.413 5.199 0 1.03.398 2.13.893 2.73.1.12.11.23.07.38l-.361 1.47a.28.28 0 0 1-.399.17c-1.395-.65-2.268-2.69-2.268-4.329 0-3.52 2.561-6.757 7.382-6.757 3.87 0 6.878 2.757 6.878 6.444 0 3.843-2.42 6.937-5.78 6.937-1.128 0-2.19-.586-2.553-1.282 0 0-.558 2.122-.693 2.647-.254.981-.944 2.21-1.408 2.962 1.122.33 2.309.509 3.538.509 6.62 0 11.988-5.367 11.988-11.987C24.006 5.367 18.637 0 12.017 0z"/></svg>
      </a>
      <a href="${liLink}" class="share-icon share-linkedin" title="Share on LinkedIn" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <a href="${tgLink}" class="share-icon share-telegram" title="Share on Telegram" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.75-.168.706-.525.943-.775.966-.55.051-1.07-.312-1.602-.662-.832-.546-1.301-.884-2.113-1.42-.938-.617-.33-1.025.205-1.58.14-.145 2.569-2.355 2.616-2.559.006-.025.01-.12-.047-.171-.059-.051-.144-.035-.207-.021-.09.02-1.517.962-4.283 2.831-.405.278-.772.414-1.102.406-.364-.008-1.062-.206-1.582-.375-.638-.207-1.144-.317-1.1-.67.023-.184.275-.373.755-.568 2.955-1.285 4.925-2.134 5.91-2.547 2.812-1.173 3.397-1.377 3.778-1.384.084-.002.273.019.395.12.103.085.132.203.143.29-.001.059-.012.222-.023.327z"/></svg>
      </a>
    `;
  })();

  // 3. Related Products (Infinite scroll Recommendations)
  const relatedContainer = $('#pdpRelated');
  relatedContainer.innerHTML = "";
  
  let recommendedIndex = 0;
  function appendRecommendations() {
    const fullCatalog = getFullCatalog();
    const catProducts = fullCatalog.filter(x => x.cat === p.cat && x.id !== p.id);
    if (!catProducts.length) {
      if (relatedContainer.children.length === 0) {
        relatedContainer.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#999;padding:24px;">No related items found</p>`;
      }
      return;
    }
    
    const batchSize = 4;
    const nextBatch = [];
    for (let i = 0; i < batchSize; i++) {
      const prod = catProducts[(recommendedIndex + i) % catProducts.length];
      nextBatch.push(prod);
    }
    recommendedIndex = (recommendedIndex + batchSize) % catProducts.length;
    
    const html = nextBatch.map(rp => {
      const isRpWL = wishlist.includes(rp.id);
      const rpOff = pct(rp.price, rp.mrp);
      return `
        <div class="p-card" data-id="${rp.id}">
          ${rp.badge ? `<span class="p-badge">${rp.badge}</span>` : ''}
          <button class="p-wish${isRpWL ? ' active' : ''}" data-wl="${rp.id}" aria-label="Wishlist">
            <svg viewBox="0 0 24 24" fill="${isRpWL ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
          </button>
          <div class="p-img">
            <img src="${rp.img}" alt="${rp.name}">
            <div class="p-quick" data-add="${rp.id}">Add to Cart</div>
          </div>
          <div class="p-info">
            <div class="p-meta">${rp.meta}</div>
            <div class="p-name">${rp.name}</div>
            <div class="p-rating"><span class="stars">${stars(rp.rating)}</span><span class="count">(${rp.reviews})</span></div>
            <div class="p-prices">
              <span class="price-now">${fmt(rp.price)}</span>
              <span class="price-was">${fmt(rp.mrp)}</span>
              <span class="price-off">${rpOff}% OFF</span>
            </div>
          </div>
        </div>`;
    }).join('');
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    
    wrapper.querySelectorAll('.p-card').forEach(card => {
      card.addEventListener('click', () => {
        const rId = +card.dataset.id;
        openPDP(rId);
        overlay.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
    
    wrapper.querySelectorAll('[data-wl]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wlId = +btn.dataset.wl;
        if (wishlist.includes(wlId)) {
          wishlist = wishlist.filter(x => x !== wlId);
          toast('Removed from wishlist');
        } else {
          wishlist.push(wlId);
          toast('Added to wishlist ♡');
        }
        saveState();
        updateCounts();
        btn.classList.toggle('active');
        btn.querySelector('svg').setAttribute('fill', wishlist.includes(wlId) ? 'currentColor' : 'none');
      });
    });
    
    wrapper.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(+btn.dataset.add);
      });
    });
    
    while (wrapper.firstChild) {
      relatedContainer.appendChild(wrapper.firstChild);
    }
  }

  // Populate first 8 items
  appendRecommendations();
  appendRecommendations();

  // Scroll listener on PDP overlay for infinite recommendations
  currentPdpScrollListener = () => {
    if (overlay.scrollTop + overlay.clientHeight >= overlay.scrollHeight - 150) {
      appendRecommendations();
    }
  };
  overlay.addEventListener('scroll', currentPdpScrollListener);

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Swipe / Drag product navigation below the image area
  const infoEl = $('#pdpInfo');
  let pdpTouchStartX = 0;
  let pdpTouchStartY = 0;
  let pdpIsDragging = false;
  
  infoEl.ontouchstart = (e) => {
    pdpTouchStartX = e.changedTouches[0].screenX;
    pdpTouchStartY = e.changedTouches[0].screenY;
  };
  
  infoEl.ontouchend = (e) => {
    const endX = e.changedTouches[0].screenX;
    const endY = e.changedTouches[0].screenY;
    handlePdpSwipe(pdpTouchStartX, endX, pdpTouchStartY, endY, p.id);
  };
  
  infoEl.onmousedown = (e) => {
    pdpTouchStartX = e.screenX;
    pdpTouchStartY = e.screenY;
    pdpIsDragging = true;
  };
  
  infoEl.onmouseup = (e) => {
    if (!pdpIsDragging) return;
    pdpIsDragging = false;
    handlePdpSwipe(pdpTouchStartX, e.screenX, pdpTouchStartY, e.screenY, p.id);
  };
}

function closePDP() {
  const overlay = $('#pdpOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  if (currentPdpScrollListener) {
    overlay.removeEventListener('scroll', currentPdpScrollListener);
    currentPdpScrollListener = null;
  }
  const pdpContainer = document.querySelector('.pdp-container');
  if (pdpContainer) {
    pdpContainer.style.transform = '';
    pdpContainer.style.transition = '';
    pdpContainer.style.opacity = '';
    pdpContainer.removeAttribute('data-animating');
  }
}

// ── PDP Swipe Navigation Helper ──
function handlePdpSwipe(startX, endX, startY, endY, currentProductId) {
  const diffX = endX - startX;
  const diffY = endY - startY;
  
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
    const p = getFullCatalog().find(x => x.id === currentProductId);
    if (!p) return;
    
    const catProducts = getFullCatalog().filter(x => x.cat === p.cat);
    if (catProducts.length <= 1) return;
    
    const curIdx = catProducts.findIndex(x => x.id === currentProductId);
    let newIdx = curIdx;
    let direction = ''; // 'left' or 'right'
    
    if (diffX < 0) {
      newIdx = (curIdx + 1) % catProducts.length; // Next product
      direction = 'left';
    } else {
      newIdx = (curIdx - 1 + catProducts.length) % catProducts.length; // Prev product
      direction = 'right';
    }
    
    const nextProduct = catProducts[newIdx];
    if (nextProduct) {
      const pdpContainer = document.querySelector('.pdp-container');
      const pdpOverlay = $('#pdpOverlay');
      if (!pdpContainer) return;
      
      // Prevent swiping while animating
      if (pdpContainer.dataset.animating === 'true') return;
      pdpContainer.dataset.animating = 'true';
      
      // Set transition style
      pdpContainer.style.transition = 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.22s ease-out';
      
      // Slide OUT
      pdpContainer.style.opacity = '0';
      if (direction === 'left') {
        pdpContainer.style.transform = 'translateX(-100%)';
      } else {
        pdpContainer.style.transform = 'translateX(100%)';
      }
      
      // After slide out completes (220ms)
      setTimeout(() => {
        // Render new product details
        openPDP(nextProduct.id);
        
        // Scroll overlay scrollbar back to top
        if (pdpOverlay) pdpOverlay.scrollTo({ top: 0 });
        
        const newPdpContainer = document.querySelector('.pdp-container');
        if (!newPdpContainer) return;
        
        // Mark as animating to prevent click interactions during transition
        newPdpContainer.dataset.animating = 'true';
        
        // Teleport to the opposite side offscreen instantly
        newPdpContainer.style.transition = 'none';
        if (direction === 'left') {
          newPdpContainer.style.transform = 'translateX(100%)';
        } else {
          newPdpContainer.style.transform = 'translateX(-100%)';
        }
        newPdpContainer.style.opacity = '0';
        
        // Force browser layout update
        newPdpContainer.offsetWidth;
        
        // Slide IN to center view smoothly
        newPdpContainer.style.transition = 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s ease-out';
        newPdpContainer.style.transform = 'translateX(0)';
        newPdpContainer.style.opacity = '1';
        
        // Clean up animation flags
        setTimeout(() => {
          newPdpContainer.style.transition = '';
          newPdpContainer.removeAttribute('data-animating');
        }, 260);
        
      }, 220);
    }
  }
}

function addGiftWrapToCart() {
  const giftWrapId = 99;
  const existingProduct = PRODUCTS.find(x => x.id === giftWrapId);
  if (!existingProduct) {
    PRODUCTS.push({
      id: giftWrapId,
      name: 'Premium VFS Gift Box & Ribbon',
      cat: 'services',
      meta: 'Gift Pack',
      price: 49,
      mrp: 49,
      img: 'assets/bracelets.webp',
      rating: 5,
      reviews: 0,
      badge: 'Gift'
    });
  }
  
  const existingInCart = cart.find(c => c.id === giftWrapId);
  if (!existingInCart) {
    cart.push({ id: giftWrapId, qty: 1 });
    saveState();
    updateCounts();
    renderCart();
  }
}

// Back to shop button in PDP
$('#pdpBack').addEventListener('click', closePDP);

// ── Scroll to Top Behavior ──
window.addEventListener('scroll', () => {
  const btn = $('#scrollTopBtn');
  if (window.scrollY > 300) {
    btn.classList.add('show');
  } else {
    btn.classList.remove('show');
  }
});
$('#scrollTopBtn').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ── Catch Placeholder Links ──
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (a && a.getAttribute('href') === '#') {
    e.preventDefault();
    toast(`${a.textContent.trim() || 'Feature'} coming soon! 💎`);
  }
});

// ── Store Locator Logic ──
const STORES = [
  {
    name: "VFS Jewels Sowcarpet",
    address: "42, 2nd Floor, Natwar Kurpa Complex, Narayana Mudali Street, Sowcarpet, George Town, Chennai - 600001",
    link: "https://www.google.com/search?q=VFS+JEWELS+Jewellery+Wholesaler+Sowcarpet+Chennai",
    badge: "Flagship Wholesaler"
  },
  {
    name: "VFS Jewels T. Nagar",
    address: "12, Usman Road, opposite Tanishq, T. Nagar, Chennai - 600017",
    link: "https://www.google.com/search?q=VFS+JEWELS+Jewellery+Wholesaler+Sowcarpet+Chennai",
    badge: "Retail Hub"
  },
  {
    name: "VFS Jewels Adyar",
    address: "85, Sardar Patel Road, opposite IIT Madras, Adyar, Chennai - 600020",
    link: "https://www.google.com/search?q=VFS+JEWELS+Jewellery+Wholesaler+Sowcarpet+Chennai",
    badge: "Boutique"
  },
  {
    name: "VFS Jewels Velachery",
    address: "4, Velachery Main Road, near Phoenix Marketcity, Velachery, Chennai - 600042",
    link: "https://www.google.com/search?q=VFS+JEWELS+Jewellery+Wholesaler+Sowcarpet+Chennai",
    badge: "Experience Center"
  }
];

function openStoreLocator() {
  const shuffled = [...STORES].sort(() => 0.5 - Math.random());
  
  const listContainer = $('#storeList');
  listContainer.innerHTML = shuffled.map(s => `
    <div class="store-card">
      <div class="store-card-name">
        <span>${s.name}</span>
        <span class="store-card-badge">${s.badge}</span>
      </div>
      <div class="store-card-address">${s.address}</div>
      <div class="store-card-actions">
        <a href="${s.link}" target="_blank" rel="noopener" class="btn-store-dir">
          Get Directions →
        </a>
      </div>
    </div>
  `).join('');

  $('#storeOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeStoreLocator() {
  $('#storeOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

$('#openStore').addEventListener('click', openStoreLocator);
$('#closeStore').addEventListener('click', closeStoreLocator);
$('#storeOverlay').addEventListener('click', (e) => {
  if (e.target === $('#storeOverlay')) {
    closeStoreLocator();
  }
});

// ── Google Review Modal Logic ──
const REVIEW_TEXT_DEFAULT = "Absolutely love VFS Jewellery! Their 18K gold-plated designs are stunning, the anti-tarnish protective shield works wonders, and the customer service is outstanding. Highly recommended for retail and wholesale purchases! 💎✨";
let selectedReviewStars = 5;

function openReviewModal() {
  const modal = $('#googleReviewModal');
  if (modal) {
    modal.classList.add('active');
  }
  const reviewText = $('#modalReviewText');
  if (reviewText) {
    reviewText.value = REVIEW_TEXT_DEFAULT;
  }
  updateReviewStars(5);
  document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
  const modal = $('#googleReviewModal');
  if (modal) {
    modal.classList.remove('active');
  }
  document.body.style.overflow = '';
}

function updateReviewStars(rating) {
  selectedReviewStars = rating;
  const starsContainer = $('#modalReviewStars');
  if (!starsContainer) return;
  const starsList = starsContainer.querySelectorAll('.star');
  starsList.forEach((star, idx) => {
    if (idx < rating) {
      star.classList.add('selected');
    } else {
      star.classList.remove('selected');
    }
  });

  const labels = {
    1: 'Hated it (1/5) 😡',
    2: 'Disliked it (2/5) 🙁',
    3: 'It was OK (3/5) 😐',
    4: 'Liked it (4/5) 🙂',
    5: 'Loved it (5/5) 😍'
  };
  const labelEl = $('#revStarsLabel');
  if (labelEl) {
    labelEl.textContent = labels[rating] || 'Loved it (5/5) 😍';
  }
}

function handleReviewSubmit() {
  const modalBody = $('.rev-modal-body');
  if (!modalBody) return;
  
  const savedStars = selectedReviewStars;
  
  modalBody.innerHTML = `
    <div class="review-success-state" style="text-align:center; padding:30px 10px; animation: fadeUp 0.3s ease;">
      <div style="width:60px; height:60px; border-radius:50%; background:#27ae60; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:3rem">✓</div>
      <h3 style="font-size:2rem; margin-bottom:10px; color:#121212">Review Submitted!</h3>
      <p style="font-size:1.35rem; color:#666; margin-bottom:20px; line-height:1.5">
        Thank you for your rating of <strong>${savedStars} Stars</strong>.<br>
        Redirecting you to Google to post it officially...
      </p>
    </div>
  `;
  
  // Open google writereview in new tab
  setTimeout(() => {
    window.open('https://search.google.com/local/writereview?placeid=ChIJGeNBXJ1vUjoRKvwj5pfrrCk', '_blank');
    closeReviewModal();
    // Reset modal content after closing transition finishes
    setTimeout(() => {
      modalBody.innerHTML = `
        <div class="rev-modal-stars" id="modalReviewStars">
          <span class="star" data-value="1">★</span>
          <span class="star" data-value="2">★</span>
          <span class="star" data-value="3">★</span>
          <span class="star" data-value="4">★</span>
          <span class="star" data-value="5">★</span>
        </div>
        <p class="rev-stars-label" id="revStarsLabel">Excellent (5/5)</p>
        <textarea id="modalReviewText" rows="5" placeholder="Share details of your experience..."></textarea>
        <div class="rev-modal-actions">
          <button class="btn-rev-cancel" id="cancelReviewModal">Cancel</button>
          <button class="btn-rev-submit" id="submitReviewModal">Post Review</button>
        </div>
      `;
      // Re-attach listeners
      $('#cancelReviewModal').addEventListener('click', closeReviewModal);
      $('#submitReviewModal').addEventListener('click', handleReviewSubmit);
      $('#modalReviewStars').querySelectorAll('.star').forEach(s => {
        s.addEventListener('click', () => {
          const val = +s.dataset.value;
          updateReviewStars(val);
        });
      });
    }, 500);
  }, 2000);
}

// Bind Review Modal events
const openReviewBtn = $('#openReviewBtn');
if (openReviewBtn) {
  openReviewBtn.addEventListener('click', openReviewModal);
}
const closeReviewModalBtn = $('#closeReviewModal');
if (closeReviewModalBtn) {
  closeReviewModalBtn.addEventListener('click', closeReviewModal);
}
const cancelReviewModalBtn = $('#cancelReviewModal');
if (cancelReviewModalBtn) {
  cancelReviewModalBtn.addEventListener('click', closeReviewModal);
}
const submitReviewBtn = $('#submitReviewModal');
if (submitReviewBtn) {
  submitReviewBtn.addEventListener('click', handleReviewSubmit);
}
const googleReviewModalEl = $('#googleReviewModal');
if (googleReviewModalEl) {
  googleReviewModalEl.addEventListener('click', (e) => {
    if (e.target === googleReviewModalEl) {
      closeReviewModal();
    }
  });
}
const modalStars = $$('#modalReviewStars .star');
modalStars.forEach(star => {
  star.addEventListener('click', () => {
    const val = +star.dataset.value;
    updateReviewStars(val);
  });
});

// Also update Escape key listener to close this modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeReviewModal();
  }
});

// ── Video Call Modal Logic ──
function openVCModal() {
  const modal = $('#vcModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeVCModal() {
  const modal = $('#vcModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

const openVCDialogBtn = $('#openVCDialog');
if (openVCDialogBtn) {
  openVCDialogBtn.addEventListener('click', openVCModal);
}
const closeVCModalBtn = $('#closeVCModal');
if (closeVCModalBtn) {
  closeVCModalBtn.addEventListener('click', closeVCModal);
}

// ── How to Order Guide Modal Logic ──
function openGuideModal() {
  const modal = $('#guideModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeGuideModal() {
  const modal = $('#guideModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

window.closeGuideAndOpenVC = function() {
  closeGuideModal();
  setTimeout(openVCModal, 300);
};

const openGuideBtn = $('#openGuideBtn');
if (openGuideBtn) {
  openGuideBtn.addEventListener('click', openGuideModal);
}
const closeGuideModalBtn = $('#closeGuideModal');
if (closeGuideModalBtn) {
  closeGuideModalBtn.addEventListener('click', closeGuideModal);
}
const backToShopBtn = $('#btnBackToShopFromGuide');
if (backToShopBtn) {
  backToShopBtn.addEventListener('click', closeGuideModal);
}
const guideToVCBtn = $('#guideToVCBtn');
if (guideToVCBtn) {
  guideToVCBtn.addEventListener('click', window.closeGuideAndOpenVC);
}
const guideModalEl = $('#guideModal');
if (guideModalEl) {
  guideModalEl.addEventListener('click', (e) => {
    if (e.target === guideModalEl) {
      closeGuideModal();
    }
  });
}
const vcModalEl = $('#vcModal');
if (vcModalEl) {
  vcModalEl.addEventListener('click', (e) => {
    if (e.target === vcModalEl) {
      closeVCModal();
    }
  });
}

// Form submission handler
const vcForm = $('#vcForm');
if (vcForm) {
  vcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#vcName').value.trim();
    const phone = $('#vcPhone').value.trim();
    const slot = $('input[name="vcTime"]:checked').value;

    const message = `Hi VFS Jewellery! I'd like to schedule a Live Video Call to view your jewellery collection.\n\nName: ${name}\nWhatsApp: ${phone}\nPreferred Slot: ${slot}`;

    const waLink = `https://wa.me/919840757363?text=${encodeURIComponent(message)}`;
    
    // Open in new tab
    window.open(waLink, '_blank');
    
    // Reset and close
    vcForm.reset();
    closeVCModal();
    toast('Video Call request sent! 📞');
  });
}

// Escape key listener extension
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeVCModal();
  }
});

// ── Customer Order Tracking Overlay ──
const footerTrackOrderBtn = $('#footerTrackOrder');
if (footerTrackOrderBtn) {
  footerTrackOrderBtn.addEventListener('click', (e) => {
    e.preventDefault();
    $('#trackingOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

const headerTrackBtn = $('#openTracking');
if (headerTrackBtn) {
  headerTrackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    $('#trackingOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

const closeTrackingBtn = $('#closeTracking');
if (closeTrackingBtn) {
  closeTrackingBtn.addEventListener('click', () => {
    $('#trackingOverlay').classList.remove('active');
    document.body.style.overflow = '';
  });
}

const btnTrackOrder = $('#btnTrackOrder');
if (btnTrackOrder) {
  btnTrackOrder.addEventListener('click', async () => {
    const orderId = $('#trackInput').value.trim();
    const detailsContainer = $('#trackingDetails');
    if (!orderId) {
      toast('Please enter an Order ID');
      return;
    }
    
    // Retrieve orders via VFS_DB wrapper
    const ordersList = await window.VFS_DB.getOrders();
    const order = ordersList.find(o => o.id.toLowerCase() === orderId.toLowerCase());
    
    if (!order) {
      detailsContainer.style.display = 'block';
      detailsContainer.innerHTML = `
        <div style="text-align:center;padding:20px;color:var(--color-error);font-size:1.5rem;font-weight:700;">
          ⚠ Order ID not found. Please check your spelling or verify payment screenshot.
        </div>
      `;
      return;
    }
    
    // Render stepper progress and order info
    let activeStep = 1; // 1: Confirmed
    if (order.status === 'paid') activeStep = 2; // 2: Paid
    if (order.trackingId) activeStep = 3; // 3: Shipped
    if (order.status === 'delivered') activeStep = 5; // 5: Delivered
    
    let linePct = 0;
    if (activeStep === 2) linePct = 25;
    if (activeStep === 3) linePct = 50;
    if (activeStep === 4) linePct = 75;
    if (activeStep === 5) linePct = 100;
    
    const step1Active = 'active';
    const step2Active = activeStep >= 2 ? 'active' : '';
    const step3Active = activeStep >= 3 ? 'active' : '';
    const step4Active = activeStep >= 4 ? 'active' : '';
    const step5Active = activeStep >= 5 ? 'active' : '';
    
    const itemsText = order.items.map(item => `
      <div style="display:flex;justify-content:space-between;font-size:1.3rem;margin-bottom:6px;border-bottom:1px dashed #eee;padding-bottom:6px;">
        <span>${item.name} <strong>x ${item.qty}</strong></span>
        <span>${fmt(item.price * item.qty)}</span>
      </div>
    `).join('');
    
    const trackingDetailsHtml = `
      <div class="tracking-container">
        <div class="tracking-info-grid">
          <div class="tracking-info-block">
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Order Date:</strong> ${order.date}</p>
            <p><strong>Shipping Status:</strong> <span style="text-transform:uppercase;font-weight:700;color:${order.trackingId ? '#27ae60' : '#f39c12'}">${order.trackingId ? 'Shipped' : 'Pending Shipment'}</span></p>
          </div>
          <div class="tracking-info-block">
            <p><strong>Customer:</strong> ${order.name}</p>
            <p><strong>Carrier:</strong> ${order.carrier}</p>
            <p><strong>Payment Status:</strong> <span style="text-transform:uppercase;font-weight:700;color:${order.status === 'paid' ? '#27ae60' : '#d9534f'}">${order.status}</span></p>
          </div>
        </div>
        
        <!-- Stepper Progress -->
        <div class="stepper-container">
          <div class="stepper-line"><div class="stepper-line-progress" style="width: ${linePct}%"></div></div>
          
          <div class="step-node ${step1Active}">
            1
            <div class="step-label">Confirmed</div>
          </div>
          <div class="step-node ${step2Active}">
            2
            <div class="step-label">Paid</div>
          </div>
          <div class="step-node ${step3Active}">
            3
            <div class="step-label">Shipped</div>
          </div>
          <div class="step-node ${step4Active}">
            4
            <div class="step-label">In Transit</div>
          </div>
          <div class="step-node ${step5Active}">
            5
            <div class="step-label">Delivered</div>
          </div>
        </div>
        
        <!-- Items Summary -->
        <div style="margin-top:30px;text-align:left;">
          <h4 style="font-size:1.5rem;margin-bottom:12px;text-transform:uppercase;color:var(--color-primary-70);">Items Summary</h4>
          ${itemsText}
          <div style="display:flex;justify-content:space-between;font-weight:700;font-size:1.5rem;margin-top:12px;color:var(--color-secondary);">
            <span>Total Paid/Payable:</span>
            <span>${fmt(order.total)}</span>
          </div>
        </div>
        
        <!-- Shipping Carrier / Barcode Details -->
        ${order.trackingId ? `
          <div style="margin-top:30px;background:var(--color-primary-10);border:1px dashed var(--color-secondary);padding:20px;border-radius:var(--rounded-md);text-align:left;">
            <h4 style="font-size:1.5rem;margin-bottom:10px;text-transform:uppercase;color:var(--color-secondary);font-weight:700;">Carrier Info: ${order.carrier}</h4>
            <p style="font-size:1.35rem;margin-bottom:12px;">Your order has been shipped via <strong>${order.carrier}</strong> with tracking number: <strong style="font-size:1.45rem">${order.trackingId}</strong>.</p>
            
            <!-- Barcode simulation -->
            <div style="display:inline-block;padding:10px;background:#fff;border:1px solid #ccc;margin-bottom:12px;">
              <div style="display:flex;height:40px;align-items:stretch;width:180px;">
                ${Array.from({length: 30}).map(() => {
                  const width = [1, 2, 3, 4][Math.floor(Math.random() * 4)];
                  const space = [1, 2, 3][Math.floor(Math.random() * 3)];
                  return `<div style="background:#000;width:${width}px;margin-right:${space}px;"></div>`;
                }).join('')}
              </div>
              <div style="font-family:monospace;font-size:1.1rem;text-align:center;letter-spacing:4px;margin-top:4px;">${order.trackingId}</div>
            </div>
            
            <div style="margin-top:10px;display:flex;gap:12px;flex-wrap:wrap;">
              <a href="https://www.google.com/search?q=${order.carrier}+tracking+${order.trackingId}" target="_blank" rel="noopener" class="btn-primary" style="display:inline-block;padding:8px 20px;font-size:1.2rem;text-decoration:none;">
                Track on Official Site →
              </a>
              <button onclick="downloadCustomerInvoicePDF('${order.id}')" class="btn-primary" style="display:inline-block;padding:8px 20px;font-size:1.2rem;background:#27ae60;border:none;cursor:pointer;">
                Download Invoice PDF 📄
              </button>
            </div>
            
            <!-- VFS Returns Centre Module -->
            <div class="return-centre-box" style="margin-top:30px;border-top:1px dashed #ccc;padding-top:20px;">
              <h4 style="font-size:1.5rem;margin-bottom:10px;text-transform:uppercase;color:var(--color-secondary);font-weight:700;">🔄 VFS Returns Centre</h4>
              
              ${order.returnStatus === 'pending' ? `
                <div style="background:#fffaf0;border:1px solid #f0ad4e;color:#c0392b;padding:15px;border-radius:var(--rounded-md);font-size:1.3rem;">
                  ⏳ <strong>Return Requested: Awaiting Verification</strong><br>
                  We have received your unboxing video and invoice screenshot. Our verification team is checking the details. Upon defect confirmation, your refund will be credited directly as points to your wallet!
                </div>
              ` : order.returnStatus === 'approved' ? `
                <div style="background:#eafaf1;border:1px solid #2ecc71;color:#27ae60;padding:15px;border-radius:var(--rounded-md);font-size:1.3rem;">
                  ✅ <strong>Return Approved: Store Credits Granted</strong><br>
                  Your return request was approved! Credit points representing your full refund value have been added to your account wallet.
                </div>
              ` : order.returnStatus === 'rejected' ? `
                <div style="background:#fdf2f2;border:1px solid #f8d7da;color:#c53030;padding:15px;border-radius:var(--rounded-md);font-size:1.3rem;">
                  ❌ <strong>Return Request Declined</strong><br>
                  Our validation team could not confirm the defect from the unboxing video provided. For disputes, please contact us on WhatsApp.
                </div>
              ` : `
                <!-- No return requested yet -->
                <p style="font-size:1.3rem;color:#666;margin-bottom:16px;line-height:1.5;">
                  To request a return, you must upload a **photo of your invoice** (downloaded above) and a **continuous unboxing video** recorded when receiving the parcel.
                </p>
                <button onclick="toggleReturnForm()" class="btn-primary" style="background:#121212;color:#D4AF37;border:1px solid #D4AF37;padding:8px 20px;font-size:1.2rem;cursor:pointer;">
                  Request a Return
                </button>
                
                <form id="returnsSubmitForm" style="display:none;margin-top:20px;background:#fcfcfc;padding:20px;border:1px dashed #ddd;border-radius:var(--rounded-md);" onsubmit="submitReturnRequest(event, '${order.id}', '${order.phone}')">
                  <!-- Test/Debug helper -->
                  <a href="#" id="btnAutofillReturnProofs" onclick="autofillReturnProofs(event)" style="font-size:1.15rem;color:var(--color-secondary);margin-bottom:12px;display:block;font-weight:700;text-decoration:underline;">[Testing: Auto-fill Mock Proofs]</a>
                  
                  <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;text-align:left;">
                    <label style="font-size:1.15rem;font-weight:700;color:#555;text-transform:uppercase;">1. Upload Invoice Photo/Screenshot</label>
                    <input type="file" id="retInvoiceFile" accept="image/*" style="font-size:1.2rem;">
                  </div>
                  <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;text-align:left;">
                    <label style="font-size:1.15rem;font-weight:700;color:#555;text-transform:uppercase;">2. Upload Unboxing Video (Max 15MB)</label>
                    <input type="file" id="retVideoFile" accept="video/*" style="font-size:1.2rem;">
                  </div>
                  <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;text-align:left;">
                    <label style="font-size:1.15rem;font-weight:700;color:#555;text-transform:uppercase;">3. Describe the Defect</label>
                    <textarea id="retDefectDesc" rows="3" placeholder="Explain what defect was detected during unboxing..." required style="padding:10px;font-size:1.3rem;border:1px solid #ddd;border-radius:4px;outline:none;font-family:sans-serif;width:100%;"></textarea>
                  </div>
                  <button type="submit" id="btnSubmitRet" class="btn-primary" style="width:100%;padding:10px;font-size:1.30rem;justify-content:center;">
                    Submit Return Request
                  </button>
                </form>
              `}
            </div>
          </div>
        ` : `
          <div style="margin-top:30px;background:#fffaf0;border:1px dashed #f0ad4e;padding:15px;border-radius:var(--rounded-md);text-align:left;font-size:1.3rem;">
            ℹ Your order is confirmed and is currently being processed. Once payment is confirmed and our logistics partner scans the tracking barcode, your tracking details will appear here.
          </div>
        `}
      </div>
    `;
    
    detailsContainer.innerHTML = trackingDetailsHtml;
    detailsContainer.style.display = 'block';
  });
}

// Escape key listener tracking extension
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const trackingOverlay = $('#trackingOverlay');
    if (trackingOverlay) {
      trackingOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});

// ── Init ──
// ── Customer PDF Invoice Downloader ──
window.downloadCustomerInvoicePDF = async function(orderId) {
  // Retrieve orders via VFS_DB wrapper
  const ordersList = await window.VFS_DB.getOrders();
  
  const order = ordersList.find(o => o.id === orderId);
  if (!order) return;

  toast("Generating invoice PDF... 📄");

  // Create invisible wrapper container to force layout painting
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.top = '0';
  wrapper.style.left = '0';
  wrapper.style.width = '0';
  wrapper.style.height = '0';
  wrapper.style.overflow = 'hidden';
  wrapper.style.zIndex = '-9999';
  wrapper.style.pointerEvents = 'none';

  const tempDiv = document.createElement('div');
  tempDiv.style.width = '750px';
  tempDiv.style.background = '#ffffff';
  tempDiv.style.color = '#000000';
  tempDiv.style.padding = '30px';
  tempDiv.style.fontFamily = "'Lato', sans-serif";

  const tableRows = order.items.map((item, idx) => `
    <tr style="border-bottom: 1px solid #eeeeee;">
      <td style="padding: 12px 10px; font-size: 10pt; color: #000000;">${idx + 1}</td>
      <td style="padding: 12px 10px; font-size: 10pt; color: #000000;"><strong>${item.name}</strong><br><span style="font-size:8pt;color:#666">Imitation Fashion Jewellery</span></td>
      <td style="padding: 12px 10px; font-size: 10pt; color: #000000;">${fmt(item.price)}</td>
      <td style="padding: 12px 10px; font-size: 10pt; color: #000000;">${item.qty}</td>
      <td style="padding: 12px 10px; font-size: 10pt; text-align: right; color: #000000;">${fmt(item.price * item.qty)}</td>
    </tr>
  `).join('');

  tempDiv.innerHTML = `
    <div style="border: 1px solid #dddddd; padding: 30px; background: #ffffff; color: #000000;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; margin-bottom: 20px;">
        <div>
          <div style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #000000;">VFS<span style="color:#D4AF37;">.</span></div>
          <p style="font-size: 8.5pt; color: #666666; margin: 4px 0 0 0;">Handcrafted Premium Imitation Jewellery</p>
        </div>
        <div style="text-align: right; font-size: 9.5pt; line-height: 1.4; color: #000000;">
          <h2 style="color: #D4AF37; text-transform: uppercase; font-size: 16px; margin: 0 0 6px 0;">Retail Tax Invoice</h2>
          <p style="margin: 2px 0;"><strong>Invoice ID:</strong> INV-${order.id.replace('#', '')}</p>
          <p style="margin: 2px 0;"><strong>Order ID:</strong> ${order.id}</p>
          <p style="margin: 2px 0;"><strong>Date:</strong> ${order.date}</p>
          <p style="margin: 2px 0;"><strong>Status:</strong> <span style="color:#27AE60;font-weight:700;text-transform:uppercase;">${order.status}</span></p>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 35px; font-size: 9.5pt; line-height: 1.5; color: #000000;">
        <div>
          <h4 style="margin: 0 0 6px 0; font-weight: 700; text-transform: uppercase; color: #555555;">Sold By:</h4>
          <strong>VFS Jewels Main Store</strong><br>
          42, 2nd Floor, Natwar Kurpa Complex,<br>
          Narayana Mudali Street, Sowcarpet, George Town,<br>
          Chennai, Tamil Nadu - 600001<br>
          Email: accounts@vfsjewels.in | GSTIN: 33AAFVC8491A1ZX
        </div>
        <div>
          <h4 style="margin: 0 0 6px 0; font-weight: 700; text-transform: uppercase; color: #555555;">Ship To:</h4>
          <strong>${order.name}</strong><br>
          Address: ${order.address}<br>
          City: ${order.city} - ${order.pincode}<br>
          Phone: +91 ${order.phone}
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; color: #000000;">
        <thead>
          <tr style="background: #fcfcfc; border-bottom: 2px solid #dddddd;">
            <th style="width: 8%; text-align: left; padding: 10px; font-size: 9pt; text-transform: uppercase; color: #000000;">S.No</th>
            <th style="text-align: left; padding: 10px; font-size: 9pt; text-transform: uppercase; color: #000000;">Description of Goods</th>
            <th style="width: 15%; text-align: left; padding: 10px; font-size: 9pt; text-transform: uppercase; color: #000000;">Rate</th>
            <th style="width: 10%; text-align: left; padding: 10px; font-size: 9pt; text-transform: uppercase; color: #000000;">Qty</th>
            <th style="width: 18%; text-align: right; padding: 10px; font-size: 9pt; text-transform: uppercase; color: #000000;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div style="display: flex; justify-content: flex-end; color: #000000; margin-bottom: 20px;">
        <table style="width: 250px; font-size: 9.5pt; line-height: 1.6; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #000000;">Subtotal:</td>
            <td style="text-align: right; font-weight: 700; padding: 4px 0; color: #000000;">${fmt(order.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #000000;">Shipping Fee:</td>
            <td style="text-align: right; font-weight: 700; padding: 4px 0; color: #000000;">${fmt(order.shipping)}</td>
          </tr>
          <tr style="font-size: 11pt; font-weight: 900; border-top: 1px solid #dddddd; color: #000000;">
            <td style="padding: 8px 0 0 0; color: #000000;">Grand Total:</td>
            <td style="text-align: right; padding: 8px 0 0 0; color: #000000;">${fmt(order.total)}</td>
          </tr>
        </table>
      </div>
      
      ${order.trackingId ? `
        <div style="text-align: center; margin: 25px 0; color: #000000;">
          <p style="font-size: 8pt; color: #666666; margin: 0 0 6px 0;">Shipping Partner: <strong>${order.carrier}</strong></p>
          <div style="display: inline-flex; height: 35px; align-items: stretch; width: 180px;">
            ${Array.from({length: 34}).map(() => {
              const width = [1, 2, 3][Math.floor(Math.random() * 3)];
              const space = [1, 2][Math.floor(Math.random() * 2)];
              return `<div style="background:#000000;width:${width}px;margin-right:${space}px;height:100%"></div>`;
            }).join('')}
          </div>
          <div style="font-family: monospace; font-size: 9pt; letter-spacing: 5px; margin-top: 6px; color: #000000;">${order.trackingId}</div>
        </div>
      ` : ''}
      
      <div style="text-align: center; font-size: 8.5pt; color: #777777; margin-top: 40px; border-top: 1px dashed #dddddd; padding-top: 15px;">
        <p style="margin: 0 0 4px 0;">This is a computer-generated tax invoice. No signature required.</p>
        <p style="margin: 0; font-weight: 700; color: #000000;">Thank you for your business! VFS Jewellery Sowcarpet</p>
      </div>
    </div>
  `;
  
  wrapper.appendChild(tempDiv);
  document.body.appendChild(wrapper);
  
  const opt = {
    margin:       [0.4, 0.4],
    filename:     `VFS_Invoice_${order.id.replace('#', '')}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(tempDiv).save().then(() => {
    wrapper.remove();
    toast(`PDF invoice downloaded! 📄`);
  }).catch(err => {
    console.error("PDF generation error:", err);
    wrapper.remove();
    alert("PDF generation failed: " + err.message);
  });
};

// ── Hash Routing for Direct Product Links ──
function checkHashRoute() {
  const hash = window.location.hash;
  if (hash) {
    const match = hash.match(/#product[\/-](\d+)/);
    if (match) {
      const productId = parseInt(match[1]);
      setTimeout(() => {
        openPDP(productId);
      }, 300); // slight delay to ensure dynamic products render first
    }
  }
}

window.addEventListener('load', checkHashRoute);
window.addEventListener('hashchange', checkHashRoute);

// Execute immediately in case the load event has already fired
checkHashRoute();

renderProducts(null);
renderTestimonials();
updateCounts();

// ── MOBILE SIDE DRAWER NAVIGATION ──
const mobileNavDrawer = $('#mobileNavDrawer');
const openMobileNavBtn = $('#openMobileNav');
const closeMobileNavBtn = $('#closeMobileNav');
const drawerSearchInput = $('#drawerSearchInput');
const drawerCategoriesList = $('#drawerCategoriesList');

// Toggle Drawer Open/Close
if (openMobileNavBtn && mobileNavDrawer) {
  openMobileNavBtn.addEventListener('click', () => {
    mobileNavDrawer.classList.add('active');
    document.body.style.overflow = 'hidden';
    populateDrawerCategories();
  });
}

if (closeMobileNavBtn && mobileNavDrawer) {
  closeMobileNavBtn.addEventListener('click', () => {
    mobileNavDrawer.classList.remove('active');
    document.body.style.overflow = '';
  });
}

// Close drawer if clicking backdrop overlay
if (mobileNavDrawer) {
  mobileNavDrawer.addEventListener('click', (e) => {
    if (e.target === mobileNavDrawer) {
      mobileNavDrawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Switch Tabs inside Side Drawer
const drawerTabBtns = document.querySelectorAll('.drawer-tab-btn');
drawerTabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active state from headers
    drawerTabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Switch active panels
    const tabName = btn.dataset.tab;
    const tabContents = document.querySelectorAll('.drawer-tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    if (tabName === 'menu') {
      const panel = $('#tabContentMenu');
      if (panel) panel.classList.add('active');
    } else {
      const panel = $('#tabContentCategories');
      if (panel) panel.classList.add('active');
    }
  });
});

// Populate Drawer Categories list dynamically
function populateDrawerCategories() {
  if (!drawerCategoriesList) return;
  drawerCategoriesList.innerHTML = '';
  
  // Get unique category names from catalog
  const uniqueCats = [...new Set(getFullCatalog().map(p => p.cat).filter(Boolean))];
  
  uniqueCats.forEach(cat => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#products';
    a.className = 'drawer-nav-link';
    a.textContent = cat.toUpperCase();
    a.addEventListener('click', () => {
      // Close drawer
      mobileNavDrawer.classList.remove('active');
      document.body.style.overflow = '';
      
      // Filter products by category
      const filtered = getFullCatalog().filter(p => p.cat.toLowerCase() === cat.toLowerCase());
      renderProducts(filtered);
      
      // Scroll to catalog section
      const target = document.getElementById('products');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
    li.appendChild(a);
    drawerCategoriesList.appendChild(li);
  });
}

// Search field triggers
if (drawerSearchInput) {
  // Enter key press triggers storefront search
  drawerSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      triggerDrawerSearch();
    }
  });
}

function triggerDrawerSearch() {
  const query = drawerSearchInput.value.trim().toLowerCase();
  if (mobileNavDrawer) {
    mobileNavDrawer.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  // Set storefront search bar value & trigger search
  const storefrontSearchInput = $('#searchInput');
  if (storefrontSearchInput) {
    storefrontSearchInput.value = query;
    // Dispatch input event to fire the real-time search listener in storefront
    storefrontSearchInput.dispatchEvent(new Event('input'));
  }
  
  // Scroll storefront to catalog list
  const target = document.getElementById('products');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

// Menu Nav Link scroll overrides
const drawerNavLinks = document.querySelectorAll('.drawer-nav-link');
drawerNavLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const targetAttr = link.dataset.target;
    if (!targetAttr) return;
    
    // Close drawer
    if (mobileNavDrawer) {
      mobileNavDrawer.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    if (targetAttr === 'home') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetAttr === 'about') {
      e.preventDefault();
      const target = document.getElementById('trust');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    } else if (targetAttr === 'shop') {
      e.preventDefault();
      // Show full catalog
      renderProducts(null);
      const target = document.getElementById('products');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    } else if (targetAttr === 'contact') {
      e.preventDefault();
      const target = document.getElementById('store');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    } else if (targetAttr === 'fine-gold') {
      e.preventDefault();
      // filter to 'Fine Gold' category
      const filtered = getFullCatalog().filter(p => p.cat.toLowerCase() === 'fine gold' || p.cat.toLowerCase() === 'gold');
      renderProducts(filtered);
      const target = document.getElementById('products');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── Return Policy Modal Listeners ──
const returnPolicyModal = $('#returnPolicyModal');
const openPolicyBtn = $('#footerReturnsPolicy');
const closePolicyBtn = $('#closeReturnPolicy');
const policyTrackBtn = $('#btnPolicyTrackOrder');

if (openPolicyBtn && returnPolicyModal) {
  openPolicyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    returnPolicyModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

if (closePolicyBtn && returnPolicyModal) {
  closePolicyBtn.addEventListener('click', () => {
    returnPolicyModal.classList.remove('active');
    document.body.style.overflow = '';
  });
}

if (policyTrackBtn && returnPolicyModal) {
  policyTrackBtn.addEventListener('click', () => {
    returnPolicyModal.classList.remove('active');
    document.body.style.overflow = '';
    // Open tracking overlay
    const trackingOverlay = $('#trackingOverlay');
    if (trackingOverlay) {
      trackingOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });
}

// ── Returns Request Form Logic ──
window.toggleReturnForm = function() {
  const form = document.getElementById('returnsSubmitForm');
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  }
}

window.submitReturnRequest = async function(event, orderId, phone) {
  event.preventDefault();
  
  const invoiceInput = document.getElementById('retInvoiceFile');
  const videoInput = document.getElementById('retVideoFile');
  const descInput = document.getElementById('retDefectDesc');
  const submitBtn = document.getElementById('btnSubmitRet');
  
  const debugFilled = document.getElementById('returnsSubmitForm').dataset.debugFilled === "true";
  
  if (!invoiceInput || !videoInput || !descInput || !submitBtn) return;
  if (!debugFilled && (!invoiceInput.files[0] || !videoInput.files[0])) {
    toast('Please upload invoice photo & unboxing video');
    return;
  }
  if (!descInput.value.trim()) {
    toast('Please describe the defect');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Uploading files & submitting...';
  
  const defectDesc = descInput.value.trim();
  
  const handleSuccess = async (invoiceURL, videoURL) => {
    // Save return request
    const returnObj = {
      id: 'RET-' + Date.now().toString().slice(-4),
      orderId: orderId,
      phone: phone,
      invoice: invoiceURL,
      video: videoURL,
      desc: defectDesc,
      status: 'pending',
      date: new Date().toLocaleDateString('en-IN')
    };
    
    await window.VFS_DB.saveReturn(returnObj);
    
    // Update order returnStatus to pending
    await window.VFS_DB.updateOrder(orderId, { returnStatus: 'pending' });
    
    toast('Return submitted successfully! 🔄');
    
    // Re-trigger order tracking display to show "pending verification" status
    const btnTrack = document.getElementById('btnTrackOrder');
    if (btnTrack) btnTrack.click();
  };

  if (debugFilled) {
    const dummyImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='150' height='150' fill='%23D4AF37'/><text x='15' y='80' fill='black' font-family='sans-serif' font-weight='bold'>VFS INVOICE PROOF</text></svg>";
    const dummyVideo = "data:video/mp4;base64,AAAAIGZ0eXBtcDQyAAAAAG1wNDJpc29tYXZjMQAAADhmdmVlAAAAAGhhbmRsAAAAAG1pbmYAAAAAZWxzdAAAAABzdGJsAAAAAG1kaWEAAAAAbWRoZAAAAAA=";
    setTimeout(async () => {
      await handleSuccess(dummyImage, dummyVideo);
    }, 800);
    return;
  }

  const invoiceFile = invoiceInput.files[0];
  const videoFile = videoInput.files[0];

  // Try Cloudinary if active
  if (window.VFS_CLOUD_ACTIVE && window.VFS_CONFIG.cloudinary && window.VFS_CONFIG.cloudinary.cloudName && !window.VFS_CONFIG.cloudinary.cloudName.startsWith("YOUR_")) {
    try {
      submitBtn.textContent = 'Uploading to Cloudinary...';
      const [invoiceURL, videoURL] = await Promise.all([
        window.uploadToCloudinary(invoiceFile),
        window.uploadToCloudinary(videoFile)
      ]);
      await handleSuccess(invoiceURL, videoURL);
    } catch(err) {
      console.error(err);
      toast('Cloudinary upload failed. Falling back to local storage.');
      // Fallback: convert files to Base64 in parallel using FileReader
      const readAsBase64 = (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      Promise.all([readAsBase64(invoiceFile), readAsBase64(videoFile)]).then(async ([invoiceB64, videoB64]) => {
        await handleSuccess(invoiceB64, videoB64);
      }).catch(e => {
        toast('Error processing attachments.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Return Request';
      });
    }
    return;
  }
  
  // Standard LocalStorage base64 fallback
  const readAsBase64 = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
  
  Promise.all([readAsBase64(invoiceFile), readAsBase64(videoFile)]).then(async ([invoiceB64, videoB64]) => {
    await handleSuccess(invoiceB64, videoB64);
  }).catch(err => {
    console.error(err);
    toast('Error parsing files. Try smaller attachments.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Return Request';
  });
}

window.autofillReturnProofs = function(e) {
  e.preventDefault();
  const form = document.getElementById('returnsSubmitForm');
  if (form) {
    form.dataset.debugFilled = "true";
    document.getElementById('retDefectDesc').value = "Scratched gold coating on the main celestial halo band mount.";
    toast("Demo return request details auto-filled! 🔄");
  }
};
