/**
 * Immediately Invoked Function Expression (IIFE) that manages
 * the login greeting overlay on the summary page.
 * 
 * The overlay is displayed only once after a successful login
 * and only on smaller screens. It automatically hides after a
 * short delay and is removed if the viewport becomes larger.
 */
(() => {
  const OVERLAY_ID = 'keyframeSummaryOverlay';
  const NAME_ID = 'username_keyframe';
  const LOGIN_FLAG_KEY = 'summary_greeting_overlay';
  const MQ = window.matchMedia('(max-width: 899px)');

   /**
   * Retrieves the stored username from localStorage.
   *
   * @returns {string} The stored username or an empty string if none exists.
   */
  function getStoredUsername() {
    return localStorage.getItem('username') || '';
  }

    /**
   * Formats a username for display by capitalizing the first letter
   * of each word in the name.
   *
   * @param {string} name - The raw username.
   * @returns {string} The formatted display name.
   */
  function formatDisplayName(name) {
    return String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  /**
   * Inserts the formatted username into the overlay element.
   *
   * @returns {void}
   */
  function setOverlayName() {
    const el = document.getElementById(NAME_ID);
    if (!el) return;
    const username = getStoredUsername();
    el.textContent = username ? formatDisplayName(username) : '';
  }

   /**
   * Completely removes the overlay element from the DOM.
   *
   * @returns {void}
   */
  function removeOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay);
  }

   /**
   * Hides the overlay by applying a CSS class that triggers
   * the exit animation and removes the element afterward.
   *
   * @returns {void}
   */
  function hideOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    overlay.classList.add('keyframe-summary-overlay--hide');
    window.setTimeout(removeOverlay, 450);
  }

   /**
   * Checks whether the greeting overlay should be shown.
   * This happens only once after a successful login.
   *
   * @returns {boolean} True if the overlay should be displayed.
   */
  function shouldShowOverlayOnceAfterLogin() {
    return sessionStorage.getItem(LOGIN_FLAG_KEY) === '1';
  }

  /**
   * Removes the login flag from sessionStorage to ensure the
   * overlay is not shown again when navigating back to the page.
   *
   * @returns {void}
   */
  function consumeLoginFlag() {

    sessionStorage.removeItem(LOGIN_FLAG_KEY);
  }
  /**
   * Displays the greeting overlay if the required conditions are met:
   * - The login flag is set.
   * - The overlay element exists.
   * - The screen width matches the mobile breakpoint.
   *
   * The overlay automatically hides after a short delay.
   *
   * @returns {void}
   */
  function showOverlayIfNeeded() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    if (!shouldShowOverlayOnceAfterLogin()) {
      removeOverlay();
      return;
    }
    consumeLoginFlag();
    if (!MQ.matches) {
      removeOverlay();
      return;
    }
    setOverlayName();
    window.setTimeout(hideOverlay, 2000);
  }

  /**
   * Initializes the greeting overlay behavior when the DOM is ready.
   * Also listens for viewport changes to hide the overlay if the
   * screen becomes larger than the mobile breakpoint.
   */
  document.addEventListener('DOMContentLoaded', () => {
    showOverlayIfNeeded();
    if (typeof MQ.addEventListener === 'function') {
      MQ.addEventListener('change', (e) => {
        if (!e.matches) hideOverlay();
      });
    } else if (typeof MQ.addListener === 'function') {
      MQ.addListener((e) => {
        if (!e.matches) hideOverlay();
      });
    }
  });
})();
