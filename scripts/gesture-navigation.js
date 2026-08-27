/**
 * VFS JEWELS — NATIVE MOBILE GESTURE NAVIGATION ENGINE
 * 8 / 8 Interaction Patterns:
 * 1. Swipe to Go Back (Edge Swipe & Drawer/Modal Dismiss)
 * 2. List Item Swipe Actions (Swipe Left for Delete/Wishlist, Swipe Right for +1)
 * 3. Pull to Refresh (Elastic Pull & Gold Jewel Spinner)
 * 4. Long Press Menus (Glassmorphic Context Menu for Products)
 * 5. Pinch to Zoom (1x–4x Multi-touch Pan & Zoom with Double Tap)
 * 6. Drag to Reorder (Long-press Lift & Reordering in Bag)
 * 7. Gesture Hints (Subtle Animated Micro-hints)
 * 8. Haptic Feedback (Calibrated Tactile Feedback)
 */

(function(window, document) {
  'use strict';

  // =========================================================================
  // 8. HAPTIC FEEDBACK MANAGER
  // =========================================================================
  const vfsHaptic = {
    hasVibrate: typeof navigator !== 'undefined' && 'vibrate' in navigator,
    
    light: function(e) {
      if (this.hasVibrate) {
        try { navigator.vibrate(12); } catch (err) {}
      }
      this.triggerVisualWave(e);
    },
    medium: function(e) {
      if (this.hasVibrate) {
        try { navigator.vibrate(35); } catch (err) {}
      }
      this.triggerVisualWave(e);
    },
    heavy: function(e) {
      if (this.hasVibrate) {
        try { navigator.vibrate(60); } catch (err) {}
      }
      this.triggerVisualWave(e);
    },
    success: function(e) {
      if (this.hasVibrate) {
        try { navigator.vibrate([20, 40, 25]); } catch (err) {}
      }
      this.triggerVisualWave(e);
    },
    warning: function(e) {
      if (this.hasVibrate) {
        try { navigator.vibrate([40, 50, 40]); } catch (err) {}
      }
      this.triggerVisualWave(e);
    },
    triggerVisualWave: function(e) {
      if (!e) return;
      let x = 0, y = 0;
      if (e.touches && e.touches[0]) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if (e.clientX !== undefined) {
        x = e.clientX;
        y = e.clientY;
      } else {
        return;
      }
      const wave = document.createElement('div');
      wave.className = 'vfs-haptic-wave';
      wave.style.left = x + 'px';
      wave.style.top = y + 'px';
      document.body.appendChild(wave);
      setTimeout(() => wave.remove(), 400);
    }
  };

  window.vfsHaptic = vfsHaptic;

  // =========================================================================
  // CORE GESTURE ENGINE
  // =========================================================================
  const VFSGestures = {
    version: '1.2.0',

    // =======================================================================
    // 1. SWIPE TO GO BACK (Edge Swipe & Drawer Dismiss)
    // =======================================================================
    initSwipeToGoBack: function() {
      let startX = 0;
      let startY = 0;
      let currentX = 0;
      let isEdgeSwipe = false;
      let isModalSwipe = false;
      let activeModal = null;
      let indicator = null;

      function getIndicator() {
        if (!indicator) {
          indicator = document.querySelector('.vfs-edge-swipe-indicator');
          if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'vfs-edge-swipe-indicator';
            indicator.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            document.body.appendChild(indicator);
          }
        }
        return indicator;
      }

      function getOpenModal() {
        const candidates = [
          document.getElementById('cartDW'),
          document.getElementById('profileDW'),
          document.getElementById('wlDW'),
          document.getElementById('pdpOverlay'),
          document.getElementById('storeOverlay'),
          document.getElementById('trackingOverlay'),
          document.getElementById('zoomLightbox'),
          document.getElementById('guideModal'),
          document.getElementById('walletModal'),
          document.getElementById('vcModal'),
          document.getElementById('returnPolicyModal'),
          document.getElementById('categoryPageView')
        ];
        for (const el of candidates) {
          if (el && (el.classList.contains('active') || el.classList.contains('open') || (el.style.display && el.style.display !== 'none' && el.style.display !== ''))) {
            return el;
          }
        }
        return null;
      }

      function handleStart(clientX, clientY, target) {
        if (target.closest('[data-gesture-no-edge-swipe]') || target.closest('#tinderCard') || target.closest('.announcement-slider')) {
          return;
        }

        startX = clientX;
        startY = clientY;
        currentX = startX;
        activeModal = getOpenModal();

        if (startX <= 45) {
          isEdgeSwipe = true;
          isModalSwipe = false;
          const ind = getIndicator();
          ind.style.opacity = '1';
          ind.classList.add('vfs-edge-swipe-active');
        } else if (activeModal && (target.closest('.dw') || target.closest('.pdp-overlay') || target.closest('.modal-bg'))) {
          isModalSwipe = true;
          isEdgeSwipe = false;
        }
      }

      function handleMove(clientX, clientY, e) {
        if (!isEdgeSwipe && !isModalSwipe) return;
        currentX = clientX;
        const deltaX = currentX - startX;
        const deltaY = clientY - startY;

        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 25) {
          if (isEdgeSwipe) {
            const ind = getIndicator();
            ind.style.opacity = '0';
            ind.style.transform = 'translateY(-50%) translateX(-100%)';
          }
          isEdgeSwipe = false;
          isModalSwipe = false;
          return;
        }

        if (deltaX > 0) {
          if (isEdgeSwipe) {
            const ind = getIndicator();
            const pullDistance = Math.min(deltaX * 0.45, 55);
            ind.style.transform = `translateY(-50%) translateX(${pullDistance - 44}px)`;
          } else if (isModalSwipe && activeModal) {
            const drawerContent = activeModal.querySelector('.dw-content, .pdp-container, .pin-modal') || activeModal;
            if (drawerContent) {
              drawerContent.style.transform = `translateX(${Math.min(deltaX, 260)}px)`;
              drawerContent.style.transition = 'none';
            }
          }
        }
      }

      function handleEnd(e) {
        if (!isEdgeSwipe && !isModalSwipe) return;
        const deltaX = currentX - startX;

        if (isEdgeSwipe) {
          const ind = getIndicator();
          ind.classList.remove('vfs-edge-swipe-active');
          ind.style.opacity = '0';
          ind.style.transform = 'translateY(-50%) translateX(-100%)';

          if (deltaX > 65) {
            vfsHaptic.medium(e);
            VFSGestures.dismissCurrentView(activeModal);
          }
        } else if (isModalSwipe && activeModal) {
          const drawerContent = activeModal.querySelector('.dw-content, .pdp-container, .pin-modal') || activeModal;
          if (drawerContent) drawerContent.style.transition = '';
          if (deltaX > 80) {
            vfsHaptic.medium(e);
            VFSGestures.dismissCurrentView(activeModal);
          } else if (drawerContent) {
            drawerContent.style.transform = '';
          }
        }

        isEdgeSwipe = false;
        isModalSwipe = false;
        activeModal = null;
      }

      document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
        }
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY, e);
        }
      }, { passive: true });

      document.addEventListener('touchend', (e) => handleEnd(e));
    },

    dismissCurrentView: function(activeModal) {
      if (activeModal) {
        if (activeModal.id === 'cartDW') {
          const closeBtn = document.getElementById('closeCartDW') || document.getElementById('cartBG');
          if (closeBtn) closeBtn.click();
        } else if (activeModal.id === 'profileDW') {
          const closeBtn = document.getElementById('closeProfileDW') || document.getElementById('profileBG');
          if (closeBtn) closeBtn.click();
        } else if (activeModal.id === 'wlDW') {
          const closeBtn = document.getElementById('closeWLDW') || document.getElementById('wlBG');
          if (closeBtn) closeBtn.click();
        } else if (activeModal.id === 'pdpOverlay') {
          const closeBtn = document.getElementById('pdpBack') || document.getElementById('closePDP');
          if (closeBtn) closeBtn.click();
        } else if (activeModal.id === 'zoomLightbox') {
          const closeBtn = document.getElementById('closeZoomLightbox');
          if (closeBtn) closeBtn.click();
        } else if (activeModal.id === 'categoryPageView') {
          activeModal.style.display = 'none';
          const mainStore = document.getElementById('products');
          if (mainStore) mainStore.scrollIntoView({ behavior: 'smooth' });
        } else {
          activeModal.classList.remove('active', 'open');
          activeModal.style.display = 'none';
        }
      } else if (window.history.length > 1) {
        window.history.back();
      }
    },

    // =======================================================================
    // 2. LIST ITEM SWIPE ACTIONS (Delete, Wishlist, +1 Add)
    // =======================================================================
    initListItemSwipeActions: function() {
      let activeSwipedItem = null;

      VFSGestures.enhanceCartItems = function() {
        const items = document.querySelectorAll('#cartBody .dw-item, #wlBody .dw-item');
        
        items.forEach(item => {
          if (item.closest('.vfs-swipe-item-wrapper')) return;

          const itemId = item.dataset.id;
          const wrapper = document.createElement('div');
          wrapper.className = 'vfs-swipe-item-wrapper';

          // Right Actions (Swipe Left -> Delete & Wishlist)
          const rightActions = document.createElement('div');
          rightActions.className = 'vfs-swipe-actions vfs-swipe-actions-right';
          rightActions.innerHTML = `
            <button class="vfs-swipe-btn vfs-swipe-btn-wishlist" data-swipe-wishlist="${itemId}" title="Save to Wishlist">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Save</span>
            </button>
            <button class="vfs-swipe-btn vfs-swipe-btn-delete" data-swipe-delete="${itemId}" title="Remove Item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Delete</span>
            </button>
          `;

          // Left Actions (Swipe Right -> +1 Add)
          const leftActions = document.createElement('div');
          leftActions.className = 'vfs-swipe-actions vfs-swipe-actions-left';
          leftActions.innerHTML = `
            <button class="vfs-swipe-btn vfs-swipe-btn-add" data-swipe-add="${itemId}" title="Add +1 Quantity">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>+1 Add</span>
            </button>
          `;

          // Reorder handle
          if (!item.querySelector('.vfs-reorder-handle')) {
            const handle = document.createElement('div');
            handle.className = 'vfs-reorder-handle';
            handle.title = 'Drag to reorder';
            handle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>`;
            item.appendChild(handle);
          }

          item.classList.add('vfs-swipe-content');
          item.parentNode.insertBefore(wrapper, item);
          wrapper.appendChild(leftActions);
          wrapper.appendChild(rightActions);
          wrapper.appendChild(item);

          let startX = 0;
          let currentX = 0;
          let isSwiping = false;

          function startSwipe(clientX) {
            if (activeSwipedItem && activeSwipedItem !== item) {
              activeSwipedItem.style.transform = '';
              activeSwipedItem = null;
            }
            startX = clientX;
            currentX = startX;
            isSwiping = true;
            item.classList.add('is-swiping');
          }

          function moveSwipe(clientX) {
            if (!isSwiping) return;
            currentX = clientX;
            const deltaX = currentX - startX;
            if (deltaX < 0) {
              item.style.transform = `translateX(${Math.max(deltaX, -160)}px)`;
            } else {
              item.style.transform = `translateX(${Math.min(deltaX, 90)}px)`;
            }
          }

          function endSwipe(e) {
            if (!isSwiping) return;
            isSwiping = false;
            item.classList.remove('is-swiping');
            const deltaX = currentX - startX;

            if (deltaX < -55) {
              item.style.transform = 'translateX(-136px)';
              activeSwipedItem = item;
              vfsHaptic.light(e);
            } else if (deltaX > 45) {
              item.style.transform = 'translateX(68px)';
              activeSwipedItem = item;
              vfsHaptic.light(e);
            } else {
              item.style.transform = '';
              if (activeSwipedItem === item) activeSwipedItem = null;
            }
          }

          // Touch
          item.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1 && !e.target.closest('.qty-ctrl, button, .vfs-reorder-handle')) {
              startSwipe(e.touches[0].clientX);
            }
          }, { passive: true });

          item.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) moveSwipe(e.touches[0].clientX);
          }, { passive: true });

          item.addEventListener('touchend', (e) => endSwipe(e));

          // Mouse support for desktop testing
          item.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !e.target.closest('.qty-ctrl, button, .vfs-reorder-handle')) {
              startSwipe(e.clientX);
              const onMouseMove = (ev) => moveSwipe(ev.clientX);
              const onMouseUp = (ev) => {
                endSwipe(ev);
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }
          });
        });

        // Delegate actions
        document.querySelectorAll('[data-swipe-delete]').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const id = +btn.dataset.swipeDelete;
            vfsHaptic.warning(e);
            if (window.cart) {
              window.cart = window.cart.filter(c => c.id !== id);
              if (typeof window.saveState === 'function') window.saveState();
              if (typeof window.updateCounts === 'function') window.updateCounts();
              if (typeof window.renderCart === 'function') window.renderCart();
              if (typeof window.toast === 'function') window.toast('Item removed');
            }
          };
        });

        document.querySelectorAll('[data-swipe-wishlist]').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const id = +btn.dataset.swipeWishlist;
            vfsHaptic.success(e);
            if (window.cart && window.wl) {
              if (!window.wl.includes(id)) window.wl.push(id);
              window.cart = window.cart.filter(c => c.id !== id);
              if (typeof window.saveState === 'function') window.saveState();
              if (typeof window.updateCounts === 'function') window.updateCounts();
              if (typeof window.renderCart === 'function') window.renderCart();
              if (typeof window.toast === 'function') window.toast('Saved to Wishlist! 💖');
            }
          };
        });

        document.querySelectorAll('[data-swipe-add]').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const id = +btn.dataset.swipeAdd;
            vfsHaptic.light(e);
            if (window.cart) {
              const item = window.cart.find(c => c.id === id);
              if (item) {
                item.qty++;
                if (typeof window.saveState === 'function') window.saveState();
                if (typeof window.updateCounts === 'function') window.updateCounts();
                if (typeof window.renderCart === 'function') window.renderCart();
                if (typeof window.toast === 'function') window.toast('Quantity +1');
              }
            }
          };
        });
      };

      document.addEventListener('touchstart', (e) => {
        if (activeSwipedItem && !e.target.closest('.vfs-swipe-item-wrapper')) {
          activeSwipedItem.style.transform = '';
          activeSwipedItem = null;
        }
      }, { passive: true });
    },

    // =======================================================================
    // 3. PULL TO REFRESH (Rotating Gold Jewel & Live Sync)
    // =======================================================================
    initPullToRefresh: function() {
      let startY = 0;
      let currentY = 0;
      let isPulling = false;
      let badge = null;

      function getBadge() {
        if (!badge) {
          const container = document.createElement('div');
          container.className = 'vfs-ptr-container';
          container.innerHTML = `
            <div class="vfs-ptr-badge" id="vfsPtrBadge">
              <div class="vfs-ptr-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="vfs-ptr-text" id="vfsPtrText">Pull to refresh <span>VFS Jewels</span></div>
            </div>
          `;
          document.body.appendChild(container);
          badge = document.getElementById('vfsPtrBadge');
        }
        return badge;
      }

      document.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1 || window.scrollY > 5) return;
        startY = e.touches[0].clientY;
        currentY = startY;
        isPulling = true;
        getBadge();
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        if (deltaY > 0 && window.scrollY <= 0) {
          const pullProgress = Math.min(deltaY * 0.45, 90);
          const b = getBadge();
          b.style.opacity = `${Math.min(pullProgress / 50, 1)}`;
          b.style.transform = `translateY(${pullProgress - 50}px) scale(${0.8 + (pullProgress / 450)})`;
          
          const icon = b.querySelector('.vfs-ptr-icon');
          if (icon) icon.style.transform = `rotate(${deltaY * 2.5}deg)`;

          const text = document.getElementById('vfsPtrText');
          if (deltaY > 80) {
            text.innerHTML = `Release to <span>Sync Live Rates ✨</span>`;
          } else {
            text.innerHTML = `Pull to refresh <span>VFS Jewels</span>`;
          }
        }
      }, { passive: true });

      document.addEventListener('touchend', async (e) => {
        if (!isPulling) return;
        isPulling = false;
        const deltaY = currentY - startY;

        if (deltaY > 80 && window.scrollY <= 0) {
          vfsHaptic.medium(e);
          const b = getBadge();
          b.classList.add('vfs-ptr-spinning');
          const text = document.getElementById('vfsPtrText');
          if (text) text.innerHTML = `<span>Updating live stock & rates...</span>`;

          try {
            if (typeof window.initCloudConfig === 'function') await window.initCloudConfig();
            if (typeof window.renderProducts === 'function') window.renderProducts(null);
          } catch (err) {}

          setTimeout(() => {
            vfsHaptic.success(e);
            if (text) text.innerHTML = `✨ <span>Updated Successfully!</span>`;
            setTimeout(() => {
              b.classList.remove('vfs-ptr-spinning');
              b.style.opacity = '0';
              b.style.transform = 'translateY(-80px) scale(0.8)';
            }, 600);
          }, 700);
        } else if (badge) {
          badge.style.opacity = '0';
          badge.style.transform = 'translateY(-80px) scale(0.8)';
        }
      });
    },

    // =======================================================================
    // 4. LONG PRESS MENUS (Context Menu on Products)
    // =======================================================================
    initLongPressMenus: function() {
      let pressTimer = null;
      let startX = 0, startY = 0;
      let backdrop = null;

      function getBackdrop() {
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.className = 'vfs-context-backdrop';
          backdrop.innerHTML = `
            <div class="vfs-context-menu" id="vfsContextMenu">
              <div class="vfs-context-header">
                <img class="vfs-context-thumb" id="vfsCtxThumb" src="" alt="">
                <div class="vfs-context-info">
                  <h4 class="vfs-context-title" id="vfsCtxTitle">Product Title</h4>
                  <p class="vfs-context-price" id="vfsCtxPrice">₹0</p>
                </div>
              </div>
              <ul class="vfs-context-list">
                <li><button class="vfs-context-item" id="vfsCtxView"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Quick View / Zoom</button></li>
                <li><button class="vfs-context-item" id="vfsCtxAdd"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> Add to Bag</button></li>
                <li><button class="vfs-context-item" id="vfsCtxWishlist"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Add to Wishlist</button></li>
                <li><button class="vfs-context-item" id="vfsCtxShare"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg> Share on WhatsApp</button></li>
                <li><button class="vfs-context-item" id="vfsCtxCopy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy Product Link</button></li>
              </ul>
            </div>
          `;
          document.body.appendChild(backdrop);

          backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) backdrop.classList.remove('active');
          });
        }
        return backdrop;
      }

      function openContextMenu(product, e) {
        if (!product) return;
        const b = getBackdrop();
        vfsHaptic.medium(e);

        const thumb = document.getElementById('vfsCtxThumb');
        const title = document.getElementById('vfsCtxTitle');
        const price = document.getElementById('vfsCtxPrice');

        if (thumb) thumb.src = product.img || '';
        if (title) title.textContent = product.name || 'VFS Jewels';
        if (price) price.textContent = typeof window.fmt === 'function' ? window.fmt(window.getCurrentProductPrice ? window.getCurrentProductPrice(product) : product.price) : `₹${product.price}`;

        document.getElementById('vfsCtxView').onclick = () => {
          b.classList.remove('active');
          if (typeof window.openPDP === 'function') window.openPDP(product.id);
        };
        document.getElementById('vfsCtxAdd').onclick = (ev) => {
          b.classList.remove('active');
          vfsHaptic.success(ev);
          if (typeof window.addToCart === 'function') window.addToCart(product.id);
        };
        document.getElementById('vfsCtxWishlist').onclick = (ev) => {
          b.classList.remove('active');
          vfsHaptic.success(ev);
          if (typeof window.toggleWishlist === 'function') window.toggleWishlist(product.id);
        };
        document.getElementById('vfsCtxShare').onclick = () => {
          b.classList.remove('active');
          const text = encodeURIComponent(`Check out this ${product.name} at VFS Jewels: ${window.location.origin}/#products`);
          window.open(`https://wa.me/?text=${text}`, '_blank');
        };
        document.getElementById('vfsCtxCopy').onclick = () => {
          b.classList.remove('active');
          navigator.clipboard.writeText(`${window.location.origin}/#product-${product.id}`);
          if (typeof window.toast === 'function') window.toast('Product link copied! 📋');
        };

        b.classList.add('active');
      }

      document.addEventListener('touchstart', (e) => {
        const card = e.target.closest('.product-card, .p-card, .bestseller-card');
        if (!card || e.target.closest('button, input, a, .qty-ctrl')) return;

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        pressTimer = setTimeout(() => {
          const id = card.dataset.id || card.dataset.productId;
          const fullCatalog = typeof window.getFullCatalog === 'function' ? window.getFullCatalog() : (window.PRODUCTS || []);
          const p = fullCatalog.find(x => String(x.id) === String(id));
          if (p) openContextMenu(p, e);
        }, 450);
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        if (!pressTimer) return;
        if (Math.hypot(e.touches[0].clientX - startX, e.touches[0].clientY - startY) > 12) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      }, { passive: true });

      document.addEventListener('touchend', () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      });
    },

    // =======================================================================
    // 5. PINCH TO ZOOM & DOUBLE TAP (PDP & Lightbox)
    // =======================================================================
    initPinchToZoom: function() {
      let currentScale = 1;
      let initialDistance = 0;
      let startScale = 1;
      let panX = 0, panY = 0;
      let startPanX = 0, startPanY = 0;
      let lastTapTime = 0;

      VFSGestures.attachPinchToElement = function(imgEl) {
        if (!imgEl || imgEl.dataset.pinchAttached) return;
        imgEl.dataset.pinchAttached = 'true';
        imgEl.classList.add('vfs-pinch-zoomable');

        imgEl.addEventListener('touchstart', (e) => {
          if (e.touches.length === 1) {
            const now = Date.now();
            if (now - lastTapTime < 300) {
              vfsHaptic.medium(e);
              if (currentScale > 1.2) {
                currentScale = 1;
                panX = 0; panY = 0;
                imgEl.style.transform = '';
                imgEl.classList.remove('is-zoomed');
              } else {
                currentScale = 2.5;
                imgEl.style.transform = `scale(2.5)`;
                imgEl.classList.add('is-zoomed');
              }
              lastTapTime = 0;
              return;
            }
            lastTapTime = now;

            if (currentScale > 1) {
              startPanX = e.touches[0].clientX - panX;
              startPanY = e.touches[0].clientY - panY;
              imgEl.classList.add('is-panning');
            }
          }

          if (e.touches.length === 2) {
            e.preventDefault();
            initialDistance = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
            );
            startScale = currentScale;
            imgEl.classList.add('is-panning');
          }
        }, { passive: false });

        imgEl.addEventListener('touchmove', (e) => {
          if (e.touches.length === 2) {
            e.preventDefault();
            const currentDistance = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
            );
            if (initialDistance > 0) {
              currentScale = Math.min(Math.max(startScale * (currentDistance / initialDistance), 1), 4);
              imgEl.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
              if (currentScale > 1) imgEl.classList.add('is-zoomed');
            }
          } else if (e.touches.length === 1 && currentScale > 1) {
            e.preventDefault();
            panX = e.touches[0].clientX - startPanX;
            panY = e.touches[0].clientY - startPanY;
            imgEl.style.transform = `translate(${panX}px, ${panY}px) scale(${currentScale})`;
          }
        }, { passive: false });

        imgEl.addEventListener('touchend', () => {
          imgEl.classList.remove('is-panning');
          if (currentScale <= 1.05) {
            currentScale = 1;
            panX = 0; panY = 0;
            imgEl.style.transform = '';
            imgEl.classList.remove('is-zoomed');
          }
        });
      };

      setInterval(() => {
        const pdpImg = document.querySelector('#pdpMainImg img, .pdp-main-img img, #zoomLightboxImg');
        if (pdpImg) VFSGestures.attachPinchToElement(pdpImg);
      }, 500);
    },

    // =======================================================================
    // 6. DRAG TO REORDER (Shopping Bag Items)
    // =======================================================================
    initDragToReorder: function() {
      let draggingItem = null;
      let placeholder = null;
      let startY = 0;

      document.addEventListener('touchstart', (e) => {
        const handle = e.target.closest('.vfs-reorder-handle');
        if (!handle) return;

        const item = handle.closest('.vfs-swipe-item-wrapper, .dw-item');
        if (!item) return;

        e.preventDefault();
        vfsHaptic.medium(e);

        draggingItem = item;
        startY = e.touches[0].clientY;

        const rect = item.getBoundingClientRect();
        placeholder = document.createElement('div');
        placeholder.className = 'vfs-reorder-placeholder';
        placeholder.style.height = `${rect.height}px`;

        item.parentNode.insertBefore(placeholder, item);
        item.classList.add('vfs-reorder-dragging');
        item.style.width = `${rect.width}px`;
        item.style.position = 'fixed';
        item.style.top = `${rect.top}px`;
        item.style.left = `${rect.left}px`;
      }, { passive: false });

      document.addEventListener('touchmove', (e) => {
        if (!draggingItem) return;
        e.preventDefault();
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        draggingItem.style.transform = `translateY(${deltaY}px) scale(1.02)`;

        const container = placeholder.parentNode;
        const siblings = Array.from(container.children).filter(c => c !== draggingItem && (c.classList.contains('vfs-swipe-item-wrapper') || c.classList.contains('dw-item')));

        for (const sib of siblings) {
          const sibRect = sib.getBoundingClientRect();
          if (currentY > sibRect.top && currentY < sibRect.bottom) {
            if (currentY < sibRect.top + sibRect.height / 2) {
              container.insertBefore(placeholder, sib);
            } else {
              container.insertBefore(placeholder, sib.nextSibling);
            }
            vfsHaptic.light(e);
            break;
          }
        }
      }, { passive: false });

      document.addEventListener('touchend', (e) => {
        if (!draggingItem) return;
        vfsHaptic.success(e);

        draggingItem.classList.remove('vfs-reorder-dragging');
        draggingItem.style.position = '';
        draggingItem.style.top = '';
        draggingItem.style.left = '';
        draggingItem.style.width = '';
        draggingItem.style.transform = '';

        if (placeholder && placeholder.parentNode) {
          placeholder.parentNode.insertBefore(draggingItem, placeholder);
          placeholder.remove();
        }

        if (window.cart) {
          const newOrderIds = Array.from(document.querySelectorAll('#cartBody .dw-item, #cartBody .vfs-swipe-item-wrapper')).map(el => {
            const raw = el.dataset.id || el.querySelector('.dw-item')?.dataset.id;
            return +raw;
          }).filter(Boolean);

          if (newOrderIds.length > 0) {
            const newCart = [];
            newOrderIds.forEach(id => {
              const found = window.cart.find(c => c.id === id);
              if (found) newCart.push(found);
            });
            window.cart = newCart;
            if (typeof window.saveState === 'function') window.saveState();
          }
        }

        draggingItem = null;
        placeholder = null;
      });
    },

    // =======================================================================
    // 7. GESTURE HINTS (Subtle First-Visit Micro Tooltip)
    // =======================================================================
    initGestureHints: function() {
      const HINT_KEY = 'vfs_gesture_hints_seen_v2';
      if (localStorage.getItem(HINT_KEY)) return;

      const cartDW = document.getElementById('cartDW');
      if (cartDW) {
        const observer = new MutationObserver(() => {
          if ((cartDW.classList.contains('active') || cartDW.classList.contains('open')) && !localStorage.getItem(HINT_KEY)) {
            const firstItem = document.querySelector('#cartBody .dw-item');
            if (firstItem && !document.querySelector('.vfs-gesture-hint')) {
              const hint = document.createElement('div');
              hint.className = 'vfs-gesture-hint';
              hint.style.top = '-36px';
              hint.style.right = '10px';
              hint.innerHTML = `
                <span class="vfs-gesture-hint-icon">👈</span>
                <span>Swipe item left to Save / Delete</span>
                <button class="vfs-gesture-hint-close" title="Got it">&times;</button>
              `;
              firstItem.parentElement.style.position = 'relative';
              firstItem.parentElement.appendChild(hint);

              hint.querySelector('.vfs-gesture-hint-close').onclick = (e) => {
                e.stopPropagation();
                hint.remove();
                localStorage.setItem(HINT_KEY, 'true');
              };

              setTimeout(() => { if (hint) hint.remove(); }, 5000);
            }
          }
        });
        observer.observe(cartDW, { attributes: true, attributeFilter: ['class', 'style'] });
      }
    },

    // =======================================================================
    // MASTER INITIALIZE
    // =======================================================================
    init: function() {
      this.initSwipeToGoBack();
      this.initListItemSwipeActions();
      this.initPullToRefresh();
      this.initLongPressMenus();
      this.initPinchToZoom();
      this.initDragToReorder();
      this.initGestureHints();

      setInterval(() => {
        if (typeof VFSGestures.enhanceCartItems === 'function') {
          VFSGestures.enhanceCartItems();
        }
      }, 600);
    }
  };

  window.VFSGestures = VFSGestures;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VFSGestures.init());
  } else {
    VFSGestures.init();
  }

})(window, document);
