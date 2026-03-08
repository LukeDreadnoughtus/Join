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
const T = App.T || {};

// -----------------------------
// Data access (Firebase)
// -----------------------------
App.data = App.data || {};

/**
 * Maps a raw Firebase record into the contact shape used by the UI.
 * - Filters out invalid entries that are missing the object or the name.
 * - Normalizes legacy color fields by checking both "color" and "colors".
 * - Returns a clean contact object or null for broken records.
 */
App.data.mapContact = function mapContact(key, u) {
  if (!u || !u.name) return null;

  return {
    id: key,
    name: String(u.name),
    email: u.email || "",
    phone: u.phone || "",
    color: u.color || u.colors || null
  };
};

/**
 * Loads all contacts from Firebase and returns a normalized array.
 * - Converts the database object into a list of UI-ready contact objects.
 * - Returns an empty array when the database has no contact entries.
 * - Avoids mutating external state so the function stays predictable.
 */
App.data.fetchContacts = async function fetchContacts() {
  const response = await fetch(App.DB + ".json");
  const data = await response.json();

  if (!data) return [];

  return Object.keys(data)
    .map(key => App.data.mapContact(key, data[key]))
    .filter(Boolean);
};

/**
 * Creates a new contact record in Firebase.
 * - Sends the contact to the collection endpoint using POST.
 * - Assigns a color immediately so avatars can render correctly.
 * - Returns the created Firebase id or null if no id is available.
 */
App.data.createNewContact = async function createNewContact(form) {
  const body = {
    name: form.name,
    email: form.email,
    phone: form.phone || "",
    colors: App.utils.pickColor()
  };

  const response = await fetch(App.DB + ".json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => null);
  return data?.name || null;
};

/**
 * Updates an existing contact record in Firebase.
 * - Uses PATCH so only the changed contact fields are updated.
 * - Preserves the previous color when possible to avoid avatar changes.
 * - Depends on App.state.editId to know which contact to update.
 */
App.data.saveExistingContact = async function saveExistingContact(all, form) {
  const current = (all || []).find(user => user.id === App.state.editId);
  const color = current?.color || App.utils.pickColor();

  const body = {
    name: form.name,
    email: form.email,
    phone: form.phone || "",
    colors: color
  };

  await fetch(App.DB + "/" + App.state.editId + ".json", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
};

/**
 * Removes a deleted user id from all assigned task arrays.
 * - Scans the task board for assignments that still reference the contact.
 * - Prevents orphaned assignee references after contact deletion.
 * - Sends a sparse PATCH payload so only affected tasks are updated.
 */
App.data.removeUserFromTasks = async function removeUserFromTasks(id) {
  if (!id) return;

  const response = await fetch(App.BOARD + ".json");
  const data = await response.json();

  if (!data) return;

  const body = {};

  Object.keys(data).forEach(key => {
    const task = data[key];
    const assigned = task && Array.isArray(task.assigned) ? task.assigned : null;

    if (assigned && assigned.includes(id)) {
      body[key + "/assigned"] = assigned.filter(x => x !== id);
    }
  });

  if (!Object.keys(body).length) return;

  await fetch(App.BOARD + ".json", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
};

// -----------------------------
// Dialog (Add/Edit)
// -----------------------------
App.dialog = App.dialog || {};

/**
 * Ensures that the contact modal and backdrop exist in the DOM.
 * - Reuses the existing modal if it has already been created before.
 * - Adds backdrop click handling for closing the dialog.
 * - Keeps the modal mounted so reopening stays fast.
 */
App.dialog.ensureDialog = function ensureDialog() {
  let backdrop = document.querySelector(".contacts_modal_backdrop");
  if (backdrop) return backdrop;

  backdrop = document.createElement("div");
  backdrop.className = "contacts_modal_backdrop";
  backdrop.setAttribute("onclick", "closeDialog()");

  const modal = document.createElement("div");
  modal.className = "contacts_modal";
  modal.setAttribute("onclick", "event.stopPropagation()");
  modal.innerHTML = T.dialog ? T.dialog() : "";

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  return backdrop;
};

/**
 * Clears all dialog input fields and resets validation state.
 * - Removes stale values before opening the create dialog.
 * - Prevents previous form content from appearing again by mistake.
 * - Resets visual error borders through the shared error helper.
 */
App.dialog.resetInputs = function resetDialogInputs() {
  ["c_name", "c_email", "c_phone"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  App.errors.resetErrorBorders();
};

/**
 * Reads and trims the current values from the contact form inputs.
 * - Centralizes all modal input access in one helper function.
 * - Returns a simple object for validation and save logic.
 * - Removes leading and trailing whitespace from all fields.
 */
App.dialog.readForm = function readContactForm() {
  return {
    name: document.getElementById("c_name")?.value.trim(),
    email: document.getElementById("c_email")?.value.trim(),
    phone: document.getElementById("c_phone")?.value.trim()
  };
};

/**
 * Checks whether the dialog is currently in edit mode.
 * - Reads the mode directly from the dialog layer class list.
 * - Avoids relying on button labels or other fragile UI text.
 * - Returns true only when the edit mode class is present.
 */
App.dialog.isEditMode = function isEditMode(layer) {
  return layer?.classList.contains("mode-edit") === true;
};

// -----------------------------
// Dialog helpers (small building blocks)
// -----------------------------

/**
 * Applies the correct CSS mode classes to the dialog layer.
 * - Toggles between create and edit mode class names.
 * - Centralizes mode switching to avoid duplicated class logic.
 * - Allows the CSS layer to react consistently to dialog mode.
 */
App.dialog._setModeClasses = function _setModeClasses(layer, mode) {
  if (!layer) return;

  const isCreate = mode === "create";
  layer.classList.toggle("mode-create", isCreate);
  layer.classList.toggle("mode-edit", !isCreate);
};

/**
 * Ensures the title element is wrapped in the expected container.
 * - Creates the wrapper only when the current DOM structure needs it.
 * - Keeps the modal title markup consistent across different templates.
 * - Prevents layout differences between variants of the dialog HTML.
 */
App.dialog._ensureTitleContainer = function _ensureTitleContainer(titleEl) {
  if (!titleEl || !titleEl.parentElement) return;
  if (titleEl.parentElement.classList.contains("contacts_modal_title_container")) return;

  const container = document.createElement("div");
  container.className = "contacts_modal_title_container";

  titleEl.parentElement.insertBefore(container, titleEl);
  container.appendChild(titleEl);
};

/**
 * Updates the main title text inside the contact dialog.
 * - Sets the visible title for the current dialog mode.
 * - Ensures the required title wrapper structure exists.
 * - Helps prevent visual shifts caused by inconsistent markup.
 */
App.dialog._setTitle = function _setTitle(text) {
  const title = document.getElementById("contacts_modal_title");
  if (!title) return;

  title.textContent = text;
  App.dialog._ensureTitleContainer(title);
};

/**
 * Updates the subtitle text and styling inside the dialog.
 * - Sets the subtitle content below the main title.
 * - Replaces the subtitle class so spacing and visibility match the mode.
 * - Supports empty subtitle text for edit mode layouts.
 */
App.dialog._setSubtitle = function _setSubtitle(text, className) {
  const sub = document.getElementById("contacts_modal_subtitle");
  if (!sub) return;

  sub.textContent = text;
  sub.className = "contacts_modal_subtitle " + (className || "");
};

/**
 * Inserts the default avatar placeholder for create mode.
 * - Renders the create avatar template when the helper is available.
 * - Targets the dedicated avatar slot inside the dialog.
 * - Fails safely when the slot or template helper is missing.
 */
App.dialog._setCreateAvatar = function _setCreateAvatar(layer) {
  const slot = layer?.querySelector("#contacts_modal_avatar_slot");
  if (!slot) return;

  if (T.createDialogAvatar) slot.innerHTML = T.createDialogAvatar();
};

/**
 * Shows the correct primary action button for the active mode.
 * - Switches visibility between the Create and Save buttons.
 * - Injects the provided button HTML only when needed.
 * - Keeps action button markup management in one shared helper.
 */
App.dialog._toggleActionButtons = function _toggleActionButtons(layer, createHtml, saveHtml) {
  const createBtn = layer?.querySelector("#contacts_create_btn");
  const saveBtn = layer?.querySelector("#contacts_save_btn");

  if (createBtn) {
    createBtn.style.display = createHtml ? "block" : "none";
    if (createHtml) createBtn.innerHTML = createHtml;
  }

  if (saveBtn) {
    saveBtn.style.display = saveHtml ? "block" : "none";
    if (saveHtml) saveBtn.innerHTML = saveHtml;
  }
};

/**
 * Replaces the bottom-left dialog button markup.
 * - Uses the same button position for Cancel in create mode and Delete in edit mode.
 * - Swaps the full HTML so label and icon stay in sync.
 * - Keeps mode-specific button rendering visually consistent.
 */
App.dialog._setDeleteButtonHtml = function _setDeleteButtonHtml(layer, html) {
  const del = layer?.querySelector("#contacts_delete_btn");
  if (del) del.innerHTML = html;
};

/**
 * Configures the contact dialog for create mode.
 * - Applies create-specific title, subtitle, avatar, and CSS classes.
 * - Shows the Create button and hides the Save button.
 * - Replaces the secondary action with a Cancel button.
 */
App.dialog.configureCreateMode = function configureCreateMode(layer) {
  App.dialog._setModeClasses(layer, "create");
  App.dialog._setTitle("Add contact");
  App.dialog._setSubtitle("Tasks are better with a team!", "add-subtitle");
  App.dialog._setCreateAvatar(layer);

  const createHtml = 'Create contact <span class="contacts-checkmark"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.288 8.775L13.763 0.3C13.963 0.1 14.2005 0 14.4755 0C14.7505 0 14.988 0.1 15.188 0.3C15.388 0.5 15.488 0.7375 15.488 1.0125C15.488 1.2875 15.388 1.525 15.188 1.725L5.988 10.925C5.788 11.125 5.55467 11.225 5.288 11.225C5.02133 11.225 4.788 11.125 4.588 10.925L0.288 6.625C0.088 6.425 -0.00783333 6.1875 0.0005 5.9125C0.00883333 5.6375 0.113 5.4 0.313 5.2C0.513 5 0.7505 4.9 1.0255 4.9C1.3005 4.9 1.538 5 1.738 5.2L5.288 8.775Z" fill="white"/></svg></span>';
  App.dialog._toggleActionButtons(layer, createHtml, null);

  const cancelHtml = 'Cancel <span class="contacts-x"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.243 6.243L11.486 11.486M1 11.486L6.243 6.243L1 11.486ZM11.486 1L6.242 6.243L11.486 1ZM6.242 6.243L1 1L6.242 6.243Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  App.dialog._setDeleteButtonHtml(layer, cancelHtml);
};

/**
 * Configures the contact dialog for edit mode.
 * - Applies edit-specific title, subtitle, and CSS classes.
 * - Shows the Save button and hides the Create button.
 * - Replaces the secondary action with a Delete button.
 */
App.dialog.configureEditMode = function configureEditMode(layer) {
  App.dialog._setModeClasses(layer, "edit");
  App.dialog._setTitle("Edit contact");
  App.dialog._setSubtitle("", "edit-subtitle");

  const saveHtml = 'Save <span class="contacts-checkmark"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.288 8.775L13.763 0.3C13.963 0.1 14.2005 0 14.4755 0C14.7505 0 14.988 0.1 15.188 0.3C15.388 0.5 15.488 0.7375 15.488 1.0125C15.488 1.2875 15.388 1.525 15.188 1.725L5.988 10.925C5.788 11.125 5.55467 11.225 5.288 11.225C5.02133 11.225 4.788 11.125 4.588 10.925L0.288 6.625C0.088 6.425 -0.00783333 6.1875 0.0005 5.9125C0.00883333 5.6375 0.113 5.4 0.313 5.2C0.513 5 0.7505 4.9 1.0255 4.9C1.3005 4.9 1.538 5 1.738 5.2L5.288 8.775Z" fill="white"/></svg></span>';
  App.dialog._toggleActionButtons(layer, null, saveHtml);

  const deleteHtml = 'Delete <span class="contacts-x"><svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.243 6.243L11.486 11.486M1 11.486L6.243 6.243L1 11.486ZM11.486 1L6.242 6.243L11.486 1ZM6.242 6.243L1 1L6.242 6.243Z" stroke="#2A3647" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  App.dialog._setDeleteButtonHtml(layer, deleteHtml);
};

/**
 * Updates the avatar preview shown in edit mode.
 * - Uses the contact color to keep the avatar visually consistent.
 * - Renders a template-based avatar when the helper exists.
 * - Falls back to plain initials when no template helper is available.
 */
App.dialog.updateEditAvatar = function updateEditAvatar(layer, user) {
  const slot = layer.querySelector("#contacts_modal_avatar_slot");
  if (!slot) return;

  const bg = user.color || "#666";
  const init = App.utils.initials(user.name || "");

  if (T.editDialogAvatar) slot.innerHTML = T.editDialogAvatar(bg, init);
  else slot.textContent = init;
};

/**
 * Fills the dialog inputs with the selected contact data.
 * - Writes the current name, email, and phone into the form fields.
 * - Supports edit mode so users can modify existing values.
 * - Safely skips fields that are not present in the DOM.
 */
App.dialog.fillEditInputs = function fillEditInputs(user) {
  const nameInput = document.getElementById("c_name");
  const emailInput = document.getElementById("c_email");
  const phoneInput = document.getElementById("c_phone");

  if (nameInput) nameInput.value = user.name || "";
  if (emailInput) emailInput.value = user.email || "";
  if (phoneInput) phoneInput.value = user.phone || "";
};