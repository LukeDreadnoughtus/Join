/**
 * Summary breakpoint helpers
 *
 * - Most visual breakpoint changes are handled in `css/summary_mediaquery.css`.
 * - This script adds state classes to `<html>` for breakpoint-aware styling in CSS.
 * - It also updates layout-related CSS variables and responsive UI behavior.
 */

(function () {
  const root = document.documentElement;

  /**
   * Applies responsive layout variables for the summary area.
   *
   * - Sets the horizontal inline spacing based on the current viewport width.
   * - Defines a fixed maximum width for summary content.
   * - Exposes both values through CSS custom properties on `<html>`.
   */

  function applySummaryLayoutVars(w) {
    const inline = w < 1025 ? 16 : 64;
    const maxWidth = 620;

    root.style.setProperty('--summary-inline', `${inline}px`);
    root.style.setProperty('--summary-max-width', `${maxWidth}px`);
  }

  /**
   * Scales the summary button height for smaller viewport widths.
   *
   * - Calculates a proportional height when the viewport is below the max width.
   * - Prevents the scaling from dropping below the configured minimum width threshold.
   * - Removes the custom height override when full-size buttons should be used.
   */

  function applySummaryButtonScaling(w) {
    const baseHeight = 128;
    const minWidth = 320;
    const maxWidth = 500;

    if (w < maxWidth) {
      const clampedWidth = Math.max(w, minWidth);
      const scale = clampedWidth / maxWidth;
      const scaledHeight = Math.round(baseHeight * scale);

      root.style.setProperty('--summary-btn-height', `${scaledHeight}px`);
    } else {
      root.style.removeProperty('--summary-btn-height');
    }
  }

  /**
   * Inserts or removes line breaks in KPI button labels depending on viewport size.
   *
   * - Switches selected KPI titles to multi-line HTML when the viewport is narrow.
   * - Preserves the original label text in `data-*` attributes for safe restoration.
   * - Avoids unnecessary DOM updates by checking the current broken-state flag.
   */

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

      if (!el.dataset.originalText) {
        el.dataset.originalText = el.textContent || '';
      }

      if (shouldBreak) {
        if (el.dataset.isBroken !== '1') {
          el.innerHTML = brokenHtml;
          el.dataset.isBroken = '1';
        }
      } else if (el.dataset.isBroken === '1') {
        el.textContent = el.dataset.originalText;
        el.dataset.isBroken = '0';
      }
    });
  }

  /**
   * Positions the summary greeting next to the urgent button on wide screens.
   *
   * - Measures the urgent button and available viewport space dynamically.
   * - Moves the greeting into a fixed side position when enough room is available.
   * - Resets all inline styles to the default stacked layout on smaller screens.
   */

  function layoutSummaryGreetingV16() {
    const urgentBtn = document.querySelector('.summary-btn.summary-btn--urgent');
    const greeting = document.querySelector('.summary-greeting');

    if (!urgentBtn || !greeting) return;

    const uRect = urgentBtn.getBoundingClientRect();

    const gap = 16;
    const padRight = 16;
    const minWidth = 140;

    const viewportW = document.documentElement.clientWidth;
    const available = Math.max(0, viewportW - uRect.right - gap - padRight);

    if (viewportW > 1024 && available >= minWidth) {
      const width = Math.max(minWidth, available);

      greeting.style.position = 'fixed';
      greeting.style.left = `${uRect.right + gap}px`;
      greeting.style.top = `${uRect.top + uRect.height / 2}px`;
      greeting.style.transform = 'translateY(-50%)';
      greeting.style.width = `${width}px`;
      greeting.style.maxWidth = `${width}px`;
      greeting.style.marginTop = '0';
    } else {
      greeting.style.position = 'static';
      greeting.style.left = '';
      greeting.style.top = '';
      greeting.style.transform = 'none';
      greeting.style.width = '';
      greeting.style.maxWidth = '';
      greeting.style.marginTop = '16px';
    }
  }

  /**
   * Updates breakpoint classes and triggers all responsive summary helpers.
   *
   * - Adds or removes breakpoint state classes on `<html>` based on window width.
   * - Runs all layout, label, greeting, and scaling update functions in one place.
   * - Acts as the central refresh handler for initial load and resize-related events.
   */

  function applyBreakpointClasses() {
    const w = window.innerWidth || root.clientWidth || 0;

    root.classList.toggle('is-below-1024', w < 1025);
    root.classList.toggle('is-below-600', w < 601);
    root.classList.toggle('is-below-1000', w < 1000);

    applySummaryLayoutVars(w);
    applySummaryButtonScaling(w);
    applyKpiLabelLineBreaks(w);
    layoutSummaryGreetingV16();
  }

  applyBreakpointClasses();

  window.addEventListener('resize', applyBreakpointClasses, { passive: true });
  window.addEventListener('orientationchange', applyBreakpointClasses, { passive: true });
})();