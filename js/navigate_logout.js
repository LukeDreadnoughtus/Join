(() => {
  const currentFile = (location.pathname.split('/').pop() || '').toLowerCase();
  const isLogoutPage = currentFile.endsWith('_logout.html');

  if (!isLogoutPage) return;

  document.documentElement.classList.add('logout-page');

  const isLegalInfoLogoutPage =
    currentFile === 'privacy_policy_logout.html' ||
    currentFile === 'legal_notice_logout.html';

  /**
   * - Checks whether a user session is currently stored in localStorage.
   * - Returns a boolean that indicates logged-in state.
   * - Acts as a shared guard for logout-only page logic.
   */
  function isLoggedIn() {
    return !!localStorage.getItem('userid');
  }

  /**
   * - Redirects logged-in users away from logout-specific legal pages.
   * - Sends users to the matching logged-in legal page variant.
   * - Prevents authenticated users from staying on guest-only legal routes.
   */
  function redirectLoggedInFromLogoutLegalPages() {
    if (!isLoggedIn()) return;

    if (currentFile === 'privacy_policy_logout.html') {
      window.location.replace('privacy_policy.html');
    }

    if (currentFile === 'legal_notice_logout.html') {
      window.location.replace('legal_notice.html');
    }
  }

  /**
   * - Removes all injected main navigation rows except the login row.
   * - Keeps logout pages restricted to the intended single entry point.
   * - Protects the DOM against unwanted navigation items.
   */
  function pruneMainLinksToLoginOnly() {
    const mainLinks = document.querySelector('.main-links');
    if (!mainLinks) return;

    mainLinks
      .querySelectorAll('.link-row:not(.logout-login-row)')
      .forEach((el) => el.remove());
  }

  /**
   * - Watches the main navigation container for unwanted DOM mutations.
   * - Re-applies login-only navigation cleanup whenever links are injected.
   * - Ensures the logout layout stays stable after dynamic updates.
   */
  function observeAndBlockInjectedLinks() {
    const mainLinks = document.querySelector('.main-links');
    if (!mainLinks) return;

    const observer = new MutationObserver(() => {
      pruneMainLinksToLoginOnly();
    });

    observer.observe(mainLinks, { childList: true, subtree: true });
  }

  /**
   * - Attaches click and keyboard interaction to the static login row.
   * - Navigates users back to the login page from logout pages.
   * - Supports accessibility through Enter and Space key handling.
   */
  function wireLoginRow() {
    const row = document.querySelector('.logout-login-row');
    if (!row) return;

    const goLogin = () => {
      window.location.href = 'index.html';
    };

    row.addEventListener('click', goLogin);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        goLogin();
      }
    });
  }

  /**
   * - Creates mobile-friendly legal text links for logged-out users.
   * - Injects Privacy Policy and Legal Notice links into the left area.
   * - Avoids duplicate insertion by checking for an existing wrapper.
   */
  function ensureMobileLegalTextLinks() {
    if (isLoggedIn() || !isLegalInfoLogoutPage) return;

    const left = document.querySelector('.left');
    if (!left) return;

    left.classList.add('logout-nav');

    if (left.querySelector('.logout-legal-area')) return;

    const wrap = document.createElement('div');
    wrap.className = 'logout-legal-area';

    const privacy = document.createElement('a');
    privacy.className = 'logout-legal-link';
    privacy.href = 'privacy_policy_logout.html';
    privacy.textContent = 'Privacy Policy';

    const legal = document.createElement('a');
    legal.className = 'logout-legal-link';
    legal.href = 'legal_notice_logout.html';
    legal.textContent = 'Legal Notice';

    wrap.append(privacy, legal);
    left.appendChild(wrap);
  }

  /**
   * - Marks the active mobile logout legal text link based on the current file.
   * - Updates both visual active state and aria-current for accessibility.
   * - Runs only for logged-out users on logout legal pages.
   */
  function markActiveLogoutLegalLinks() {
    if (isLoggedIn() || !isLegalInfoLogoutPage) return;

    document.querySelectorAll('.logout-legal-link').forEach((link) => {
      const hrefFile = ((link.getAttribute('href') || '').split('/').pop() || '').toLowerCase();
      const isActive = hrefFile === currentFile;

      link.classList.toggle('is-active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  /**
   * - Marks the active desktop sidebar legal row based on the current file.
   * - Mirrors the active-state behavior used on the normal logged-in pages.
   * - Adds a safe fallback with console warnings if highlighting fails.
   */
  function markActiveSidebarLegalRows() {
    if (isLoggedIn() || !isLegalInfoLogoutPage) return;

    try {
      const rows = document.querySelectorAll('.legal-area .legal-row');

      rows.forEach((row) => {
        const hrefFile = ((row.getAttribute('href') || '').split('/').pop() || '').toLowerCase();
        const isActive = hrefFile === currentFile;

        row.classList.toggle('is-active', isActive);
        row.setAttribute('aria-current', isActive ? 'page' : 'false');
      });
    } catch (error) {
      console?.warn?.('legal-area highlight error:', error);
    }
  }

  /**
   * - Adds a mobile-only back arrow for logout legal pages.
   * - Sends users back to the login page through click or keyboard input.
   * - Synchronizes arrow visibility across viewport changes and resize events.
   */
  function ensureMobileBackArrow() {
    if (isLoggedIn() || !isLegalInfoLogoutPage) return;

    const mediaQuery = window.matchMedia('(max-width: 1024px)');

    const addArrow = () => {
      if (!mediaQuery.matches) return;
      if (document.querySelector('.logout-back-arrow')) return;

      const arrow = document.createElement('img');
      arrow.src = 'assets/img/arrow-left-line.svg';
      arrow.alt = 'Back to login';
      arrow.className = 'logout-back-arrow';
      arrow.setAttribute('role', 'button');
      arrow.setAttribute('tabindex', '0');

      const goBack = () => {
        window.location.href = 'index.html';
      };

      arrow.addEventListener('click', goBack);
      arrow.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goBack();
        }
      });

      const page = document.querySelector('.page');
      const content = document.querySelector('main.content');

      if (page && content) {
        page.insertBefore(arrow, content);
        return;
      }

      (page || document.body).appendChild(arrow);
    };

    const removeArrow = () => {
      document.querySelector('.logout-back-arrow')?.remove();
    };

    const syncArrow = () => {
      if (mediaQuery.matches) {
        addArrow();
      } else {
        removeArrow();
      }
    };

    syncArrow();

    mediaQuery.addEventListener?.('change', syncArrow);
    window.addEventListener('resize', syncArrow);
  }

  /**
   * - Executes the earliest possible DOM guards before the page is fully loaded.
   * - Removes unwanted navigation links immediately on logout pages.
   * - Starts observing future DOM injections to keep navigation locked down.
   */
  function initializeEarlyGuards() {
    pruneMainLinksToLoginOnly();
    observeAndBlockInjectedLinks();
  }

  /**
   * - Runs the complete logout-page setup after DOMContentLoaded.
   * - Applies redirects, interaction wiring, legal link states, and mobile helpers.
   * - Marks the page as ready so navigation can become visible again.
   */
  function initializeLogoutPage() {
    redirectLoggedInFromLogoutLegalPages();
    pruneMainLinksToLoginOnly();
    wireLoginRow();
    ensureMobileLegalTextLinks();
    markActiveLogoutLegalLinks();
    markActiveSidebarLegalRows();
    ensureMobileBackArrow();

    document.documentElement.classList.add('logout-ready');
  }

  initializeEarlyGuards();

  document.addEventListener('DOMContentLoaded', initializeLogoutPage);
})();