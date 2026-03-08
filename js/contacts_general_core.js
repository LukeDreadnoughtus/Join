/**
 * contacts_general_core.js
 *
 * Core logic for the Contacts page.
 * This file only contains:
 * - namespace and shared state
 * - overlay helpers
 * - small utility helpers
 * - validation and error UI helpers
 *
 * Data access, dialog UI and page actions live in separate files:
 * - contacts_general_data_dialog.js
 * - contacts_general_actions.js
 */

checkAuth();

/**
 * Keeps a single global namespace so the app works without bundlers or modules.
 * Other contacts files hook into the same shared object.
 */
var App = (window.ContactsApp = window.ContactsApp || {});

/**
 * Provides template access from js/templates/contacts_templates.js.
 * Falls back to safe defaults if no external templates are available.
 */
App.T = window.contactsTemplates || {};

/**
 * Defines Firebase endpoints used by the contacts feature.
 * DB stores contacts, while BOARD is used to clean up task assignments.
 */
App.DB = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";
App.BOARD = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";

/**
 * Stores the predefined color palette for contact avatars.
 * Cycles through the list so color assignment never runs out.
 */
App.COLOR = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF',
  '#8A2BE2', '#ff8800', '#0f8558', '#00afff', '#cd6839', '#f9c20cff'
];

/**
 * Holds the shared in-memory state for the contacts page.
 * - order: contacts in the exact sidebar render order
 * - editId: currently edited contact
 * - selectedId: currently selected contact in the detail view
 */
App.state = App.state || {
  order: [],
  editId: null,
  selectedId: null,
};

// -----------------------------
// Overlay helpers
// -----------------------------
App.overlays = App.overlays || {};

/**
 * Hides a specific overlay and restores its original HTML content if available.
 * - Removes the active display state and re-applies the hidden class.
 * - Resets inline display so CSS can take over again.
 * - Safely exits if the target element does not exist.
 */
App.overlays.hide = function hideContactsOverlay(id) {
  const el = document.getElementById(id);
  if (!el) return;

  if (el.dataset.defaultHtml) {
    el.innerHTML = el.dataset.defaultHtml;
  }

  el.classList.add('d_none');
  el.style.display = 'none';
};

/**
 * Hides all known contacts-related overlays in one step.
 * - Clears success and feedback overlays used in the contacts UI.
 * - Helps prevent stale messages from staying visible during interaction.
 * - Keeps the page state visually clean and responsive.
 */
App.overlays.hideAll = function hideAllContactsOverlays() {
  ['userfeedback_email', 'userfeedback_contact_created', 'userfeedback_contact_deleted']
    .forEach(App.overlays.hide);
};

/**
 * Shows a lightweight overlay for a limited time.
 * - Removes the hidden class and forces a flex display state.
 * - Automatically hides the overlay again after the given timeout.
 * - Reuses and clears existing timers to avoid overlapping hide calls.
 */
App.overlays.show = function showContactsOverlay(id, ms = 2200) {
  const el = document.getElementById(id);
  if (!el) return;

  el.classList.remove('d_none');
  el.style.display = 'flex';

  if (ms) {
    window.clearTimeout(el._hideTimer);
    el._hideTimer = window.setTimeout(() => App.overlays.hide(id), ms);
  }
};

/**
 * Replaces overlay content with one or more message paragraphs before showing it.
 * - Converts the given message input into a filtered list of visible strings.
 * - Extends the display duration when multiple messages are shown.
 * - Preserves the original HTML so it can be restored on hide.
 */
App.overlays.showMessages = function showContactsOverlayMessages(id, messages, baseMs = 2200) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!el.dataset.defaultHtml) el.dataset.defaultHtml = el.innerHTML;

  const list = [].concat(messages || []).filter(Boolean);
  el.innerHTML = list.map(m => `<p>${String(m)}</p>`).join('');

  const ms = baseMs + Math.max(0, list.length - 1) * 1000;
  App.overlays.show(id, ms);
};

/**
 * Wires overlay auto-hide behavior to contact input fields once.
 * - Hides all overlays when users focus or type into form inputs.
 * - Prevents duplicate event binding by using a small internal flag.
 * - Keeps the interaction pattern aligned with the rest of the project.
 */
App.overlays.wireAutoHideOnInput = function wireContactsOverlayHiders() {
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

/**
 * Builds initials from the first one or two parts of a full name.
 * - Uses the first two non-empty name segments to create avatar letters.
 * - Returns a single initial if only one name part exists.
 * - Returns an empty string for missing or invalid input.
 */
App.utils.initials = function initials(fullName) {
  if (!fullName) return '';
  return String(fullName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');
};

/**
 * Normalizes the first character of a name for alphabetical grouping.
 * - Accepts A-Z and German umlauts as valid group keys.
 * - Converts the first visible character to uppercase before checking it.
 * - Falls back to "#" when the name starts with a non-letter character.
 */
App.utils.normalizeInitial = function normalizeInitial(name) {
  if (!name) return '#';
  const first = name.trim().charAt(0).toUpperCase();
  if ('ÄÖÜ'.includes(first)) return first;
  if (first >= 'A' && first <= 'Z') return first;
  return '#';
};

/**
 * Picks a color from the predefined palette based on the current contact order.
 * - Uses the current sidebar order length to derive a deterministic index.
 * - Wraps around the palette so color assignment always stays available.
 * - Helps keep avatar colors visually stable as the list grows.
 */
App.utils.pickColor = function pickColor() {
  const idx = App.state.order.length % App.COLOR.length;
  return App.COLOR[idx];
};

/**
 * Formats a full name into title case.
 * - Normalizes mixed-case input like "mAx mUSTer" into readable output.
 * - Splits by whitespace so extra spaces or tabs do not matter.
 * - Returns an empty string for falsy input values.
 */
App.utils.titleCase = function titleCase(fullName) {
  if (!fullName) return '';
  return String(fullName)
    .split(/\s+/)
    .map(w => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
};

// -----------------------------
// Validation helpers
// -----------------------------
App.validation = App.validation || {};

/**
 * Searches the contact list for an existing email conflict.
 * - Compares email addresses case-insensitively to avoid duplicates.
 * - Ignores a specific contact ID so self-edits remain allowed.
 * - Returns the conflicting contact object or undefined.
 */
App.validation.findEmailConflict = function findEmailConflict(all, email, idToIgnore) {
  const lower = String(email || '').toLowerCase();
  return (all || []).find(u => (u.email || '').toLowerCase() === lower && u.id !== idToIgnore);
};

/**
 * Checks whether an email address matches a simple UI-safe format.
 * - Trims surrounding whitespace before validation.
 * - Uses a practical regex without trying to cover every RFC edge case.
 * - Returns only a boolean and does not modify any UI state.
 */
App.validation.isValidEmail = function isValidEmail(email) {
  if (!email) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(email).trim());
};

/**
 * Checks whether a name contains at least a first and last name.
 * - Allows letters, spaces, apostrophes and hyphens.
 * - Uses Unicode letter matching so umlauts and non-ASCII names work.
 * - Enforces a reasonable total length between 2 and 50 characters.
 */
App.validation.isValidName = function isValidName(name) {
  if (!name) return false;
  return /^(?=.{2,50}$)[\p{L}]+(?:[ '\-][\p{L}]+)+$/u.test(String(name).trim());
};

/**
 * Validates a phone number with optional international prefix support.
 * - Treats the field as optional and accepts empty input as valid.
 * - Allows an optional leading plus sign followed by 10 to 15 digits.
 * - Rejects letters and loosely formatted values to reduce input errors.
 */
App.validation.isValidPhoneNumber = function isValidPhoneNumber(phone) {
  if (!phone) return true;
  return /^\+?[0-9]{10,15}$/.test(String(phone).trim());
};

/**
 * Validates the contact email and returns a structured result object.
 * - Requires a non-empty value before running format and uniqueness checks.
 * - Verifies syntax and checks for duplicates in the provided contact list.
 * - Allows keeping the current email unchanged when editing an existing contact.
 */
App.validation.validateContactEmail = function validateContactEmail(email, all = [], editId = null) {
  if (!email?.trim()) return { error: true, msg: null };
  if (!App.validation.isValidEmail(email)) return { error: true, msg: 'Keine gültige E-Mail-Adresse.' };
  if (App.validation.findEmailConflict(all, email, editId)) return { error: true, msg: 'Diese E-Mail existiert bereits.' };
  return { error: false };
};

/**
 * Validates the contact name and returns a structured result object.
 * - Requires a non-empty name input before format validation starts.
 * - Ensures the value contains at least first and last name parts.
 * - Returns a localized validation message when the format is invalid.
 */
App.validation.validateContactName = function validateContactName(name) {
  if (!name?.trim()) return { error: true, msg: null };
  if (!App.validation.isValidName(name)) return { error: true, msg: 'Bitte Vor- und Nachname eingeben (nur Buchstaben).' };
  return { error: false };
};

/**
 * Validates the contact phone field and returns a structured result object.
 * - Treats the phone number as optional and accepts empty values immediately.
 * - Applies format validation only when the user entered a value.
 * - Returns a localized error message for invalid number formats.
 */
App.validation.validateContactPhone = function validateContactPhone(phone) {
  if (!phone?.trim()) return { error: false };
  if (!App.validation.isValidPhoneNumber(phone)) return { error: true, msg: 'Nur Ziffern, 10–15 Stellen, optionales + am Anfang.' };
  return { error: false };
};

// -----------------------------
// Error UI (input borders + inline error messages)
// -----------------------------
App.errors = App.errors || {};

/**
 * Removes the error state from a single input field.
 * - Clears the red border styling from the given input element.
 * - Hides and empties the related inline error element if it exists.
 * - Can be called safely even when the input or error node is missing.
 */
App.errors.clearFieldError = function clearFieldError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove('input_error');
  const errorEl = document.getElementById(`error-${inputEl.id}`);
  if (!errorEl) return;
  errorEl.textContent = '';
  errorEl.classList.add('d_none');
};

/**
 * Resets error borders on all modal contact input fields.
 * - Clears leftover validation styling when dialogs are opened or closed.
 * - Prevents the modal from visually remembering old invalid states.
 * - Iterates over the known contact form field IDs.
 */
App.errors.resetErrorBorders = function resetErrorBorders() {
  ['c_name', 'c_email', 'c_phone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('input-error');
  });
};

/**
 * Shows an error state for a specific input field.
 * - Adds the visual error class to highlight the invalid input.
 * - Writes the message into the matching inline error element when available.
 * - Supports border-only feedback when no message text is provided.
 */
App.errors.showFieldError = function showFieldError(inputEl, msg) {
  if (!inputEl) return;
  inputEl.classList.add('input_error');
  const errorEl = document.getElementById(`error-${inputEl.id}`);
  if (!errorEl) return;
  if (msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('d_none');
  }
};