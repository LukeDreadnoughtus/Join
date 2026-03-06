// contacts_detail.js
// ------------------------------------------------------------
// Everything related to:
//  - .contact_detail_header
//  - .contact_detail_root
// lives here.
// That includes:
//  - creating/ensuring the containers
//  - positioning (desktop layout)
//  - rendering the selected contact profile
//  - selection / deselection behavior
// ------------------------------------------------------------

(function () {
  const App = (window.ContactsApp = window.ContactsApp || {});
  App.detail = App.detail || {};

  const T = App.T || {};

  App.detail.createDetailHeader = function createDetailHeader() {
    // Builds the fixed detail header ("Contacts" + subtitle) once.
    // Appends it to the body so it can be positioned independently from the sidebar.
    // Returns the created header element.
    const h = document.createElement('div');
    h.className = 'contact_detail_header';

    const t = document.createElement('h2');
    t.className = 'cdh_title';
    t.textContent = 'Contacts';

    const line = document.createElement('div');
    line.className = 'cdh_line';

    const sub = document.createElement('div');
    sub.className = 'cdh_sub';
    sub.textContent = 'better with a team';

    h.append(t, line, sub);
    document.body.appendChild(h);
    return h;
  };

  App.detail.ensureDetailHeader = function ensureDetailHeader() {
    // Returns the existing detail header if it’s already there.
    // Otherwise creates it, so init() can call this safely.
    // Keeps page bootstrapping idempotent.
    let h = document.querySelector('.contact_detail_header');
    if (h) return h;
    return App.detail.createDetailHeader();
  };

  App.detail.ensureDetailRoot = function ensureDetailRoot() {
    // Ensures the detail container exists (where the profile renders).
    // Creates it once and reuses it, so selection just swaps innerHTML.
    // Returns the root container.
    let root = document.querySelector('.contact_detail_root');
    if (root) return root;

    App.detail.ensureDetailHeader();
    root = document.createElement('div');
    root.className = 'contact_detail_root';
    document.body.appendChild(root);
    return root;
  };

  App.detail.positionDetailRoot = function positionDetailRoot() {
    // Positions the detail view to the right of the sidebar using DOM measurements.
    // Also aligns the header so everything stays in one column visually.
    // Only relevant on desktop; mobile overrides position via CSS/overlay.
    const root = document.querySelector('.contact_detail_root');
    const sidebar = document.querySelector('.contacts_sidebar');
    const head = document.querySelector('.contact_detail_header');
    if (!root || !sidebar) return;

    const rect = sidebar.getBoundingClientRect();
    const left = (rect.right + 20) + 'px';
    root.style.left = left;
    if (head) head.style.left = left;
  };

  App.detail.clearSelection = function clearSelection() {
    // Removes highlight from selected sidebar row.
    // Clears the detail panel so nothing is shown when no user is selected.
    // Also resets selectedId in shared state.
    App.state.selectedId = null;

    document.querySelectorAll('.contacts_name_row.is-selected')
      .forEach(el => el.classList.remove('is-selected'));

    const root = document.querySelector('.contact_detail_root');
    if (root) root.innerHTML = '';
  };

  App.detail.buildDetailHead = function buildDetailHead(user, idx) {
    // Builds the top part of the detail view (avatar/name + actions).
    // Uses the template (detailHead) if available.
    // Wires delete so it sets editId first, then runs deleteContact().
    const head = document.createElement('div');
    head.className = 'contact_detail_item';

    const init = App.utils.initials(user.name);
    const color = user.color || '#666';
    const name = App.utils.titleCase(user.name);

    head.innerHTML = T.detailHead ? T.detailHead(init, name, color, idx) : name;

    const del = head.querySelector('.detail_delete');
    if (del) del.onclick = () => {
      App.state.editId = user.id || null;
      window.deleteContact();
    };

    return head;
  };

  App.detail.buildEmailElements = function buildEmailElements(user) {
    // Creates the email label + a clickable "mailto:" link.
    // Keeps it empty if the user has no email (so layout stays stable).
    // Returns {label, mail} nodes for easy appending.
    const label = document.createElement('div');
    label.className = 'contact_detail_item font_weight_700';
    label.textContent = 'E-Mail';

    const mail = document.createElement('a');
    mail.className = 'contact_detail_item contact_detail_email';
    if (user.email) {
      mail.href = 'mailto:' + user.email;
      mail.textContent = user.email;
    } else {
      mail.textContent = '';
    }

    return { label, mail };
  };

  App.detail.buildPhoneElements = function buildPhoneElements(user) {
    // Creates the phone label + value container.
    // Phone stays plain text (no click-to-call), so it works everywhere.
    // Returns {label, phone} nodes for easy appending.
    const label = document.createElement('div');
    label.className = 'contact_detail_item font_weight_700';
    label.textContent = 'Phone';

    const phone = document.createElement('div');
    phone.className = 'contact_detail_item';
    phone.textContent = user.phone || '';

    return { label, phone };
  };

  App.detail.createContactInfoSection = function createContactInfoSection() {
    // Builds the "Contact Information" section title.
    // Makes the detail view feel structured instead of just dumping fields.
    // Returns the label node.
    const section = document.createElement('div');
    section.className = 'contact_detail_item detail_section_label';
    section.textContent = 'Contact Information';
    return section;
  };

  App.detail.appendProfileElements = function appendProfileElements(root, elements) {
    // Appends detail elements with an animation class.
    // Keeps the animation logic in one place instead of repeating it.
    // Accepts an array of DOM nodes.
    (elements || []).forEach(el => {
      el.classList.add('slide_in_right');
      root.appendChild(el);
    });
  };

  App.detail.fillProfile = function fillProfile(user, idx) {
    // Renders the full detail profile for the selected user.
    // Repositions the detail panel first so it lines up after resizing.
    // Clears the old content so animations play nicely.
    const root = App.detail.ensureDetailRoot();

    if (!window.matchMedia("(max-width: 1024px)").matches) {
      App.detail.positionDetailRoot();
    }

    root.innerHTML = '';

    const head = App.detail.buildDetailHead(user, idx);
    const section = App.detail.createContactInfoSection();
    const { label: mailLabel, mail } = App.detail.buildEmailElements(user);
    const { label: phoneLabel, phone } = App.detail.buildPhoneElements(user);

    App.detail.appendProfileElements(root, [head, section, mailLabel, mail, phoneLabel, phone]);
  };

  App.detail.selectUserAt = function selectUserAt(idx) {
    // Selects a user by sidebar index and renders their profile.
    // Adds a visual "is-selected" class so the clicked row stays highlighted.
    // Also remembers selectedId so refresh can re-select after re-render.
    App.detail.clearSelection();

    const row = document.querySelector('.contacts_name_row[data-idx="' + idx + '"]');
    if (row) row.classList.add('is-selected');

    const user = App.state.order[idx];
    if (!user) return;

    App.state.selectedId = user.id || null;
    App.detail.fillProfile(user, idx);
  };

  // -----------------------------
  // Backwards-compatible window.* API
  // -----------------------------
  window.selectUserAt = (...a) => App.detail.selectUserAt(...a);
  window.clearSelection = (...a) => App.detail.clearSelection(...a);
  window.fillProfile = (...a) => App.detail.fillProfile(...a);
  window.positionDetailRoot = (...a) => App.detail.positionDetailRoot(...a);
  window.ensureDetailRoot = (...a) => App.detail.ensureDetailRoot(...a);
  window.ensureSidebar = (...a) => App.sidebar.ensureSidebar(...a);

  // Keep the old resize behavior: only reposition on desktop.
  window.addEventListener('resize', () => {
    if (!window.matchMedia("(max-width: 1024px)").matches) {
      App.detail.positionDetailRoot();
    }
  });

  // -----------------------------
  // Bootstrapping (this file is loaded last)
  // -----------------------------
  function runInitOnce() {
    // Runs ContactsApp.init() once.
    // Guards against double-init when scripts are injected/reloaded.
    // Keeps things predictable during dev.
    if (window.__contacts_init_done) return;
    window.__contacts_init_done = true;
    if (typeof App.init === 'function') App.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInitOnce);
  } else {
    runInitOnce();
  }
}());


// ------------------------------------------------------------
// Force rerender of .contact_detail_root after deleting contact
// ------------------------------------------------------------
App.detail.removeDetailRoot = function removeDetailRoot() {
  const root = document.querySelector('.contact_detail_root');
  if (root) root.remove();
};

App.detail.rerenderDetailRootAfterDelete = function rerenderDetailRootAfterDelete() {
  App.detail.clearSelection && App.detail.clearSelection();
  App.detail.removeDetailRoot();

  const root = App.detail.ensureDetailRoot ? App.detail.ensureDetailRoot() : null;
  if (root) {
    root.innerHTML = '';
  }

  if (window.matchMedia && !window.matchMedia('(max-width: 1024px)').matches) {
    App.detail.positionDetailRoot && App.detail.positionDetailRoot();
  }

  return root;
};

window.rerenderDetailRootAfterDelete = function () {
  if (App.detail && App.detail.rerenderDetailRootAfterDelete) {
    App.detail.rerenderDetailRootAfterDelete();
  }
};
