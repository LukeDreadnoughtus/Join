(() => {
  const currentFile = (location.pathname.split('/').pop() || '').toLowerCase();
  const isLogoutPage = currentFile.endsWith('_logout.html');
  if (!isLogoutPage) return;

  // Frühestmöglich: main-links unsichtbar halten (CSS), bis wir fertig sind.
  document.documentElement.classList.add('logout-page');

  const isLegalInfoLogoutPage =
    currentFile === 'privacy_policy_logout.html' ||
    currentFile === 'legal_notice_logout.html';

  const isLoggedIn = () => !!localStorage.getItem('userid');

  function redirectLoggedInFromLogoutLegalPages() {
    if (!isLoggedIn()) return;
    if (currentFile === 'privacy_policy_logout.html') window.location.replace('privacy_policy.html');
    if (currentFile === 'legal_notice_logout.html') window.location.replace('legal_notice.html');
  }

  function pruneMainLinksToLoginOnly() {
    // Sicherheit: Falls irgendwoher doch Main-Links injiziert werden, sofort entfernen.
    const mainLinks = document.querySelector('.main-links');
    if (!mainLinks) return;
    mainLinks.querySelectorAll('.link-row:not(.logout-login-row)').forEach((el) => el.remove());
  }

  function observeAndBlockInjectedLinks() {
    const mainLinks = document.querySelector('.main-links');
    if (!mainLinks) return;

    const obs = new MutationObserver(() => pruneMainLinksToLoginOnly());
    obs.observe(mainLinks, { childList: true, subtree: true });
  }

  function wireLoginRow() {
    // Logout-Seiten: Login-Zeile ist statisch im HTML, wir hängen nur das Verhalten dran.
    const row = document.querySelector('.logout-login-row');
    if (!row) return;

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
    if (isLoggedIn() || !isLegalInfoLogoutPage) return;

    document.querySelectorAll('.logout-legal-link').forEach((a) => {
      const hrefFile = ((a.getAttribute('href') || '').split('/').pop() || '').toLowerCase();
      const active = hrefFile === currentFile;
      a.classList.toggle('is-active', active);
      a.setAttribute('aria-current', active ? 'page' : 'false');
    });
  }

  function ensureMobileBackArrow() {
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

      const goBack = () => (window.location.href = 'index.html');
      arrow.addEventListener('click', goBack);
      arrow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goBack();
        }
      });

      const page = document.querySelector('.page');
      const content = document.querySelector('main.content');
      if (page && content) page.insertBefore(arrow, content);
      else (page || document.body).appendChild(arrow);
    };

    const removeArrow = () => document.querySelector('.logout-back-arrow')?.remove();

    const sync = () => (mq.matches ? addArrow() : removeArrow());
    sync();

    mq.addEventListener?.('change', sync);
    window.addEventListener('resize', sync);
  }

  // So früh wie möglich (noch vor DOMContentLoaded): extra Links blockieren.
  pruneMainLinksToLoginOnly();
  observeAndBlockInjectedLinks();

  document.addEventListener('DOMContentLoaded', () => {
    redirectLoggedInFromLogoutLegalPages();
    pruneMainLinksToLoginOnly();
    wireLoginRow();
    ensureMobileLegalTextLinks();
    markActiveLogoutLegalLinks();
    ensureMobileBackArrow();

    // Jetzt darf die Navigation sichtbar werden.
    document.documentElement.classList.add('logout-ready');
  });
})();