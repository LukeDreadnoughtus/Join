(() => {
  const OVERLAY_ID = 'keyframeSummaryOverlay';
  const NAME_ID = 'username_keyframe';
  const LOGIN_FLAG_KEY = 'summary_greeting_overlay';
  const MQ = window.matchMedia('(max-width: 899px)');

  function getStoredUsername() {
    return localStorage.getItem('username') || '';
  }

  function formatDisplayName(name) {
    return String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  function setOverlayName() {
    const el = document.getElementById(NAME_ID);
    if (!el) return;
    const username = getStoredUsername();
    el.textContent = username ? formatDisplayName(username) : '';
  }

  function removeOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay);
  }

  function hideOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    overlay.classList.add('keyframe-summary-overlay--hide');
    window.setTimeout(removeOverlay, 450);
  }

  function shouldShowOverlayOnceAfterLogin() {
    return sessionStorage.getItem(LOGIN_FLAG_KEY) === '1';
  }

  function consumeLoginFlag() {
    // Ensure it won't show again when navigating back to Summary
    sessionStorage.removeItem(LOGIN_FLAG_KEY);
  }

  function showOverlayIfNeeded() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;

    // Only show right after a successful login.
    if (!shouldShowOverlayOnceAfterLogin()) {
      removeOverlay();
      return;
    }

    // Consume immediately so back/forward navigation won't show it again.
    consumeLoginFlag();

    // Only run on small screens.
    if (!MQ.matches) {
      removeOverlay();
      return;
    }

    setOverlayName();

    // Auto-hide after ~2 seconds.
    window.setTimeout(hideOverlay, 2000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    showOverlayIfNeeded();

    // If the user resizes above 900px, remove overlay immediately.
    if (typeof MQ.addEventListener === 'function') {
      MQ.addEventListener('change', (e) => {
        if (!e.matches) hideOverlay();
      });
    } else if (typeof MQ.addListener === 'function') {
      // Safari fallback
      MQ.addListener((e) => {
        if (!e.matches) hideOverlay();
      });
    }
  });
})();
