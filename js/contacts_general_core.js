// contacts_general_core.js
// ------------------------------------------------------------
// Core logic for the Contacts page.
// This file ONLY contains:
//  - namespace + shared state
//  - overlay helpers
//  - small utilities (initials, title case, ...)
//  - validation + error UI helpers
//
// Data access, dialog UI and page actions live in separate files:
//  - contacts_general_data_dialog.js
//  - contacts_general_actions.js
// ------------------------------------------------------------

checkAuth();

// We keep a single global namespace so the app works without bundlers/modules.
// Other contacts files (sidebar/detail/mediaquery) hook into the same object.
var App = (window.ContactsApp = window.ContactsApp || {});

// Templates are provided by js/templates/contacts_templates.js
// If a template is missing, we fall back to safe defaults.
App.T = window.contactsTemplates || {};

// Firebase endpoints.
// DB: contacts (created during registration in the original project)
// BOARD: tasks board (so we can remove deleted users from assignments)
App.DB = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";
App.BOARD = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";

// Predefined color palette for random color assignment.
// We cycle through the list so it never runs out.
// This keeps the avatars consistent and easy to recognize.
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
