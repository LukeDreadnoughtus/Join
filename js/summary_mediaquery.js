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

  function layoutSummaryGreetingV16(){
    const urgentBtn = document.querySelector('.summary-btn.summary-btn--urgent');
    const greeting = document.querySelector('.summary-greeting');
    if(!urgentBtn || !greeting) return;

    const uRect = urgentBtn.getBoundingClientRect();

    const gap = 16;
    const padRight = 16;
    const minWidth = 140;

    const viewportW = document.documentElement.clientWidth;
    const available = Math.max(0, viewportW - uRect.right - gap - padRight);

    if(viewportW > 1024 && available >= minWidth){
      greeting.style.position = 'fixed';
      greeting.style.left = (uRect.right + gap) + 'px';
      greeting.style.top = (uRect.top + (uRect.height/2)) + 'px';
      greeting.style.transform = 'translateY(-50%)';
      const w = Math.max(minWidth, available);
      greeting.style.width = w + 'px';
      greeting.style.maxWidth = w + 'px';
      greeting.style.marginTop = '0';
    }else{
      greeting.style.position = 'static';
      greeting.style.left = '';
      greeting.style.top = '';
      greeting.style.transform = 'none';
      greeting.style.width = '';
      greeting.style.maxWidth = '';
      greeting.style.marginTop = '16px';
    }
  }

  
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
      } else {
        if (el.dataset.isBroken === '1') {
          el.textContent = el.dataset.originalText;
          el.dataset.isBroken = '0';
        }
      }
    });
  }

  
  function applySummaryLayoutVars(w) {
    
    
    const inline = w < 1025 ? 16 : 64;

    
    
    const maxWidth = 620;

    root.style.setProperty('--summary-inline', `${inline}px`);
    root.style.setProperty('--summary-max-width', `${maxWidth}px`);
  }

  
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

  function applyBreakpointClasses() {
    const w = window.innerWidth || root.clientWidth || 0;
    root.classList.toggle('is-below-1024', w < 1025);
    root.classList.toggle('is-below-600', w < 601);
    root.classList.toggle('is-below-1000', w < 1000);

    applySummaryLayoutVars(w);
    applyKpiLabelLineBreaks(w);
    
    layoutSummaryGreetingV16();applySummaryButtonScaling(w);
  }

  
  applyBreakpointClasses();

  
  window.addEventListener('resize', applyBreakpointClasses, { passive: true });
  window.addEventListener('orientationchange', applyBreakpointClasses, { passive: true });
})();

window.addEventListener('resize', layoutSummaryGreetingV16);
layoutSummaryGreetingV16();
