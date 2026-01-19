(() => {
  const currentFile = (location.pathname.split('/').pop() || '').toLowerCase();
  const isLogoutPage = currentFile.endsWith('_logout.html');
  if (!isLogoutPage) return;

 
  const isLegalInfoLogoutPage =
    currentFile === 'privacy_policy_logout.html' ||
    currentFile === 'legal_notice_logout.html';

  const isLoggedIn = () => {
    
    // - Checks localStorage for either a saved userid or username.
    // - If one of them exists, it treats the user as logged in (simple boolean check).
    // - This is a lightweight "session" check based on persisted values, not cookies/auth tokens.
    // - It returns true/false only, so other functions can keep their logic clean.
    const uid = localStorage.getItem('userid');
    const uname = localStorage.getItem('username');
    return !!(uid || uname);
  };

  function redirectLoggedInFromLogoutLegalPages() {

    // - If a logged-in user lands on a *_logout legal page, this sends them to the normal version.
    // - Prevents weird UX where a logged-in user sees the "logged-out" legal pages by accident.
    // - Uses window.location.replace so the logout-page isn't kept in browser history.
    // - Only runs for the two specific legal pages, everything else stays untouched.
    if (!isLoggedIn()) return;
    if (currentFile === 'privacy_policy_logout.html') {
      window.location.replace('privacy_policy.html');
      return;
    }
    if (currentFile === 'legal_notice_logout.html') {
      window.location.replace('legal_notice.html');
      return;
    }
  }

  function enforceLogoutLinks() {
    
    // - When the user is logged out, rewrites legal links to point to the *_logout pages.
    // - Keeps navigation consistent so logged-out users never jump to the logged-in legal pages.
    // - It scans two areas (legal-area rows + header user menu) and adjusts hrefs safely.
    // - Uses endsWith checks, so it won’t break if paths contain extra folders.
    if (isLoggedIn()) return;

    
    document.querySelectorAll('.legal-area a.legal-row').forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href.endsWith('privacy_policy.html')) a.setAttribute('href', 'privacy_policy_logout.html');
      if (href.endsWith('legal_notice.html')) a.setAttribute('href', 'legal_notice_logout.html');
    });

    
    document.querySelectorAll('#user_menu a').forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href.endsWith('privacy_policy.html')) a.setAttribute('href', 'privacy_policy_logout.html');
      if (href.endsWith('legal_notice.html')) a.setAttribute('href', 'legal_notice_logout.html');
    });
  }

  function removeMainLinkRows() {
    // - If the user is logged out, removes the main navigation rows from the left menu.
    // - This basically "locks down" the app navigation while logged out.
    // - It only touches elements inside .main-links, so it doesn't mess with other sections.
    // - Safe-guards included: if .main-links doesn’t exist, it just returns.
    if (isLoggedIn()) return;
   
    const mainLinks = document.querySelector('.main-links');
    if (!mainLinks) return;
    mainLinks.querySelectorAll('.link-row').forEach((row) => row.remove());
  }

  function ensureLoginRowInMainLinks() {
   
    // - Adds a "Log in" row into the left main-links section when logged out.
    // - Makes the logout/legal pages feel navigable instead of being a dead-end.
    // - Includes keyboard support (Enter/Space) so it works like a real accessible link.
    // - Won’t duplicate the row because it checks for .logout-login-row first.
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

  function ensureMobileLegalTextLinks() {
  
    // - On mobile logout legal pages, injects simple text links for Privacy/Legal in the left area.
    // - Adds a helper class (logout-nav) so CSS can style the logout navigation differently.
    // - Prevents duplicates by checking for an existing .logout-legal-area wrapper.
    // - Only runs on the logout legal pages, not on other logout pages.
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

  function markActiveLogoutLegalLinks() {
    
    // - Highlights the currently active logout legal link (Privacy vs Legal) for better orientation.
    // - Compares the link filename to currentFile, so it works even if the href has a path.
    // - Toggles a CSS class (is-active) and sets aria-current for accessibility.
    // - Only applies while logged out and only on the logout legal pages.
    if (isLoggedIn() || !isLegalInfoLogoutPage) return;

    document.querySelectorAll('.logout-legal-link').forEach((a) => {
      const hrefFile = ((a.getAttribute('href') || '').split('/').pop() || '').toLowerCase();
      const active = hrefFile === currentFile;
      a.classList.toggle('is-active', active);
      a.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  function ensureHeaderMenuLogin() {
    
    // - Replaces the header "logout" action with a "Log in" link when the user is logged out.
    // - Removes the onclick logout handler so it can’t trigger logout logic in a logged-out state.
    // - Updates both the anchor text and the inner span text if present (covers icon menus).
    // - Keeps markup mostly intact, so layout doesn't jump around.
    const menu = document.getElementById('user_menu');
    if (!menu) return;

    
    const logoutAnchor = menu.querySelector('a[onclick*="logoutUser"], a[onclick*="logoutuser"]');
    if (logoutAnchor && !isLoggedIn()) {
      logoutAnchor.removeAttribute('onclick');
      logoutAnchor.setAttribute('href', 'index.html');
      logoutAnchor.textContent = 'Log in';
     
      const span = logoutAnchor.querySelector('span');
      if (span) span.textContent = 'Log in';
    }
  }

  function hideUserIconWhenLoggedOut() {

    // - Hides user icon elements when logged out to avoid implying there's an active profile.
    // - Targets .my_icon and sets display:none directly (quick + reliable).
    // - Keeps the header cleaner on logout/legal screens.
    // - Does nothing if the user is logged in, so normal UI stays untouched.
    if (isLoggedIn()) return;
    document.querySelectorAll('.my_icon').forEach((el) => {
      el.style.display = 'none';
    });
  }

  function ensureMobileBackArrow() {

    // - Adds a back arrow button on mobile for logout legal pages, sending users to the login screen.
    // - Uses matchMedia so it only appears under 1024px (and cleans itself up when resizing).
    // - Handles click + keyboard input for accessibility (Enter/Space).
    // - Inserts the arrow in a sensible spot (before main content if possible).
    if (isLoggedIn() || !isLegalInfoLogoutPage) return;

    const mq = window.matchMedia('(max-width: 1024px)');

    const addArrow = () => {
      if (!mq.matches) return;
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
      arrow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goBack();
        }
      });

      const page = document.querySelector('.page');
      const content = document.querySelector('main.content');

      if (page && content) {
        
        page.insertBefore(arrow, content);
      } else if (page) {
        page.appendChild(arrow);
      } else {
        document.body.appendChild(arrow);
      }
    };

    const removeArrow = () => {
      // - Removes the mobile back arrow if it exists (cleanup for desktop or route changes).
      // - Prevents duplicate arrows when the resize handler fires multiple times.
      // - Keeps the DOM clean instead of leaving unused elements around.
      // - Safe to call even if the arrow doesn't exist.
      const existing = document.querySelector('.logout-back-arrow');
      if (existing) existing.remove();
    };

    const sync = () => {
      // - Syncs the arrow state with the current media query (mobile vs desktop).
      // - Adds the arrow when entering mobile width, removes it when leaving.
      // - Used by both the initial call and the resize/change listeners.
      // - Centralizes the logic so it’s not duplicated.
      if (mq.matches) addArrow();
      else removeArrow();
    };

    sync();
    mq.addEventListener?.('change', sync);
    window.addEventListener('resize', sync);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // - Runs all logout-page UI fixes only after the DOM is ready.
    // - Prevents querySelector calls from failing because elements haven't loaded yet.
    // - Keeps everything in one place so the page behavior is predictable.
    // - Order matters a bit: redirects first, then cleanup, then link/UI adjustments.
    redirectLoggedInFromLogoutLegalPages();
    removeMainLinkRows();
    enforceLogoutLinks();
    ensureHeaderMenuLogin();
    ensureLoginRowInMainLinks();
    ensureMobileLegalTextLinks();
    markActiveLogoutLegalLinks();
    hideUserIconWhenLoggedOut();
    ensureMobileBackArrow();
  });
})();
