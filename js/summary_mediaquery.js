/**
 * Summary – breakpoint helpers
 *
 * The visual changes are primarily done in css/summary_mediaquery.css via
 * media queries.
 
 * This script additionally adds state classes to <html> so you can target
 * breakpoints in CSS without relying exclusively on media queries:
 */

(function () {
  const root = document.documentElement;

  
  function applyKpiLabelLineBreaks(w) {
    const shouldBreak = w < 1000;

    /** @type {Array<{selector: string, brokenHtml: string}>} */
    const targets = [
      { selector: '.summary-btn--board h4', brokenHtml: 'Tasks in<br>Board' },
      { selector: '.summary-btn--progress h4', brokenHtml: 'Tasks In<br>Progress' },
      { selector: '.summary-btn--feedback h4', brokenHtml: 'Awaiting<br>Feedback' },
    ];

    targets.forEach(({ selector, brokenHtml }) => {
      const el = document.querySelector(selector);
      if (!el) return;

      // Keep the original label once.
      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent || '';
      }

      if (shouldBreak) {
        // Only update if not already broken.
        if (el.dataset.isBroken !== '1') {
          el.innerHTML = brokenHtml;
          el.dataset.isBroken = '1';
        }
      } else {
        if (el.dataset.isBroken === '1') {
          el.textContent = el.dataset.originalText;
          el.dataset.isBroken = '0';
        }
      }
    });
  }

  
  function applySummaryLayoutVars(w) {
    // Below the desktop breakpoint the sidebar becomes a bottom bar.
    // Use a smaller, but still constant, outer inset.
    const inline = w < 1025 ? 16 : 64;

    // A fixed max width prevents the grid from creeping right.
    // It will shrink naturally when the viewport is smaller.
    const maxWidth = 620;

    root.style.setProperty('--summary-inline', `${inline}px`);
    root.style.setProperty('--summary-max-width', `${maxWidth}px`);
  }

  
  function applySummaryButtonScaling(w) {
    const baseHeight = 128; // px at 500px viewport width
    const minWidth = 320;   // clamp so it doesn't get comically small
    const maxWidth = 500;

    if (w < maxWidth) {
      const clampedWidth = Math.max(w, minWidth);
      const scale = clampedWidth / maxWidth;
      const scaledHeight = Math.round(baseHeight * scale);
      root.style.setProperty('--summary-btn-height', `${scaledHeight}px`);
    } else {
      // Reset above 500px
      root.style.removeProperty('--summary-btn-height');
    }
  }

  function applyBreakpointClasses() {
    const w = window.innerWidth || root.clientWidth || 0;
    root.classList.toggle('is-below-1024', w < 1025);
    root.classList.toggle('is-below-600', w < 601);
    root.classList.toggle('is-below-1000', w < 1000);

    applySummaryLayoutVars(w);
    applyKpiLabelLineBreaks(w);
    applySummaryButtonScaling(w);
  }

  // Initial
  applyBreakpointClasses();

  // Update on resize/orientation changes
  window.addEventListener('resize', applyBreakpointClasses, { passive: true });
  window.addEventListener('orientationchange', applyBreakpointClasses, { passive: true });
})();
