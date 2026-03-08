/**
 * contacts_detail.js
 *
 * Everything related to:
 * - .contact_detail_header
 * - .contact_detail_root
 *
 * This file is responsible for:
 * - creating and maintaining the detail header and root containers
 * - positioning the detail area next to the sidebar on desktop
 * - rendering, selecting, deselecting, and resetting contact details
 */
(function () {
  const App = (window.ContactsApp = window.ContactsApp || {});
  App.detail = App.detail || {};

  const T = App.T || {};

  /**
   * Creates the fixed detail header element.
   *
   * - Builds the "Contacts" title, separator line, and subtitle.
   * - Appends the header directly to the document body.
   * - Returns the created header element.
   *
   * @returns {HTMLDivElement}
   */
  App.detail.createDetailHeader = function createDetailHeader() {
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

  /**
   * Ensures that the detail header exists exactly once.
   *
   * - Returns the existing header if it is already present.
   * - Creates a new header only when none exists yet.
   * - Keeps initialization safe and idempotent.
   *
   * @returns {Element | HTMLDivElement}
   */
  App.detail.ensureDetailHeader = function ensureDetailHeader() {
    const h = document.querySelector('.contact_detail_header');
    if (h) return h;
    return App.detail.createDetailHeader();
  };

  /**
   * Ensures that the detail root container exists.
   *
   * - Reuses the existing detail root when available.
   * - Creates the root only once for profile rendering.
   * - Ensures the header exists before creating the root.
   *
   * @returns {Element | HTMLDivElement}
   */
  App.detail.ensureDetailRoot = function ensureDetailRoot() {
    let root = document.querySelector('.contact_detail_root');
    if (root) return root;

    App.detail.ensureDetailHeader();

    root = document.createElement('div');
    root.className = 'contact_detail_root';
    document.body.appendChild(root);

    return root;
  };

  /**
   * Positions the detail root and header beside the sidebar.
   *
   * - Measures the sidebar position using getBoundingClientRect().
   * - Aligns the detail root and header to the same left offset.
   * - Applies desktop-only positioning logic.
   */
  App.detail.positionDetailRoot = function positionDetailRoot() {
    const root = document.querySelector('.contact_detail_root');
    const sidebar = document.querySelector('.contacts_sidebar');
    const head = document.querySelector('.contact_detail_header');

    if (!root || !sidebar) return;

    const rect = sidebar.getBoundingClientRect();
    const left = rect.right + 20 + 'px';

    root.style.left = left;
    if (head) head.style.left = left;
  };

  /**
   * Clears the current sidebar selection and detail content.
   *
   * - Removes the visual selected state from all sidebar rows.
   * - Resets the shared selectedId state to null.
   * - Empties the detail root so no profile remains visible.
   */
  App.detail.clearSelection = function clearSelection() {
    App.state.selectedId = null;

    document
      .querySelectorAll('.contacts_name_row.is-selected')
      .forEach(el => el.classList.remove('is-selected'));

    const root = document.querySelector('.contact_detail_root');
    if (root) root.innerHTML = '';
  };

  /**
   * Builds the top header section of a contact profile.
   *
   * - Creates the avatar, name, and action area for the selected user.
   * - Uses the available detailHead template when present.
   * - Connects the delete button to the existing deleteContact flow.
   *
   * @param {Object} user
   * @param {number} idx
   * @returns {HTMLDivElement}
   */
  App.detail.buildDetailHead = function buildDetailHead(user, idx) {
    const head = document.createElement('div');
    head.className = 'contact_detail_item';

    const init = App.utils.initials(user.name);
    const color = user.color || '#666';
    const name = App.utils.titleCase(user.name);

    head.innerHTML = T.detailHead ? T.detailHead(init, name, color, idx) : name;

    const del = head.querySelector('.detail_delete');
    if (del) {
      del.onclick = () => {
        App.state.editId = user.id || null;
        window.deleteContact();
      };
    }

    return head;
  };

  /**
   * Builds the email label and mailto link elements.
   *
   * - Creates a section label for the email field.
   * - Generates a clickable mailto link when an email exists.
   * - Returns both nodes together for easier rendering.
   *
   * @param {Object} user
   * @returns {{ label: HTMLDivElement, mail: HTMLAnchorElement }}
   */
  App.detail.buildEmailElements = function buildEmailElements(user) {
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

  /**
   * Builds the phone label and phone value elements.
   *
   * - Creates a section label for the phone field.
   * - Displays the phone number as plain text.
   * - Returns both nodes together for consistent appending.
   *
   * @param {Object} user
   * @returns {{ label: HTMLDivElement, phone: HTMLDivElement }}
   */
  App.detail.buildPhoneElements = function buildPhoneElements(user) {
    const label = document.createElement('div');
    label.className = 'contact_detail_item font_weight_700';
    label.textContent = 'Phone';

    const phone = document.createElement('div');
    phone.className = 'contact_detail_item';
    phone.textContent = user.phone || '';

    return { label, phone };
  };

  /**
   * Creates the "Contact Information" section label.
   *
   * - Adds a structured heading above the contact fields.
   * - Improves readability of the detail view.
   * - Returns the generated section element.
   *
   * @returns {HTMLDivElement}
   */
  App.detail.createContactInfoSection = function createContactInfoSection() {
    const section = document.createElement('div');
    section.className = 'contact_detail_item detail_section_label';
    section.textContent = 'Contact Information';
    return section;
  };

  /**
   * Appends profile elements to the detail root with animation.
   *
   * - Adds a slide-in animation class to each node.
   * - Appends all provided elements in order.
   * - Centralizes animation-related append logic.
   *
   * @param {Element} root
   * @param {Element[]} elements
   */
  App.detail.appendProfileElements = function appendProfileElements(root, elements) {
    (elements || []).forEach(el => {
      el.classList.add('slide_in_right');
      root.appendChild(el);
    });
  };

  /**
   * Renders the full profile of the selected contact.
   *
   * - Ensures the detail root exists before rendering content.
   * - Repositions the panel on desktop before injecting new content.
   * - Clears old content and appends the newly built profile elements.
   *
   * @param {Object} user
   * @param {number} idx
   */
  App.detail.fillProfile = function fillProfile(user, idx) {
    const root = App.detail.ensureDetailRoot();

    if (!window.matchMedia('(max-width: 1024px)').matches) {
      App.detail.positionDetailRoot();
    }

    root.innerHTML = '';

    const head = App.detail.buildDetailHead(user, idx);
    const section = App.detail.createContactInfoSection();
    const { label: mailLabel, mail } = App.detail.buildEmailElements(user);
    const { label: phoneLabel, phone } = App.detail.buildPhoneElements(user);

    App.detail.appendProfileElements(root, [
      head,
      section,
      mailLabel,
      mail,
      phoneLabel,
      phone
    ]);
  };

  /**
   * Selects a user by index and renders the corresponding profile.
   *
   * - Clears any previous selection before applying a new one.
   * - Marks the selected sidebar row with the is-selected class.
   * - Stores the selected user ID and renders the profile content.
   *
   * @param {number} idx
   */
  App.detail.selectUserAt = function selectUserAt(idx) {
    App.detail.clearSelection();

    const row = document.querySelector('.contacts_name_row[data-idx="' + idx + '"]');
    if (row) row.classList.add('is-selected');

    const user = App.state.order[idx];
    if (!user) return;

    App.state.selectedId = user.id || null;
    App.detail.fillProfile(user, idx);
  };

  /**
   * Removes the detail root element from the DOM.
   *
   * - Finds the existing .contact_detail_root element.
   * - Removes it completely when present.
   * - Supports a clean rerender after deleting a contact.
   */
  App.detail.removeDetailRoot = function removeDetailRoot() {
    const root = document.querySelector('.contact_detail_root');
    if (root) root.remove();
  };

  /**
   * Recreates and resets the detail root after a contact deletion.
   *
   * - Clears the current selection before rebuilding the detail area.
   * - Removes and recreates the detail root container.
   * - Repositions the detail area again on desktop screens.
   *
   * @returns {Element | HTMLDivElement | null}
   */
  App.detail.rerenderDetailRootAfterDelete = function rerenderDetailRootAfterDelete() {
    if (App.detail.clearSelection) {
      App.detail.clearSelection();
    }

    App.detail.removeDetailRoot();

    const root = App.detail.ensureDetailRoot ? App.detail.ensureDetailRoot() : null;

    if (root) {
      root.innerHTML = '';
    }

    if (window.matchMedia && !window.matchMedia('(max-width: 1024px)').matches) {
      if (App.detail.positionDetailRoot) {
        App.detail.positionDetailRoot();
      }
    }

    return root;
  };

  /**
   * Runs application initialization exactly once.
   *
   * - Prevents duplicate App.init() execution.
   * - Sets a global flag to guard repeated bootstrapping.
   * - Calls App.init() only when it exists.
   */
  function runInitOnce() {
    if (window.__contacts_init_done) return;
    window.__contacts_init_done = true;

    if (typeof App.init === 'function') {
      App.init();
    }
  }

  /**
   * Exposes legacy global functions for backward compatibility.
   *
   * - Maps existing window.* calls to the new App.detail methods.
   * - Preserves compatibility with older code paths.
   * - Keeps migration to modular structure safe.
   */
  window.selectUserAt = (...a) => App.detail.selectUserAt(...a);
  window.clearSelection = (...a) => App.detail.clearSelection(...a);
  window.fillProfile = (...a) => App.detail.fillProfile(...a);
  window.positionDetailRoot = (...a) => App.detail.positionDetailRoot(...a);
  window.ensureDetailRoot = (...a) => App.detail.ensureDetailRoot(...a);
  window.ensureSidebar = (...a) => App.sidebar.ensureSidebar(...a);
  window.rerenderDetailRootAfterDelete = function () {
    if (App.detail && App.detail.rerenderDetailRootAfterDelete) {
      App.detail.rerenderDetailRootAfterDelete();
    }
  };

  /**
   * Repositions the detail panel on window resize for desktop layouts.
   *
   * - Listens to the global resize event.
   * - Skips repositioning on smaller mobile viewports.
   * - Keeps the detail area aligned with the sidebar.
   */
  window.addEventListener('resize', () => {
    if (!window.matchMedia('(max-width: 1024px)').matches) {
      App.detail.positionDetailRoot();
    }
  });

  /**
   * Starts initialization immediately or after DOMContentLoaded.
   *
   * - Waits for the DOM when the document is still loading.
   * - Runs initialization directly when the DOM is already ready.
   * - Ensures startup logic works in both loading states.
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runInitOnce);
  } else {
    runInitOnce();
  }
}());