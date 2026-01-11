
/* for main Tasks */

(() => {
  const routes = {
    summary:  'summary.html',
    board:    'board.html',
    add_task: 'add_task.html',
    contacts: 'contacts.html'
  };

  const currentFile = (location.pathname.split('/').pop() || '').toLowerCase();
  const isSame = (dest) => dest && dest.toLowerCase() === currentFile;

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-link]');
    if (!el) return;

    const key = el.getAttribute('data-link');
    const dest = routes[key];
    if (!dest) return;

    if (isSame(dest)) {
      e.preventDefault();
      return;
    }

    window.location.href = dest;
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-link]')) {
      e.preventDefault();
      e.target.click();
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-link]').forEach((el) => {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'link');
    });
  });
})();


/* for sub Tasks */



(() => {
  try {
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    const rows = document.querySelectorAll('.legal-area .legal-row');

    rows.forEach(row => {
      const href = (row.getAttribute('href') || '').toLowerCase();
      const isActive = file && (href.endsWith(file));
      row.classList.toggle('is-active', !!isActive);
      row.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  } catch (e) {
    
    console && console.warn && console.warn('legal-area highlight error:', e);
  }
})();

// Ensure the user icon initials are rendered on every page that includes navigate.js
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (typeof renderUserIcon === 'function') {
      renderUserIcon();
    }
  } catch (e) {
    console.warn('renderUserIcon error:', e);
  }
});
