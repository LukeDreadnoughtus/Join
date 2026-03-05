// contacts_sidebar.js
// ------------------------------------------------------------
// Everything that belongs to the sidebar ("contacts_sidebar") lives here.
// That includes:
//  - creating the sidebar skeleton
//  - grouping + rendering contacts
//  - handling clicks that clear the selection
//
// Detail rendering and dialog logic are handled in other files.
// ------------------------------------------------------------

(function () {
  const App = (window.ContactsApp = window.ContactsApp || {});
  App.sidebar = App.sidebar || {};

  const T = App.T || {};

  App.sidebar.createSidebarAddButton = function createSidebarAddButton() {
    // Creates the "Add contact" button for the sidebar.
    // Uses templates if available, otherwise falls back to plain text.
    // The click handler stays global (openDialog) to match existing HTML.
    const btn = document.createElement('button');
    btn.className = 'contacts_sidebar_add';
    btn.setAttribute('onclick', 'openDialog()');
    btn.innerHTML = T.sidebarAddButton ? T.sidebarAddButton() : 'Add contact';
    return btn;
  };

  App.sidebar.createSidebarSkeleton = function createSidebarSkeleton(content) {
    // Builds the sidebar structure (button + list container) once.
    // Attaches a click handler so clicks outside rows can clear selection.
    // Returns the created sidebar element.
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

  App.sidebar.ensureSidebar = function ensureSidebar() {
    // Makes sure the sidebar exists before rendering contacts.
    // Also re-wires the add button/template so it stays correct after re-rendering.
    // Returns the sidebar element (or null when main.content is missing).
    const content = document.querySelector('main.content');
    if (!content) return null;

    let sidebar = content.querySelector('.contacts_sidebar');
    if (!sidebar) sidebar = App.sidebar.createSidebarSkeleton(content);

    const btn = sidebar.querySelector('.contacts_sidebar_add');
    if (btn) {
      btn.setAttribute('onclick', 'openDialog()');
      if (!btn.querySelector('img') && T.sidebarAddButton) btn.innerHTML = T.sidebarAddButton();
    }

    return sidebar;
  };

  App.sidebar.createNameAvatar = function createNameAvatar(user) {
    // Creates the little round avatar with initials.
    // Uses the saved user color (or a fallback) so each user is recognizable.
    // Returns a ready-to-append DOM node.
    const avatar = document.createElement('div');
    avatar.className = 'contacts_avatar';
    avatar.textContent = App.utils.initials(user.name);
    avatar.style.background = user.color || '#666';
    return avatar;
  };

  App.sidebar.createNameTexts = function createNameTexts(user) {
    // Builds the text area next to the avatar (name + email).
    // Applies title casing so the list looks clean even with messy input.
    // Adds <wbr> so long names/emails can wrap nicely.
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

  App.sidebar.createNameRow = function createNameRow(user, idx) {
    // Creates one clickable row in the sidebar for a user.
    // Stores the render index so selection can find the correct user in state.order.
    // Keeps click handler global (selectUserAt) for compatibility.
    const row = document.createElement('div');
    row.className = 'contacts_name_row';
    row.dataset.idx = idx;
    row.setAttribute('onclick', 'selectUserAt(' + idx + ')');
    row.append(App.sidebar.createNameAvatar(user), App.sidebar.createNameTexts(user));
    return row;
  };

  App.sidebar.groupContactsByInitial = function groupContactsByInitial(users) {
    // Sorts contacts by name (German locale rules) and groups them by initial.
    // Returns an object like {A:[...], B:[...], "#":[...]}.
    // The grouping key comes from utils.normalizeInitial().
    const groups = {};
    (users || [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
      .forEach(u => {
        const letter = App.utils.normalizeInitial(u.name);
        (groups[letter] || (groups[letter] = [])).push(u);
      });
    return groups;
  };

  App.sidebar.createGroupHeader = function createGroupHeader(letter) {
    // Creates the header for a group section (letter label + divider).
    // Keeps markup consistent so CSS can style group separators easily.
    // Returns the full section container.
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

  App.sidebar.appendUsersToGroup = function appendUsersToGroup(section, users) {
    // Appends user rows into a given letter section.
    // Pushes users into state.order so the sidebar index matches the data index.
    // This is the only place that mutates state.order during rendering.
    (users || []).forEach(u => {
      const idx = App.state.order.push(u) - 1;
      section.appendChild(App.sidebar.createNameRow(u, idx));
    });
  };

  App.sidebar.renderContacts = function renderContacts(root, users) {
    // Clears the sidebar list and re-renders everything from scratch.
    // Rebuilds state.order so selection always points to the right contact.
    // Group rendering is kept separate so this stays readable.
    if (!root) return;
    root.innerHTML = '';
    App.state.order = [];

    const groups = App.sidebar.groupContactsByInitial(users);
    Object.keys(groups)
      .sort()
      .forEach(letter => {
        const section = App.sidebar.createGroupHeader(letter);
        App.sidebar.appendUsersToGroup(section, groups[letter]);
        root.appendChild(section);
      });
  };

  // -----------------------------
  // Global handlers (used by inline onclick attributes)
  // -----------------------------
  window.sidebarClick = function sidebarClick(e) {
    // If you click anywhere in the sidebar that is NOT a row, selection is cleared.
    // Makes the UI feel natural (clicking empty space deselects).
    // Uses window.clearSelection so the detail logic stays in one place.
    if (!e.target.closest('.contacts_name_row')) window.clearSelection();
  };
}());
