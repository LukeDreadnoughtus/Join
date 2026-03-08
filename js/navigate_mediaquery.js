/**
 * Navigation responsive helpers
 * - Adds a marker class to <html> depending on viewport width.
 * - Ensures .legal-area is hidden at <= 1024px in addition to CSS.
 * - Applies defensive inline layout fixes for responsive sidebar behavior.
 */

(() => {
  const mq = window.matchMedia('(max-width: 1024px)');

  /**
   * Applies responsive navigation adjustments based on the current viewport size.
   * - Toggles the mq-1024 class on the root element for responsive styling.
   * - Hides or restores the legal area depending on whether mobile view is active.
   * - Resets or enforces sidebar sizing and centers the scaled "Board" label on mobile.
   */

  function apply() {
    const is1024 = mq.matches;
    document.documentElement.classList.toggle('mq-1024', is1024);

    const legalArea = document.querySelector('.left .legal-area');
    if (legalArea) {
      legalArea.style.display = is1024 ? 'none' : '';
    }

    const left = document.querySelector('.left');
    if (left) {
      if (is1024) {
        left.style.width = '';
        left.style.minWidth = '';
        left.style.maxWidth = '';
        left.style.flex = '';
      } else {
        left.style.width = '232px';
        left.style.minWidth = '232px';
        left.style.maxWidth = '232px';
        left.style.flex = '0 0 232px';
      }
    }

    const boardText = document.querySelector(
      '.left .main-links .link-row[data-link="board"] .link-text--board'
    );
    if (boardText) {
      boardText.style.transformOrigin = is1024 ? 'center' : '';
    }
  }

  window.addEventListener('DOMContentLoaded', apply);

  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', apply);
  } else {
    /**
     * Safari fallback for media query change handling.
     * - Uses the legacy addListener API when addEventListener is not supported.
     * - Ensures responsive behavior also works in older Safari versions.
     */

    mq.addListener(apply);
  }

  window.addEventListener('resize', apply);
})();