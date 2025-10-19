


(() => {
  const ACTIVE_COLOR = '#091931';

  

 
  const PAGE_TO_LINK = {
    'summary.html': 'summary',
    'board.html': 'board',
    'add_task.html': 'add_task',
    'contacts.html': 'contacts',
  };

  const getFilename = () => {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf('/') + 1) || '';
    return file.toLowerCase();
  };

  const highlightNav = () => {
    const file = getFilename();

  
    let targetLink = PAGE_TO_LINK[file];

  
    if (!targetLink) {
      const base = file.replace(/\.html?$/i, '');
      for (const [page, link] of Object.entries(PAGE_TO_LINK)) {
        if (page.replace(/\.html?$/i, '') === base) {
          targetLink = link;
          break;
        }
      }
    }

    const items = document.querySelectorAll('[data-link]');
    items.forEach((el) => {
      el.style.backgroundColor = '';
    });

    if (targetLink) {
      const activeEl = document.querySelector(`[data-link="${targetLink}"]`);
      if (activeEl) {
}
      if (activeEl) {
        activeEl.classList.add('is-active');
        activeEl.setAttribute('aria-current', 'page');
        activeEl.style.cursor = 'default';
      }
    }
  };

  document.addEventListener('DOMContentLoaded', highlightNav);
})();


if (isSame(routes[el.getAttribute('data-link')])) {
  el.setAttribute('aria-current', 'page'); 
}