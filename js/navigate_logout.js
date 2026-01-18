/*
  Logout-only navigation adjustments
  IMPORTANT: This script is ONLY included on *_logout.html pages.

  Goals:
  - Ensure legal links point to *_logout.html when no user is logged in
  - Remove the main navigation rows (Summary/Add task/Board/Contacts) on logout pages
  - Show a "Log in" row in the left sidebar using logout_legal-row.svg
  - Keep privacy_policy.html and legal_notice.html unaffected by only loading this file on logout pages
*/

(() => {
  const currentFile = (location.pathname.split('/').pop() || '').toLowerCase();
  const isLogoutPage = currentFile.endsWith('_logout.html');
  if (!isLogoutPage) return;

  const isLoggedIn = () => {
    // Join uses these keys in script.js (logoutUser clears them)
    const uid = localStorage.getItem('userid');
    const uname = localStorage.getItem('username');
    return !!(uid || uname);
  };

  function enforceLogoutLinks() {
    // If a user is NOT logged in, never link to the non-logout versions.
    if (isLoggedIn()) return;

    // Sidebar legal links
    document.querySelectorAll('.legal-area a.legal-row').forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href.endsWith('privacy_policy.html')) a.setAttribute('href', 'privacy_policy_logout.html');
      if (href.endsWith('legal_notice.html')) a.setAttribute('href', 'legal_notice_logout.html');
    });

    // Header user menu links
    document.querySelectorAll('#user_menu a').forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href.endsWith('privacy_policy.html')) a.setAttribute('href', 'privacy_policy_logout.html');
      if (href.endsWith('legal_notice.html')) a.setAttribute('href', 'legal_notice_logout.html');
    });
  }

  function removeMainLinkRows() {
    // "wegcutten" the navigation rows (Summary/Add task/Board/Contacts)
    // We remove them from the DOM so navigate.js cannot route via [data-link].
    const mainLinks = document.querySelector('.main-links');
    if (!mainLinks) return;
    mainLinks.querySelectorAll('.link-row').forEach((row) => row.remove());
  }

  function ensureLoginRowInMainLinks() {
    // Add a "Log in" row exactly where the former .link-row entries were (Summary/Add task/Board/Contacts)
    // Only for logged-out users.
    if (isLoggedIn()) return;

    const mainLinks = document.querySelector('.left .main-links');
    if (!mainLinks) return;

    if (mainLinks.querySelector('.logout-login-row')) return;

    const row = document.createElement('div');
    row.className = 'link-row logout-login-row';
    row.setAttribute('role', 'link');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-label', 'Log in');

    const img = document.createElement('img');
    img.className = 'link-icon';
    img.src = 'assets/img/logout_legal-row.svg';
    img.alt = 'Log in';

    const span = document.createElement('span');
    span.className = 'logout-login-label';
    span.textContent = 'Log in';

    row.append(img, span);
    mainLinks.appendChild(row);

    const goLogin = () => (window.location.href = 'index.html');
    row.addEventListener('click', goLogin);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goLogin();
      }
    });
  }

  function ensureHeaderMenuLogin() {
    // Replace "Log out" with "Log in" on logout pages.
    const menu = document.getElementById('user_menu');
    if (!menu) return;

    // Remove any existing logout action.
    const logoutAnchor = menu.querySelector('a[onclick*="logoutUser"], a[onclick*="logoutuser"]');
    if (logoutAnchor && !isLoggedIn()) {
      logoutAnchor.removeAttribute('onclick');
      logoutAnchor.setAttribute('href', 'index.html');
      logoutAnchor.textContent = 'Log in';
      // In some pages the text is wrapped in <span>
      const span = logoutAnchor.querySelector('span');
      if (span) span.textContent = 'Log in';
    }
  }

  function hideUserIconWhenLoggedOut() {
    // Requirement:
    // When a user is logged out and is on privacy_policy_logout.html / legal_notice_logout.html,
    // the element with class `my_icon` must not be displayed.
    if (isLoggedIn()) return;
    document.querySelectorAll('.my_icon').forEach((el) => {
      el.style.display = 'none';
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    removeMainLinkRows();
    enforceLogoutLinks();
    ensureHeaderMenuLogin();
    ensureLoginRowInMainLinks();
    hideUserIconWhenLoggedOut();
  });
})();
