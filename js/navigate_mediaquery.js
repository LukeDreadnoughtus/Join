/**
 * Navigation responsive helpers
 * - Adds a marker class to <html> depending on viewport width
 * - Ensures .legal-area is hidden at <= 1024px (in addition to CSS)
 */

(() => {
  const mq = window.matchMedia('(max-width: 1024px)');

  function apply() {
    const is1024 = mq.matches;
    document.documentElement.classList.toggle('mq-1024', is1024);

    // Defensive: in case a page injects inline styles or loads CSS late.
    const legalArea = document.querySelector('.left .legal-area');
    if (legalArea) {
      legalArea.style.display = is1024 ? 'none' : '';
    }

    // Ensure fixed sidebar width on desktop only (defensive)
    // Important: clear any inline width when switching to the mobile bottom-nav.
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

    // Fix (<=1024px): keep the scaled "Board" text visually centered under the icon.
    // Base styles scale the board text from the left edge, which shifts it when
    // the nav becomes a vertical icon+text stack.
    const boardText = document.querySelector(
      '.left .main-links .link-row[data-link="board"] .link-text--board'
    );
    if (boardText) {
      boardText.style.transformOrigin = is1024 ? 'center' : '';
    }
  }

  // Initial
  window.addEventListener('DOMContentLoaded', apply);
  // On changes
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', apply);
  } else {
    // Safari fallback
    mq.addListener(apply);
  }
  window.addEventListener('resize', apply);
})();
