// contacts_general_data_dialog.js
// ------------------------------------------------------------
// Data + Dialog logic for the Contacts page.
// This file contains:
//  - Firebase access (fetch/create/update/delete helpers)
//  - modal dialog creation + mode switching (create/edit)
//
// UI actions (open/save/delete) are defined in:
//  - contacts_general_actions.js
// ------------------------------------------------------------

var App = (window.ContactsApp = window.ContactsApp || {});

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
const T = App.T || {};

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
  modal.innerHTML = T.dialog ? T.dialog() : "";

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

// -----------------------------
// Dialog helpers (small building blocks)
// -----------------------------
App.dialog._setModeClasses = function _setModeClasses(layer, mode) {
  // Adds/removes mode classes so CSS can react.
  // We keep this in one place to avoid class-name typos.
  // mode: 'create' | 'edit'
  if (!layer) return;
  const isCreate = mode === 'create';
  layer.classList.toggle('mode-create', isCreate);
  layer.classList.toggle('mode-edit', !isCreate);
};

App.dialog._ensureTitleContainer = function _ensureTitleContainer(titleEl) {
  // The design expects a wrapper div around the title.
  // Some templates already have it, others don't.
  // This makes the DOM structure consistent.
  if (!titleEl || !titleEl.parentElement) return;
  if (titleEl.parentElement.classList.contains('contacts_modal_title_container')) return;
  const container = document.createElement('div');
  container.className = 'contacts_modal_title_container';
  titleEl.parentElement.insertBefore(container, titleEl);
  container.appendChild(titleEl);
};

App.dialog._setTitle = function _setTitle(text) {
  // Updates the dialog title text.
  // Also ensures the title wrapper exists.
  // This prevents layout shifts between modes.
  const title = document.getElementById('contacts_modal_title');
  if (!title) return;
  title.textContent = text;
  App.dialog._ensureTitleContainer(title);
};

App.dialog._setSubtitle = function _setSubtitle(text, className) {
  // Updates the subtitle line under the title.
  // We also swap the class so spacing/visibility matches the mode.
  // Empty text is allowed (edit mode hides it).
  const sub = document.getElementById('contacts_modal_subtitle');
  if (!sub) return;
  sub.textContent = text;
  sub.className = 'contacts_modal_subtitle ' + (className || '');
};

App.dialog._setCreateAvatar = function _setCreateAvatar(layer) {
  // Drops the default avatar placeholder into the slot.
  // Uses the template helper if available.
  // Safe to call even if the slot doesn't exist.
  const slot = layer?.querySelector('#contacts_modal_avatar_slot');
  if (!slot) return;
  if (T.createDialogAvatar) slot.innerHTML = T.createDialogAvatar();
};

App.dialog._toggleActionButtons = function _toggleActionButtons(layer, createHtml, saveHtml) {
  // Shows/hides the correct action button for the current mode.
  // Keeps the SVG markup in one place.
  // This makes configureCreate/Edit much shorter.
  const createBtn = layer?.querySelector('#contacts_create_btn');
  const saveBtn = layer?.querySelector('#contacts_save_btn');

  if (createBtn) {
    createBtn.style.display = createHtml ? 'block' : 'none';
    if (createHtml) createBtn.innerHTML = createHtml;
  }
  if (saveBtn) {
    saveBtn.style.display = saveHtml ? 'block' : 'none';
    if (saveHtml) saveBtn.innerHTML = saveHtml;
  }
};

App.dialog._setDeleteButtonHtml = function _setDeleteButtonHtml(layer, html) {
  // The bottom-left button is used for Cancel (create) or Delete (edit).
  // We simply swap the label + icon HTML.
  // Keeps both modes visually consistent.
  const del = layer?.querySelector('#contacts_delete_btn');
  if (del) del.innerHTML = html;
};

App.dialog.configureCreateMode = function configureCreateMode(layer) {
  // Switches the dialog UI into "create" mode.
  // Updates title/subtitle + shows the correct action buttons.
  // Adds CSS flags so the modal can style differently.
  App.dialog._setModeClasses(layer, 'create');
  App.dialog._setTitle('Add contact');
  App.dialog._setSubtitle('Tasks are better with a team!', 'add-subtitle');
  App.dialog._setCreateAvatar(layer);

  const createHtml = 'Create contact <span class="contacts-checkmark"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.288 8.775L13.763 0.3C13.963 0.1 14.2005 0 14.4755 0C14.7505 0 14.988 0.1 15.188 0.3C15.388 0.5 15.488 0.7375 15.488 1.0125C15.488 1.2875 15.388 1.525 15.188 1.725L5.988 10.925C5.788 11.125 5.55467 11.225 5.288 11.225C5.02133 11.225 4.788 11.125 4.588 10.925L0.288 6.625C0.088 6.425 -0.00783333 6.1875 0.0005 5.9125C0.00883333 5.6375 0.113 5.4 0.313 5.2C0.513 5 0.7505 4.9 1.0255 4.9C1.3005 4.9 1.538 5 1.738 5.2L5.288 8.775Z" fill="white"/></svg></span>';
  App.dialog._toggleActionButtons(layer, createHtml, null);

  const cancelHtml = 'Cancel <span class="contacts-x"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.243 6.243L11.486 11.486M1 11.486L6.243 6.243L1 11.486ZM11.486 1L6.242 6.243L11.486 1ZM6.242 6.243L1 1L6.242 6.243Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  App.dialog._setDeleteButtonHtml(layer, cancelHtml);
};

App.dialog.configureEditMode = function configureEditMode(layer) {
  // Switches the dialog UI into "edit" mode.
  // Updates title/subtitle + swaps Create vs Save buttons.
  // Adds CSS flags so the modal can style differently.
  App.dialog._setModeClasses(layer, 'edit');
  App.dialog._setTitle('Edit contact');
  App.dialog._setSubtitle('', 'edit-subtitle');

  const saveHtml = 'Save <span class="contacts-checkmark"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.288 8.775L13.763 0.3C13.963 0.1 14.2005 0 14.4755 0C14.7505 0 14.988 0.1 15.188 0.3C15.388 0.5 15.488 0.7375 15.488 1.0125C15.488 1.2875 15.388 1.525 15.188 1.725L5.988 10.925C5.788 11.125 5.55467 11.225 5.288 11.225C5.02133 11.225 4.788 11.125 4.588 10.925L0.288 6.625C0.088 6.425 -0.00783333 6.1875 0.0005 5.9125C0.00883333 5.6375 0.113 5.4 0.313 5.2C0.513 5 0.7505 4.9 1.0255 4.9C1.3005 4.9 1.538 5 1.738 5.2L5.288 8.775Z" fill="white"/></svg></span>';
  App.dialog._toggleActionButtons(layer, null, saveHtml);

  const deleteHtml = 'Delete <span class="contacts-x"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.243 6.243L11.486 11.486M1 11.486L6.243 6.243L1 11.486ZM11.486 1L6.242 6.243L11.486 1ZM6.242 6.243L1 1L6.242 6.243Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  App.dialog._setDeleteButtonHtml(layer, deleteHtml);
};

App.dialog.updateEditAvatar = function updateEditAvatar(layer, user) {
  // Updates the avatar preview inside the edit modal.
  // Uses template if present, otherwise just prints initials.
  // Keeps the background color consistent with the contact.
  const slot = layer.querySelector('#contacts_modal_avatar_slot');
  if (!slot) return;
  const bg = user.color || '#666';
  const init = App.utils.initials(user.name || '');
  if (T.editDialogAvatar) slot.innerHTML = T.editDialogAvatar(bg, init);
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
