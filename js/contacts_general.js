// contacts_general.js
// ------------------------------------------------------------
// "General" logic for the Contacts page.
// Everything that is NOT directly tied to:
//  - the sidebar (contacts_sidebar)
//  - the detail area (contact_detail_root / contact_detail_header)
// lives here.
//
// This file sets up a small global namespace (window.ContactsApp)
// and exposes the same window.* functions the old code used.
// ------------------------------------------------------------

checkAuth();

(function () {
  // Create a single namespace so the three files can share state cleanly.
  // We keep it simple (no bundler/modules needed).
  const App = (window.ContactsApp = window.ContactsApp || {});

  // Templates are provided by js/templates/contacts_templates.js
  // If a template is missing, we fall back to safe defaults.
  App.T = window.contactsTemplates || {};

  // Firebase endpoints.
  // DB: contacts (created during registration in the original project)
  // BOARD: tasks board (so we can remove deleted users from assignments)
  App.DB = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";
  App.BOARD = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";

  // Predefined color palette for random color assignment.
  App.COLOR = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF',
    '#8A2BE2', '#ff8800', '#0f8558', '#00afff', '#cd6839', '#f9c20cff'
  ];

  // Shared in-memory state.
  // order: contacts in the exact render order of the sidebar
  // editId: currently edited contact (modal)
  // selectedId: currently selected contact (detail view)
  App.state = App.state || {
    order: [],
    editId: null,
    selectedId: null,
  };

  // -----------------------------
  // Overlay helpers
  // -----------------------------
  App.overlays = App.overlays || {};

  App.overlays.show = function showContactsOverlay(id, ms = 2200) {
    // Shows a lightweight overlay (like on registration.html).
    // Uses d_none + inline display to avoid CSS specificity surprises.
    // Auto-hides after "ms" milliseconds when ms is truthy.
    const el = document.getElementById(id);
    if (!el) return;

    el.classList.remove('d_none');
    el.style.display = 'flex';

    if (ms) {
      window.clearTimeout(el._hideTimer);
      el._hideTimer = window.setTimeout(() => App.overlays.hide(id), ms);
    }
  };

  App.overlays.showMessages = function showContactsOverlayMessages(id, messages, baseMs = 2200) {
    // Replaces the overlay content with a list of <p> messages.
    // Increases the display time a bit for multiple messages.
    // Restores the original HTML after the overlay is hidden.
    const el = document.getElementById(id);
    if (!el) return;

    if (!el.dataset.defaultHtml) el.dataset.defaultHtml = el.innerHTML;

    const list = [].concat(messages || []).filter(Boolean);
    el.innerHTML = list.map(m => `<p>${String(m)}</p>`).join('');

    const ms = baseMs + Math.max(0, list.length - 1) * 1000;
    App.overlays.show(id, ms);
  };

  App.overlays.hide = function hideContactsOverlay(id) {
    // Hides an overlay and resets the HTML back to its original state.
    // Also removes inline display so CSS can handle it again.
    // Safe to call even when the overlay doesn't exist.
    const el = document.getElementById(id);
    if (!el) return;

    if (el.dataset.defaultHtml) {
      el.innerHTML = el.dataset.defaultHtml;
    }

    el.classList.add('d_none');
    el.style.display = 'none';
  };

  App.overlays.hideAll = function hideAllContactsOverlays() {
    // Convenience helper to clear all contacts overlays.
    // Useful on init and on input focus/typing.
    // Keeps the UI from feeling "stuck".
    ['userfeedback_email', 'userfeedback_contact_created', 'userfeedback_contact_deleted']
      .forEach(App.overlays.hide);
  };

  App.overlays.wireAutoHideOnInput = function wireContactsOverlayHiders() {
    // When a user starts typing/focusing, we hide overlays.
    // This matches the UX pattern used elsewhere in the project.
    // We wire only once per input via a small flag.
    ['c_name', 'c_email', 'c_phone'].forEach(id => {
      const el = document.getElementById(id);
      if (!el || el._overlayWired) return;

      const hideAll = () => App.overlays.hideAll();
      el.addEventListener('input', hideAll);
      el.addEventListener('focus', hideAll);
      el._overlayWired = true;
    });
  };

  // -----------------------------
  // Small utility helpers
  // -----------------------------
  App.utils = App.utils || {};

  App.utils.normalizeInitial = function normalizeInitial(name) {
    // Takes the first character of a name and normalizes it for grouping.
    // A-Z and ÄÖÜ are handled as normal letters.
    // Everything else goes into the "#" bucket.
    if (!name) return '#';
    const first = name.trim().charAt(0).toUpperCase();
    if ('ÄÖÜ'.includes(first)) return first;
    if (first >= 'A' && first <= 'Z') return first;
    return '#';
  };

  App.utils.titleCase = function titleCase(fullName) {
    // Formats a full name nicely ("mAx mUSTer" -> "Max Muster").
    // Splits on whitespace so multiple spaces/tabs won't matter.
    // Returns "" for falsy input so templates don't get "undefined".
    if (!fullName) return '';
    return String(fullName)
      .split(/\s+/)
      .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
      .join(' ');
  };

  App.utils.initials = function initials(fullName) {
    // Builds initials from the first two name parts ("Max Mustermann" -> "MM").
    // Used for the avatar letters in sidebar + detail.
    // If only one name exists, you still get a single initial.
    if (!fullName) return '';
    return String(fullName)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  };

  App.utils.pickColor = function pickColor() {
    // Picks a deterministic color based on current ORDER length.
    // Cycles through the palette, so it never runs out.
    // Keeps avatar colors stable-ish as the list grows.
    const idx = App.state.order.length % App.COLOR.length;
    return App.COLOR[idx];
  };

  // -----------------------------
  // Validation helpers
  // -----------------------------
  App.validation = App.validation || {};

  App.validation.isValidEmail = function isValidEmail(email) {
    // Simple email check: enough for UI validation without being overly strict.
    // Trims whitespace so " user@mail.com " isn't rejected.
    // Returns boolean only (no side effects).
    if (!email) return false;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email).trim());
  };

  App.validation.isValidName = function isValidName(name) {
    // Requires a first and last name (at least one separator).
    // Allows letters + spaces + apostrophes + hyphens.
    // Uses Unicode property \p{L} so umlauts and non-ASCII letters work.
    if (!name) return false;
    return /^(?=.{2,50}$)[\p{L}]+(?:[ '\-][\p{L}]+)+$/u.test(String(name).trim());
  };

  App.validation.isValidPhoneNumber = function isValidPhoneNumber(phone) {
    // Phone is optional. If present, we accept 10–15 digits.
    // Allows an optional leading "+" for international numbers.
    // This keeps it strict enough to prevent accidental letters.
    if (!phone) return true;
    return /^\+?[0-9]{10,15}$/.test(String(phone).trim());
  };

  App.validation.findEmailConflict = function findEmailConflict(all, email, idToIgnore) {
    // Checks if the email already exists (case-insensitive).
    // Ignores a given id so editing your own email isn't blocked.
    // Returns the conflicting contact object or undefined.
    const lower = String(email || '').toLowerCase();
    return (all || []).find(u => (u.email || '').toLowerCase() === lower && u.id !== idToIgnore);
  };

  App.validation.validateContactName = function validateContactName(name) {
    // "Required" field: name.
    // Returns a small object so the caller can decide how to show feedback.
    // msg may be null when we just want a red border (no text).
    if (!name?.trim()) return { error: true, msg: null };
    if (!App.validation.isValidName(name)) return { error: true, msg: 'Bitte Vor- und Nachname eingeben (nur Buchstaben).' };
    return { error: false };
  };

  App.validation.validateContactEmail = function validateContactEmail(email, all = [], editId = null) {
    // "Required" field: email.
    // Validates syntax + uniqueness (against Firebase list).
    // editId is used to allow keeping your own email while editing.
    if (!email?.trim()) return { error: true, msg: null };
    if (!App.validation.isValidEmail(email)) return { error: true, msg: 'Keine gültige E-Mail-Adresse.' };
    if (App.validation.findEmailConflict(all, email, editId)) return { error: true, msg: 'Diese E-Mail existiert bereits.' };
    return { error: false };
  };

  App.validation.validateContactPhone = function validateContactPhone(phone) {
    // Optional field: phone.
    // Only checks format when something was entered.
    // Returns {error:false} for empty phone input.
    if (!phone?.trim()) return { error: false };
    if (!App.validation.isValidPhoneNumber(phone)) return { error: true, msg: 'Nur Ziffern, 10–15 Stellen, optionales + am Anfang.' };
    return { error: false };
  };

  // -----------------------------
  // Error UI (input borders + inline error messages)
  // -----------------------------
  App.errors = App.errors || {};

  App.errors.showFieldError = function showFieldError(inputEl, msg) {
    // Adds a red border to the input.
    // If an error container exists (error-<id>), we show the message.
    // If msg is null, we keep it minimal (only the red border).
    if (!inputEl) return;
    inputEl.classList.add('input_error');
    const errorEl = document.getElementById(`error-${inputEl.id}`);
    if (!errorEl) return;
    if (msg) {
      errorEl.textContent = msg;
      errorEl.classList.remove('d_none');
    }
  };

  App.errors.clearFieldError = function clearFieldError(inputEl) {
    // Removes the red border.
    // Hides and clears the inline error message (if present).
    // Safe to call even if the field isn't wired yet.
    if (!inputEl) return;
    inputEl.classList.remove('input_error');
    const errorEl = document.getElementById(`error-${inputEl.id}`);
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.classList.add('d_none');
  };

  App.errors.resetErrorBorders = function resetErrorBorders() {
    // Small helper to remove error borders from all modal inputs.
    // This is called when opening/closing the dialog.
    // Keeps the modal from "remembering" old validation states.
    ['c_name', 'c_email', 'c_phone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('input-error');
    });
  };

  // -----------------------------
  // Data access (Firebase)
  // -----------------------------
  App.data = App.data || {};

  App.data.mapContact = function mapContact(key, u) {
    // Converts raw Firebase JSON into the contact object the UI expects.
    // Filters out broken entries (missing object or missing name).
    // Also normalizes the color field (some older entries use "colors").
    if (!u || !u.name) return null;
    return {
      id: key,
      name: String(u.name),
      email: u.email || "",
      phone: u.phone || "",
      color: u.color || u.colors || null
    };
  };

  App.data.fetchContacts = async function fetchContacts() {
    // Loads all contacts from Firebase and turns them into a clean array.
    // Returns [] if the DB is empty, so rendering never crashes.
    // Keeps the function "pure" (it doesn't mutate state.order).
    const response = await fetch(App.DB + ".json");
    const data = await response.json();
    if (!data) return [];
    return Object.keys(data)
      .map(k => App.data.mapContact(k, data[k]))
      .filter(Boolean);
  };

  App.data.saveExistingContact = async function saveExistingContact(all, form) {
    // Updates an existing Firebase record using PATCH.
    // Keeps the previous color when possible (so avatars don't randomly change).
    // Relies on App.state.editId being set.
    const current = (all || []).find(u => u.id === App.state.editId);
    const color = current?.color || App.utils.pickColor();

    const body = { name: form.name, email: form.email, phone: form.phone || '', colors: color };
    await fetch(App.DB + '/' + App.state.editId + '.json', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };

  App.data.createNewContact = async function createNewContact(form) {
    // Creates a new contact record using POST to the collection endpoint.
    // Assigns a color right away so the UI can render the avatar nicely.
    // Returns the new Firebase id (or null).
    const body = {
      name: form.name,
      email: form.email,
      phone: form.phone || '',
      colors: App.utils.pickColor()
    };

    const r = await fetch(App.DB + '.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await r.json().catch(() => null);
    return data?.name || null;
  };

  App.data.removeUserFromTasks = async function removeUserFromTasks(id) {
    // Scans the task board and removes the user id from assigned arrays.
    // Prevents "ghost assignees" after a contact is deleted.
    // Uses PATCH with a sparse update payload for efficiency.
    if (!id) return;
    const r = await fetch(App.BOARD + ".json");
    const data = await r.json();
    if (!data) return;

    const body = {};
    Object.keys(data).forEach(k => {
      const t = data[k];
      const a = t && Array.isArray(t.assigned) ? t.assigned : null;
      if (a && a.includes(id)) body[k + "/assigned"] = a.filter(x => x !== id);
    });

    if (!Object.keys(body).length) return;
    await fetch(App.BOARD + ".json", {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };

  // -----------------------------
  // Dialog (Add/Edit)
  // -----------------------------
  App.dialog = App.dialog || {};

  App.dialog.ensureDialog = function ensureDialog() {
    // Ensures the modal backdrop + modal exist in the DOM.
    // Clicking the backdrop closes the dialog; clicking inside won't.
    // We keep it in the DOM so re-opening is instant.
    let backdrop = document.querySelector('.contacts_modal_backdrop');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.className = 'contacts_modal_backdrop';
    backdrop.setAttribute('onclick', 'closeDialog()');

    const modal = document.createElement('div');
    modal.className = 'contacts_modal';
    modal.setAttribute('onclick', 'event.stopPropagation()');
    modal.innerHTML = App.T.dialog ? App.T.dialog() : "";

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    return backdrop;
  };

  App.dialog.resetInputs = function resetDialogInputs() {
    // Clears the input fields when opening the dialog.
    // Prevents old values from sticking around on "Add".
    // Also resets any previous validation styling.
    ['c_name', 'c_email', 'c_phone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    App.errors.resetErrorBorders();
  };

  App.dialog.readForm = function readContactForm() {
    // Reads values from the modal inputs and trims whitespace.
    // Returns a simple object so validation/saving stays clean.
    // This keeps DOM lookups in one place.
    return {
      name: document.getElementById('c_name')?.value.trim(),
      email: document.getElementById('c_email')?.value.trim(),
      phone: document.getElementById('c_phone')?.value.trim()
    };
  };

  App.dialog.isEditMode = function isEditMode(layer) {
    // Detects edit mode by checking a class on the dialog layer.
    // More reliable than reading button text (because buttons can be hidden).
    // Returns a boolean.
    return layer?.classList.contains('mode-edit') === true;
  };

  App.dialog.configureCreateMode = function configureCreateMode(layer) {
    // Switches the dialog UI into "create" mode.
    // Updates title/subtitle + shows the correct action buttons.
    // Adds CSS flags so the modal can style differently.
    if (layer) {
      layer.classList.add('mode-create');
      layer.classList.remove('mode-edit');
    }

    const title = document.getElementById('contacts_modal_title');
    const sub = document.getElementById('contacts_modal_subtitle');

    if (title) {
      title.textContent = 'Add contact';
      if (!title.parentElement.classList.contains('contacts_modal_title_container')) {
        const container = document.createElement('div');
        container.className = 'contacts_modal_title_container';
        title.parentElement.insertBefore(container, title);
        container.appendChild(title);
      }
    }

    if (sub) {
      sub.textContent = 'Tasks are better with a team!';
      sub.className = 'contacts_modal_subtitle add-subtitle';
    }

    const avatarSlot = layer.querySelector('#contacts_modal_avatar_slot');
    if (avatarSlot && App.T.createDialogAvatar) avatarSlot.innerHTML = App.T.createDialogAvatar();

    const createBtn = layer.querySelector('#contacts_create_btn');
    const saveBtn = layer.querySelector('#contacts_save_btn');

    if (createBtn) {
      createBtn.style.display = 'block';
      createBtn.innerHTML = 'Create contact <span class="contacts-checkmark"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.288 8.775L13.763 0.3C13.963 0.1 14.2005 0 14.4755 0C14.7505 0 14.988 0.1 15.188 0.3C15.388 0.5 15.488 0.7375 15.488 1.0125C15.488 1.2875 15.388 1.525 15.188 1.725L5.988 10.925C5.788 11.125 5.55467 11.225 5.288 11.225C5.02133 11.225 4.788 11.125 4.588 10.925L0.288 6.625C0.088 6.425 -0.00783333 6.1875 0.0005 5.9125C0.00883333 5.6375 0.113 5.4 0.313 5.2C0.513 5 0.7505 4.9 1.0255 4.9C1.3005 4.9 1.538 5 1.738 5.2L5.288 8.775Z" fill="white"/></svg></span>';
    }
    if (saveBtn) saveBtn.style.display = 'none';

    const del = layer.querySelector('#contacts_delete_btn');
    if (del) del.innerHTML = 'Cancel <span class="contacts-x"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.243 6.243L11.486 11.486M1 11.486L6.243 6.243L1 11.486ZM11.486 1L6.242 6.243L11.486 1ZM6.242 6.243L1 1L6.242 6.243Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  };

  App.dialog.configureEditMode = function configureEditMode(layer) {
    // Switches the dialog UI into "edit" mode.
    // Updates title/subtitle + swaps Create vs Save buttons.
    // Adds CSS flags so the modal can style differently.
    if (layer) {
      layer.classList.add('mode-edit');
      layer.classList.remove('mode-create');
    }

    const title = document.getElementById('contacts_modal_title');
    const sub = document.getElementById('contacts_modal_subtitle');

    if (title) {
      title.textContent = 'Edit contact';
      if (!title.parentElement.classList.contains('contacts_modal_title_container')) {
        const container = document.createElement('div');
        container.className = 'contacts_modal_title_container';
        title.parentElement.insertBefore(container, title);
        container.appendChild(title);
      }
    }

    if (sub) {
      sub.textContent = '';
      sub.className = 'contacts_modal_subtitle edit-subtitle';
    }

    const createBtn = layer.querySelector('#contacts_create_btn');
    const saveBtn = layer.querySelector('#contacts_save_btn');

    if (createBtn) createBtn.style.display = 'none';
    if (saveBtn) {
      saveBtn.style.display = 'block';
      saveBtn.innerHTML = 'Save <span class="contacts-checkmark"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.288 8.775L13.763 0.3C13.963 0.1 14.2005 0 14.4755 0C14.7505 0 14.988 0.1 15.188 0.3C15.388 0.5 15.488 0.7375 15.488 1.0125C15.488 1.2875 15.388 1.525 15.188 1.725L5.988 10.925C5.788 11.125 5.55467 11.225 5.288 11.225C5.02133 11.225 4.788 11.125 4.588 10.925L0.288 6.625C0.088 6.425 -0.00783333 6.1875 0.0005 5.9125C0.00883333 5.6375 0.113 5.4 0.313 5.2C0.513 5 0.7505 4.9 1.0255 4.9C1.3005 4.9 1.538 5 1.738 5.2L5.288 8.775Z" fill="white"/></svg></span>';
    }

    const del = layer.querySelector('#contacts_delete_btn');
    if (del) del.innerHTML = 'Delete <span class="contacts-x"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.243 6.243L11.486 11.486M1 11.486L6.243 6.243L1 11.486ZM11.486 1L6.242 6.243L11.486 1ZM6.242 6.243L1 1L6.242 6.243Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  };

  App.dialog.updateEditAvatar = function updateEditAvatar(layer, user) {
    // Updates the avatar preview inside the edit modal.
    // Uses template if present, otherwise just prints initials.
    // Keeps the background color consistent with the contact.
    const slot = layer.querySelector('#contacts_modal_avatar_slot');
    if (!slot) return;
    const bg = user.color || '#666';
    const init = App.utils.initials(user.name || '');
    if (App.T.editDialogAvatar) slot.innerHTML = App.T.editDialogAvatar(bg, init);
    else slot.textContent = init;
  };

  App.dialog.fillEditInputs = function fillEditInputs(user) {
    // Fills the modal inputs with the selected user's data.
    // This is used by openEdit so the user can modify existing values.
    // Safe if some inputs are missing.
    const N = document.getElementById('c_name');
    const E = document.getElementById('c_email');
    const P = document.getElementById('c_phone');
    if (N) N.value = user.name || '';
    if (E) E.value = user.email || '';
    if (P) P.value = user.phone || '';
  };

  // -----------------------------
  // Public page actions (wired to window.*)
  // -----------------------------
  App.actions = App.actions || {};

  App.actions.openDialog = function openDialog() {
    // Opens the modal in create mode and resets editId.
    // Clears inputs so you're always starting fresh.
    // Also hides any old overlay messages.
    App.state.editId = null;

    const layer = App.dialog.ensureDialog();
    if (!layer) return;

    layer.classList.add('is-open');
    App.dialog.resetInputs();
    App.errors.resetErrorBorders();
    App.overlays.hide('userfeedback_email');
    App.overlays.wireAutoHideOnInput();
    App.dialog.configureCreateMode(layer);
  };

  App.actions.closeDialog = function closeDialog() {
    // Hides the modal by removing the "is-open" class.
    // Doesn't destroy elements, so opening again is instant.
    // Also clears validation state so the next open looks clean.
    const layer = document.querySelector('.contacts_modal_backdrop');
    if (layer) layer.classList.remove('is-open');
    App.errors.resetErrorBorders();
    App.overlays.hideAll();
    ['c_name', 'c_email', 'c_phone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) App.errors.clearFieldError(el);
    });
  };

  App.actions.openEdit = function openEdit(idx) {
    // Opens the modal in edit mode for the selected sidebar user.
    // Stores editId so save/delete knows which Firebase record to touch.
    // Also refreshes the avatar preview for that user.
    const user = App.state.order[idx];
    if (!user) return;
    App.state.editId = user.id || null;

    const layer = App.dialog.ensureDialog();
    if (!layer) return;

    layer.classList.add('is-open');
    App.dialog.fillEditInputs(user);
    App.overlays.hide('userfeedback_email');
    App.overlays.wireAutoHideOnInput();
    App.dialog.configureEditMode(layer);
    App.dialog.updateEditAvatar(layer, user);
  };

  App.actions.refreshContactsUI = async function refreshContactsUI() {
    // Pulls latest contacts from Firebase and re-renders the sidebar.
    // Re-selects the selected contact (if it still exists).
    // Keeps sidebar + detail view in sync after create/edit/delete.
    const sidebar = App.sidebar?.ensureSidebar?.();
    if (!sidebar) return;
    const list = sidebar.querySelector('.contacts_sidebar_list');
    const users = await App.data.fetchContacts();
    App.sidebar.renderContacts(list, users);

    if (App.state.selectedId) {
      const idx = App.state.order.findIndex(u => u.id === App.state.selectedId);
      if (idx > -1) window.selectUserAt(idx);
      else window.clearSelection();
    }
  };

  App.actions.saveContact = async function saveContact() {
    // Validates inputs and saves either a new contact or an edited one.
    // Shows user feedback overlays (success / updates / duplicate email).
    // Refreshes the sidebar + detail view afterward.
    const form = App.dialog.readForm();
    const all = await App.data.fetchContacts();

    // Clear previous errors first (feels less "sticky").
    ['c_name', 'c_email', 'c_phone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) App.errors.clearFieldError(el);
    });

    let hasError = false;

    const nameCheck = App.validation.validateContactName(form.name);
    if (nameCheck.error) {
      App.errors.showFieldError(document.getElementById('c_name'), nameCheck.msg);
      hasError = true;
    }

    const emailCheck = App.validation.validateContactEmail(form.email, all, App.state.editId);
    if (emailCheck.error) {
      App.errors.showFieldError(document.getElementById('c_email'), emailCheck.msg);
      hasError = true;
    }

    const phoneCheck = App.validation.validateContactPhone(form.phone);
    if (phoneCheck.error) {
      App.errors.showFieldError(document.getElementById('c_phone'), phoneCheck.msg);
      hasError = true;
    }

    if (hasError) return;

    const layer = document.querySelector('.contacts_modal_backdrop');

    // Edit flow
    if (App.dialog.isEditMode(layer) && App.state.editId) {
      const current = all.find(u => u.id === App.state.editId) || null;

      // Build a small list of messages so the user knows what changed.
      const changedMessages = [];
      if (current) {
        const oldName = (current.name || '').trim();
        const oldEmail = (current.email || '').trim();
        const oldPhone = (current.phone || '').trim();

        const newName = (form.name || '').trim();
        const newEmail = (form.email || '').trim();
        const newPhone = (form.phone || '').trim();

        if (oldName !== newName) changedMessages.push('Name was successfully updated');
        if (oldEmail !== newEmail) changedMessages.push('E-mail was successfully updated');
        if (oldPhone !== newPhone) changedMessages.push('Phone number was successfully updated');
      }

      App.state.selectedId = App.state.editId;
      await App.data.saveExistingContact(all, form);

      if (changedMessages.length) {
        App.overlays.showMessages('userfeedback_contact_created', changedMessages, 2000);
      }
    }
    // Create flow
    else {
      const newId = await App.data.createNewContact(form);
      if (newId) App.state.selectedId = newId;
      App.overlays.show('userfeedback_contact_created', 2000);
    }

    await App.actions.refreshContactsUI();
    App.state.editId = null;
    App.actions.closeDialog();
  };

  App.actions.deleteContact = async function deleteContact() {
    // Deletes the currently edited contact from Firebase.
    // Also removes that user from task assignments on the board.
    // After deleting we refresh the UI and show a small success overlay.
    if (!App.state.editId) {
      App.actions.closeDialog();
      return;
    }

    await App.data.removeUserFromTasks(App.state.editId);
    await fetch(App.DB + '/' + App.state.editId + '.json', { method: 'DELETE' });

    if (App.state.selectedId === App.state.editId) App.state.selectedId = null;

    await App.actions.refreshContactsUI();
    App.state.editId = null;
    App.actions.closeDialog();
    App.overlays.show('userfeedback_contact_deleted', 2000);
  };

  // -----------------------------
  // Input event handlers (blur + input)
  // -----------------------------
  App.actions.handleNameBlur = function handleNameBlur(event) {
    // Validates name on blur and shows an inline message if needed.
    // Keeps the dialog responsive without blocking typing.
    // Works for both create and edit dialogs.
    const input = event.target;
    const result = App.validation.validateContactName(input.value);
    result.error ? App.errors.showFieldError(input, result.msg) : App.errors.clearFieldError(input);
  };

  App.actions.handleEmailBlur = function handleEmailBlur(event) {
    // Validates email on blur.
    // Needs an async contacts fetch to check for duplicates.
    // Uses the current editId so editing your own email works.
    App.data.fetchContacts().then(all => {
      const result = App.validation.validateContactEmail(event.target.value, all, App.state.editId);
      result.error ? App.errors.showFieldError(event.target, result.msg) : App.errors.clearFieldError(event.target);
    });
  };

  App.actions.handlePhoneBlur = function handlePhoneBlur(event) {
    // Validates phone on blur.
    // Phone is optional, so we only show an error when something invalid was entered.
    // Keeps the message localized and easy to understand.
    const input = event.target;
    const result = App.validation.validateContactPhone(input.value);
    result.error ? App.errors.showFieldError(input, result.msg) : App.errors.clearFieldError(input);
  };

  App.actions.resetFieldOnInput = function resetFieldOnInput(inputEl) {
    // Clears the error state as soon as the user starts fixing the field.
    // Makes the form feel less punishing (red border disappears on typing).
    // Keeps the error message area clean.
    App.errors.clearFieldError(inputEl);
  };

  // -----------------------------
  // App bootstrap (called by contacts_detail.js after scripts loaded)
  // -----------------------------
  App.init = async function initContactsPage() {
    // Bootstraps the contacts UI.
    // 1) sidebar skeleton + contacts list
    // 2) detail header + root (empty at first)
    // 3) positioning (desktop only)
    App.overlays.hideAll();

    const sidebar = App.sidebar?.ensureSidebar?.();
    if (!sidebar) return;

    const list = sidebar.querySelector('.contacts_sidebar_list');
    App.sidebar.renderContacts(list, await App.data.fetchContacts());

    // Make sure detail elements exist; actual profile is rendered on selection.
    App.detail?.ensureDetailHeader?.();
    App.detail?.ensureDetailRoot?.();

    // Desktop positioning stays where it was before.
    if (!window.matchMedia("(max-width: 1024px)").matches) {
      App.detail?.positionDetailRoot?.();
    }
  };

  // -----------------------------
  // Keep backwards-compatible window.* API
  // (contacts_mediaquery.js and templates rely on these names)
  // -----------------------------
  window.openDialog = (...a) => App.actions.openDialog(...a);
  window.closeDialog = (...a) => App.actions.closeDialog(...a);
  window.saveContact = (...a) => App.actions.saveContact(...a);
  window.deleteContact = (...a) => App.actions.deleteContact(...a);
  window.openEdit = (...a) => App.actions.openEdit(...a);
  window.handleNameBlur = (...a) => App.actions.handleNameBlur(...a);
  window.handleEmailBlur = (...a) => App.actions.handleEmailBlur(...a);
  window.handlePhoneBlur = (...a) => App.actions.handlePhoneBlur(...a);
  window.resetFieldOnInput = (...a) => App.actions.resetFieldOnInput(...a);
}());
