// contacts_general_actions.js
// ------------------------------------------------------------
// Page actions + bootstrap for the Contacts page.
// This file contains:
//  - public actions (open/save/delete/edit)
//  - input handlers (blur/input)
//  - ContactsApp.init() which is called once on page load
//
// It depends on:
//  - contacts_general_core.js
//  - contacts_general_data_dialog.js
//  - contacts_sidebar.js + contacts_detail.js
// ------------------------------------------------------------

var App = (window.ContactsApp = window.ContactsApp || {});

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

// -----------------------------
// Save helpers (keep functions tiny)
// -----------------------------
App.actions._clearModalFieldErrors = function _clearModalFieldErrors() {
  // Resets validation borders + message labels in one go.
  // Makes the next validation run feel "fresh".
  // We call this before validating the current input.
  ['c_name', 'c_email', 'c_phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) App.errors.clearFieldError(el);
  });
};

App.actions._validateAndShowErrors = function _validateAndShowErrors(form, all) {
  // Runs the existing validation rules and paints the UI if something is wrong.
  // Returns true when everything is okay.
  // Keeps saveContact short and readable.
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

  return !hasError;
};

App.actions._buildChangedMessages = function _buildChangedMessages(current, form) {
  // Compares old values to new ones and creates nice feedback messages.
  // Only produces messages for fields that actually changed.
  // This prevents annoying "updated" popups when nothing changed.
  if (!current) return [];
  const oldName = (current.name || '').trim();
  const oldEmail = (current.email || '').trim();
  const oldPhone = (current.phone || '').trim();

  const newName = (form.name || '').trim();
  const newEmail = (form.email || '').trim();
  const newPhone = (form.phone || '').trim();

  const msg = [];
  if (oldName !== newName) msg.push('Name was successfully updated');
  if (oldEmail !== newEmail) msg.push('E-mail was successfully updated');
  if (oldPhone !== newPhone) msg.push('Phone number was successfully updated');
  return msg;
};

App.actions._saveEditFlow = async function _saveEditFlow(all, form) {
  // Saves an existing contact (PATCH).
  // Updates the selected contact so details stay open.
  // Shows a multi-line feedback overlay if something changed.
  const current = all.find(u => u.id === App.state.editId) || null;
  const messages = App.actions._buildChangedMessages(current, form);

  App.state.selectedId = App.state.editId;
  await App.data.saveExistingContact(all, form);

  if (messages.length) {
    App.overlays.showMessages('userfeedback_contact_created', messages, 2000);
  }
};

App.actions._saveCreateFlow = async function _saveCreateFlow(form) {
  // Creates a new contact (POST) and selects it afterward.
  // Shows the usual "contact created" overlay.
  // Returns the new id so callers can use it.
  const newId = await App.data.createNewContact(form);
  if (newId) App.state.selectedId = newId;
  App.overlays.show('userfeedback_contact_created', 2000);
  return newId;
};

App.actions._finalizeSave = async function _finalizeSave() {
  // Refreshes the UI so sidebar + details match the DB.
  // Resets editId so we don't accidentally patch the wrong record.
  // Finally closes the modal.
  await App.actions.refreshContactsUI();
  App.state.editId = null;
  App.actions.closeDialog();
};

App.actions.saveContact = async function saveContact() {
  // Validates inputs and saves either a new contact or an edited one.
  // Shows user feedback overlays (success / updates / duplicate email).
  // Refreshes the sidebar + detail view afterward.
  const form = App.dialog.readForm();
  const all = await App.data.fetchContacts();

  App.actions._clearModalFieldErrors();
  if (!App.actions._validateAndShowErrors(form, all)) return;

  const layer = document.querySelector('.contacts_modal_backdrop');
  const isEdit = App.dialog.isEditMode(layer) && App.state.editId;

  if (isEdit) await App.actions._saveEditFlow(all, form);
  else await App.actions._saveCreateFlow(form);

  await App.actions._finalizeSave();
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
