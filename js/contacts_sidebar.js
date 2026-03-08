(function () {
  const App = (window.ContactsApp = window.ContactsApp || {});
  App.sidebar = App.sidebar || {};

  const T = App.T || {};

  /**
   * Creates the "Add contact" button for the sidebar.
   * Uses templates if available, otherwise falls back to plain text.
   * The click handler stays global (openDialog) to match existing HTML.
   *
   * @returns {HTMLButtonElement} The created add button.
   */
  App.sidebar.createSidebarAddButton = function createSidebarAddButton() {
    const btn = document.createElement('button');
    btn.className = 'contacts_sidebar_add';
    btn.setAttribute('onclick', 'openDialog()');
    btn.innerHTML = T.sidebarAddButton ? T.sidebarAddButton() : 'Add contact';
    return btn;
  };

  /**
   * Builds the sidebar structure (button + list container) once.
   * Attaches a click handler so clicks outside rows can clear selection.
   * Returns the created sidebar element.
   *
   * @param {HTMLElement} content - The main content container.
   * @returns {HTMLDivElement} The created sidebar element.
   */
  App.sidebar.createSidebarSkeleton = function createSidebarSkeleton(content) {
    const sidebar = document.createElement('div');
    sidebar.className = 'contacts_sidebar';
    sidebar.setAttribute('onclick', 'sidebarClick(event)');

    const addBtn = App.sidebar.createSidebarAddButton();
    const list = document.createElement('div');
    list.className = 'contacts_sidebar_list';

    sidebar.append(addBtn, list);
    content.insertBefore(sidebar, content.firstChild);
    return sidebar;
  };

  /**
   * Makes sure the sidebar exists before rendering contacts.
   * Also re-wires the add button/template so it stays correct after re-rendering.
   *
   * @returns {HTMLElement|null} The sidebar element or null when main.content is missing.
   */
  App.sidebar.ensureSidebar = function ensureSidebar() {
    const content = document.querySelector('main.content');
    if (!content) return null;

    let sidebar = content.querySelector('.contacts_sidebar');
    if (!sidebar) sidebar = App.sidebar.createSidebarSkeleton(content);

    const btn = sidebar.querySelector('.contacts_sidebar_add');
    if (btn) {
      btn.setAttribute('onclick', 'openDialog()');
      if (!btn.querySelector('img') && T.sidebarAddButton) {
        btn.innerHTML = T.sidebarAddButton();
      }
    }

    return sidebar;
  };

  /**
   * Creates the little round avatar with initials.
   * Uses the saved user color (or a fallback) so each user is recognizable.
   *
   * @param {Object} user - The user object.
   * @param {string} user.name - The user's name.
   * @param {string} [user.color] - The user's avatar color.
   * @returns {HTMLDivElement} A ready-to-append avatar node.
   */
  App.sidebar.createNameAvatar = function createNameAvatar(user) {
    const avatar = document.createElement('div');
    avatar.className = 'contacts_avatar';
    avatar.textContent = App.utils.initials(user.name);
    avatar.style.background = user.color || '#666';
    return avatar;
  };

  /**
   * Builds the text area next to the avatar (name + email).
   * Applies title casing so the list looks clean even with messy input.
   * Adds <wbr> so long names and emails can wrap nicely.
   *
   * @param {Object} user - The user object.
   * @param {string} user.name - The user's name.
   * @param {string} [user.email] - The user's email address.
   * @returns {HTMLDivElement} The text wrapper containing name and email.
   */
  App.sidebar.createNameTexts = function createNameTexts(user) {
    const texts = document.createElement('div');
    texts.className = 'contacts_texts';

    const label = document.createElement('h4');
    label.className = 'contacts_name';

    const n = App.utils.titleCase(user.name);
    const nParts = String(n).split(' ');
    nParts.forEach((part, i) => {
      label.appendChild(document.createTextNode(part));
      if (i < nParts.length - 1) {
        label.appendChild(document.createTextNode(' '));
        label.appendChild(document.createElement('wbr'));
      }
    });

    const email = document.createElement('div');
    email.className = 'contacts_email';
    const e = String(user.email || '');
    const at = e.indexOf('@');

    if (at > -1) {
      email.appendChild(document.createTextNode(e.slice(0, at + 1)));
      email.appendChild(document.createElement('wbr'));
      email.appendChild(document.createTextNode(e.slice(at + 1)));
    } else {
      email.textContent = e;
    }

    texts.append(label, email);
    return texts;
  };

  /**
   * Creates one clickable row in the sidebar for a user.
   * Stores the render index so selection can find the correct user in state.order.
   * Keeps click handler global (selectUserAt) for compatibility.
   *
   * @param {Object} user - The user object.
   * @param {number} idx - The render index of the user.
   * @returns {HTMLDivElement} The created sidebar row.
   */
  App.sidebar.createNameRow = function createNameRow(user, idx) {
    const row = document.createElement('div');
    row.className = 'contacts_name_row';
    row.dataset.idx = idx;
    row.setAttribute('onclick', 'selectUserAt(' + idx + ')');
    row.append(
      App.sidebar.createNameAvatar(user),
      App.sidebar.createNameTexts(user)
    );
    return row;
  };

  /**
   * Sorts contacts by name (German locale rules) and groups them by initial.
   * Returns an object like { A:[...], B:[...], "#":[...] }.
   * The grouping key comes from utils.normalizeInitial().
   *
   * @param {Array<Object>} users - The list of users.
   * @returns {Object<string, Array<Object>>} Grouped users by initial letter.
   */
  App.sidebar.groupContactsByInitial = function groupContactsByInitial(users) {
    const groups = {};

    (users || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
      .forEach((u) => {
        const letter = App.utils.normalizeInitial(u.name);
        (groups[letter] || (groups[letter] = [])).push(u);
      });

    return groups;
  };

  /**
   * Creates the header for a group section (letter label + divider).
   * Keeps markup consistent so CSS can style group separators easily.
   *
   * @param {string} letter - The group letter.
   * @returns {HTMLDivElement} The full group section container.
   */
  App.sidebar.createGroupHeader = function createGroupHeader(letter) {
    const section = document.createElement('div');
    section.className = 'contacts_group';

    const head = document.createElement('div');
    head.className = 'contacts_group_label';
    head.textContent = letter;

    const divider = document.createElement('div');
    divider.className = 'contacts_divider';

    section.append(head, divider);
    return section;
  };

  /**
   * Appends user rows into a given letter section.
   * Pushes users into state.order so the sidebar index matches the data index.
   * This is the only place that mutates state.order during rendering.
   *
   * @param {HTMLElement} section - The group section element.
   * @param {Array<Object>} users - The users to append.
   * @returns {void}
   */
  App.sidebar.appendUsersToGroup = function appendUsersToGroup(section, users) {
    (users || []).forEach((u) => {
      const idx = App.state.order.push(u) - 1;
      section.appendChild(App.sidebar.createNameRow(u, idx));
    });
  };

  /**
   * Clears the sidebar list and re-renders everything from scratch.
   * Rebuilds state.order so selection always points to the right contact.
   * Group rendering is kept separate so this stays readable.
   *
   * @param {HTMLElement} root - The sidebar list root element.
   * @param {Array<Object>} users - The users to render.
   * @returns {void}
   */
  App.sidebar.renderContacts = function renderContacts(root, users) {
    if (!root) return;

    root.innerHTML = '';
    App.state.order = [];

    const groups = App.sidebar.groupContactsByInitial(users);
    Object.keys(groups)
      .sort()
      .forEach((letter) => {
        const section = App.sidebar.createGroupHeader(letter);
        App.sidebar.appendUsersToGroup(section, groups[letter]);
        root.appendChild(section);
      });
  };

  /**
   * If you click anywhere in the sidebar that is not a row, selection is cleared.
   * Makes the UI feel natural by deselecting on empty-space clicks.
   * Uses window.clearSelection so the detail logic stays in one place.
   *
   * @param {MouseEvent} e - The click event.
   * @returns {void}
   */
  window.sidebarClick = function sidebarClick(e) {
    if (!e.target.closest('.contacts_name_row')) window.clearSelection();
  };
}());