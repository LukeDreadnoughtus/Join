/**
 * contacts_general_actions.js
 *
 * Page actions and bootstrap logic for the Contacts page.
 *
 * Depends on:
 * - contacts_general_core.js
 * - contacts_general_data_dialog.js
 * - contacts_sidebar.js
 * - contacts_detail.js
 */

var App = (window.ContactsApp = window.ContactsApp || {});
App.actions = App.actions || {};

/**
 * Opens the contact dialog in create mode.
 *
 * - Resets the current edit state so a new contact can be created.
 * - Clears all dialog inputs and validation states.
 * - Hides old overlays and prepares the dialog for fresh input.
 */
App.actions.openDialog = function openDialog() {
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

/**
 * Closes the contact dialog and resets visible error states.
 *
 * - Removes the open class from the modal backdrop.
 * - Clears validation borders and inline field errors.
 * - Hides all active overlays for a clean next open.
 */
App.actions.closeDialog = function closeDialog() {
  const layer = document.querySelector('.contacts_modal_backdrop');
  if (layer) layer.classList.remove('is-open');

  App.errors.resetErrorBorders();
  App.overlays.hideAll();

  ['c_name', 'c_email', 'c_phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) App.errors.clearFieldError(el);
  });
};

/**
 * Opens the contact dialog in edit mode for a selected user.
 *
 * - Loads the selected contact from the current sidebar order.
 * - Stores the contact id so save and delete actions know the target record.
 * - Fills the dialog and updates the avatar preview with existing data.
 */
App.actions.openEdit = function openEdit(idx) {
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

/**
 * Refreshes sidebar and detail UI with the latest contact data.
 *
 * - Fetches the newest contact list from the data source.
 * - Re-renders the sidebar contact list.
 * - Restores the selected contact when it still exists.
 */
App.actions.refreshContactsUI = async function refreshContactsUI() {
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

/**
 * Clears modal field-level validation errors.
 *
 * - Removes error states from all contact input fields.
 * - Prepares the form for a new validation pass.
 * - Keeps validation handling centralized and reusable.
 */
App.actions._clearModalFieldErrors = function _clearModalFieldErrors() {
  ['c_name', 'c_email', 'c_phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) App.errors.clearFieldError(el);
  });
};

/**
 * Validates form input and displays field errors when needed.
 *
 * - Runs name, email, and phone validation rules.
 * - Shows inline errors for any invalid field.
 * - Returns true only when the complete form is valid.
 */
App.actions._validateAndShowErrors = function _validateAndShowErrors(form, all) {
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

/**
 * Builds feedback messages for fields that were changed during editing.
 *
 * - Compares old and new contact values field by field.
 * - Creates success messages only for values that actually changed.
 * - Prevents showing unnecessary update messages when nothing changed.
 */
App.actions._buildChangedMessages = function _buildChangedMessages(current, form) {
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

/**
 * Saves changes for an existing contact.
 *
 * - Resolves the current contact from the loaded collection.
 * - Persists the updated data through the edit save flow.
 * - Shows multi-line feedback when one or more fields changed.
 */
App.actions._saveEditFlow = async function _saveEditFlow(all, form) {
  const current = all.find(u => u.id === App.state.editId) || null;
  const messages = App.actions._buildChangedMessages(current, form);

  App.state.selectedId = App.state.editId;
  await App.data.saveExistingContact(all, form);

  if (messages.length) {
    App.overlays.showMessages('userfeedback_contact_created', messages, 2000);
  }
};

/**
 * Creates a new contact and selects it afterward.
 *
 * - Sends the new contact through the create flow.
 * - Stores the returned id as the current selection.
 * - Shows the standard contact-created overlay message.
 */
App.actions._saveCreateFlow = async function _saveCreateFlow(form) {
  const newId = await App.data.createNewContact(form);

  if (newId) App.state.selectedId = newId;
  App.overlays.show('userfeedback_contact_created', 2000);

  return newId;
};

/**
 * Finalizes the save workflow after create or edit.
 *
 * - Refreshes the sidebar and detail UI to reflect persisted data.
 * - Resets the current edit id to avoid accidental reuse.
 * - Closes the dialog when all follow-up steps are done.
 */
App.actions._finalizeSave = async function _finalizeSave() {
  await App.actions.refreshContactsUI();

  if (typeof window.rerenderDetailRootAfterDelete === 'function') {
    window.rerenderDetailRootAfterDelete();
  }

  App.state.editId = null;
  App.actions.closeDialog();
};

/**
 * Saves the current contact form in create or edit mode.
 *
 * - Reads form data and validates all relevant fields.
 * - Decides automatically between create and update behavior.
 * - Refreshes the UI and closes the dialog after a successful save.
 */
App.actions.saveContact = async function saveContact() {
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

/**
 * Deletes the currently edited contact.
 *
 * - Removes the contact from task assignments before deletion.
 * - Deletes the contact record from the database.
 * - Refreshes the UI, clears selection if needed, and shows success feedback.
 */
App.actions.deleteContact = async function deleteContact() {
  if (!App.state.editId) {
    App.actions.closeDialog();
    return;
  }

  await App.data.removeUserFromTasks(App.state.editId);
  await fetch(App.DB + '/' + App.state.editId + '.json', { method: 'DELETE' });

  if (App.state.selectedId === App.state.editId) {
    App.state.selectedId = null;
  }

  await App.actions.refreshContactsUI();

  if (typeof window.rerenderDetailRootAfterDelete === 'function') {
    window.rerenderDetailRootAfterDelete();
  }

  App.state.editId = null;
  App.actions.closeDialog();
  App.overlays.show('userfeedback_contact_deleted', 2000);
};

/**
 * Validates the name field when it loses focus.
 *
 * - Runs contact name validation on blur.
 * - Shows an inline error when the input is invalid.
 * - Clears any existing error when the value is valid.
 */
App.actions.handleNameBlur = function handleNameBlur(event) {
  const input = event.target;
  const result = App.validation.validateContactName(input.value);

  result.error
    ? App.errors.showFieldError(input, result.msg)
    : App.errors.clearFieldError(input);
};

/**
 * Validates the email field when it loses focus.
 *
 * - Loads all contacts to check for duplicate email addresses.
 * - Respects the current edit id so unchanged own emails stay valid.
 * - Updates the field error state asynchronously after validation.
 */
App.actions.handleEmailBlur = function handleEmailBlur(event) {
  App.data.fetchContacts().then(all => {
    const result = App.validation.validateContactEmail(
      event.target.value,
      all,
      App.state.editId
    );

    result.error
      ? App.errors.showFieldError(event.target, result.msg)
      : App.errors.clearFieldError(event.target);
  });
};

/**
 * Validates the phone field when it loses focus.
 *
 * - Checks whether the entered phone value matches validation rules.
 * - Only shows an error when an invalid non-acceptable value is present.
 * - Clears previous field errors when the value is valid.
 */
App.actions.handlePhoneBlur = function handlePhoneBlur(event) {
  const input = event.target;
  const result = App.validation.validateContactPhone(input.value);

  result.error
    ? App.errors.showFieldError(input, result.msg)
    : App.errors.clearFieldError(input);
};

/**
 * Clears the error state of a field while the user types.
 *
 * - Removes the visual validation state immediately on input.
 * - Helps the form feel more responsive and forgiving.
 * - Keeps field-specific reset logic in a shared helper.
 */
App.actions.resetFieldOnInput = function resetFieldOnInput(inputEl) {
  App.errors.clearFieldError(inputEl);
};

/**
 * Initializes the Contacts page after all scripts are loaded.
 *
 * - Hides overlays and ensures sidebar structure exists.
 * - Fetches and renders the contact list into the sidebar.
 * - Ensures detail containers exist and applies desktop positioning.
 */
App.init = async function initContactsPage() {
  App.overlays.hideAll();

  const sidebar = App.sidebar?.ensureSidebar?.();
  if (!sidebar) return;

  const list = sidebar.querySelector('.contacts_sidebar_list');
  App.sidebar.renderContacts(list, await App.data.fetchContacts());

  App.detail?.ensureDetailHeader?.();
  App.detail?.ensureDetailRoot?.();

  if (!window.matchMedia('(max-width: 1024px)').matches) {
    App.detail?.positionDetailRoot?.();
  }
};

window.openDialog = (...a) => App.actions.openDialog(...a);
window.closeDialog = (...a) => App.actions.closeDialog(...a);
window.saveContact = (...a) => App.actions.saveContact(...a);
window.deleteContact = (...a) => App.actions.deleteContact(...a);
window.openEdit = (...a) => App.actions.openEdit(...a);
window.handleNameBlur = (...a) => App.actions.handleNameBlur(...a);
window.handleEmailBlur = (...a) => App.actions.handleEmailBlur(...a);
window.handlePhoneBlur = (...a) => App.actions.handlePhoneBlur(...a);
window.resetFieldOnInput = (...a) => App.actions.resetFieldOnInput(...a);