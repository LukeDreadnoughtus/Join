"use strict";

/**
 * Updates the assigned users display text and renders user icons
 */
function updateDisplayText() {
  const display = document.getElementById("assignedDisplay");
  const assignedUsersContainer = document.getElementById("assigned-users-icons");
  if (!display || !assignedUsersContainer) return;
  const displayText = window.selectedUsers && window.selectedUsers.size > 0 ? "To:" : "Select contacts to assign";
  rebuildDisplayElement(display, displayText);
  renderAssignedUserIcons(assignedUsersContainer);
}


/**
 * Renders icon elements for all selected users
 * @param {HTMLElement} container - The container element for user icons
 */
function renderAssignedUserIcons(container) {
  container.innerHTML = "";
  if (window.selectedUsers && window.selectedUsers.size > 0) {
    window.selectedUsers.forEach((id) => {
      const icon = createSelectedUserIcon(id);
      if (icon) container.appendChild(icon);
    });
  }
}


/**
 * Rebuilds the display element with text and arrow
 * @param {HTMLElement} display - The display element to rebuild
 * @param {string} [textContent="Select contacts to assign"] - The text to display
 */
function rebuildDisplayElement(display, textContent = "Select contacts to assign") {
  display.innerHTML = "";
  const text = createDisplayTextSpan(textContent);
  const arrow = createDisplayArrow();
  display.append(text, arrow);
}


/**
 * Creates a span element for display text
 * @param {string} textContent - The text content for the span
 * @returns {HTMLSpanElement} The created span element
 */
function createDisplayTextSpan(textContent) {
  const text = document.createElement("span");
  text.className = "select-display-text";
  text.id = "assignedDisplayText";
  text.textContent = textContent;
  return text;
}


/**
 * Creates an arrow span element for the dropdown indicator
 * @returns {HTMLSpanElement} The created arrow element
 */
function createDisplayArrow() {
  const arrow = document.createElement("span");
  arrow.className = "icon-assign";
  arrow.id = "assignedArrow";
  arrow.textContent = "▼";
  return arrow;
}


/**
 * Creates an icon element for a selected user
 * @param {string} id - The user ID
 * @returns {HTMLDivElement|null} The user icon element or null if elements not found
 */
function createSelectedUserIcon(id) {
  const nameEl = document.getElementById(`option-name-${id}`);
  const iconEl = document.getElementById(`option-icon-${id}`);
  if (!nameEl || !iconEl) return null;
  const userName = nameEl.textContent.trim();
  const bgColor = window.getComputedStyle(iconEl).backgroundColor;
  const newIcon = document.createElement("div");
  newIcon.className = "assigned_user_icon";
  newIcon.style.backgroundColor = bgColor;
  newIcon.title = userName;
  newIcon.textContent = initials(userName);
  return newIcon;
}


/**
 * Fetches user data from the Firebase database
 * @async
 * @returns {Promise<Object>} The user data object from Firebase
 */
async function fetchUserData() {
  const response = await fetch(ADD_TASK_PATH_REGISTER + ".json");
  return await response.json();
}


/**
 * Loads and displays user assignments in the dropdown
 * @async
 */
async function loadUserAssignments() {
  const container = document.getElementById("task-assigned-to");
  if (!container) return;
  try {
    const data = await fetchUserData();
    buildDropdown(container, data);
  } catch (error) {
    console.error("Error loading users:", error);
  }
}


/**
 * Builds the complete dropdown with display and options
 * @param {HTMLElement} container - The container for the dropdown
 * @param {Object} data - The user data object
 */
function buildDropdown(container, data) {
  container.innerHTML = "";
  window.selectedUsers = new Set();
  const display = createDisplayElement();
  const options = createOptionsContainer(data);
  container.append(display, options);
  attachOutsideClickHandlerForAssignedDropdown();
}


/**
 * Creates the main display element for the dropdown
 * @returns {HTMLDivElement} The created display element
 */
function createDisplayElement() {
  const el = document.createElement("div");
  el.className = "select-display";
  el.id = "assignedDisplay";
  el.onclick = toggleDropdown;
  const text = createDisplayTextSpan("Select contacts to assign");
  const arrow = createDisplayArrow();
  el.append(text, arrow);
  return el;
}


/**
 * Creates the options container with all user options
 * @param {Object} data - The user data object
 * @returns {HTMLDivElement} The created options container
 */
function createOptionsContainer(data) {
  const options = document.createElement("div");
  options.className = "select-options";
  options.id = "assignedOptions";
  for (const key of Object.keys(data || {})) {
    addOptionItem(options, key, data[key]);
  }
  return options;
}


/**
 * Adds a single option item to the container
 * @param {HTMLElement} container - The container for options
 * @param {string} id - The user ID
 * @param {Object} user - The user data object
 */
function addOptionItem(container, id, user) {
  const item = createOptionItemElement(id, user);
  item.onclick = () => toggleUserById(id);
  container.appendChild(item);
}


/**
 * Creates an option item element for a user
 * @param {string} id - The user ID
 * @param {Object} user - The user data object
 * @returns {HTMLDivElement} The created option item element
 */
function createOptionItemElement(id, user) {
  const item = document.createElement("div");
  item.className = "option-item";
  item.id = `option-${id}`;
  item.dataset.id = id;
  const userName = (user?.name || "").trim();
  const userIconText = initials(userName);
  const color = user?.color || "#393737";
  item.innerHTML = `
    <div class="option-left">
      <div class="user_icon" id="option-icon-${id}" style="background-color:${color}">${userIconText}</div>
      <span class="option-user-name" id="option-name-${id}">${userName}</span>
    </div>
    <span class="checkbox-square"></span>
  `;
  return item;
}


/**
 * Toggles the selection state of a user by ID
 * @param {string} id - The user ID to toggle
 */
function toggleUserById(id) {
  const item = document.getElementById(`option-${id}`);
  if (!item) return;
  if (!window.selectedUsers) window.selectedUsers = new Set();
  if (window.selectedUsers.has(id)) {
    window.selectedUsers.delete(id);
    item.classList.remove("checked");
  } else {
    window.selectedUsers.add(id);
    item.classList.add("checked");
  }
  updateDisplayText();
}


/**
 * Toggles the visibility of the assigned dropdown
 */
function toggleDropdown() {
  const options = document.getElementById("assignedOptions");
  const arrow = document.getElementById("assignedArrow");
  if (!options) return;
  options.classList.toggle("show");
  if (arrow) arrow.classList.toggle("rotate");
}


/**
 * Closes the assigned users dropdown
 */
function closeAssignedDropdown() {
  const options = document.getElementById("assignedOptions");
  const arrow = document.getElementById("assignedArrow");
  if (options) options.classList.remove("show");
  if (arrow) arrow.classList.remove("rotate");
}


/**
 * Checks if a click event occurred inside the assigned dropdown
 * @param {EventTarget} target - The click event target
 * @returns {boolean} True if click was inside dropdown
 */
function isClickInsideAssignedDropdown(target) {
  const display = document.getElementById("assignedDisplay");
  const options = document.getElementById("assignedOptions");
  return (display && display.contains(target)) || (options && options.contains(target));
}


/**
 * Attaches a click handler to close dropdown when clicking outside
 */
function attachOutsideClickHandlerForAssignedDropdown() {
  if (window.__assignedOutsideClickBound) return;
  window.__assignedOutsideClickBound = true;
  document.addEventListener("click", (e) => {
    if (!isClickInsideAssignedDropdown(e.target)) closeAssignedDropdown();
  });
}
