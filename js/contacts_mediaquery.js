// Mobile overlay behavior for Contacts (<= 400px)
// Sidebar takes full width. When a contact is selected, details are shown
// as a full-screen white overlay so the sidebar is hidden (no new page).

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
  }

  function closeOverlay() {
    document.body.classList.remove(BODY_OPEN_CLASS);
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
    btn.textContent = '←';
    btn.addEventListener('click', closeOverlay);

    header.insertBefore(btn, header.firstChild);
  }

  function syncForBreakpoint() {
    if (!isMobile()) {
      document.body.classList.remove(BODY_OPEN_CLASS);
      if (typeof window.positionDetailRoot === 'function') window.positionDetailRoot();
      return;
    }

    const root = document.querySelector('.contact_detail_root');
    const hasContent = !!(root && root.children && root.children.length);
    if (!hasContent) document.body.classList.remove(BODY_OPEN_CLASS);
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
        if (isMobile()) document.body.classList.remove(BODY_OPEN_CLASS);
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
    syncForBreakpoint();

    if (mq.addEventListener) mq.addEventListener('change', syncForBreakpoint);
    else mq.addListener(syncForBreakpoint);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
