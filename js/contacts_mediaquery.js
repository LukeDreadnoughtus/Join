// Mobile overlay behavior for Contacts (<= 700px)
// Sidebar takes full width. When a contact is selected, details are shown
// as a full-screen white overlay so the sidebar is hidden (no new page).
//
// Additionally:
// - At <=700px the Add/Edit contact dialog is rearranged (CSS in contacts_mediaquery.css).
// - The close button (×) is moved into the top-right of .contacts_modal_left_panel.

(function () {
  const mq = window.matchMedia('(max-width: 700px)');
  const BODY_OPEN_CLASS = 'contacts-overlay-open';
  const BODY_MENU_CLASS = 'contacts-fab-menu-open';
  // Separate FAB for "Add contact" on the sidebar.
  // Must not interfere with the existing .contacts_overlay_fab (3-dots menu FAB).
  const SIDEBAR_ADD_FAB_CLASS = 'contacts_sidebar_add_fab';

  function isMobile() {
    // Checks if the current viewport matches the mobile breakpoint (<= 700px).
    // Basically a single source of truth so you don't sprinkle mq.matches everywhere.
    return mq.matches;
  }

  // Keep a stable viewport height unit on mobile browsers (address bar safe)
  // Sets CSS var --vh to 1% of window.innerHeight (in px).
  function setVhVar() {
    // Fixes the classic mobile browser "100vh" issue when the address bar shows/hides.
    // Updates a CSS variable you can use for height calculations without layout jumping.
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }


  function openOverlay() {
    // Only opens the overlay on mobile — desktop should keep the normal split layout.
    // Adds a body class + makes sure the back button + FAB + menu exist.
    if (!isMobile()) return;
    document.body.classList.add(BODY_OPEN_CLASS);
    ensureBackButton();
    ensureOverlayFab();
    ensureFabMenu();
  }

  function closeOverlay() {
    // Closes the mobile details overlay and returns the user to the sidebar list.
    // Also resets related UI bits (FAB menu, back button, overlay FAB) so nothing is left hanging.
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
    // Creates the "Add contact" floating button specifically for the sidebar on small screens.
    // Won't add duplicates and won't show while the details overlay is open.
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
      // Stops the click from bubbling into other click handlers (like document-level closers).
      // Triggers the existing dialog open logic if it's available.
      e.stopPropagation();
      if (typeof window.openDialog === 'function') window.openDialog();
    });
    fab.addEventListener('keydown', (e) => {
      // Adds keyboard support so Enter/Space works like a click (accessibility).
      // Prevents default scrolling/behavior for Space so it feels like a real button.
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fab.click();
      }
    });

    sidebar.appendChild(fab);
  }

  function removeSidebarAddFab() {
    // Removes the sidebar-specific add FAB if it exists (cleanup for desktop mode).
    // Useful when switching breakpoints so you don't leave mobile-only UI around.
    const fab = document.querySelector('.' + SIDEBAR_ADD_FAB_CLASS);
    if (fab) fab.remove();
  }

  function openFabMenu() {
    // Opens the small "more actions" menu on mobile (the one tied to the 3-dots FAB).
    // Sets aria state + adds a body class so CSS can handle visibility/positioning.
    if (!isMobile()) return;
    ensureFabMenu();
    const menu = document.querySelector('.contacts_fab_menu');
    if (menu) menu.setAttribute('aria-hidden', 'false');
    document.body.classList.add(BODY_MENU_CLASS);
  }

  function closeFabMenu() {
    // Closes/hides the FAB menu and resets aria-hidden for accessibility.
    // Also removes the body class so the page returns to its normal state.
    document.body.classList.remove(BODY_MENU_CLASS);
    const menu = document.querySelector('.contacts_fab_menu');
    if (menu) menu.setAttribute('aria-hidden', 'true');
  }

  function ensureBackButton() {
    // Injects a back button into the detail header for the mobile overlay.
    // Only adds it once, and wires it to closeOverlay() so it behaves like navigation.
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
    // Adds the bottom-right 3-dots FAB for extra actions while in the overlay.
    // Taps toggle the small menu open/closed, and it supports keyboard interaction too.
    // Circular button (bottom-right) with 3-dots icon.
    if (document.querySelector('.contacts_overlay_fab')) return;
    const fab = document.createElement('div');
    fab.className = 'contacts_overlay_fab';
    fab.setAttribute('role', 'button');
    fab.setAttribute('tabindex', '0');
    fab.setAttribute('aria-label', 'More actions');
    fab.innerHTML = '<img src="assets/img/3points.svg" alt="">';
    fab.addEventListener('click', (e) => {
      // Prevents the document click handler from instantly closing the menu.
      // Toggles the menu based on current state.
      e.stopPropagation();
      if (document.body.classList.contains(BODY_MENU_CLASS)) closeFabMenu();
      else openFabMenu();
    });
    fab.addEventListener('keydown', (e) => {
      // Keyboard toggle support (Enter/Space) to match expected button behavior.
      // Prevents default so Space doesn't scroll the page.
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fab.click();
      }
    });
    document.body.appendChild(fab);
  }

  function removeOverlayFab() {
    // Removes the overlay FAB from the DOM (cleanup when leaving overlay/desktop).
    // Keeps things tidy so you don't stack multiple FABs on repeated breakpoint changes.
    const fab = document.querySelector('.contacts_overlay_fab');
    if (fab) fab.remove();
  }

  function ensureFabMenu() {
    // Creates the hidden "Edit/Delete" menu that pops up from the overlay FAB.
    // It reuses existing hidden action buttons if they exist (so behavior stays consistent).
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
        // Stops bubbling so the outer click handler doesn't interfere.
        // Tries to trigger the original edit action first; falls back to openEdit(idx).
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
        // Stops bubbling so it doesn't close instantly in weird ways.
        // Triggers the existing delete handler if it's present in the DOM.
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
    // Removes the FAB menu from the DOM and also guarantees it's in a closed state.
    // Helpful during breakpoint switches so you don't leave stale UI behind.
    const menu = document.querySelector('.contacts_fab_menu');
    if (menu) menu.remove();
    closeFabMenu();
  }

  function removeBackButton() {
    // Deletes the injected back button (only exists for the mobile overlay header).
    // Called when leaving overlay or switching back to desktop layout.
    const btn = document.querySelector('.contacts_overlay_back');
    if (btn) btn.remove();
  }

  function syncForBreakpoint() {
    // Syncs UI state whenever the breakpoint changes (desktop <-> mobile).
    // Basically a "make the DOM match the current layout rules" function.
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

    // On <=700px: show the "Add contact" FAB on the sidebar.
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

  
  // 1) move the close button into the left panel
  // 2) move the avatar container into the left panel so it can be anchored to its bottom edge
  function syncDialogCloseButtonPlacement() {
    // Moves the dialog close (×) button depending on screen size.
    // On mobile it goes into the left panel; on desktop it goes back into the right header.
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

  // Move the avatar column into the left (dark) panel on <=700px so it can be
  // anchored to the panel's bottom edge (CSS). On larger screens we restore the
  // original DOM order (between left and right panels).
  function syncDialogAvatarPlacement() {
    // Reorders the avatar column in the dialog so mobile CSS can pin it to the left panel bottom.
    // Restores the original structure on desktop so the layout stays as intended.
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
    // Watches the DOM for dialog-related changes and re-syncs button/avatar placement.
    // This catches cases where the modal gets re-rendered or opened dynamically.
    // Watch for dialog creation/open state changes.
    const target = document.body;
    const obs = new MutationObserver(() => {
      syncDialogCloseButtonPlacement();
      syncDialogAvatarPlacement();
    });
    obs.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  function patchContactsFunctions() {
    // Wraps existing global contact functions so mobile overlay behavior is automatic.
    // Keeps original logic intact, but adds extra UI syncing around it.


    const origSelectUserAt = window.selectUserAt;
    if (typeof origSelectUserAt === 'function') {
      window.selectUserAt = function (...args) {
        // Stores the last selected index so the FAB menu knows which contact to edit.
        // Calls the original function first, then opens the overlay for mobile.
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
        // Lets the original clearSelection run, then cleans up overlay-only UI on mobile.
        // This avoids weird leftover buttons/menus when nothing is selected anymore.
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
        // Calls the original dialog open, then waits a tick so the DOM exists before moving elements.
        // setTimeout(0) is basically "run after the modal is in the DOM".
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
        // Same idea as openDialog: open first, then re-place close button + avatar for the current breakpoint.
        // Keeps Add and Edit dialogs consistent on mobile.
        const res = origOpenEdit.apply(this, args);
        setTimeout(() => {
          syncDialogCloseButtonPlacement();
          syncDialogAvatarPlacement();
        }, 0);
        return res;
      };
    }

    document.addEventListener('keydown', (e) => {
      // Allows closing the overlay with Escape (only when the overlay is actually open).
      // Nice for keyboard users and feels like a normal modal close behavior.
      if (e.key === 'Escape' && document.body.classList.contains(BODY_OPEN_CLASS)) {
        closeOverlay();
      }
    });

    // Close the small FAB menu when the user clicks anywhere outside.
    // No backdrop is used (requirement: background must not change).
    document.addEventListener('click', () => {
      // Global click handler: if the menu is open and the user clicks outside, close it.
      // Since menu clicks stopPropagation, only "outside" clicks reach this handler.
      if (document.body.classList.contains(BODY_MENU_CLASS)) closeFabMenu();
    });
  }

  function init() {
    // Bootstraps the whole behavior: patch functions, set vh var, start observers, and sync initial state.
    // Also hooks resize/orientation + media query changes so the UI stays correct as the screen changes.
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
