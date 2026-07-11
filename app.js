/* =========================================================
   VFS Jewellery — App Logic
   ========================================================= */

// ── Product Data ──
const PRODUCTS = [];

// PRODUCTS catalog loaded dynamically from vfs-products.json

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

  // ── Reviews ──
  getReviews: async function() {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const snap = await window.db.collection('reviews').get();
        const reviews = [];
        snap.forEach(doc => {
          reviews.push(doc.data());
        });
        return reviews;
      } catch(e) {
        console.error("Firestore read reviews error:", e);
      }
    }
    const local = localStorage.getItem('vfs_reviews');
    return local ? JSON.parse(local) : [];
  },

  saveReview: async function(review) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('reviews').doc(review.id).set(review);
        return;
      } catch(e) {
        console.error("Firestore write review error:", e);
      }
    }
    const local = localStorage.getItem('vfs_reviews');
    let list = local ? JSON.parse(local) : [];
    list.push(review);
    localStorage.setItem('vfs_reviews', JSON.stringify(list));
  },

  updateReview: async function(reviewId, updates) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('reviews').doc(reviewId).update(updates);
        return;
      } catch(e) {
        console.error("Firestore update review error:", e);
      }
    }
    const local = localStorage.getItem('vfs_reviews');
    if (local) {
      const list = JSON.parse(local);
      const idx = list.findIndex(r => r.id === reviewId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        localStorage.setItem('vfs_reviews', JSON.stringify(list));
      }
    }
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
  },

  // ── Product Stock ──
  getProductStock: async function(productId) {
    const idStr = String(productId);
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const doc = await window.db.collection('product_stock').doc(idStr).get();
        if (doc.exists) {
          const val = doc.data().stock;
          return val !== undefined ? val : 5;
        }
      } catch(e) {
        console.error("Firestore read stock error:", e);
      }
    }
    const local = localStorage.getItem('vfs_product_stock');
    const stockMap = local ? JSON.parse(local) : {};
    if (stockMap[idStr] !== undefined) {
      return stockMap[idStr];
    }
    // Default initial stock: product 401 has 1 stock for easy testing, others have 5
    const initial = (productId === 401) ? 1 : 5;
    stockMap[idStr] = initial;
    localStorage.setItem('vfs_product_stock', JSON.stringify(stockMap));
    return initial;
  },

  saveProductStock: async function(productId, stock) {
    const idStr = String(productId);
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('product_stock').doc(idStr).set({ stock: stock });
        return;
      } catch(e) {
        console.error("Firestore write stock error:", e);
      }
    }
    const local = localStorage.getItem('vfs_product_stock');
    const stockMap = local ? JSON.parse(local) : {};
    stockMap[idStr] = stock;
    localStorage.setItem('vfs_product_stock', JSON.stringify(stockMap));
  },

  // ── Birthday ──
  getBirthday: async function(phone) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const doc = await window.db.collection('customer_birthdays').doc(phone).get();
        if (doc.exists) return doc.data();
        return null;
      } catch(e) {
        console.error("Firestore read birthday error:", e);
      }
    }
    const local = localStorage.getItem('vfs_birthdays');
    const map = local ? JSON.parse(local) : {};
    return map[phone] || null;
  },

  saveBirthday: async function(phone, data) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('customer_birthdays').doc(phone).set(data);
        return;
      } catch(e) {
        console.error("Firestore write birthday error:", e);
      }
    }
    const local = localStorage.getItem('vfs_birthdays');
    const map = local ? JSON.parse(local) : {};
    map[phone] = data;
    localStorage.setItem('vfs_birthdays', JSON.stringify(map));
  },

  // ── Banners ──
  getBanners: async function() {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const snap = await window.db.collection('banners').orderBy('createdAt', 'desc').get();
        const banners = [];
        snap.forEach(doc => banners.push({ id: doc.id, ...doc.data() }));
        return banners;
      } catch(e) {
        console.error("Firestore read banners error:", e);
      }
    }
    const local = localStorage.getItem('vfs_banners');
    return local ? JSON.parse(local) : [];
  },

  saveBanner: async function(banner) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('banners').doc(banner.id).set(banner);
        return;
      } catch(e) {
        console.error("Firestore write banner error:", e);
      }
    }
    const local = localStorage.getItem('vfs_banners');
    const list = local ? JSON.parse(local) : [];
    list.unshift(banner);
    localStorage.setItem('vfs_banners', JSON.stringify(list));
  },

  deleteBanner: async function(bannerId) {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        await window.db.collection('banners').doc(bannerId).delete();
        return;
      } catch(e) {
        console.error("Firestore delete banner error:", e);
      }
    }
    const local = localStorage.getItem('vfs_banners');
    const list = local ? JSON.parse(local) : [];
    const filtered = list.filter(b => b.id !== bannerId);
    localStorage.setItem('vfs_banners', JSON.stringify(filtered));
  },

  // ── Customers (Wholesale) ──
  getCustomers: async function() {
    if (window.VFS_CLOUD_ACTIVE) {
      try {
        const snap = await window.db.collection('wholesale_users').get();
        const customers = [];
        snap.forEach(doc => customers.push({ id: doc.id, ...doc.data() }));
        return customers;
      } catch(e) {
        console.error("Firestore read customers error:", e);
      }
    }
    const local = localStorage.getItem('vfs_wholesale_customers');
    return local ? JSON.parse(local) : [];
  }
};


function getFullCatalog() {
  if (window.VFS_PRODUCTS_CACHE && window.VFS_PRODUCTS_CACHE.length > 0) {
    return window.VFS_PRODUCTS_CACHE;
  }
  return PRODUCTS;
}

const CATEGORY_BANNERS = {
  kadas: { title: "Kadas Collection", desc: "Premium handcrafted daily-wear gold plated Kadas.", img: "https://res.cloudinary.com/cwx4zame/image/upload/v1783178917/whbmflasdurxiag7au7t.jpg" },
  chains: { title: "Chains Collection", desc: "Classic and luxury gold-plated chains and necklaces.", img: "https://res.cloudinary.com/cwx4zame/image/upload/v1783178938/vza7byllycs7nmz8bwdq.jpg" },
  earrings: { title: "Ear Rings Collection", desc: "Dazzling handcrafted ear rings for every occasion.", img: "https://res.cloudinary.com/cwx4zame/image/upload/v1783694425/kuk50yyh9yzosthcsxkk.png" }
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
window.VFS_STOCK_CACHE = {};
let cart = [];
try {
  const storedCart = localStorage.getItem('vfs_cart');
  cart = storedCart ? JSON.parse(storedCart) : [];
  if (!Array.isArray(cart)) cart = [];
  
  // 24-Hour Cart Expiration: Remove items added more than 24 hours ago
  const now = Date.now();
  let expired = false;
  cart = cart.map(item => {
    if (!item.addedAt) item.addedAt = now;
    return item;
  }).filter(item => {
    if (now - item.addedAt > 24 * 60 * 60 * 1000) {
      expired = true;
      return false;
    }
    return true;
  });
  if (expired) {
    localStorage.setItem('vfs_cart', JSON.stringify(cart));
  }
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
const clOpt = (url, width) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  if (url.includes('/f_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};

// ── Shopping Mode State (Retail/Wholesale) ──
let shoppingMode = localStorage.getItem('vfs_shopping_mode') || 'retail';
let wholesaleUser = null;
let tempPhone = '';
try {
  const storedUser = localStorage.getItem('vfs_wholesale_user');
  wholesaleUser = storedUser ? JSON.parse(storedUser) : null;
} catch (e) {
  wholesaleUser = null;
}
let wholesaleUnlocked = localStorage.getItem('vfs_wholesale_unlocked') === 'true';

async function checkWholesaleStatus() {
  if (!wholesaleUser) return;
  if (window.VFS_CLOUD_ACTIVE && window.db) {
    try {
      const uid = wholesaleUser.uid || ('phone-' + wholesaleUser.phone);
      const doc = await window.db.collection('wholesale_users').doc(uid).get();
      if (doc.exists) {
        const data = doc.data();
        wholesaleUser = data;
        wholesaleUnlocked = data.unlocked === true;
        saveState();
        updateModeUI();
      }
    } catch (e) {
      console.warn("Error syncing wholesale status:", e);
    }
  }
}

// Google redirect authentication handler on page load
function handleGoogleRedirectResult() {
  if (!window.firebase) return;
  firebase.auth().getRedirectResult().then(async (result) => {
    if (result && result.user) {
      const user = result.user;
      toast("Google Authentication successful! 🌸");
      
      let userData = null;
      if (window.VFS_CLOUD_ACTIVE && window.db) {
        const doc = await window.db.collection('wholesale_users').doc(user.uid).get();
        if (doc.exists) {
          userData = doc.data();
        }
      } else {
        const mockUsers = JSON.parse(localStorage.getItem('vfs_wholesale_users') || '{}');
        if (mockUsers[user.uid]) userData = mockUsers[user.uid];
      }
      
      if (userData) {
        wholesaleUser = userData;
        shoppingMode = 'wholesale';
        wholesaleUnlocked = userData.unlocked === true;
        saveState();
        updateModeUI();
        renderProducts(null);
        if (!wholesaleUnlocked) {
          if (window.VFS_OPEN_UNLOCK_MODAL) {
            window.VFS_OPEN_UNLOCK_MODAL();
          }
        }
      } else {
        // Pre-fill profile registration
        tempPhone = user.phoneNumber || '';
        $('#regNameInput').value = user.displayName || '';
        window._googleUser = user;
        
        // Show login modal directly on registration step
        $('#loginStepPhone').style.display = 'none';
        $('#loginStepOTP').style.display = 'none';
        $('#loginStepRegister').style.display = 'block';
        $('#wholesaleLoginModal').classList.add('active');
      }
    }
  }).catch((err) => {
    console.error("Redirect Sign-in error:", err);
    toast("Sign in failed: " + err.message);
  });
}

// Call check status and handle redirect on startup
setTimeout(() => {
  checkWholesaleStatus();
  handleGoogleRedirectResult();
}, 2000);

function saveState() {
  localStorage.setItem('vfs_cart', JSON.stringify(cart));
  localStorage.setItem('vfs_wl', JSON.stringify(wishlist));
  localStorage.setItem('vfs_shopping_mode', shoppingMode);
  if (wholesaleUser) {
    localStorage.setItem('vfs_wholesale_user', JSON.stringify(wholesaleUser));
  } else {
    localStorage.removeItem('vfs_wholesale_user');
  }
  localStorage.setItem('vfs_wholesale_unlocked', wholesaleUnlocked ? 'true' : 'false');
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

// ── State for Lazy Loading / Horizontal Infinite Scroll ──
const LOADED_COUNTS = {};
const BATCH_SIZE = 12;

function isProductVisible(p) {
  const now = Date.now();
  const stock = window.VFS_STOCK_CACHE[p.id];
  // If product is older than 7 days (1 week) and has stock > 0 (remains unsold), hide it
  if (p.createdAt && (now - p.createdAt > 7 * 24 * 60 * 60 * 1000) && (stock > 0)) {
    return false;
  }
  return true;
}

function getRetailPriceInfo(p) {
  const basePrice = p.price || 499;
  const baseMrp = p.mrp || Math.round(basePrice * 1.5);
  let currentPrice = basePrice;
  let badge = p.badge || '';
  let isSale = false;

  if (p.createdAt) {
    const now = Date.now();
    const ageMs = now - p.createdAt;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    // Calculate the first Sunday following the createdAt timestamp
    const createdDate = new Date(p.createdAt);
    const dayOfWeek = createdDate.getDay(); 
    const daysToSunday = (7 - dayOfWeek) % 7;
    
    // Set first Sunday end timestamp (23:59:59.999)
    const nextSunday = new Date(p.createdAt);
    nextSunday.setDate(createdDate.getDate() + daysToSunday);
    nextSunday.setHours(23, 59, 59, 999);

    const firstSundayPassed = now > nextSunday.getTime();

    if (ageDays >= 28) {
      // 4 weeks: 50% price drop + Sale badge
      currentPrice = Math.round(basePrice * 0.5);
      badge = 'Sale';
      isSale = true;
    } else if (firstSundayPassed) {
      // Unsold by next Sunday: 25% price drop
      currentPrice = Math.round(basePrice * 0.75);
    }
  }

  return {
    price: currentPrice,
    mrp: baseMrp,
    badge: badge,
    isSale: isSale
  };
}

function getCurrentProductPrice(p) {
  if (shoppingMode === 'retail') {
    return getRetailPriceInfo(p).price;
  } else {
    return p.wholesalePrice || Math.round((p.price || 499) * 0.6);
  }
}

// ── Render Product Grid (Horizontal Scrolling Categories) ──
function renderProducts(filter) {
  const container = $('#categoryTracksContainer');
  if (!container) return;
  container.innerHTML = "";

  const fullCatalog = getFullCatalog();
  
  let categories = [];
  if (filter && filter !== 'all' && filter !== 'sale') {
    categories = [filter];
  } else {
    // Extract unique categories present in the catalog dynamically
    const uniqueCats = new Set(fullCatalog.map(p => p.cat).filter(Boolean));
    categories = Array.from(uniqueCats);
    
    // Sort standard ones first
    const standardOrder = ['kadas', 'chains', 'earrings'];
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
    let list = fullCatalog.filter(p => p.cat === cat && isProductVisible(p));
    if (filter === 'sale') {
      list = list.filter(p => {
        const info = getRetailPriceInfo(p);
        return info && info.badge === '50% OFF';
      });
    }
    if (list.length === 0) return;

    // Reset loaded count for this category when full catalog renders/filters
    LOADED_COUNTS[cat] = BATCH_SIZE;
    const visibleList = list.slice(0, BATCH_SIZE);

    const bannerInfo = CATEGORY_BANNERS[cat] || { 
      title: cat.charAt(0).toUpperCase() + cat.slice(1) + " Collection", 
      desc: "Premium handcrafted VFS creations.", 
      img: "assets/hero_banner.webp" 
    };

    const trackHtml = `
      <div class="category-track-row" data-category="${cat}">
        <!-- Category Banner -->
        <div class="category-banner" style="background-image: url('${clOpt(bannerInfo.img, 1200)}')">
          <div class="category-banner-overlay">
            <h2>${bannerInfo.title}</h2>
            <p>${bannerInfo.desc}</p>
          </div>
        </div>
        <!-- Horizontal Scroll Container -->
        <div class="product-row-scroll" id="scrollRow_${cat}">
          ${visibleList.map(p => {
            const isWL = wishlist.includes(p.id);
            
            const stockVal = window.VFS_STOCK_CACHE[p.id];
            const isOOS = (stockVal !== undefined && stockVal <= 0);
            
            let priceHtml = '';
            let quickActionHtml = '';
            
            if (shoppingMode === 'retail') {
              const priceInfo = getRetailPriceInfo(p);
              const retailPrice = priceInfo.price;
              const retailMrp = priceInfo.mrp;
              const isDiscounted = retailMrp > retailPrice;
              const off = isDiscounted ? pct(retailPrice, retailMrp) : 0;
              
              priceHtml = `
                <span class="price-now">${fmt(retailPrice)}</span>
                ${isDiscounted ? `
                  <span class="price-was">${fmt(retailMrp)}</span>
                  <span class="price-off">${off}% OFF</span>
                ` : ''}
              `;
              
              quickActionHtml = `<div class="p-quick" data-add="${p.id}">Add to Cart</div>`;
            } else {
              // Wholesale mode
              if (!wholesaleUnlocked) {
                priceHtml = `<span class="price-now" style="font-size:1.15rem; color:#ff3b30; font-weight:700;">🔒 Locked (Pay Advance)</span>`;
                quickActionHtml = `<div class="p-quick unlock-prices-btn" style="background:#D4AF37; color:#121212; font-weight:700;">Unlock Prices</div>`;
              } else {
                const wsPrice = p.wholesalePrice || Math.round((p.price || 499) * 0.6);
                const retailMrp = p.mrp || Math.round((p.price || 499) * 1.5);
                const off = pct(wsPrice, retailMrp);
                
                priceHtml = `
                  <span class="price-now" style="color:var(--color-primary);">${fmt(wsPrice)}</span>
                  <span class="price-was">${fmt(retailMrp)}</span>
                  <span class="price-off">${off}% OFF</span>
                `;
                quickActionHtml = `<div class="p-quick" data-add="${p.id}">Add to Cart</div>`;
              }
            }
            
            if (isOOS) {
              quickActionHtml = `<div class="p-quick" style="background:#555;color:#ccc;cursor:not-allowed;font-weight:700;">Sold Out</div>`;
            }
            
            const dynamicBadge = (shoppingMode === 'retail') ? getRetailPriceInfo(p).badge : (p.badge || '');
            
            return `
              <div class="p-card" data-id="${p.id}">
                ${isOOS ? `<span class="p-badge" style="background:#ff3b30;color:#fff;">Sold Out</span>` : (dynamicBadge ? `<span class="p-badge${dynamicBadge === 'Sale' ? ' sale' : ''}">${dynamicBadge}</span>` : '')}
                <button class="p-wish${isWL ? ' active' : ''}" data-wl="${p.id}" aria-label="Wishlist">
                  <svg viewBox="0 0 24 24" fill="${isWL ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
                </button>
                <div class="p-img">
                  <img src="${clOpt(p.img, 400)}" alt="${p.name}" loading="lazy">
                  ${quickActionHtml}
                </div>
                <div class="p-info">
                  <div class="p-meta">${p.meta}</div>
                  <div class="p-name">${p.name}</div>
                  <div class="p-rating"><span class="stars">${stars(p.rating)}</span><span class="count">(${p.reviews})</span></div>
                  <div class="p-prices">
                    ${priceHtml}
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', trackHtml);

    // Attach horizontal scroll listener for lazy loading (infinite scroll)
    const scrollRow = document.getElementById(`scrollRow_${cat}`);
    if (scrollRow) {
      scrollRow.addEventListener('scroll', () => {
        // If scrolled within 300px of the right end, load the next batch
        if (scrollRow.scrollLeft + scrollRow.clientWidth >= scrollRow.scrollWidth - 300) {
          if ((LOADED_COUNTS[cat] || BATCH_SIZE) < list.length) {
            loadNextBatch(cat, list, scrollRow);
          }
        }
      });
    }
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

  container.querySelectorAll('.inquire-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = +btn.closest('.p-card').dataset.id;
      const product = getFullCatalog().find(x => x.id === id);
      const text = `Hi VFS Jewels, I would like to inquire about the price of Kada: ${product.name} (SKU: ZU1-${product.id}).`;
      window.open(`https://api.whatsapp.com/send?phone=919840757363&text=${encodeURIComponent(text)}`, '_blank');
    });
  });

  container.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(+btn.dataset.add);
    });
  });

  container.querySelectorAll('.unlock-prices-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.VFS_OPEN_UNLOCK_MODAL) {
        window.VFS_OPEN_UNLOCK_MODAL();
      }
    });
  });

  container.querySelectorAll('.p-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = +card.dataset.id;
      openPDP(id);
    });
  });
}

// ── Horizontal Infinite Scroll: Load and append next batch of items ──
function loadNextBatch(cat, list, scrollRow) {
  const currentCount = LOADED_COUNTS[cat] || BATCH_SIZE;
  if (currentCount >= list.length) return;

  const nextCount = currentCount + BATCH_SIZE;
  LOADED_COUNTS[cat] = nextCount;

  const newItems = list.slice(currentCount, nextCount);
  const newCardElements = [];

  newItems.forEach(p => {
    const isWL = wishlist.includes(p.id);
    
    let priceHtml = '';
    let quickActionHtml = '';
    
    if (shoppingMode === 'retail') {
      const priceInfo = getRetailPriceInfo(p);
      const retailPrice = priceInfo.price;
      const retailMrp = priceInfo.mrp;
      const isDiscounted = retailMrp > retailPrice;
      const off = isDiscounted ? pct(retailPrice, retailMrp) : 0;
      
      priceHtml = `
        <span class="price-now">${fmt(retailPrice)}</span>
        ${isDiscounted ? `
          <span class="price-was">${fmt(retailMrp)}</span>
          <span class="price-off">${off}% OFF</span>
        ` : ''}
      `;
      
      quickActionHtml = `<div class="p-quick" data-add="${p.id}">Add to Cart</div>`;
    } else {
      // Wholesale mode
      if (!wholesaleUnlocked) {
        priceHtml = `<span class="price-now" style="font-size:1.15rem; color:#ff3b30; font-weight:700;">🔒 Locked (Pay Advance)</span>`;
        quickActionHtml = `<div class="p-quick unlock-prices-btn" style="background:#D4AF37; color:#121212; font-weight:700;">Unlock Prices</div>`;
      } else {
        const wsPrice = p.wholesalePrice || Math.round((p.price || 499) * 0.6);
        const retailMrp = p.mrp || Math.round((p.price || 499) * 1.5);
        const off = pct(wsPrice, retailMrp);
        
        priceHtml = `
          <span class="price-now" style="color:var(--color-primary);">${fmt(wsPrice)}</span>
          <span class="price-was">${fmt(retailMrp)}</span>
          <span class="price-off">${off}% OFF</span>
        `;
        quickActionHtml = `<div class="p-quick" data-add="${p.id}">Add to Cart</div>`;
      }
    }
    
    const stockVal = window.VFS_STOCK_CACHE[p.id];
    const isOOS = (stockVal !== undefined && stockVal <= 0);
    
    if (isOOS) {
      quickActionHtml = `<div class="p-quick" style="background:#555;color:#ccc;cursor:not-allowed;font-weight:700;">Sold Out</div>`;
    }
    
    const dynamicBadge = (shoppingMode === 'retail') ? getRetailPriceInfo(p).badge : (p.badge || '');
    
    const cardHtml = `
      <div class="p-card" data-id="${p.id}">
        ${isOOS ? `<span class="p-badge" style="background:#ff3b30;color:#fff;">Sold Out</span>` : (dynamicBadge ? `<span class="p-badge${dynamicBadge === 'Sale' ? ' sale' : ''}">${dynamicBadge}</span>` : '')}
        <button class="p-wish${isWL ? ' active' : ''}" data-wl="${p.id}" aria-label="Wishlist">
          <svg viewBox="0 0 24 24" fill="${isWL ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
        </button>
        <div class="p-img">
          <img src="${clOpt(p.img, 400)}" alt="${p.name}" loading="lazy">
          ${quickActionHtml}
        </div>
        <div class="p-info">
          <div class="p-meta">${p.meta}</div>
          <div class="p-name">${p.name}</div>
          <div class="p-rating"><span class="stars">${stars(p.rating)}</span><span class="count">(${p.reviews})</span></div>
          <div class="p-prices">
            ${priceHtml}
          </div>
        </div>
      </div>
    `;
    
    const cardWrapper = document.createElement('div');
    cardWrapper.innerHTML = cardHtml.trim();
    const cardEl = cardWrapper.firstChild;
    scrollRow.appendChild(cardEl);
    newCardElements.push(cardEl);
  });

  // Bind local event listeners to the dynamically appended cards
  newCardElements.forEach(card => {
    // 1. Wishlist button
    const wlBtn = card.querySelector('[data-wl]');
    if (wlBtn) {
      wlBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = +wlBtn.dataset.wl;
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
    }

    // 2. Inquire button
    const inquireBtn = card.querySelector('.inquire-btn');
    if (inquireBtn) {
      inquireBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = +card.dataset.id;
        const product = getFullCatalog().find(x => x.id === id);
        const text = `Hi VFS Jewels, I would like to inquire about the price of Kada: ${product.name} (SKU: ZU1-${product.id}).`;
        window.open(`https://api.whatsapp.com/send?phone=919840757363&text=${encodeURIComponent(text)}`, '_blank');
      });
    }

    // 3. Add to cart button
    const addBtn = card.querySelector('[data-add]');
    if (addBtn) {
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(+addBtn.dataset.add);
      });
    }

    // 3b. Unlock prices button
    const unlockBtn = card.querySelector('.unlock-prices-btn');
    if (unlockBtn) {
      unlockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.VFS_OPEN_UNLOCK_MODAL) {
          window.VFS_OPEN_UNLOCK_MODAL();
        }
      });
    }

    // 4. Click card to open modal details
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

// All links with data-filter attributes
$$('a[data-filter]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    currentFilter = a.dataset.filter;
    renderProducts(currentFilter);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });
});

window.filterCat = function(cat) {
  currentFilter = cat;
  renderProducts(cat);
  const el = document.getElementById('products');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

// ── Cart Logic ──
function addToCart(id, qty = 1) {
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty += qty;
    existing.addedAt = Date.now();
  } else {
    cart.push({ id, qty, addedAt: Date.now() });
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
    const unitPrice = getCurrentProductPrice(p);
    total += unitPrice * ci.qty;
    return `
      <div class="dw-item" data-id="${p.id}">
        <img class="dw-item-img dw-pdp-link" src="${clOpt(p.img, 150)}" alt="${p.name}" style="cursor:pointer">
        <div>
          <div class="dw-item-meta">${p.meta}</div>
          <div class="dw-item-name dw-pdp-link" style="cursor:pointer">${p.name}</div>
          <div class="dw-item-price">${fmt(unitPrice)}</div>
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
        ci.addedAt = Date.now();
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
        <img class="dw-item-img dw-pdp-link" src="${clOpt(p.img, 150)}" alt="${p.name}" style="cursor:pointer">
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
async function renderTestimonials() {
  const container = $('#googleReviewsMarquee');
  if (!container) return;
  
  let approvedReviews = [];
  try {
    const list = await window.VFS_DB.getReviews();
    approvedReviews = list.filter(r => r.status === 'approved');
  } catch(e) {
    console.error("Failed to load custom testimonials:", e);
  }

  const customTestimonials = approvedReviews.map(r => ({
    name: r.name,
    text: r.text,
    rating: r.rating || 5,
    fileUrl: r.fileUrl,
    fileType: r.fileType
  }));

  const allReviews = [...TESTIMONIALS, ...customTestimonials];
  
  // Duplicate list to achieve continuous infinite scroll loop
  const list = [...allReviews, ...allReviews];
  container.innerHTML = list.map(t => {
    let mediaHtml = '';
    if (t.fileUrl) {
      if (t.fileType === 'video') {
        mediaHtml = `
          <div style="margin-top: 8px; text-align: center;">
            <video src="${t.fileUrl}" style="max-height: 80px; max-width: 100%; border-radius: 4px;" controls muted></video>
          </div>`;
      } else {
        mediaHtml = `
          <div style="margin-top: 8px; text-align: center;">
            <img src="${t.fileUrl}" style="max-height: 80px; max-width: 100%; border-radius: 4px; object-fit: cover;">
          </div>`;
      }
    }

    const starsHtml = '★'.repeat(t.rating || 5) + '☆'.repeat(5 - (t.rating || 5));

    return `
      <div class="review-marquee-card" style="min-width: 220px; display: inline-block; vertical-align: top; margin-right: 15px;">
        <div class="rev-card-head">
          <span class="rev-card-name">${t.name}</span>
          <span class="rev-card-badge">Verified Buyer</span>
        </div>
        <div class="rev-card-stars" style="color: var(--color-secondary);">${starsHtml}</div>
        <div class="rev-card-text">"${t.text}"</div>
        ${mediaHtml}
      </div>`;
  }).join('');
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
    pruneCart();
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
    isProductVisible(p) && (
      p.name.toLowerCase().includes(q) ||
      p.cat.includes(q) ||
      p.meta.toLowerCase().includes(q)
    )
  );

  results.innerHTML = matches.length
    ? matches.map(p => `
        <div class="sr-item" data-sr="${p.id}">
          <img class="sr-img" src="${clOpt(p.img, 150)}" alt="${p.name}">
          <div class="sr-info"><h4>${p.name}</h4><span>${p.priceOnRequest ? 'Price on Request' : fmt(p.price)}</span></div>
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
    res.innerHTML = `✓ Delivery available! Estimated ${days}–${days + 2} business days.<br><span style="font-weight:700;color:var(--color-secondary)">Express Shipping: ₹90 applies!</span>`;
  });
}


// ── Dynamic Checkout & Payments ──
let activeCheckoutOrder = null;

function openCheckout() {
  if (!cart.length) {
    toast('Your cart is empty! Add products first.');
    return;
  }
  
  if (shoppingMode === 'wholesale') {
    const subtotal = cart.reduce((sum, item) => {
      const p = getProduct(item.id);
      if (!p) return sum;
      const price = getWholesalePrice(p);
      return sum + (price * item.qty);
    }, 0);
    
    if (subtotal < 4000) {
      alert('Wholesale Minimum Order Value (MOQ) is ₹4,000. Your current cart subtotal is ' + fmt(subtotal) + '. Please add more items to proceed.');
      return;
    }
  }
  
  closeDrawer('cart');
  
  // Show shipping form (step 1) and reset other steps
  $('#coStep1').style.display = 'block';
  $('#coStep2').style.display = 'none';
  $('#coStep3').style.display = 'none';
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
// Automatically check wallet balance and coupons when phone number is entered
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

async function updateEligibleCoupons() {
  const phoneVal = $('#coPhone').value.trim();
  const cleanPhone = phoneVal.replace(/\D/g, '').slice(-10);
  const couponSelect = $('#coCouponSelect');
  if (!couponSelect) return;
  
  couponSelect.innerHTML = '<option value="">No Coupon Applied</option>';
  
  if (cleanPhone.length === 10) {
    // 1. Birthday coupon
    const bdayCoupon = localStorage.getItem(`vfs_bday_coupon_unlocked_${cleanPhone}`);
    const bdayUsed = localStorage.getItem(`vfs_bday_coupon_used_${cleanPhone}`);
    if (bdayCoupon === 'true' && bdayUsed !== 'true') {
      couponSelect.insertAdjacentHTML('beforeend', '<option value="BDAY3">Birthday Reward Code: BDAY3 (3% OFF)</option>');
    }
    
    // 2. Loyalty coupons based on lifetime purchases
    try {
      const orders = await window.VFS_DB.getOrders();
      // Only completed (paid) orders
      const completed = orders.filter(o => o.phone === cleanPhone && o.status === 'paid');
      const totalSpend = completed.reduce((sum, o) => sum + o.total, 0);
      
      if (totalSpend >= 100000) {
        couponSelect.insertAdjacentHTML('beforeend', '<option value="LOYAL100">Loyalty Tier 1: LOYAL100 (3% OFF)</option>');
      }
      
      const extraIntervals = Math.floor((totalSpend - 100000) / 50000);
      for (let i = 1; i <= extraIntervals; i++) {
        const code = `LOYAL${100 + i * 50}`;
        couponSelect.insertAdjacentHTML('beforeend', `<option value="${code}">Loyalty Tier ${i+1}: ${code} (3% OFF)</option>`);
      }
    } catch (err) {
      console.warn("Loyalty coupon lookup failed:", err);
    }
  }
}

function handlePhoneInput() {
  checkWalletBalance();
  updateEligibleCoupons();
}

$('#coPhone').addEventListener('input', handlePhoneInput);
$('#coPhone').addEventListener('change', handlePhoneInput);

// Checkout Step 1 Shipping form submission
$('#coForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const gstIN = $('#coGST').value.trim().toUpperCase();
  if (gstIN && gstIN.length !== 15) {
    toast('Please enter a valid 15-digit GSTIN (or leave it blank)');
    return;
  }

  const fullCatalog = getFullCatalog();
  let subtotal = 0;
  
  const itemsList = cart.map(ci => {
    const p = fullCatalog.find(x => x.id === ci.id);
    const unitPrice = getCurrentProductPrice(p);
    subtotal += unitPrice * ci.qty;
    return { id: p.id, sku: p.sku || `SN-${String(p.id).padStart(4, '0')}`, name: p.name, price: unitPrice, qty: ci.qty };
  });
  
  const gstAmount = Math.round(subtotal * 0.03);
  const shippingCost = 90;
  
  // Calculate Wholesale Advance Deduction if applicable
  let advanceDeduction = 0;
  if (shoppingMode === 'wholesale') {
    const isFirst = !wholesaleUser || wholesaleUser.ordersCount === 0;
    advanceDeduction = isFirst ? 1000 : 500;
  }

  // Calculate Coupon Discount (3% of subtotal)
  let couponDiscount = 0;
  const couponSelect = $('#coCouponSelect');
  const couponCode = couponSelect ? couponSelect.value : '';
  if (couponCode) {
    couponDiscount = Math.round(subtotal * 0.03);
  }

  let grandTotal = subtotal + gstAmount + shippingCost - advanceDeduction - couponDiscount;
  
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
  
  grandTotal = Math.max(0, grandTotal);

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
    gstAmount: gstAmount,
    gstNumber: gstIN,
    advanceAdjusted: advanceDeduction,
    couponCode: couponCode,
    couponDiscount: couponDiscount,
    walletDiscount: walletDiscount,
    total: grandTotal,
    status: 'unpaid', // unpaid/paid
    trackingId: ''
  };
  
  activeCheckoutOrder = newOrder;

  // Render Step 2 Payment details
  $('#coSumSubtotal').textContent = fmt(subtotal);
  $('#coSumGST').textContent = fmt(gstAmount);
  $('#coSumShipping').textContent = fmt(shippingCost);
  
  if (walletDiscount > 0) {
    $('#coSumDiscountRow').style.display = 'flex';
    $('#coSumDiscount').textContent = `-${fmt(walletDiscount)}`;
  } else {
    $('#coSumDiscountRow').style.display = 'none';
  }
  
  if (couponDiscount > 0) {
    $('#coSumCouponRow').style.display = 'flex';
    $('#coSumCouponCode').textContent = couponCode;
    $('#coSumCouponAmount').textContent = `-${fmt(couponDiscount)}`;
  } else {
    $('#coSumCouponRow').style.display = 'none';
  }
  
  if (advanceDeduction > 0) {
    $('#coSumAdvanceRow').style.display = 'flex';
    $('#coSumAdvance').textContent = `-${fmt(advanceDeduction)}`;
  } else {
    $('#coSumAdvanceRow').style.display = 'none';
  }
  
  $('#coSumTotal').textContent = fmt(grandTotal);
  
  // Create UPI URI using your real payment receiver details (8939086608@fam)
  const upiURI = `upi://pay?pa=8939086608@fam&pn=VFS%20Jewels&am=${grandTotal}&cu=INR&tn=Order%20${newOrder.id}`;

  // Use custom static QR code image uploaded by user
  $('#coQRWrapper').innerHTML = `<img src="https://res.cloudinary.com/cwx4zame/image/upload/v1783183761/a4hfmqgh7wxjuzucvutj.png" alt="UPI QR Code" style="width:180px;height:180px;display:block;margin:0 auto;object-fit:contain;">`;
  
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

    // Mark birthday coupon as used if applied
    if (activeCheckoutOrder.couponCode === 'BDAY3') {
      localStorage.setItem(`vfs_bday_coupon_used_${activeCheckoutOrder.phone}`, 'true');
      localStorage.removeItem(`vfs_bday_coupon_unlocked_${activeCheckoutOrder.phone}`);
    }

    // Deduct purchased items from stock ledger
    const stockPromises = activeCheckoutOrder.items.map(async (item) => {
      const currentStock = await window.VFS_DB.getProductStock(item.id);
      const newStock = Math.max(0, currentStock - item.qty);
      await window.VFS_DB.saveProductStock(item.id, newStock);
      window.VFS_STOCK_CACHE[item.id] = newStock;
    });
    await Promise.all(stockPromises);

    // If wholesale mode, increment ordersCount and relock prices (for next order)
    if (shoppingMode === 'wholesale' && wholesaleUser) {
      wholesaleUser.ordersCount = (wholesaleUser.ordersCount || 0) + 1;
      localStorage.setItem('vfs_wholesale_user', JSON.stringify(wholesaleUser));
      
      const mockUsers = JSON.parse(localStorage.getItem('vfs_wholesale_users') || '{}');
      mockUsers[wholesaleUser.phone] = wholesaleUser;
      localStorage.setItem('vfs_wholesale_users', JSON.stringify(mockUsers));
      
      // Auto lock pricing for next order
      wholesaleUnlocked = false;
      saveState();
    }

    // Trigger local products view re-render to reflect OOS / Sold Out statuses
    renderProducts(currentFilter);

  } catch (err) {
    console.error("Order submission, wallet debit, or stock deduction failed:", err);
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
*Carrier Partner:* ${activeCheckoutOrder.carrier}\n`;

  if (activeCheckoutOrder.gstNumber) {
    waMessage += `*GSTIN:* ${activeCheckoutOrder.gstNumber}\n`;
  }

  waMessage += `----------------------------------
*Items Ordered:*
${itemsSummaryText}
----------------------------------
*Subtotal:* ₹${activeCheckoutOrder.subtotal}
*GST (3%):* ₹${activeCheckoutOrder.gstAmount}
*Delivery Fee:* ₹${activeCheckoutOrder.shipping}\n`;

  if (activeCheckoutOrder.walletDiscount && activeCheckoutOrder.walletDiscount > 0) {
    waMessage += `*Wallet Discount:* -₹${activeCheckoutOrder.walletDiscount}\n`;
  }
  
  if (activeCheckoutOrder.couponCode && activeCheckoutOrder.couponDiscount > 0) {
    waMessage += `*Coupon Discount (${activeCheckoutOrder.couponCode}):* -₹${activeCheckoutOrder.couponDiscount}\n`;
  }
  
  if (activeCheckoutOrder.advanceAdjusted && activeCheckoutOrder.advanceAdjusted > 0) {
    waMessage += `*Wholesale Advance Adjusted:* -₹${activeCheckoutOrder.advanceAdjusted}\n`;
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

  // PDF Invoice Download button
  const pdfBtn = $('#successPdfBtn');
  if (pdfBtn) {
    const newPdfBtn = pdfBtn.cloneNode(true);
    pdfBtn.parentNode.replaceChild(newPdfBtn, pdfBtn);
    newPdfBtn.addEventListener('click', () => {
      downloadInvoicePDF(activeCheckoutOrder);
    });
  }

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
    images = [p.img];
  } else {
    images = ['assets/hero_banner.webp'];
  }
  
  // Render scrollable images slider
  mainImgContainer.innerHTML = `
    <div class="pdp-images-slider" style="display:flex; overflow-x:auto; scroll-snap-type:x mandatory; width:100%; height:100%; scrollbar-width:none; -ms-overflow-style:none;">
      ${images.map((imgSrc, idx) => `
        <img src="${clOpt(imgSrc, 800)}" alt="${p.name} - Image ${idx+1}" style="flex:0 0 100%; width:100%; height:100%; object-fit:contain; scroll-snap-align:start; background:#fff;">
      `).join('')}
    </div>
  `;

  mainImgContainer.onclick = () => {
    const sliderEl = mainImgContainer.querySelector('.pdp-images-slider');
    if (sliderEl && window.VFS_OPEN_IMAGE_ZOOM) {
      const idx = Math.round(sliderEl.scrollLeft / sliderEl.clientWidth);
      const activeImg = sliderEl.querySelectorAll('img')[idx];
      if (activeImg) {
        window.VFS_OPEN_IMAGE_ZOOM(activeImg.src);
      }
    }
  };
  mainImgContainer.style.cursor = 'zoom-in';

  const thumbsContainer = $('#pdpThumbs');
  if (images.length > 1) {
    thumbsContainer.style.display = 'flex';
    thumbsContainer.innerHTML = images.map((imgSrc, idx) => `
      <div class="pdp-thumb ${idx === 0 ? 'active' : ''}" data-idx="${idx}">
        <img src="${imgSrc}" alt="${p.name} - Angle ${idx + 1}" style="object-fit:contain; background:#fff;">
      </div>
    `).join('');
  } else {
    thumbsContainer.style.display = 'none';
    thumbsContainer.innerHTML = '';
  }

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
  const infoContainer = $('#pdpInfo');
  
  const catLabel = p.cat ? p.cat.charAt(0).toUpperCase() + p.cat.slice(1) : 'Jewellery';
  const sku = `ZU1-${p.id}`;
  
  let priceHtml = '';
  let qtyCartHtml = '';
  
  if (shoppingMode === 'retail') {
    const priceInfo = getRetailPriceInfo(p);
    const retailPrice = priceInfo.price;
    const retailMrp = priceInfo.mrp;
    const isDisc = retailMrp > retailPrice;
    const offPct = isDisc ? pct(retailPrice, retailMrp) : 0;
    
    priceHtml = `
      <span class="pdp-price-now">${fmt(retailPrice)}</span>
      ${isDisc ? `
        <span class="pdp-price-was">${fmt(retailMrp)}</span>
        <span class="pdp-price-off">${offPct}% OFF</span>
      ` : ''}
    `;
    
    qtyCartHtml = `
      <div class="pdp-qty-selector">
        <button id="pdpQtyDec" class="pdp-qty-btn">−</button>
        <input type="number" id="pdpQtyInput" class="pdp-qty-input" value="1" min="1" readonly>
        <button id="pdpQtyInc" class="pdp-qty-btn">+</button>
      </div>
      <button class="pdp-btn-add-new" id="pdpBtnAdd" data-id="${p.id}">
        ADD TO CART
      </button>
    `;
  } else {
    // Wholesale Mode
    if (!wholesaleUnlocked) {
      priceHtml = `
        <span class="pdp-price-now" style="font-size: 1.8rem; font-weight:700; color:#ff3b30; display:flex; align-items:center; gap:6px;">
          🔒 Locked (Pay Advance to View)
        </span>
      `;
      qtyCartHtml = `
        <button class="pdp-btn-add-new" id="pdpUnlockTrigger" style="width: 100%; background: #D4AF37; border-color: #D4AF37; color: #121212; font-weight:700;">
          PAY ADVANCE TO UNLOCK WHOLESALE PRICES
        </button>
      `;
    } else {
      const wsPrice = p.wholesalePrice || Math.round((p.price || 499) * 0.6);
      const retailMrp = p.mrp || Math.round((p.price || 499) * 1.5);
      const offPct = pct(wsPrice, retailMrp);
      
      priceHtml = `
        <span class="pdp-price-now" style="color:var(--color-primary);">${fmt(wsPrice)} <span style="font-size:1.1rem;font-weight:400;color:#888;">(Wholesale Price)</span></span>
        <span class="pdp-price-was">${fmt(retailMrp)}</span>
        <span class="pdp-price-off">${offPct}% OFF</span>
      `;
      
      qtyCartHtml = `
        <div class="pdp-qty-selector">
          <button id="pdpQtyDec" class="pdp-qty-btn">−</button>
          <input type="number" id="pdpQtyInput" class="pdp-qty-input" value="1" min="1" readonly>
          <button id="pdpQtyInc" class="pdp-qty-btn">+</button>
        </div>
        <button class="pdp-btn-add-new" id="pdpBtnAdd" data-id="${p.id}">
          ADD TO CART
        </button>
      `;
    }
  }

  const stock = window.VFS_STOCK_CACHE[p.id];
  const isOutOfStock = (stock !== undefined && stock <= 0);
  if (isOutOfStock) {
    qtyCartHtml = `
      <button class="pdp-btn-add-new" disabled style="width: 100%; background: #ccc; border-color: #ccc; color: #666; cursor: not-allowed; font-weight: 700;">
        SOLD OUT / OUT OF STOCK
      </button>
    `;
  }

  infoContainer.innerHTML = `
    <h1 class="pdp-title">${p.name} ( ${sku} )</h1>
    
    <div class="pdp-price-box">
      ${priceHtml}
    </div>
    
    <div class="pdp-swipe-helper">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m17 7 5 5-5 5M7 7l-5 5 5 5M2 12h20"/></svg>
      <span>Swipe to see more products</span>
    </div>
    
    <div class="pdp-qty-cart-row">
      ${qtyCartHtml}
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
  
  if (qtyInput && btnDec && btnInc) {
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
  }

  const btnAdd = $('#pdpBtnAdd');
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      const isGiftChecked = $('#pdpGiftWrap').checked;
      const qty = qtyInput ? (parseInt(qtyInput.value) || 1) : 1;
      addToCart(p.id, qty);
      if (isGiftChecked) {
        addGiftWrapToCart();
      }
    });
  }

  const pdpUnlockTrigger = $('#pdpUnlockTrigger');
  if (pdpUnlockTrigger) {
    pdpUnlockTrigger.addEventListener('click', () => {
      // Close overlay
      $('#pdpOverlay').classList.remove('active');
      document.body.style.overflow = '';
      if (window.VFS_OPEN_UNLOCK_MODAL) {
        window.VFS_OPEN_UNLOCK_MODAL();
      }
    });
  }

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

  // 3. Related Products Tinder Swiper suggestions
  let swipeCount = 0;
  let hasRightSwiped = false;
  let tinderDeckIndex = 0;
  let swiperCategory = p.cat;

  function createTinderCardDOM(product, isTop) {
    const card = document.createElement('div');
    card.className = 'tinder-card';
    card.dataset.id = product.id;
    card.style.zIndex = isTop ? '10' : String(5 - product.id % 3);
    if (!isTop) {
      card.style.transform = `scale(0.95) translateY(10px)`;
      card.style.pointerEvents = 'none';
    }

    const isDiscounted = product.mrp && product.mrp > product.price;
    const off = isDiscounted ? pct(product.price, product.mrp) : 0;

    card.innerHTML = `
      <div class="tinder-badge dislike">NOPE</div>
      <div class="tinder-badge like">LIKE</div>
      <div class="tinder-img-box">
        <img src="${clOpt(product.img, 450)}" alt="${product.name}">
      </div>
      <div class="tinder-card-info">
        <div>
          <div class="tinder-meta">${product.meta}</div>
          <div class="tinder-name">${product.name}</div>
        </div>
        <div class="tinder-bottom-row">
          <div class="tinder-price">
            ${product.priceOnRequest ? `
              <span style="font-size: 1.25rem; font-weight:700; color:var(--color-secondary);">Price on Request</span>
            ` : `
              ${fmt(product.price)}
              ${isDiscounted ? `<span class="tinder-mrp">${fmt(product.mrp)}</span>` : ''}
            `}
          </div>
          <div style="font-size: 1.15rem; color: #ffb214; font-weight:700;">★ ${product.rating}</div>
        </div>
      </div>
    `;

    // Click navigation (if drag was small, open that product page)
    let startX = 0, startY = 0;
    card.addEventListener('mousedown', (e) => { startX = e.clientX; startY = e.clientY; });
    card.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; });
    card.addEventListener('click', (e) => {
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx < 8 && dy < 8) {
        openPDP(product.id);
        overlay.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    return card;
  }

  function initTinderSwiper() {
    const stack = $('#tinderCardStack');
    if (!stack) return;
    stack.innerHTML = "";

    const fullCatalog = getFullCatalog();
    const deckProducts = fullCatalog.filter(x => x.cat === swiperCategory && x.id !== p.id);

    if (deckProducts.length === 0) {
      stack.innerHTML = `
        <div class="tinder-card" style="display:flex;align-items:center;justify-content:center;padding:20px;text-align:center;pointer-events:none;transform:none;box-shadow:none;border:1px dashed #ccc;">
          <div>
            <div style="font-size:3rem;margin-bottom:12px;">🌟</div>
            <h4 style="font-size:1.5rem;font-weight:700;">All Items Viewed!</h4>
            <p style="font-size:1.2rem;color:#777;margin-top:6px;">Select a category below to browse.</p>
          </div>
        </div>
      `;
      return;
    }

    if (tinderDeckIndex >= deckProducts.length) {
      tinderDeckIndex = 0;
    }

    const cardsToLoad = Math.min(deckProducts.length, 3);
    for (let i = cardsToLoad - 1; i >= 0; i--) {
      const prodIdx = (tinderDeckIndex + i) % deckProducts.length;
      const product = deckProducts[prodIdx];
      const cardEl = createTinderCardDOM(product, i === 0);
      stack.appendChild(cardEl);
    }

    setupTopCardGesture();
  }

  function setupTopCardGesture() {
    const stack = $('#tinderCardStack');
    const cards = stack.querySelectorAll('.tinder-card');
    if (!cards.length) return;

    const topCard = cards[cards.length - 1];
    topCard.style.pointerEvents = 'auto';

    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let dragging = false;

    const likeBadge = topCard.querySelector('.tinder-badge.like');
    const dislikeBadge = topCard.querySelector('.tinder-badge.dislike');

    const startDrag = (clientX, clientY) => {
      dragging = true;
      startX = clientX;
      startY = clientY;
      topCard.style.transition = 'none';
    };

    const moveDrag = (clientX, clientY) => {
      if (!dragging) return;
      currentX = clientX - startX;
      currentY = clientY - startY;

      const rotate = currentX / 15;
      topCard.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;

      if (currentX > 20) {
        likeBadge.style.opacity = Math.min((currentX - 20) / 80, 1);
        dislikeBadge.style.opacity = 0;
      } else if (currentX < -20) {
        dislikeBadge.style.opacity = Math.min((-currentX - 20) / 80, 1);
        likeBadge.style.opacity = 0;
      } else {
        likeBadge.style.opacity = 0;
        dislikeBadge.style.opacity = 0;
      }
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;

      topCard.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';

      if (currentX > 100) {
        executeSwipe(true);
      } else if (currentX < -100) {
        executeSwipe(false);
      } else {
        topCard.style.transform = '';
        likeBadge.style.opacity = 0;
        dislikeBadge.style.opacity = 0;
      }
      currentX = 0;
      currentY = 0;
    };

    window.executeSwipe = (isLike) => {
      topCard.style.transition = 'transform 0.3s ease, opacity 0.3s';
      const flyX = isLike ? 600 : -600;
      topCard.style.transform = `translate(${flyX}px, ${currentY}px) rotate(${flyX / 15}deg)`;
      topCard.style.opacity = '0';

      const topCardId = +topCard.dataset.id;

      setTimeout(() => {
        topCard.remove();
        tinderDeckIndex++;
        swipeCount++;

        if (isLike) {
          hasRightSwiped = true;
          addToCart(topCardId);
        }

        initTinderSwiper();

        // 20 Swipes Threshold Trigger
        if (swipeCount >= 20 && !hasRightSwiped) {
          triggerCategoryShiftPrompt();
        }
      }, 220);
    };

    topCard.addEventListener('touchstart', (e) => {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    
    topCard.addEventListener('touchmove', (e) => {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    
    topCard.addEventListener('touchend', endDrag);

    topCard.addEventListener('mousedown', (e) => {
      startDrag(e.clientX, e.clientY);

      const mouseMoveHandler = (ev) => moveDrag(ev.clientX, ev.clientY);
      const mouseUpHandler = () => {
        endDrag();
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    });
  }

  function triggerCategoryShiftPrompt() {
    const modal = $('#categoryShiftModal');
    if (!modal) return;
    
    const optionsContainer = $('#catShiftOptions');
    // Get unique categories and filter out current
    const standardCategories = ['kadas', 'chains', 'earrings'];
    const otherCats = standardCategories.filter(c => c !== swiperCategory);
    
    optionsContainer.innerHTML = otherCats.map(cat => `
      <button class="cat-shift-btn" data-shift="${cat}">Explore ${cat}</button>
    `).join('');
    
    optionsContainer.querySelectorAll('[data-shift]').forEach(btn => {
      btn.addEventListener('click', () => {
        swiperCategory = btn.dataset.shift;
        tinderDeckIndex = 0;
        swipeCount = 0;
        hasRightSwiped = false;
        modal.classList.remove('active');
        initTinderSwiper();
      });
    });
    
    modal.classList.add('active');
  }

  // Bind keep swiping button
  const closeCatShiftBtn = $('#closeCatShiftModal');
  if (closeCatShiftBtn) {
    closeCatShiftBtn.addEventListener('click', () => {
      $('#categoryShiftModal').classList.remove('active');
      swipeCount = 0; // reset count to allow next 20 swipes
    });
  }

  // Bind swiper button controls
  const dislikeBtn = $('#tinderDislikeBtn');
  const likeBtn = $('#tinderLikeBtn');
  
  if (dislikeBtn && likeBtn) {
    // Prevent duplicate triggers
    dislikeBtn.onclick = (e) => {
      e.preventDefault();
      const topCard = $('#tinderCardStack .tinder-card');
      if (topCard && topCard.style.pointerEvents !== 'none') {
        window.executeSwipe(false);
      }
    };
    
    likeBtn.onclick = (e) => {
      e.preventDefault();
      const topCard = $('#tinderCardStack .tinder-card');
      if (topCard && topCard.style.pointerEvents !== 'none') {
        window.executeSwipe(true);
      }
    };
  }

  // Initialize
  initTinderSwiper();

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
    cart.push({ id: giftWrapId, qty: 1, addedAt: Date.now() });
    saveState();
    updateCounts();
    renderCart();
  } else {
    existingInCart.addedAt = Date.now();
    saveState();
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

const openStoreBtn = $('#openStore');
if (openStoreBtn) {
  openStoreBtn.addEventListener('click', openStoreLocator);
}
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
  
  const submitBtn = $('#submitReviewModal');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }

  const nameVal = $('#modalReviewName').value.trim() || 'Anonymous';
  const textVal = $('#modalReviewText').value.trim() || '';
  const fileInput = $('#modalReviewFile');
  const file = fileInput && fileInput.files ? fileInput.files[0] : null;

  let fileUrl = '';
  let fileType = '';

  const processSubmit = async () => {
    const reviewId = 'rev-' + Math.floor(100000 + Math.random() * 900000);
    const newReviewObj = {
      id: reviewId,
      name: nameVal,
      rating: selectedReviewStars,
      text: textVal,
      fileUrl: fileUrl,
      fileType: fileType,
      status: 'pending', // pending approval
      date: new Date().toLocaleDateString('en-IN')
    };

    try {
      await window.VFS_DB.saveReview(newReviewObj);
      toast('Review submitted for moderation! ✓');
    } catch(err) {
      console.error("Save review failed:", err);
    }

    modalBody.innerHTML = `
      <div class="review-success-state" style="text-align:center; padding:30px 10px; animation: fadeUp 0.3s ease;">
        <div style="width:60px; height:60px; border-radius:50%; background:#27ae60; color:#fff; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:3rem">✓</div>
        <h3 style="font-size:2rem; margin-bottom:10px; color:#121212">Review Submitted!</h3>
        <p style="font-size:1.35rem; color:#666; margin-bottom:20px; line-height:1.5">
          Thank you! Your review has been submitted to our moderators for verification and approval.
        </p>
      </div>
    `;

    setTimeout(() => {
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
          <input type="text" id="modalReviewName" placeholder="Your Name (Optional)" style="width: 100%; padding: 10px; font-size: 1.3rem; border: 1px solid #ddd; border-radius: var(--rounded-sm); outline: none; margin-bottom: 12px;">
          <textarea id="modalReviewText" rows="5" placeholder="Share details of your experience..."></textarea>
          <div style="margin: 15px 0 10px; text-align: left;">
            <label for="modalReviewFile" style="font-size: 1.25rem; font-weight: 700; color: #555; display: block; margin-bottom: 6px;">Upload Photo or Video (unboxing/reel)</label>
            <input type="file" id="modalReviewFile" accept="image/*,video/*" style="font-size: 1.2rem; cursor: pointer;">
          </div>
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
    }, 2500);
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      fileUrl = e.target.result;
      fileType = file.type.startsWith('video/') ? 'video' : 'image';
      processSubmit();
    };
    reader.onerror = () => {
      processSubmit();
    };
    reader.readAsDataURL(file);
  } else {
    processSubmit();
  }
}

// Bind Review Modal events
const openReviewBtn = $('#openReviewBtn');
if (openReviewBtn) {
  openReviewBtn.addEventListener('click', () => {
    window.open('https://www.google.com/maps/place/VFS+JEWELS+%7C+Jewellery+Wholesaler/@13.0901146,80.2750305,17z/data=!3m1!4b1!4m6!3m5!1s0x3a526f9d5c41e319:0x29aceb97e623fc2a!8m2!3d13.0901094!4d80.2799014!16s%2Fg%2F11vt81tvl1?entry=ttu&g_ep=EgoyMDI2MDYyOS4wIKXMDSoASAFQAw%3D%3D', '_blank');
  });
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
  wrapper.style.position = 'absolute';
  wrapper.style.top = '0';
  wrapper.style.left = '-9999px';
  wrapper.style.width = '750px';
  wrapper.style.height = 'auto';
  wrapper.style.overflow = 'visible';
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

async function initApp() {
  // Clear any legacy client-side products caching to avoid conflicts
  try {
    localStorage.removeItem('vfs_products');
    localStorage.removeItem('vfs_custom_products');
  } catch (e) {}

  try {
    const res = await fetch(`/vfs-products.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        PRODUCTS.length = 0; // Clear
        PRODUCTS.push(...data);
      }
    }
  } catch (e) {
    console.error("Failed to load products from live catalog:", e);
  }

  // Load stock cache and assign creation dates for unsold hiding simulation
  const catalog = getFullCatalog();
  const now = Date.now();
  const loadPromises = catalog.map(async (p) => {
    const stockVal = await window.VFS_DB.getProductStock(p.id);
    window.VFS_STOCK_CACHE[p.id] = stockVal;

    if (!p.createdAt) {
      if (p.id % 5 === 0) {
        // Created 10 days ago (older than 1 week)
        p.createdAt = now - 10 * 24 * 60 * 60 * 1000;
      } else {
        // Created 1 day ago (visible)
        p.createdAt = now - 1 * 24 * 60 * 60 * 1000;
      }
    }
  });
  await Promise.all(loadPromises);

  // Execute 24-hour expiration and out of stock cart pruning
  pruneCart();

  checkHashRoute();
  renderProducts(null);
  renderTestimonials();
  renderProductShelves();
  updateCounts();
  setupShoppingMode();
  setupBirthdayCircle();
}

function pruneCart() {
  const now = Date.now();
  let expired = false;
  let oosCount = 0;
  const oosNames = [];
  
  cart = cart.filter(item => {
    // Check 24-hour expiration
    if (item.addedAt && (now - item.addedAt > 24 * 60 * 60 * 1000)) {
      expired = true;
      return false;
    }
    
    // Check out-of-stock
    const stock = window.VFS_STOCK_CACHE[item.id];
    if (stock !== undefined && stock <= 0) {
      oosCount++;
      const fullCatalog = getFullCatalog();
      const p = fullCatalog.find(x => x.id === item.id);
      if (p) oosNames.push(p.name);
      return false;
    }
    
    return true;
  });
  
  if (expired || oosCount > 0) {
    saveState();
    updateCounts();
    renderCart();
    if (expired) {
      toast('Expired items (older than 24h) were removed from your cart');
    }
    if (oosCount > 0) {
      toast(`Sold out items removed from cart: ${oosNames.join(', ')}`);
    }
  }
}

window.addEventListener('load', initApp);
window.addEventListener('hashchange', checkHashRoute);

// Execute immediately if DOM content is already parsed/loading
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initApp();
}

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
      renderProducts(cat);
      
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
    } else if (targetAttr === 'shipping-policy') {
      e.preventDefault();
      if (shippingPolicyModal) {
        shippingPolicyModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
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

// ── Shipping Policy Modal Listeners ──
const shippingPolicyModal = $('#shippingPolicyModal');
const openShippingBtn = $('#footerShippingPolicy');
const closeShippingBtn = $('#closeShippingPolicy');
const policyCloseShippingBtn = $('#btnPolicyCloseShipping');

if (openShippingBtn && shippingPolicyModal) {
  openShippingBtn.addEventListener('click', (e) => {
    e.preventDefault();
    shippingPolicyModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

if (closeShippingBtn && shippingPolicyModal) {
  closeShippingBtn.addEventListener('click', () => {
    shippingPolicyModal.classList.remove('active');
    document.body.style.overflow = '';
  });
}

if (policyCloseShippingBtn && shippingPolicyModal) {
  policyCloseShippingBtn.addEventListener('click', () => {
    shippingPolicyModal.classList.remove('active');
    document.body.style.overflow = '';
  });
}

if (shippingPolicyModal) {
  shippingPolicyModal.addEventListener('click', (e) => {
    if (e.target === shippingPolicyModal) {
      shippingPolicyModal.classList.remove('active');
      document.body.style.overflow = '';
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

// ── Lightbox Image Zoomer ──
(function setupZoomLightbox() {
  const lightbox = document.getElementById('zoomLightbox');
  const lightboxImg = document.getElementById('zoomLightboxImg');
  const closeBtn = document.getElementById('closeZoomLightbox');
  if (!lightbox || !lightboxImg) return;

  let isZoomed = false;
  let startX = 0, startY = 0;
  let translateX = 0, translateY = 0;
  let baseTranslateX = 0, baseTranslateY = 0;
  let dragging = false;

  function openZoom(src) {
    lightboxImg.src = src;
    isZoomed = false;
    translateX = 0;
    translateY = 0;
    baseTranslateX = 0;
    baseTranslateY = 0;
    lightboxImg.style.transition = 'none';
    lightboxImg.style.transform = `translate(0px, 0px) scale(1)`;
    lightboxImg.style.cursor = 'zoom-in';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeZoom() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'hidden'; // Keep PDP overlay scrolling off
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeZoom);
  }
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightbox.querySelector('.zoom-lightbox-content')) {
      closeZoom();
    }
  });

  // Toggle Zoom on click
  lightboxImg.addEventListener('click', (e) => {
    e.stopPropagation();
    isZoomed = !isZoomed;
    lightboxImg.style.transition = 'transform 0.25s ease-out';
    if (isZoomed) {
      lightboxImg.style.transform = `translate(0px, 0px) scale(2.5)`;
      lightboxImg.style.cursor = 'zoom-out';
      translateX = 0;
      translateY = 0;
      baseTranslateX = 0;
      baseTranslateY = 0;
    } else {
      lightboxImg.style.transform = `translate(0px, 0px) scale(1)`;
      lightboxImg.style.cursor = 'zoom-in';
      translateX = 0;
      translateY = 0;
    }
  });

  // Drag to pan
  const onStart = (clientX, clientY) => {
    if (!isZoomed) return;
    dragging = true;
    startX = clientX;
    startY = clientY;
    baseTranslateX = translateX;
    baseTranslateY = translateY;
    lightboxImg.style.transition = 'none';
  };

  const onMove = (clientX, clientY) => {
    if (!dragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    translateX = baseTranslateX + dx;
    translateY = baseTranslateY + dy;
    
    // Bounds check to avoid dragging completely off screen
    const maxBound = window.innerHeight * 0.6;
    if (Math.abs(translateX) > maxBound) translateX = Math.sign(translateX) * maxBound;
    if (Math.abs(translateY) > maxBound) translateY = Math.sign(translateY) * maxBound;

    lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(2.5)`;
  };

  const onEnd = () => {
    dragging = false;
  };

  // Bind Mouse Events
  lightboxImg.addEventListener('mousedown', (e) => {
    e.preventDefault();
    onStart(e.clientX, e.clientY);
    const onMouseMove = (ev) => onMove(ev.clientX, ev.clientY);
    const onMouseUp = () => {
      onEnd();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // Bind Touch Events
  lightboxImg.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  lightboxImg.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  lightboxImg.addEventListener('touchend', onEnd);

  // Expose function globally
  window.VFS_OPEN_IMAGE_ZOOM = openZoom;
})();

function setupShoppingMode() {
  const statusbar = $('#modeStatusBar');
  const label = $('#activeModeLabel');
  const switchBtn = $('#switchModeBtn');
  
  const modeSelectorModal = $('#modeSelectorModal');
  const wholesaleTermsModal = $('#wholesaleTermsModal');
  const wholesaleLoginModal = $('#wholesaleLoginModal');
  const wholesaleUnlockModal = $('#wholesaleUnlockModal');
  
  if (!statusbar || !label || !switchBtn) return;

  // Update status bar UI
  function updateModeUI() {
    if (shoppingMode === 'retail') {
      label.innerHTML = 'Retail (Personal Use)';
      statusbar.querySelector('.mode-dot').classList.remove('wholesale-locked');
      switchBtn.innerHTML = 'Switch to Wholesale';
    } else {
      statusbar.querySelector('.mode-dot').classList.add('wholesale-locked');
      if (wholesaleUnlocked) {
        statusbar.querySelector('.mode-dot').classList.remove('wholesale-locked');
        label.innerHTML = `Wholesale (${wholesaleUser ? wholesaleUser.name : 'Business'}) — Unlocked ✅`;
        switchBtn.innerHTML = 'Switch to Retail';
      } else {
        label.innerHTML = `Wholesale (${wholesaleUser ? wholesaleUser.name : 'Business'}) — Locked 🔒`;
        switchBtn.innerHTML = 'Unlock / Switch';
      }
    }
  }

  updateModeUI();

  // Bind Start Shopping button
  const startBtn = $('#btnStartShopping');
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      modeSelectorModal.classList.add('active');
    });
  }

  // Bind switch button in header status bar
  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      if (shoppingMode === 'retail') {
        modeSelectorModal.classList.add('active');
      } else {
        if (!wholesaleUnlocked) {
          modeSelectorModal.classList.add('active');
        } else {
          shoppingMode = 'retail';
          saveState();
          updateModeUI();
          renderProducts(null);
          toast('Switched to Retail Mode');
        }
      }
    });
  }

  // Selector Modal actions
  $('#selectRetailCard').addEventListener('click', () => {
    shoppingMode = 'retail';
    saveState();
    modeSelectorModal.classList.remove('active');
    updateModeUI();
    renderProducts(null);
    toast('Switched to Retail Mode successfully!');
  });

  $('#selectWholesaleCard').addEventListener('click', () => {
    modeSelectorModal.classList.remove('active');
    if (!wholesaleUser) {
      wholesaleTermsModal.classList.add('active');
    } else {
      shoppingMode = 'wholesale';
      saveState();
      updateModeUI();
      renderProducts(null);
      if (!wholesaleUnlocked) {
        openWholesaleUnlockModal();
      } else {
        toast(`Welcome back, ${wholesaleUser.name}!`);
      }
    }
  });

  // Wholesale T&C checkbox check
  const termsCheckbox = $('#agreeWholesaleTerms');
  const acceptTermsBtn = $('#btnAcceptTerms');
  
  if (termsCheckbox && acceptTermsBtn) {
    termsCheckbox.addEventListener('change', () => {
      if (termsCheckbox.checked) {
        acceptTermsBtn.removeAttribute('disabled');
        acceptTermsBtn.style.opacity = '1';
        acceptTermsBtn.style.cursor = 'pointer';
      } else {
        acceptTermsBtn.setAttribute('disabled', 'true');
        acceptTermsBtn.style.opacity = '0.6';
        acceptTermsBtn.style.cursor = 'not-allowed';
      }
    });
  }

  $('#btnCancelTerms').addEventListener('click', () => {
    wholesaleTermsModal.classList.remove('active');
    modeSelectorModal.classList.add('active');
  });

  acceptTermsBtn.addEventListener('click', () => {
    if (!termsCheckbox.checked) return;
    wholesaleTermsModal.classList.remove('active');
    $('#loginStepPhone').style.display = 'block';
    $('#loginStepOTP').style.display = 'none';
    $('#loginStepRegister').style.display = 'none';
    $('#wholesalePhoneInput').value = '';
    $('#wholesaleOtpInput').value = '';
    wholesaleLoginModal.classList.add('active');
  });

  $('#btnCancelLogin').addEventListener('click', () => {
    wholesaleLoginModal.classList.remove('active');
    modeSelectorModal.classList.add('active');
  });

  // Send OTP
  // Google Sign-In Listener
  $('#btnGoogleSignIn').addEventListener('click', async () => {
    const btn = $('#btnGoogleSignIn');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
    btn.innerHTML = '<span>Connecting to Google...</span>';
    
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      let result;
      try {
        result = await firebase.auth().signInWithPopup(provider);
      } catch (popupErr) {
        // If popup is blocked, cancelled, or closed, redirect instead!
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request' || popupErr.code === 'auth/popup-closed-by-user') {
          toast("Popup blocked/cancelled. Redirecting to Google login...");
          await firebase.auth().signInWithRedirect(provider);
          return;
        } else {
          throw popupErr;
        }
      }
      
      if (!result || !result.user) return;
      const user = result.user;
      
      let userData = null;
      if (window.VFS_CLOUD_ACTIVE && window.db) {
        const doc = await window.db.collection('wholesale_users').doc(user.uid).get();
        if (doc.exists) {
          userData = doc.data();
        }
      } else {
        const mockUsers = JSON.parse(localStorage.getItem('vfs_wholesale_users') || '{}');
        if (mockUsers[user.uid]) userData = mockUsers[user.uid];
      }
      
      if (userData) {
        wholesaleUser = userData;
        shoppingMode = 'wholesale';
        wholesaleUnlocked = userData.unlocked === true;
        saveState();
        wholesaleLoginModal.classList.remove('active');
        updateModeUI();
        renderProducts(null);
        
        if (!wholesaleUnlocked) {
          openWholesaleUnlockModal();
        } else {
          toast(`Welcome back, ${wholesaleUser.name}!`);
        }
      } else {
        // First-time signup with Google
        tempPhone = user.phoneNumber || '';
        $('#regNameInput').value = user.displayName || '';
        window._googleUser = user;
        
        $('#loginStepPhone').style.display = 'none';
        $('#loginStepRegister').style.display = 'block';
      }
    } catch (err) {
      console.error("Google Sign-In failed:", err);
      toast("Sign in failed: " + err.message);
    } finally {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.86 2.22c1.67-1.54 2.63-3.8 2.63-6.55z" fill="#4285F4"/><path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.86-2.22C11.3 14.13 10.22 14.4 9 14.4c-2.34 0-4.33-1.57-5.03-3.69L1.03 13c1.5 2.98 4.58 5 8.1 5z" fill="#34A853"/><path d="M3.97 10.71A5.39 5.39 0 0 1 3.6 9c0-.59.1-1.17.28-1.71L1.03 5.07A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.97 4.04l3-2.33z" fill="#FBBC05"/><path d="M9 3.6c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.47.8 11.43 0 9 0 5.48 0 2.4 2.02.9 5.07l2.94 2.28c.7-2.12 2.69-3.69 5.03-3.69z" fill="#EA4335"/></svg>
        <span style="font-weight:700;">Sign in with Google</span>
      `;
    }
  });

  // Send OTP
  $('#btnSendOTP').addEventListener('click', () => {
    const phone = $('#wholesalePhoneInput').value.trim();
    if (phone.length !== 10 || isNaN(phone)) {
      toast('Enter a valid 10-digit number');
      return;
    }
    tempPhone = phone;
    toast(`OTP sent to +91 ${phone}!`);
    $('#loginStepPhone').style.display = 'none';
    $('#loginStepOTP').style.display = 'block';
  });

  // Verify OTP
  $('#btnVerifyOTP').addEventListener('click', () => {
    const otp = $('#wholesaleOtpInput').value.trim();
    if (otp !== '1234' && otp.length !== 4) {
      toast('Invalid OTP. Use 1234.');
      return;
    }
    
    const uid = 'phone-' + tempPhone;
    const mockUsers = JSON.parse(localStorage.getItem('vfs_wholesale_users') || '{}');
    if (mockUsers[uid]) {
      wholesaleUser = mockUsers[uid];
      shoppingMode = 'wholesale';
      wholesaleUnlocked = wholesaleUser.unlocked === true;
      saveState();
      wholesaleLoginModal.classList.remove('active');
      updateModeUI();
      renderProducts(null);
      if (!wholesaleUnlocked) {
        openWholesaleUnlockModal();
      } else {
        toast(`Welcome back, ${wholesaleUser.name}!`);
      }
    } else {
      $('#loginStepOTP').style.display = 'none';
      $('#loginStepRegister').style.display = 'block';
    }
  });

  // Complete Registration
  $('#btnRegisterUser').addEventListener('click', async () => {
    const name = $('#regNameInput').value.trim();
    const business = $('#regBusinessInput').value.trim();
    const address = $('#regAddressInput').value.trim();
    
    if (!name || !business || !address) {
      toast('Please fill all fields');
      return;
    }
    
    const googleUser = window._googleUser;
    const uid = googleUser ? googleUser.uid : ('phone-' + tempPhone);
    const email = googleUser ? googleUser.email : '';
    
    wholesaleUser = {
      uid: uid,
      email: email,
      phone: tempPhone || '',
      name: name,
      businessName: business,
      shopName: business, // keep backward compatibility
      address: address,
      unlocked: false,
      paymentStatus: 'none',
      registeredAt: Date.now(),
      ordersCount: 0
    };
    
    if (window.VFS_CLOUD_ACTIVE && window.db) {
      try {
        await window.db.collection('wholesale_users').doc(uid).set(wholesaleUser);
      } catch (err) {
        console.error("Firestore save failed:", err);
      }
    }
    
    const mockUsers = JSON.parse(localStorage.getItem('vfs_wholesale_users') || '{}');
    mockUsers[uid] = wholesaleUser;
    localStorage.setItem('vfs_wholesale_users', JSON.stringify(mockUsers));
    
    shoppingMode = 'wholesale';
    saveState();
    wholesaleLoginModal.classList.remove('active');
    updateModeUI();
    renderProducts(null);
    
    openWholesaleUnlockModal();
    toast('Registration completed!');
  });

  // Unlock Modal helper
  function openWholesaleUnlockModal() {
    const unlockAmountLabel = $('#unlockAmountLabel');
    const unlockPriceText = $('#unlockPriceText');
    
    const isFirstOrder = !wholesaleUser || wholesaleUser.ordersCount === 0;
    const amount = isFirstOrder ? 1000 : 500;
    
    unlockAmountLabel.innerHTML = `₹${amount.toLocaleString('en-IN')}`;
    unlockPriceText.innerHTML = isFirstOrder
      ? 'Pay ₹1,000 first order advance to unlock wholesale prices.'
      : 'Pay ₹500 advance to unlock wholesale prices for your next order.';
      
    wholesaleUnlockModal.classList.add('active');
  }

  $('#btnCancelUnlock').addEventListener('click', () => {
    wholesaleUnlockModal.classList.remove('active');
  });

  async function requestWholesaleUnlock() {
    if (!wholesaleUser) {
      toast("Error: wholesale user not logged in");
      return;
    }
    
    wholesaleUser.paymentStatus = 'pending';
    wholesaleUser.unlocked = false;
    
    if (window.VFS_CLOUD_ACTIVE && window.db) {
      try {
        await window.db.collection('wholesale_users').doc(wholesaleUser.uid).update({
          paymentStatus: 'pending',
          unlocked: false
        });
      } catch (err) {
        console.error("Firestore unlock request failed:", err);
      }
    }
    
    const mockUsers = JSON.parse(localStorage.getItem('vfs_wholesale_users') || '{}');
    mockUsers[wholesaleUser.uid] = wholesaleUser;
    localStorage.setItem('vfs_wholesale_users', JSON.stringify(mockUsers));
    saveState();
    
    alert("Payment submitted successfully! Admin will verify your payment and grant access. Once approved, wholesale prices will unlock automatically.");
    wholesaleUnlockModal.classList.remove('active');
  }

  $('#btnSimulateSuccess').addEventListener('click', requestWholesaleUnlock);
  
  document.querySelectorAll('.upi-pay-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      toast(`Connecting to ${btn.dataset.method.toUpperCase()}...`);
      setTimeout(() => {
        requestWholesaleUnlock();
      }, 1200);
    });
  });

  window.VFS_OPEN_UNLOCK_MODAL = openWholesaleUnlockModal;
}

function setupBirthdayCircle() {
  const bdayForm = $('#birthdayForm');
  const bdayInputPhone = $('#bdayInputPhone');
  const bdayInputDate = $('#bdayInputDate');
  const bdayResultText = $('#bdayResultText');
  const bdayCelebrationModal = $('#birthdayCelebrationModal');
  const closeBdayCeleb = $('#closeBdayCeleb');
  const btnClaimBday = $('#btnClaimBday');

  if (bdayForm) {
    bdayForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = bdayInputPhone.value.trim();
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        toast('Please enter a valid 10-digit mobile number');
        return;
      }
      
      const dateVal = bdayInputDate.value;
      if (!dateVal) return;

      // CHECK if birthday already registered (Firestore-backed lock)
      const existing = await window.VFS_DB.getBirthday(cleanPhone);
      if (existing) {
        bdayResultText.innerHTML = `🎂 Birthday already registered for this number! Your BDAY3 coupon is unlocked.`;
        bdayResultText.style.color = '#e67e22';
        bdayResultText.style.display = 'block';
        return;
      }

      // Save to Firestore (locks birthday permanently)
      const bdayData = { phone: cleanPhone, birthday: dateVal, registeredAt: Date.now() };
      await window.VFS_DB.saveBirthday(cleanPhone, bdayData);

      // Also save locally for coupon access
      localStorage.setItem(`vfs_birthday_phone_${cleanPhone}`, dateVal);
      localStorage.setItem(`vfs_bday_coupon_unlocked_${cleanPhone}`, 'true');

      // Display results success message in line
      bdayResultText.innerHTML = `🎁 Successfully joined! Coupon code BDAY3 has been unlocked for phone: ${cleanPhone}`;
      bdayResultText.style.color = '#2ecc71';
      bdayResultText.style.display = 'block';
      bdayForm.reset();

      // Trigger Happy Birthday Celebration Modal immediately!
      if (bdayCelebrationModal) {
        bdayCelebrationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  const closeCeleb = () => {
    if (bdayCelebrationModal) {
      bdayCelebrationModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (closeBdayCeleb) {
    closeBdayCeleb.addEventListener('click', closeCeleb);
  }
  if (btnClaimBday) {
    btnClaimBday.addEventListener('click', closeCeleb);
  }
}

// ── Product Shelves: New Arrivals / Best Sellers / Sale ──
async function renderProductShelves() {
  const catalog = getFullCatalog();
  const now = Date.now();
  const mode = shoppingMode;

  // Helper: make a mini card HTML for shelf
  function shelfCard(p, badge) {
    const priceInfo = getRetailPriceInfo(p);
    const displayPrice = mode === 'wholesale'
      ? (wholesaleUnlocked ? fmt(p.wsPrice || Math.round(p.price * 0.7)) : '🔒 Login to view')
      : fmt(priceInfo.price);
    const oldPrice = mode === 'retail' && priceInfo.mrp && priceInfo.mrp !== priceInfo.price
      ? `<span style="text-decoration:line-through;color:#aaa;font-size:1.1rem;margin-left:4px;">${fmt(priceInfo.mrp)}</span>` : '';
    const badgeHtml = badge ? `<span class="sale-ribbon">${badge}</span>` : '';
    return `
      <div class="p-card" style="cursor:pointer;position:relative;" onclick="openPDP(${p.id})">
        ${badgeHtml}
        <div class="p-img">
          <img src="${clOpt(p.img, 300)}" alt="${p.name}" loading="lazy" style="width:100%;height:180px;object-fit:cover;border-radius:8px 8px 0 0;">
        </div>
        <div class="p-info" style="padding:10px 8px;">
          <div class="p-meta" style="font-size:1.1rem;color:#888;">${p.meta || ''}</div>
          <div class="p-name" style="font-size:1.3rem;font-weight:700;margin:3px 0;">${p.name}</div>
          <div class="p-prices" style="font-size:1.4rem;font-weight:700;color:var(--color-secondary);">${displayPrice}${oldPrice}</div>
        </div>
      </div>`;
  }

  // 1. NEW ARRIVALS: newest 8 products by createdAt
  const newArrivalsSection = $('#shelfNewArrivals');
  const newArrivalsGrid = $('#shelfNewArrivalsGrid');
  if (newArrivalsSection && newArrivalsGrid) {
    const sorted = [...catalog]
      .filter(p => window.VFS_STOCK_CACHE[p.id] === undefined || window.VFS_STOCK_CACHE[p.id] > 0)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 8);
    if (sorted.length > 0) {
      newArrivalsGrid.innerHTML = sorted.map(p => shelfCard(p, 'New')).join('');
      newArrivalsSection.style.display = 'block';
    }
  }

  // 2. BEST SELLERS: products with most completed orders
  const bestSellersSection = $('#shelfBestSellers');
  const bestSellersGrid = $('#shelfBestSellersGrid');
  if (bestSellersSection && bestSellersGrid) {
    try {
      const orders = await window.VFS_DB.getOrders();
      const completedOrders = orders.filter(o => ['paid', 'dispatched', 'delivered', 'completed'].includes(o.status));
      const saleCounts = {};
      completedOrders.forEach(o => {
        (o.items || []).forEach(item => {
          saleCounts[item.id] = (saleCounts[item.id] || 0) + (item.qty || 1);
        });
      });
      const topIds = Object.entries(saleCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([id]) => Number(id));
      const topProducts = topIds
        .map(id => catalog.find(p => p.id === id))
        .filter(Boolean)
        .filter(p => window.VFS_STOCK_CACHE[p.id] === undefined || window.VFS_STOCK_CACHE[p.id] > 0);
      
      if (topProducts.length > 0) {
        bestSellersGrid.innerHTML = topProducts.map(p => shelfCard(p, '🏆')).join('');
        bestSellersSection.style.display = 'block';
      }
    } catch(e) {
      console.error("Failed to load best sellers:", e);
    }
  }

  // 3. SALE: products with 50% decay badge
  const saleSection = $('#shelfSale');
  const saleGrid = $('#shelfSaleGrid');
  if (saleSection && saleGrid) {
    const saleProducts = catalog
      .filter(p => {
        const info = getRetailPriceInfo(p);
        return info && info.badge === '50% OFF';
      })
      .filter(p => window.VFS_STOCK_CACHE[p.id] === undefined || window.VFS_STOCK_CACHE[p.id] > 0)
      .slice(0, 8);
    if (saleProducts.length > 0) {
      saleGrid.innerHTML = saleProducts.map(p => shelfCard(p, '50% OFF')).join('');
      saleSection.style.display = 'block';
    }
  }
}

// ── PDF Invoice Download (using html2pdf.js) ──
window.downloadInvoicePDF = async function(order) {
  if (!order) return;

  toast("Generating invoice PDF... 📄");

  // Create invisible wrapper container to force layout painting
  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.top = '0';
  wrapper.style.left = '-9999px';
  wrapper.style.width = '750px';
  wrapper.style.height = 'auto';
  wrapper.style.overflow = 'visible';
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

  // Calculate totals
  const subtotal = order.subtotal || (order.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const shipping = order.shipping || 90;
  const gstAmt = order.gstAmount || 0;
  const advanceAmt = order.advanceDeducted || 0;
  const couponAmt = order.couponDiscount || 0;
  const total = order.total || subtotal;

  let totalsHtml = `
    <tr>
      <td style="padding: 4px 0; color: #000000;">Subtotal:</td>
      <td style="text-align: right; font-weight: 700; padding: 4px 0; color: #000000;">${fmt(subtotal)}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0; color: #000000;">Shipping Fee:</td>
      <td style="text-align: right; font-weight: 700; padding: 4px 0; color: #000000;">${fmt(shipping)}</td>
    </tr>
  `;
  if (gstAmt) {
    totalsHtml += `
      <tr>
        <td style="padding: 4px 0; color: #000000;">GST (3%):</td>
        <td style="text-align: right; font-weight: 700; padding: 4px 0; color: #000000;">${fmt(gstAmt)}</td>
      </tr>
    `;
  }
  if (couponAmt) {
    totalsHtml += `
      <tr>
        <td style="padding: 4px 0; color: green;">Coupon Discount (${order.couponCode || ''}):</td>
        <td style="text-align: right; font-weight: 700; padding: 4px 0; color: green;">-${fmt(couponAmt)}</td>
      </tr>
    `;
  }
  if (advanceAmt) {
    totalsHtml += `
      <tr>
        <td style="padding: 4px 0; color: green;">Advance Deducted:</td>
        <td style="text-align: right; font-weight: 700; padding: 4px 0; color: green;">-${fmt(advanceAmt)}</td>
      </tr>
    `;
  }
  totalsHtml += `
    <tr style="font-size: 11pt; font-weight: 900; border-top: 1px solid #dddddd; color: #000000;">
      <td style="padding: 8px 0 0 0; color: #000000;">Grand Total:</td>
      <td style="text-align: right; padding: 8px 0 0 0; color: #000000;">${fmt(total)}</td>
    </tr>
  `;

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
          <p style="margin: 2px 0;"><strong>Date:</strong> ${order.date || new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
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
          ${order.gstin ? `<br>GSTIN: ${order.gstin}` : ''}
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
          ${totalsHtml}
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

// Make PDF function globally accessible
window.downloadInvoicePDF = downloadInvoicePDF;
