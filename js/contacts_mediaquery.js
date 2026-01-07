// Mobile overlay behavior for Contacts (<= 400px)
// Sidebar takes full width. When a contact is selected, details are shown
// as a full-screen white overlay so the sidebar is hidden (no new page).
//
// Additionally:
// - At <=400px the Add/Edit contact dialog is rearranged (CSS in contacts_mediaquery.css).
// - The close button (×) is moved into the top-right of .contacts_modal_left_panel.

(function () {
  const mq = window.matchMedia('(max-width: 400px)');
  const BODY_OPEN_CLASS = 'contacts-overlay-open';

  function isMobile() {
    return mq.matches;
  }

  function openOverlay() {
    if (!isMobile()) return;
    document.body.classList.add(BODY_OPEN_CLASS);
    ensureBackButton();
    ensureOverlayFab();
  }

  function closeOverlay() {
    document.body.classList.remove(BODY_OPEN_CLASS);
    removeBackButton();
    removeOverlayFab();
    if (typeof window.clearSelection === 'function') window.clearSelection();
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
    fab.setAttribute('aria-hidden', 'true');
    fab.innerHTML = '<img src="assets/img/3points.svg" alt="">';
    document.body.appendChild(fab);
  }

  function removeOverlayFab() {
    const fab = document.querySelector('.contacts_overlay_fab');
    if (fab) fab.remove();
  }

  function removeBackButton() {
    const btn = document.querySelector('.contacts_overlay_back');
    if (btn) btn.remove();
  }

  function syncForBreakpoint() {
    if (!isMobile()) {
      document.body.classList.remove(BODY_OPEN_CLASS);
      removeBackButton();
      removeOverlayFab();
      if (typeof window.positionDetailRoot === 'function') window.positionDetailRoot();
      syncDialogCloseButtonPlacement();
      return;
    }

    const root = document.querySelector('.contact_detail_root');
    const hasContent = !!(root && root.children && root.children.length);
    if (!hasContent) {
      document.body.classList.remove(BODY_OPEN_CLASS);
      removeBackButton();
      removeOverlayFab();
    }
    syncDialogCloseButtonPlacement();
  }

  // --- Dialog (Add/Edit contact) adjustments for <=400px ---
  // CSS handles panel stacking + avatar overlap. Here we only move the close button.
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

  function observeDialog() {
    // Watch for dialog creation/open state changes.
    const target = document.body;
    const obs = new MutationObserver(() => syncDialogCloseButtonPlacement());
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
          removeBackButton();
          removeOverlayFab();
        }
        return res;
      };
    }

    // Ensure the dialog close button is moved right after opening (Add/Edit).
    const origOpenDialog = window.openDialog;
    if (typeof origOpenDialog === 'function') {
      window.openDialog = function (...args) {
        const res = origOpenDialog.apply(this, args);
        setTimeout(syncDialogCloseButtonPlacement, 0);
        return res;
      };
    }

    const origOpenEdit = window.openEdit;
    if (typeof origOpenEdit === 'function') {
      window.openEdit = function (...args) {
        const res = origOpenEdit.apply(this, args);
        setTimeout(syncDialogCloseButtonPlacement, 0);
        return res;
      };
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains(BODY_OPEN_CLASS)) {
        closeOverlay();
      }
    });
  }

  function init() {
    patchContactsFunctions();
    observeDialog();
    syncForBreakpoint();

    if (mq.addEventListener) mq.addEventListener('change', syncForBreakpoint);
    else mq.addListener(syncForBreakpoint);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
