checkAuth();
/**
 * Checks whether a filename points to a public (no-auth) page.
 * @param {string} file - Lowercased filename from the current URL.
 * @returns {boolean} True if the page is accessible without login.
 */
function isPublicPage(file) {
  return [
    'index.html',
    'registration.html',
    'privacy_policy_logout.html',
    'legal_notice_logout.html'
  ].includes(file);
}

/**
 * Redirects logged-out visitors away from protected pages to the correct public target.
 * - Keeps logout variants of legal/privacy when not authenticated.
 * - Falls back to index.html for all other protected pages.
 */
function ensureLoggedIn() {
  const file = (location.pathname.split('/').pop() || '').toLowerCase();
  if (localStorage.getItem('userid') || isPublicPage(file)) return;
  if (file === 'privacy_policy.html') window.location.href = 'privacy_policy_logout.html';
  else if (file === 'legal_notice.html') window.location.href = 'legal_notice_logout.html';
  else window.location.href = 'index.html';
}

ensureLoggedIn();

/* for main Tasks */

(() => {
  const routes = {
    summary:  'summary.html',
    board:    'board.html',
    add_task: 'add_task.html',
    contacts: 'contacts.html'
  };

  const currentFile = (location.pathname.split('/').pop() || '').toLowerCase();

  // - Checks whether the destination file is the same page you're already on (so we don't reload it).
  // - Helps avoid pointless navigation and keeps the UI from “flashing” when you click the current page.
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
    // - Calls renderUserIcon() only if it actually exists, so the script doesn't crash on pages without it.
    // - Keeps the user badge/initials consistent across pages (one place to trigger it, everywhere).
    if (typeof renderUserIcon === 'function') {
      renderUserIcon();
    }
  } catch (e) {
    console.warn('renderUserIcon error:', e);
  }
});
