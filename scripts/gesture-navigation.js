/**
 * VFS JEWELS — NATIVE MOBILE GESTURE NAVIGATION SUITE
 * 8 / 8 Interaction Patterns:
 * 1. Swipe to Go Back (Edge Swipe, Modal Dismiss & Native History PopState Sync)
 * 2. List Item Swipe Actions (Swipe Left for Delete/Wishlist, Swipe Right for +1)
 * 3. Pull to Refresh (Elastic Pull & Gold Jewel Spinner)
 * 4. Long Press Menus (Glassmorphic Context Menu for Products)
 * 5. Pinch to Zoom (1x–4x Multi-touch Pan & Zoom with Double Tap)
 * 6. Drag to Reorder (Long-press Lift & Vertical Reordering in Bag)
 * 7. Gesture Hints (Subtle Animated Micro-hints)
 * 8. Haptic Feedback (Calibrated Tactile Vibration & Visual Wave Fallback)
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
        try { navigator.vibrate(14); } catch (err) {}
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
  let isPoppingHistoryState = false;

  const VFSGestures = {
    version: '2.0.0',

    // =======================================================================
    // 0. SPA HISTORY & NATIVE MOBILE BACK GESTURE BRIDGE
    // =======================================================================
    initHistoryBridge: function() {
      // Set initial base state if not set
      if (!window.history.state) {
        window.history.replaceState({ vfsBase: true }, '', window.location.href);
      }

      window.addEventListener('popstate', function(e) {
        isPoppingHistoryState = true;
        try {
          const openModal = VFSGestures.getOpenModal();
          if (openModal) {
            VFSGestures.dismissCurrentView(openModal, true);
          }
        } finally {
          setTimeout(() => { isPoppingHistoryState = false; }, 80);
        }
      });
    },

    onModalOpen: function(modalType, modalId) {
      if (isPoppingHistoryState) return;
      const hash = '#' + (modalId ? (modalType + '-' + modalId) : modalType);
      if (window.location.hash !== hash) {
        window.history.pushState({ vfsModal: modalType, modalId: modalId, timestamp: Date.now() }, '', hash);
      }
    },

    onModalClose: function(modalType) {
      if (isPoppingHistoryState) return;
      if (window.history.state && window.history.state.vfsModal === modalType) {
        try { window.history.back(); } catch(e) {}
      }
    },

    getOpenModal: function() {
      const candidates = [
        document.getElementById('pdpOverlay'),
        document.getElementById('cartDW'),
        document.getElementById('profileDW'),
        document.getElementById('wlDW'),
        document.getElementById('searchOL'),
        document.getElementById('storeOverlay'),
        document.getElementById('trackingOverlay'),
        document.getElementById('zoomLightbox'),
        document.getElementById('guideModal'),
        document.getElementById('walletModal'),
        document.getElementById('vcModal'),
        document.getElementById('returnPolicyModal'),
        document.getElementById('pinModal'),
        document.getElementById('categoryPageView'),
        document.getElementById('welcomeModeModal')
      ];

      for (const el of candidates) {
        if (!el) continue;
        if (el.id === 'categoryPageView' || el.id === 'welcomeModeModal') {
          if (el.style.display !== 'none' && el.style.display !== '') return el;
        } else if (el.classList.contains('active') || el.classList.contains('open') || (el.style.display && el.style.display !== 'none' && el.style.display !== '')) {
          return el;
        }
      }

      // Check generic active overlays
      const anyActive = document.querySelector('.pdp-overlay.active, .dw.active, .vfs-modal-overlay.active');
      return anyActive || null;
    },

    dismissCurrentView: function(activeModal, isFromHistory) {
      if (!activeModal) {
        activeModal = VFSGestures.getOpenModal();
      }

      if (activeModal) {
        const modalId = activeModal.id || '';

        if (modalId === 'pdpOverlay' || activeModal.classList.contains('pdp-overlay')) {
          const closeBtn = activeModal.querySelector('.pdp-back, #pdpBack, #closePDP');
          if (closeBtn) {
            closeBtn.click();
          } else if (typeof window.closePDP === 'function') {
            window.closePDP();
          } else {
            activeModal.classList.remove('active');
            document.body.style.overflow = '';
          }
        } else if (modalId === 'cartDW') {
          const closeBtn = document.getElementById('closeCartDW') || document.getElementById('cartBG');
          if (closeBtn) closeBtn.click();
          else if (typeof window.closeDrawer === 'function') window.closeDrawer('cart');
          else activeModal.classList.remove('active');
        } else if (modalId === 'profileDW') {
          const closeBtn = document.getElementById('closeProfileDW') || document.getElementById('profileBG');
          if (closeBtn) closeBtn.click();
          else if (typeof window.closeDrawer === 'function') window.closeDrawer('profile');
          else activeModal.classList.remove('active');
        } else if (modalId === 'wlDW') {
          const closeBtn = document.getElementById('closeWLDW') || document.getElementById('wlBG');
          if (closeBtn) closeBtn.click();
          else if (typeof window.closeDrawer === 'function') window.closeDrawer('wl');
          else activeModal.classList.remove('active');
        } else if (modalId === 'searchOL') {
          const closeBtn = activeModal.querySelector('.search-close, #searchClose');
          if (closeBtn) closeBtn.click();
          else activeModal.classList.remove('active');
        } else if (modalId === 'storeOverlay') {
          const closeBtn = document.getElementById('closeStoreOverlay') || document.getElementById('closeStoreLocator');
          if (closeBtn) closeBtn.click();
          else if (typeof window.closeStoreLocator === 'function') window.closeStoreLocator();
          else activeModal.classList.remove('active');
        } else if (modalId === 'trackingOverlay') {
          const closeBtn = document.getElementById('closeTracking');
          if (closeBtn) closeBtn.click();
          else activeModal.classList.remove('active');
        } else if (modalId === 'zoomLightbox') {
          const closeBtn = document.getElementById('closeZoomLightbox');
          if (closeBtn) closeBtn.click();
          else activeModal.classList.remove('active');
        } else if (modalId === 'guideModal') {
          const closeBtn = document.getElementById('closeGuideModal');
          if (closeBtn) closeBtn.click();
          else if (typeof window.closeGuideModal === 'function') window.closeGuideModal();
          else activeModal.classList.remove('active');
        } else if (modalId === 'categoryPageView') {
          activeModal.style.display = 'none';
          const mainStore = document.getElementById('products');
          if (mainStore) mainStore.scrollIntoView({ behavior: 'smooth' });
        } else {
          activeModal.classList.remove('active', 'open');
          activeModal.style.display = 'none';
          document.body.style.overflow = '';
        }

        // If closed via gesture or click, pop history entry to keep history clean
        if (!isFromHistory && window.history.state && window.history.state.vfsModal) {
          try { window.history.back(); } catch(e) {}
        }
      } else if (!isFromHistory && window.history.length > 1) {
        window.history.back();
      }
    },

    // =======================================================================
    // 1. SWIPE TO GO BACK (Edge Swipe & Drawer / PDP Swipe Dismiss)
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

      function handleStart(clientX, clientY, target) {
        if (target.closest('[data-gesture-no-edge-swipe]') || target.closest('#tinderCard') || target.closest('.announcement-slider')) {
          return;
        }

        startX = clientX;
        startY = clientY;
        currentX = startX;
        activeModal = VFSGestures.getOpenModal();

        // Edge detection (starts within first 50px from left edge)
        if (startX <= 50) {
          isEdgeSwipe = true;
          isModalSwipe = false;
          const ind = getIndicator();
          ind.style.opacity = '1';
          ind.classList.add('vfs-edge-swipe-active');
        } else if (activeModal && (target.closest('.dw') || target.closest('.pdp-overlay') || target.closest('.pdp-container') || target.closest('.modal-bg') || target.closest('.vfs-modal-overlay'))) {
          // Modal body swipe right
          isModalSwipe = true;
          isEdgeSwipe = false;
        }
      }

      function handleMove(clientX, clientY, e) {
        if (!isEdgeSwipe && !isModalSwipe) return;
        currentX = clientX;
        const deltaX = currentX - startX;
        const deltaY = clientY - startY;

        // Cancel if user is scrolling vertically
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 30) {
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
            const drawerContent = activeModal.querySelector('.dw-content, .pdp-container, .pin-modal, .vfs-modal-content') || activeModal;
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

          if (deltaX > 55) {
            vfsHaptic.medium(e);
            VFSGestures.dismissCurrentView(activeModal, false);
          }
        } else if (isModalSwipe && activeModal) {
          const drawerContent = activeModal.querySelector('.dw-content, .pdp-container, .pin-modal, .vfs-modal-content') || activeModal;
          if (drawerContent) drawerContent.style.transition = '';
          if (deltaX > 75) {
            vfsHaptic.medium(e);
            VFSGestures.dismissCurrentView(activeModal, false);
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

    // =======================================================================
    // 2. LIST ITEM SWIPE ACTIONS (Delete, Wishlist, +1 Add)
    // =======================================================================
    initListItemSwipeActions: function() {
      let activeSwipedItem = null;

      VFSGestures.enhanceCartItems = function() {
        const items = document.querySelectorAll('#cartBody .dw-item, #wlBody .dw-item');
        
        items.forEach(item => {
          if (item.closest('.vfs-swipe-item-wrapper')) return;

          const itemId = item.dataset.id || item.dataset.ci || (item.querySelector('[data-rm]') ? item.querySelector('[data-rm]').getAttribute('data-rm') : '') || (item.querySelector('[data-qty]') ? item.querySelector('[data-qty]').getAttribute('data-qty') : '');
          const wrapper = document.createElement('div');
          wrapper.className = 'vfs-swipe-item-wrapper';

          // Right Actions (Swipe Left -> Delete & Save to Wishlist)
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
          let startY = 0;
          let currentX = 0;
          let isSwiping = false;

          function startSwipe(clientX, clientY) {
            if (activeSwipedItem && activeSwipedItem !== item) {
              activeSwipedItem.style.transform = '';
              activeSwipedItem = null;
            }
            startX = clientX;
            startY = clientY;
            currentX = startX;
            isSwiping = true;
            item.classList.add('is-swiping');
          }

          function moveSwipe(clientX, clientY) {
            if (!isSwiping) return;
            const deltaY = clientY - startY;
            const deltaX = clientX - startX;
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 25) {
              isSwiping = false;
              item.classList.remove('is-swiping');
              item.style.transform = '';
              return;
            }
            currentX = clientX;
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
              item.style.transform = 'translateX(76px)';
              activeSwipedItem = item;
              vfsHaptic.light(e);
            } else {
              item.style.transform = '';
              if (activeSwipedItem === item) activeSwipedItem = null;
            }
          }

          item.addEventListener('touchstart', (e) => {
            if (e.target.closest('.vfs-reorder-handle') || e.target.closest('button') || e.target.closest('input')) return;
            startSwipe(e.touches[0].clientX, e.touches[0].clientY);
          }, { passive: true });

          item.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            moveSwipe(e.touches[0].clientX, e.touches[0].clientY);
          }, { passive: true });

          item.addEventListener('touchend', (e) => endSwipe(e));

          // Pointer/Mouse events support
          item.addEventListener('mousedown', (e) => {
            if (e.target.closest('.vfs-reorder-handle') || e.target.closest('button') || e.target.closest('input')) return;
            startSwipe(e.clientX, e.clientY);
            const onMouseMove = (ev) => moveSwipe(ev.clientX, ev.clientY);
            const onMouseUp = (ev) => {
              endSwipe(ev);
              document.removeEventListener('mousemove', onMouseMove);
              document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
          });
        });
      };

      // Handle swipe action button clicks
      document.addEventListener('click', (e) => {
        const delBtn = e.target.closest('.vfs-swipe-btn-delete');
        if (delBtn) {
          const id = delBtn.dataset.swipeDelete;
          vfsHaptic.medium(e);
          const origRm = document.querySelector(`.dw-rm[data-rm="${id}"]`);
          if (origRm) origRm.click();
          else if (typeof window.removeFromCart === 'function') window.removeFromCart(id);
          return;
        }

        const wlBtn = e.target.closest('.vfs-swipe-btn-wishlist');
        if (wlBtn) {
          const id = wlBtn.dataset.swipeWishlist;
          vfsHaptic.success(e);
          if (typeof window.addToWishlist === 'function') window.addToWishlist(id);
          const origRm = document.querySelector(`.dw-rm[data-rm="${id}"]`);
          if (origRm) origRm.click();
          else if (typeof window.removeFromCart === 'function') window.removeFromCart(id);
          return;
        }

        const addBtn = e.target.closest('.vfs-swipe-btn-add');
        if (addBtn) {
          const id = addBtn.dataset.swipeAdd;
          vfsHaptic.light(e);
          const plusBtn = document.querySelector(`button[data-qty="${id}"][data-d="1"]`);
          if (plusBtn) plusBtn.click();
          else if (typeof window.changeQty === 'function') window.changeQty(id, 1);
          return;
        }

        // Collapse active item on outside tap
        if (activeSwipedItem && !e.target.closest('.vfs-swipe-item-wrapper')) {
          activeSwipedItem.style.transform = '';
          activeSwipedItem = null;
        }
      });
    },

    // =======================================================================
    // 3. PULL TO REFRESH (Elastic Pull & Gold Jewel Spinner)
    // =======================================================================
    initPullToRefresh: function() {
      let startY = 0;
      let currentY = 0;
      let isPulling = false;
      let isRefreshing = false;
      let indicator = null;

      function getIndicator() {
        if (!indicator) {
          indicator = document.querySelector('.vfs-pull-refresh-badge');
          if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'vfs-pull-refresh-badge';
            indicator.innerHTML = `
              <div class="vfs-pull-spinner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 3h12l4 6-10 12L2 9l4-6z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="vfs-pull-text">Pull to refresh</span>
            `;
            document.body.appendChild(indicator);
          }
        }
        return indicator;
      }

      function handleStart(y) {
        if (window.scrollY > 5) return;
        const openModal = VFSGestures.getOpenModal();
        if (openModal) return;
        startY = y;
        currentY = startY;
        isPulling = true;
      }

      function handleMove(y, e) {
        if (!isPulling || isRefreshing) return;
        if (window.scrollY > 5) {
          isPulling = false;
          getIndicator().classList.remove('vfs-pull-visible');
          return;
        }

        currentY = y;
        const pullDistance = currentY - startY;

        if (pullDistance > 15) {
          const ind = getIndicator();
          ind.classList.add('vfs-pull-visible');
          const boundedPull = Math.min(pullDistance * 0.4, 75);
          ind.style.transform = `translateX(-50%) translateY(${boundedPull}px)`;

          const spinner = ind.querySelector('.vfs-pull-spinner');
          if (spinner) {
            spinner.style.transform = `rotate(${pullDistance * 2.8}deg)`;
          }

          const text = ind.querySelector('.vfs-pull-text');
          if (pullDistance > 75) {
            text.textContent = 'Release to refresh';
          } else {
            text.textContent = 'Pull to refresh';
          }
        }
      }

      function handleEnd(e) {
        if (!isPulling || isRefreshing) return;
        isPulling = false;
        const pullDistance = currentY - startY;
        const ind = getIndicator();

        if (pullDistance > 75) {
          isRefreshing = true;
          vfsHaptic.medium(e);
          ind.querySelector('.vfs-pull-text').textContent = 'Updating collection...';
          ind.classList.add('vfs-pull-loading');

          setTimeout(() => {
            if (typeof window.renderCatalog === 'function') window.renderCatalog();
            if (typeof window.updateCounts === 'function') window.updateCounts();
            vfsHaptic.success();
            ind.classList.remove('vfs-pull-loading', 'vfs-pull-visible');
            ind.style.transform = '';
            isRefreshing = false;
          }, 900);
        } else {
          ind.classList.remove('vfs-pull-visible');
          ind.style.transform = '';
        }
      }

      document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) handleStart(e.touches[0].clientY);
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) handleMove(e.touches[0].clientY, e);
      }, { passive: true });

      document.addEventListener('touchend', (e) => handleEnd(e));
    },

    // =======================================================================
    // 4. LONG PRESS CONTEXT MENUS (Glassmorphic Luxury Action Sheet)
    // =======================================================================
    initLongPressMenus: function() {
      let pressTimer = null;
      let startX = 0;
      let startY = 0;
      let activeCard = null;

      function createContextMenu() {
        let menu = document.getElementById('vfsContextMenu');
        if (!menu) {
          menu = document.createElement('div');
          menu.id = 'vfsContextMenu';
          menu.className = 'vfs-context-menu';
          menu.innerHTML = `
            <div class="vfs-cm-backdrop"></div>
            <div class="vfs-cm-card">
              <div class="vfs-cm-header">
                <img class="vfs-cm-img" src="" alt="Product">
                <div class="vfs-cm-info">
                  <div class="vfs-cm-meta">18K Anti-Tarnish</div>
                  <div class="vfs-cm-name">Product Name</div>
                  <div class="vfs-cm-price">₹0</div>
                </div>
              </div>
              <div class="vfs-cm-actions">
                <button class="vfs-cm-btn" data-action="quickview">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>Quick View</span>
                </button>
                <button class="vfs-cm-btn" data-action="addbag">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  <span>Add to Bag</span>
                </button>
                <button class="vfs-cm-btn" data-action="wishlist">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span>Wishlist</span>
                </button>
                <button class="vfs-cm-btn" data-action="whatsapp">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                  <span>WhatsApp</span>
                </button>
                <button class="vfs-cm-btn" data-action="copy">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(menu);

          menu.querySelector('.vfs-cm-backdrop').addEventListener('click', () => {
            menu.classList.remove('active');
          });

          menu.querySelectorAll('.vfs-cm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const action = btn.dataset.action;
              const prodId = menu.dataset.prodId;
              menu.classList.remove('active');

              if (action === 'quickview') {
                if (typeof window.openPDP === 'function') window.openPDP(prodId);
              } else if (action === 'addbag') {
                if (typeof window.addToCart === 'function') window.addToCart(prodId, 1);
                vfsHaptic.success(e);
              } else if (action === 'wishlist') {
                if (typeof window.toggleWishlist === 'function') window.toggleWishlist(prodId);
                else if (typeof window.addToWishlist === 'function') window.addToWishlist(prodId);
                vfsHaptic.success(e);
              } else if (action === 'whatsapp') {
                const url = `https://wa.me/919025327860?text=${encodeURIComponent('Hi VFS Jewels, I am interested in: ' + window.location.origin + '/#pdp-' + prodId)}`;
                window.open(url, '_blank');
              } else if (action === 'copy') {
                navigator.clipboard.writeText(`${window.location.origin}/#pdp-${prodId}`).then(() => {
                  if (typeof window.toast === 'function') window.toast('Product link copied!');
                });
              }
            });
          });
        }
        return menu;
      }

      function openMenu(card, e) {
        const prodId = card.dataset.id || card.querySelector('[data-id]')?.dataset.id || card.querySelector('[data-pdp]')?.dataset.pdp;
        if (!prodId) return;

        vfsHaptic.medium(e);
        const menu = createContextMenu();
        menu.dataset.prodId = prodId;

        const imgEl = card.querySelector('img');
        const titleEl = card.querySelector('.p-name, .prod-name, .item-title, h3, h4');
        const priceEl = card.querySelector('.p-price, .prod-price, .item-price, .price');

        if (imgEl) menu.querySelector('.vfs-cm-img').src = imgEl.src;
        if (titleEl) menu.querySelector('.vfs-cm-name').textContent = titleEl.textContent.trim();
        if (priceEl) menu.querySelector('.vfs-cm-price').textContent = priceEl.textContent.trim();

        menu.classList.add('active');
        VFSGestures.onModalOpen('contextmenu', prodId);
      }

      document.addEventListener('touchstart', (e) => {
        const card = e.target.closest('.p-card, .prod-card, .bestseller-card, .offer-card');
        if (!card || e.target.closest('button') || e.target.closest('.qty-ctrl')) return;

        activeCard = card;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;

        pressTimer = setTimeout(() => {
          openMenu(activeCard, e);
          pressTimer = null;
        }, 420);
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        if (!pressTimer) return;
        const deltaX = Math.abs(e.touches[0].clientX - startX);
        const deltaY = Math.abs(e.touches[0].clientY - startY);
        if (deltaX > 10 || deltaY > 10) {
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
    // 5. PINCH TO ZOOM & DOUBLE TAP (Multi-touch Zoom & Pan)
    // =======================================================================
    initPinchToZoom: function() {
      let initialDist = 0;
      let currentScale = 1;
      let initialScale = 1;
      let targetImg = null;
      let startPanX = 0;
      let startPanY = 0;
      let panX = 0;
      let panY = 0;
      let lastTap = 0;

      function getDistance(touches) {
        return Math.hypot(
          touches[0].clientX - touches[1].clientX,
          touches[0].clientY - touches[1].clientY
        );
      }

      document.addEventListener('touchstart', (e) => {
        const img = e.target.closest('#pdpMainImg img, .pdp-images-slider img, #zoomLightbox img, .zoom-container img');
        if (!img) return;

        // Double tap toggle zoom
        if (e.touches.length === 1) {
          const now = Date.now();
          if (now - lastTap < 300) {
            targetImg = img;
            if (currentScale > 1.1) {
              currentScale = 1;
              panX = 0;
              panY = 0;
              img.style.transform = '';
            } else {
              currentScale = 2.4;
              img.style.transform = `scale(${currentScale})`;
              vfsHaptic.light(e);
            }
            lastTap = 0;
            return;
          }
          lastTap = now;

          if (currentScale > 1.1) {
            startPanX = e.touches[0].clientX - panX;
            startPanY = e.touches[0].clientY - panY;
          }
        }

        // Two fingers pinch
        if (e.touches.length === 2) {
          targetImg = img;
          initialDist = getDistance(e.touches);
          initialScale = currentScale;
          img.style.transition = 'none';
        }
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        if (!targetImg) return;

        if (e.touches.length === 2) {
          const dist = getDistance(e.touches);
          const factor = dist / initialDist;
          currentScale = Math.min(Math.max(initialScale * factor, 1), 3.8);
          targetImg.style.transform = `scale(${currentScale}) translate(${panX / currentScale}px, ${panY / currentScale}px)`;
        } else if (e.touches.length === 1 && currentScale > 1.1) {
          panX = e.touches[0].clientX - startPanX;
          panY = e.touches[0].clientY - startPanY;
          targetImg.style.transform = `scale(${currentScale}) translate(${panX / currentScale}px, ${panY / currentScale}px)`;
        }
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        if (!targetImg) return;
        if (e.touches.length === 0) {
          if (currentScale <= 1.05) {
            targetImg.style.transition = 'transform 0.2s ease-out';
            targetImg.style.transform = '';
            currentScale = 1;
            panX = 0;
            panY = 0;
          }
        }
      });
    },

    // =======================================================================
    // 6. DRAG TO REORDER (Cart Items Reordering)
    // =======================================================================
    initDragToReorder: function() {
      let draggedItem = null;
      let startY = 0;
      let originalIndex = 0;

      document.addEventListener('touchstart', (e) => {
        const handle = e.target.closest('.vfs-reorder-handle');
        if (!handle) return;

        const itemWrapper = handle.closest('.vfs-swipe-item-wrapper');
        if (!itemWrapper) return;

        draggedItem = itemWrapper;
        startY = e.touches[0].clientY;
        const allItems = Array.from(itemWrapper.parentNode.children);
        originalIndex = allItems.indexOf(itemWrapper);

        itemWrapper.classList.add('is-dragging-reorder');
        vfsHaptic.medium(e);
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        if (!draggedItem) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        draggedItem.style.transform = `translateY(${deltaY}px)`;

        // Check sibling overlap for dynamic reordering
        const siblings = Array.from(draggedItem.parentNode.children).filter(el => el !== draggedItem);
        for (const sib of siblings) {
          const rect = sib.getBoundingClientRect();
          if (currentY > rect.top && currentY < rect.bottom) {
            if (currentY > rect.top + rect.height / 2) {
              sib.after(draggedItem);
            } else {
              sib.before(draggedItem);
            }
            break;
          }
        }
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        if (!draggedItem) return;
        draggedItem.classList.remove('is-dragging-reorder');
        draggedItem.style.transform = '';
        vfsHaptic.success(e);

        // Sync reordered cart to localStorage
        const newIds = Array.from(document.querySelectorAll('#cartBody .dw-item')).map(item => item.dataset.id).filter(Boolean);
        if (newIds.length && Array.isArray(window.cart)) {
          const newCart = [];
          newIds.forEach(id => {
            const item = window.cart.find(c => c.id === id);
            if (item) newCart.push(item);
          });
          window.cart.forEach(c => {
            if (!newCart.find(x => x.id === c.id)) newCart.push(c);
          });
          window.cart = newCart;
          if (typeof window.saveState === 'function') window.saveState();
        }

        draggedItem = null;
      });
    },

    // =======================================================================
    // 7. GESTURE HINTS (Subtle First-Visit Micro-Hints)
    // =======================================================================
    initGestureHints: function() {
      if (sessionStorage.getItem('vfs_gesture_hints_shown')) return;

      const observer = new MutationObserver(() => {
        const firstCartItem = document.querySelector('#cartBody .dw-item');
        if (firstCartItem && !document.querySelector('.vfs-gesture-hint')) {
          const hint = document.createElement('div');
          hint.className = 'vfs-gesture-hint';
          hint.innerHTML = `<span>👈 Swipe item to Delete / Save</span>`;
          firstCartItem.parentNode.insertBefore(hint, firstCartItem);
          sessionStorage.setItem('vfs_gesture_hints_shown', '1');

          setTimeout(() => {
            hint.style.opacity = '0';
            setTimeout(() => hint.remove(), 400);
          }, 3500);
        }
      });

      const cartBody = document.getElementById('cartBody');
      if (cartBody) {
        observer.observe(cartBody, { childList: true });
      }
    },

    // =======================================================================
    // INITIALIZER
    // =======================================================================
    init: function() {
      this.initHistoryBridge();
      this.initSwipeToGoBack();
      this.initListItemSwipeActions();
      this.initPullToRefresh();
      this.initLongPressMenus();
      this.initPinchToZoom();
      this.initDragToReorder();
      this.initGestureHints();
    }
  };

  window.VFSGestures = VFSGestures;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => VFSGestures.init());
  } else {
    VFSGestures.init();
  }

})(window, document);
