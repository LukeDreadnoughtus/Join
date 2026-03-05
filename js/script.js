const ACTIVE_COLOR = '#091931';

const PAGE_TO_LINK = {
  'summary.html': 'summary',
  'board.html': 'board',
  'add_task.html': 'add_task',
  'contacts.html': 'contacts',
};

/**
 * Returns the current filename from the URL.
 * @returns {string} Current page filename
 */
function getFilename() {
  const path = window.location.pathname;
  const file = path.substring(path.lastIndexOf('/') + 1) || '';
  return file.toLowerCase();
}

/**
 * Tries to resolve the navigation link key for a given filename.
 * @param {string} file
 * @returns {string|undefined}
 */
function resolveTargetLink(file) {
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
  return targetLink;
}

/**
 * Removes the active state from all navigation elements.
 */
function resetNavStyles() {
  const items = document.querySelectorAll('[data-link]');
  items.forEach((el) => {
    el.style.backgroundColor = '';
    el.classList.remove('is-active');
    el.removeAttribute('aria-current');
  });
}

/**
 * Sets the active navigation element.
 * @param {string} linkKey
 */
function setActiveNav(linkKey) {
  const activeEl = document.querySelector(`[data-link="${linkKey}"]`);

  if (!activeEl) return;

  activeEl.classList.add('is-active');
  activeEl.setAttribute('aria-current', 'page');
  activeEl.style.cursor = 'default';
}

/**
 * Highlights the current navigation item based on the URL.
 */
function highlightNav() {
  const file = getFilename();
  const targetLink = resolveTargetLink(file);

  resetNavStyles();

  if (targetLink) {
    setActiveNav(targetLink);
  }
}
document.addEventListener('DOMContentLoaded', highlightNav);

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

    localStorage.removeItem('username');
    localStorage.removeItem('userid');
    localStorage.removeItem('usercolor');
    window.location.replace('index.html');
}

function checkAuth() {
    if (!localStorage.getItem('userid')) {
        window.location.replace('index.html');
    }
    document.documentElement.style.visibility = 'visible';
    document.body.style.visibility = 'visible';
}


//Help_page
/**
 * Navigates back to the previous page in the browser history.
 */
function backToLastPage() {
    window.history.back();
}
