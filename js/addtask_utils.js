"use strict";

/**
 * Checks if we're currently in the overlay context
 * @returns {boolean} True if in overlay, false otherwise
 */
function isOverlayContext() {
  const overlay = document.getElementById('overlay');
  return overlay && !overlay.classList.contains('overlay_hidden');
}

/**
 * Gets the correct element ID based on context
 * @param {string} id - The base element ID
 * @returns {string} The context-aware ID
 */
function getContextId(id) {
  return isOverlayContext() ? 'overlay-' + id : id;
}

/**
 * Gets element by ID, checking overlay context
 * @param {string} id - The base element ID
 * @returns {HTMLElement|null} The element or null
 */
function getContextElement(id) {
  const overlayId = getContextId(id);
  const el = document.getElementById(overlayId);
  if (el) return el;
  return document.getElementById(id);
}

/**
 * Generates initials from a user's name
 * @param {string} user - The full name of the user
 * @returns {string} The initials (first letter of first and last name)
 */
function initials(user) {
  const parts = String(user || "").trim().split(/\s+/);
  const first = (parts[0] || "").charAt(0).toUpperCase();
  const second = (parts[1] || "").charAt(0).toUpperCase();
  return first + (second || "");
}


/**
 * Creates a dot element for subtask items
 * @returns {HTMLDivElement} A div element with the subtask-dot class
 */
function createDot() {
  const dot = document.createElement("div");
  dot.className = "subtask-dot";
  return dot;
}


/**
 * Creates a span element for subtask text
 * @param {string} text - The text content for the span
 * @returns {HTMLSpanElement} A span element with the subtask-text class
 */
function createSpan(text) {
  const span = document.createElement("span");
  span.className = "subtask-text";
  span.textContent = text;
  return span;
}


/**
 * Creates a button element with HTML content and click handler
 * @param {string} html - The HTML content for the button
 * @param {Function} onClick - The click event handler function
 * @returns {HTMLButtonElement} A button element with type="button"
 */
function createButton(html, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.innerHTML = html;
  btn.onclick = onClick;
  return btn;
}


/**
 * Clones an SVG icon element and applies a new class
 * @param {string} sourceId - The ID of the source SVG element to clone
 * @param {string} className - The class name to apply to the cloned element
 * @returns {HTMLElement} The cloned SVG element or a span if source not found
 */
function cloneSvgIcon(sourceId, className) {
  const src = document.getElementById(sourceId);
  if (!src) return document.createElement("span");
  const node = src.cloneNode(true);
  node.removeAttribute("id");
  node.setAttribute("class", className);
  node.classList.remove("hidden", "overlay_hidden");
  return node;
}


/**
 * Counts the number of subtask items in the subtask list
 * @returns {number} The count of subtask items
 */
function getSubtaskCount() {
  const ul = document.getElementById("subtask-list");
  if (!ul) return 0;
  let count = 0;
  for (const child of ul.children) {
    if (child.classList && child.classList.contains("subtask-item")) count++;
  }
  return count;
}


/**
 * Rebuilds the left section of a subtask item with new content
 * @param {HTMLElement} left - The left section container element
 * @param {HTMLElement} dot - The dot element to add
 * @param {HTMLElement} contentElement - The content element to add
 */
function rebuildLeft(left, dot, contentElement) {
  left.innerHTML = "";
  left.append(dot, contentElement);
}


/**
 * Clears and hides the subtask input divider wrapper
 */
function clearDivider() {
  const wrapper = document.querySelector(".subtask-icons-wrapper");
  if (wrapper) wrapper.classList.add("hidden");
}

/**
 * Marks a field as invalid with a custom error message
 * @param {HTMLElement} field - The field element to mark as invalid
 * @param {string} message - The error message to display
 */
function markFieldAsInvalidWithMessage(field, message) {
  field.classList.add("input-error");
  const existing = document.getElementById(`error-${field.id}`);
  if (existing) existing.remove();
  const error = document.createElement("span");
  error.id = `error-${field.id}`;
  error.className = "error-message";
  error.textContent = message;
  field.insertAdjacentElement("afterend", error);
}

/**
 * Checks if a given date string is before today
 * @param {string} dateValue - The date string (YYYY-MM-DD)
 * @returns {boolean} True if the date is in the past
 */
function isDateInPast(dateValue) {
  if (!dateValue) return false;
  const selected = new Date(dateValue);
  const today = new Date();
  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return selected < today;
}
