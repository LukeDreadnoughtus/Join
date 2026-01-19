


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


/**
 * Returns the initials of a given user name.
 * @param {string} user - The full name of the user.
 * @returns {string} The initials of the user in uppercase.
 */
function initials(user) {
    const parts = String(user || '').trim().split(/\s+/);
    const first = (parts[0] || '').charAt(0).toUpperCase();
    const second = (parts[1] || '').charAt(0).toUpperCase();
    return first + (second || '');
}

/**
 * Renders the user's initials inside the element with the class 'my_icon'.
 */
function renderUserIcon() {
    const user = localStorage.getItem("username") || "";
    const iconDiv = document.querySelector(".my_icon");
    if (iconDiv) {
        iconDiv.textContent = initials(user);
    }
}

/**
 * Redirects the user to the help page.
 */
function toHelpPage() {
window.location.href = "help.html"
}

/**
 * Toggles the visibility of the user menu.
 */
function openUserMenu() {
  const menu = document.getElementById("user_menu");
  const overlay = document.getElementById("header_overlay");

  menu.classList.toggle("d_none");
  overlay.classList.toggle("d_none");
}

function closeUserMenu() {
  document.getElementById("user_menu").classList.add("d_none");
  document.getElementById("header_overlay").classList.add("d_none");
}

/**
 * Logs out the user by clearing stored user data and redirecting to the index page.
 * @param {Event} event - The click event triggering the logout.
 */
function logoutUser(event) {
  event.preventDefault();
  localStorage.removeItem('username')
  localStorage.removeItem('userid')
  localStorage.removeItem('usercolor')
  // After a logout, make sure we land on the correct (logged-out) view.
  // This prevents scenarios where the user is logged out but still stays on a "logged-in" page layout.
  const currentFile = (window.location.pathname.split('/').pop() || '').toLowerCase();
  if (currentFile === 'privacy_policy.html') {
    window.location.href = 'privacy_policy_logout.html';
    return;
  }
  if (currentFile === 'legal_notice.html') {
    window.location.href = 'legal_notice_logout.html';
    return;
  }
  window.location.href = 'index.html';
}
//Help_page
/**
 * Navigates back to the previous page in the browser history.
 */
function backToLastPage() {
    window.history.back();
}
