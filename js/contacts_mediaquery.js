// Mobile overlay behavior for Contacts (<= 450px)
// Sidebar takes full width. When a contact is selected, details are shown
// as a full-screen white overlay so the sidebar is hidden (no new page).
//
// Additionally:
// - At <=450px the Add/Edit contact dialog is rearranged (CSS in contacts_mediaquery.css).
// - The close button (×) is moved into the top-right of .contacts_modal_left_panel.

(function () {
  const mq = window.matchMedia('(max-width: 450px)');
  const BODY_OPEN_CLASS = 'contacts-overlay-open';
  const BODY_MENU_CLASS = 'contacts-fab-menu-open';
  // Separate FAB for "Add contact" on the sidebar.
  // Must not interfere with the existing .contacts_overlay_fab (3-dots menu FAB).
  const SIDEBAR_ADD_FAB_CLASS = 'contacts_sidebar_add_fab';

  function isMobile() {
    return mq.matches;
  }

  // Keep a stable viewport height unit on mobile browsers (address bar safe)
  // Sets CSS var --vh to 1% of window.innerHeight (in px).
  function setVhVar() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }


  function openOverlay() {
    if (!isMobile()) return;
    document.body.classList.add(BODY_OPEN_CLASS);
    ensureBackButton();
    ensureOverlayFab();
    ensureFabMenu();
  }

  function closeOverlay() {
    document.body.classList.remove(BODY_OPEN_CLASS);
    closeFabMenu();
    removeBackButton();
    removeOverlayFab();
    removeFabMenu();
    // Sidebar is visible again after closing the overlay.
    ensureSidebarAddFab();
    if (typeof window.clearSelection === 'function') window.clearSelection();
  }

  function ensureSidebarAddFab() {
    if (!isMobile()) return;
    // Only show this when the sidebar is visible (i.e. not in the details overlay).
    if (document.body.classList.contains(BODY_OPEN_CLASS)) return;

    const sidebar = document.querySelector('main.content .contacts_sidebar');
    if (!sidebar) return;
    if (sidebar.querySelector('.' + SIDEBAR_ADD_FAB_CLASS)) return;

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = SIDEBAR_ADD_FAB_CLASS;
    fab.setAttribute('aria-label', 'Add new contact');
    fab.innerHTML = '<img src="assets/img/person_add.svg" alt="">';
    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.openDialog === 'function') window.openDialog();
    });
    fab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fab.click();
      }
    });

    sidebar.appendChild(fab);
  }

  function removeSidebarAddFab() {
    const fab = document.querySelector('.' + SIDEBAR_ADD_FAB_CLASS);
    if (fab) fab.remove();
  }

  function openFabMenu() {
    if (!isMobile()) return;
    ensureFabMenu();
    const menu = document.querySelector('.contacts_fab_menu');
    if (menu) menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add(BODY_MENU_CLASS);
  }

  function closeFabMenu() {
    document.body.classList.remove(BODY_MENU_CLASS);
    const menu = document.querySelector('.contacts_fab_menu');
    if (menu) menu.setAttribute('aria-hidden', 'true');
  }

  function ensureBackButton() {
    const header = document.querySelector('.contact_detail_header');
    if (!header) return;
    if (header.querySelector('.contacts_overlay_back')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'contacts_overlay_back';
    btn.setAttribute('aria-label', 'Back');
    // Use the provided SVG icon instead of a text arrow.
    btn.innerHTML = '<img src="assets/img/arrow-left-line.svg" alt="" class="contacts_overlay_back_icon">';
    btn.addEventListener('click', closeOverlay);

    // Place the back button to the RIGHT of the "Contacts" title.
    // The mobile overlay header uses a grid layout in CSS to position elements.
    header.appendChild(btn);
  }

  function ensureOverlayFab() {
    // Circular button (bottom-right) with 3-dots icon.
    if (document.querySelector('.contacts_overlay_fab')) return;
    const fab = document.createElement('div');
    fab.className = 'contacts_overlay_fab';
    fab.setAttribute('role', 'button');
    fab.setAttribute('tabindex', '0');
    fab.setAttribute('aria-label', 'More actions');
    fab.innerHTML = '<img src="assets/img/3points.svg" alt="">';
    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      if (document.body.classList.contains(BODY_MENU_CLASS)) closeFabMenu();
      else openFabMenu();
    });
    fab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fab.click();
      }
    });
    document.body.appendChild(fab);
  }

  function removeOverlayFab() {
    const fab = document.querySelector('.contacts_overlay_fab');
    if (fab) fab.remove();
  }

  function ensureFabMenu() {
    if (document.querySelector('.contacts_fab_menu')) return;
    const menu = document.createElement('div');
    menu.className = 'contacts_fab_menu';
    menu.setAttribute('aria-hidden', 'true');
    menu.innerHTML =
      '<div class="detail_edit"><img src="assets/img/edit.svg" class="detail_action_icon">Edit</div>' +
      '<div class="detail_delete"><img src="assets/img/delete.svg" class="detail_action_icon">delete</div>';

    // Wire actions to existing (hidden) inline actions if present.
    const edit = menu.querySelector('.detail_edit');
    const del = menu.querySelector('.detail_delete');

    if (edit) {
      edit.addEventListener('click', (e) => {
        e.stopPropagation();
        closeFabMenu();
        const hidden = document.querySelector('.contact_detail_root .detail_actions .detail_edit');
        if (hidden) hidden.click();
        else if (typeof window.openEdit === 'function') {
          const idx = window.__contacts_selected_idx;
          if (typeof idx === 'number') window.openEdit(idx);
        }
      });
    }

    if (del) {
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        closeFabMenu();
        const hidden = document.querySelector('.contact_detail_root .detail_actions .detail_delete');
        if (hidden) hidden.click();
      });
    }

    // Keep clicks inside the menu from closing it.
    menu.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(menu);
  }

  function removeFabMenu() {
    const menu = document.querySelector('.contacts_fab_menu');
    if (menu) menu.remove();
    closeFabMenu();
  }

  function removeBackButton() {
    const btn = document.querySelector('.contacts_overlay_back');
    if (btn) btn.remove();
  }

  function syncForBreakpoint() {
    if (!isMobile()) {
      document.body.classList.remove(BODY_OPEN_CLASS);
      closeFabMenu();
      removeBackButton();
      removeOverlayFab();
      removeFabMenu();
      removeSidebarAddFab();
      if (typeof window.positionDetailRoot === 'function') window.positionDetailRoot();
      syncDialogCloseButtonPlacement();
      syncDialogAvatarPlacement();
      return;
    }

    // On <=450px: show the "Add contact" FAB on the sidebar.
    ensureSidebarAddFab();

    const root = document.querySelector('.contact_detail_root');
    const hasContent = !!(root && root.children && root.children.length);
    if (!hasContent) {
      document.body.classList.remove(BODY_OPEN_CLASS);
      closeFabMenu();
      removeBackButton();
      removeOverlayFab();
      removeFabMenu();
      ensureSidebarAddFab();
    }
    syncDialogCloseButtonPlacement();
    syncDialogAvatarPlacement();
  }

  // --- Dialog (Add/Edit contact) adjustments for <=450px ---
  // CSS handles panel stacking + avatar overlap.
  // Here we:
  // 1) move the close button into the left panel
  // 2) move the avatar container into the left panel so it can be anchored to its bottom edge
  function syncDialogCloseButtonPlacement() {
    const backdrop = document.querySelector('.contacts_modal_backdrop');
    if (!backdrop) return;

    const closeBtn = backdrop.querySelector('.contacts_modal_close');
    if (!closeBtn) return;

    const leftPanel = backdrop.querySelector('.contacts_modal_left_panel');
    const rightHeader = backdrop.querySelector('.contacts_modal_right_panel .contacts_modal_header');

    if (isMobile()) {
      if (leftPanel && closeBtn.parentElement !== leftPanel) leftPanel.appendChild(closeBtn);
    } else {
      // Put it back where it belongs on larger screens.
      if (rightHeader && closeBtn.parentElement !== rightHeader) rightHeader.appendChild(closeBtn);
    }
  }

  // Move the avatar column into the left (dark) panel on <=450px so it can be
  // anchored to the panel's bottom edge (CSS). On larger screens we restore the
  // original DOM order (between left and right panels).
  function syncDialogAvatarPlacement() {
    const backdrop = document.querySelector('.contacts_modal_backdrop');
    if (!backdrop) return;

    const avatarCol = backdrop.querySelector('.contacts_modal_avatar_col');
    if (!avatarCol) return;

    const leftPanel = backdrop.querySelector('.contacts_modal_left_panel');
    const content = backdrop.querySelector('.contacts_modal_content');
    const rightPanel = backdrop.querySelector('.contacts_modal_right_panel');
    if (!leftPanel || !content) return;

    if (isMobile()) {
      // Put the avatar INSIDE the left panel so CSS can anchor it at the bottom.
      if (avatarCol.parentElement !== leftPanel) {
        leftPanel.appendChild(avatarCol);
      }
    } else {
      // Restore original placement: left panel | avatar col | right panel
      if (avatarCol.parentElement !== content) {
        if (rightPanel) content.insertBefore(avatarCol, rightPanel);
        else content.appendChild(avatarCol);
      }
    }
  }

  function observeDialog() {
    // Watch for dialog creation/open state changes.
    const target = document.body;
    const obs = new MutationObserver(() => {
      syncDialogCloseButtonPlacement();
      syncDialogAvatarPlacement();
    });
    obs.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  function patchContactsFunctions() {
    // IMPORTANT:
    // In contacts.js the list items call the *local* function `selectUserAt()`
    // (not `window.fillProfile`). Wrapping `window.fillProfile` therefore does
    // not reliably run on click. To guarantee overlay behavior, we wrap the
    // exported `window.selectUserAt` which is what the inline onclick calls.

    const origSelectUserAt = window.selectUserAt;
    if (typeof origSelectUserAt === 'function') {
      window.selectUserAt = function (...args) {
        // Remember the last selected contact index for the FAB menu.
        if (typeof args[0] === 'number') window.__contacts_selected_idx = args[0];
        const res = origSelectUserAt.apply(this, args);
        openOverlay();
        return res;
      };
    }

    const origClearSelection = window.clearSelection;
    if (typeof origClearSelection === 'function') {
      window.clearSelection = function (...args) {
        const res = origClearSelection.apply(this, args);
        if (isMobile()) {
          document.body.classList.remove(BODY_OPEN_CLASS);
          closeFabMenu();
          removeBackButton();
          removeOverlayFab();
          removeFabMenu();
        }
        return res;
      };
    }

    // Ensure the dialog close button is moved right after opening (Add/Edit).
    const origOpenDialog = window.openDialog;
    if (typeof origOpenDialog === 'function') {
      window.openDialog = function (...args) {
        const res = origOpenDialog.apply(this, args);
        setTimeout(() => {
          syncDialogCloseButtonPlacement();
          syncDialogAvatarPlacement();
        }, 0);
        return res;
      };
    }

    const origOpenEdit = window.openEdit;
    if (typeof origOpenEdit === 'function') {
      window.openEdit = function (...args) {
        const res = origOpenEdit.apply(this, args);
        setTimeout(() => {
          syncDialogCloseButtonPlacement();
          syncDialogAvatarPlacement();
        }, 0);
        return res;
      };
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains(BODY_OPEN_CLASS)) {
        closeOverlay();
      }
    });

    // Close the small FAB menu when the user clicks anywhere outside.
    // No backdrop is used (requirement: background must not change).
    document.addEventListener('click', () => {
      if (document.body.classList.contains(BODY_MENU_CLASS)) closeFabMenu();
    });
  }

  function init() {
    patchContactsFunctions();
    setVhVar();
    observeDialog();
    syncForBreakpoint();

    window.addEventListener('resize', setVhVar);
    window.addEventListener('orientationchange', setVhVar);

    if (mq.addEventListener) mq.addEventListener('change', syncForBreakpoint);
    else mq.addListener(syncForBreakpoint);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
