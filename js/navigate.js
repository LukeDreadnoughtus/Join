checkAuth();

/**
 * Determines whether the current file is publicly accessible without authentication.
 * - Checks the current filename against a fixed list of public pages.
 * - Helps prevent unnecessary redirects for pages that should stay reachable.
 * - Keeps route access logic centralized in one small helper.
 *
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
 * - Keeps logout variants of legal/privacy pages accessible when not authenticated.
 * - Falls back to index.html for all other protected pages.
 * - Stops redirect logic early when a valid session or public page is detected.
 */
function ensureLoggedIn() {
  const file = (location.pathname.split('/').pop() || '').toLowerCase();

  if (localStorage.getItem('userid') || isPublicPage(file)) return;

  if (file === 'privacy_policy.html') {
    window.location.href = 'privacy_policy_logout.html';
  } else if (file === 'legal_notice.html') {
    window.location.href = 'legal_notice_logout.html';
  } else {
    window.location.href = 'index.html';
  }
}

ensureLoggedIn();

/**
 * Checks whether the destination file matches the current page.
 * - Prevents unnecessary page reloads when the user clicks the active route.
 * - Helps avoid visual flicker caused by navigating to the same page again.
 * - Makes route comparison reusable inside the main navigation logic.
 *
 * @param {string} dest - Destination filename.
 * @param {string} currentFile - Current filename from the URL.
 * @returns {boolean} True if the destination matches the current page.
 */
function isSamePage(dest, currentFile) {
  return !!dest && dest.toLowerCase() === currentFile;
}

/**
 * Handles click-based navigation for elements with a data-link attribute.
 * - Resolves route keys to actual target files using the route map.
 * - Prevents navigation if the requested target is already the current page.
 * - Uses event delegation so dynamically added navigation items also work.
 *
 * @param {MouseEvent} e - The click event object.
 * @param {Object.<string, string>} routes - Mapping of route keys to filenames.
 * @param {string} currentFile - Current filename from the URL.
 */
function handleRouteClick(e, routes, currentFile) {
  const el = e.target.closest('[data-link]');
  if (!el) return;

  const key = el.getAttribute('data-link');
  const dest = routes[key];
  if (!dest) return;

  if (isSamePage(dest, currentFile)) {
    e.preventDefault();
    return;
  }

  window.location.href = dest;
}

/**
 * Enables keyboard navigation for elements that use data-link.
 * - Triggers link behavior when Enter or Space is pressed.
 * - Improves accessibility for custom clickable elements.
 * - Ensures keyboard users get the same navigation behavior as mouse users.
 *
 * @param {KeyboardEvent} e - The keyboard event object.
 */
function handleRouteKeydown(e) {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-link]')) {
    e.preventDefault();
    e.target.click();
  }
}

/**
 * Adds accessibility attributes to custom navigation elements.
 * - Ensures data-link elements can receive keyboard focus.
 * - Assigns a link role when none is already present.
 * - Standardizes interactive behavior across all navigation entries.
 */
function enhanceRouteAccessibility() {
  document.querySelectorAll('[data-link]').forEach((el) => {
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('role')) el.setAttribute('role', 'link');
  });
}

/**
 * Initializes the main navigation behavior for top-level pages.
 * - Registers delegated click handling for route-based navigation.
 * - Adds keyboard support for accessible interaction.
 * - Applies accessibility attributes after the DOM is ready.
 */
function initMainTaskNavigation() {
  const routes = {
    summary: 'summary.html',
    board: 'board.html',
    add_task: 'add_task.html',
    contacts: 'contacts.html'
  };

  const currentFile = (location.pathname.split('/').pop() || '').toLowerCase();

  document.addEventListener('click', (e) => handleRouteClick(e, routes, currentFile));
  document.addEventListener('keydown', handleRouteKeydown);
  window.addEventListener('DOMContentLoaded', enhanceRouteAccessibility);
}

initMainTaskNavigation();

/**
 * Highlights the active legal subpage inside the legal-area navigation.
 * - Compares each row target with the current file in the URL.
 * - Adds an active class and aria-current state for the matching entry.
 * - Wraps the logic in try/catch so UI errors do not break the page.
 */
function highlightActiveLegalRow() {
  try {
    const file = (location.pathname.split('/').pop() || '').toLowerCase();
    const rows = document.querySelectorAll('.legal-area .legal-row');

    rows.forEach((row) => {
      const href = (row.getAttribute('href') || '').toLowerCase();
      const isActive = file && href.endsWith(file);

      row.classList.toggle('is-active', !!isActive);
      row.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  } catch (e) {
    console && console.warn && console.warn('legal-area highlight error:', e);
  }
}

highlightActiveLegalRow();

/**
 * Renders the user icon initials when the helper function is available.
 * - Calls renderUserIcon() only if it exists to avoid runtime errors.
 * - Keeps the user badge or initials consistent across pages using navigate.js.
 * - Handles failures safely so the rest of the page remains functional.
 */
function initUserIconRendering() {
  try {
    if (typeof renderUserIcon === 'function') {
      renderUserIcon();
    }
  } catch (e) {
    console.warn('renderUserIcon error:', e);
  }
}

document.addEventListener('DOMContentLoaded', initUserIconRendering);