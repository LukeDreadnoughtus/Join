/**
 * Firebase Realtime Database paths
 * @type {string}
 */
const ADD_TASK_PATH = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";
const ADD_TASK_PATH_REGISTER = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";


let subtaskUid = 0;

const REQUIRED_FIELD_IDS = [
  "task-title",
  "task-due-date",
  "task-priority",
  "board-slot",
  "task-category",
];


/**
 * DOM elements for priority buttons
 * @type {HTMLElement}
 */
const lowBtn = document.getElementById('low');
const mediumBtn = document.getElementById('medium');
const urgentBtn = document.getElementById('urgent');
const hiddenInput = document.getElementById('task-priority');
const HIDDEN_CLASS = "overlay_hidden";
const ACTIVE_CLASS = "overlay_active";



/**
 * Maximum number of subtasks
 * @type {number}
 */
const MAX_SUBTASKS = 3;

/**
 * Available colors for user icons
 * @type {string[]}
 */
const COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF',
  '#8A2BE2', '#ff8800', '#0f8558', '#00afff', '#cd6839', '#f9c20cff'
]

/**
 * SVG icon for edit action
 * @type {string}
 */
const editIcon = `
<svg width="19" height="19" viewBox="0 0 19 19" fill="none">
  <path d="M2 16.25H3.4L12.025 7.625L10.625 6.225L2 14.85V16.25ZM16.3 6.175L12.05 1.975L13.45 0.575C13.8333 0.191667 14.3042 0 14.8625 0C15.4208 0 15.8917 0.191667 16.275 0.575L17.675 1.975C18.0583 2.35833 18.2583 2.82083 18.275 3.3625C18.2917 3.90417 18.1083 4.36667 17.725 4.75L16.3 6.175ZM14.85 7.65L4.25 18.25H0V14L10.6 3.4L14.85 7.65Z" fill="#2A3647"/>
</svg>`;

/**
 * SVG icon for delete action
 * @type {string}
 */
const deleteIcon = `
<svg width="16" height="18" viewBox="0 0 16 18" fill="none">
  <path d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3C0.716667 3 0.479167 2.90417 0.2875 2.7125C0.0958333 2.52083 0 2.28333 0 2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1H5C5 0.716667 5.09583 0.479167 5.2875 0.2875C5.47917 0.0958333 5.71667 0 6 0H10C10.2833 0 10.5208 0.0958333 10.7125 0.2875C10.9042 0.479167 11 0.716667 11 1H15C15.2833 1 15.5208 1.09583 15.7125 1.2875C15.9042 1.47917 16 1.71667 16 2C16 2.28333 15.9042 2.52083 15.7125 2.7125C15.5208 2.90417 15.2833 3 15 3V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3Z" fill="#2A3647"/>
</svg>`;

/**
 * DOM elements for subtask input
 * @type {HTMLElement}
 */
const input = document.getElementById("subtask-input");
const addIcon = document.getElementById("subtask-add");
const clearIcon = document.getElementById("subtask-clear");
const list = document.getElementById("subtask-list");
const divider = document.getElementById("dividerSubtasks");
const delBtn = createButton(deleteIcon, () => {
  item.remove();
  updateAddUIState();
});


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates the initials of a user name
 * @param {string} user - Full user name
 * @returns {string} Initials (max. 2 characters)
 */
function initials(user) {
  const parts = String(user || '').trim().split(/\s+/);
  const first = (parts[0] || '').charAt(0).toUpperCase();
  const second = (parts[1] || '').charAt(0).toUpperCase();
  return first + (second || '');
}


/**
 * Creates a dot element for subtasks
 * @returns {HTMLElement} Dot element
 */
function createDot() {
  const dot = document.createElement("div");
  dot.className = "subtask-dot";
  return dot;
}


/**
 * Creates a text span element
 * @param {string} text - The text to display
 * @returns {HTMLElement} Text span
 */
function createSpan(text) {
  const span = document.createElement("span");
  span.className = "subtask-text";
  span.textContent = text;
  return span;
}


/**
 * Creates a button with icon and click handler
 * @param {string} html - SVG icon HTML
 * @param {Function} onClick - Click event handler
 * @returns {HTMLElement} Button element
 */
function createButton(html, onClick) {
  const btn = document.createElement("button");
  btn.innerHTML = html;
  btn.onclick = onClick;
  return btn;
}

/**
 * Clones a button from an ID
 * @param {string} id - Element ID
 * @returns {HTMLElement} Cloned button
 */
function cloneButton(id) {
  const btn = document.getElementById(id).cloneNode(true);
  btn.classList.remove("hidden");
  return btn;
}

/**
 * Counts the number of subtasks
 * @returns {number} Number of subtasks
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
 * Hides the divider between input and subtasks
 */
function clearDivider() {
  const divider = document.getElementById("dividerSubtasks");
  if (divider) divider.classList.add("hidden");
}

// ============================================================================
// DISPLAY & UI FUNCTIONS
// ============================================================================

/**
 * Updates the display text and shows icons of selected users
 */
function updateDisplayText() {
  const display = document.getElementById("assignedDisplay");
  const assignedUsersContainer = document.getElementById("assigned-users-icons");
  if (!display || !assignedUsersContainer) return;
  rebuildDisplayElement(display);
  assignedUsersContainer.innerHTML = "";
  if (window.selectedUsers && window.selectedUsers.size > 0) {
    displaySelectedUserIcons(assignedUsersContainer);
  }
}

/**
 * Rebuilds the display element with text and arrow
 * @param {HTMLElement} display - The display element
 */
function rebuildDisplayElement(display) {
  display.innerHTML = "";
  const text = document.createElement("span");
  text.className = "select-display-text";
  text.id = "assignedDisplayText";
  text.textContent = "Select contacts to assign";
  const arrow = document.createElement("span");
  arrow.className = "icon-assign";
  arrow.id = "assignedArrow";
  arrow.textContent = "▼";
  display.append(text, arrow);
}


/**
 * Displays icons for all selected users
 * @param {HTMLElement} container - The container for icons
 */
function displaySelectedUserIcons(container) {
  window.selectedUsers.forEach(id => {
    const icon = createSelectedUserIcon(id);
    if (icon) container.appendChild(icon);
  });
}

/**
 * Creates an icon element for a selected user
 * @param {string} id - User ID
 * @returns {HTMLElement|null} Icon element or null
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

// ============================================================================
// FORM FUNCTIONS
// ============================================================================

/**
 * Sets the active priority and removes active class from other buttons
 * @param {HTMLElement} activeBtn - The clicked priority button
 */
function setActivePriority(activeBtn) {
  lowBtn.classList.remove(ACTIVE_CLASS);
  mediumBtn.classList.remove(ACTIVE_CLASS);
  urgentBtn.classList.remove(ACTIVE_CLASS);
  activeBtn.classList.add(ACTIVE_CLASS);
  hiddenInput.value = activeBtn.dataset.value;
}


/**
 * Event listeners for priority button clicks
 */
lowBtn.addEventListener('click', () => {
  setActivePriority(lowBtn);
});
mediumBtn.addEventListener('click', () => {
  setActivePriority(mediumBtn);
});
urgentBtn.addEventListener('click', () => {
  setActivePriority(urgentBtn);
});

/**
 * Event listeners for subtask input
 */
input.addEventListener("input", () => {
  const hasText = input.value.trim().length > 0;
  addIcon.classList.toggle("hidden", !hasText);
  divider.classList.toggle("hidden", !hasText);
  clearIcon.classList.toggle("hidden", !hasText);
});
addIcon.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) return;
  addSubtask(text);
  input.value = "";
  addIcon.classList.add("hidden");
  clearIcon.classList.add("hidden");
});
clearIcon.addEventListener("click", () => {
  input.value = "";
  divider.classList.add("hidden");
  addIcon.classList.add("hidden");
  clearIcon.classList.add("hidden");
});


/**
 * Collects all task data from the form
 * @returns {Object} Task object with all form data
 */
function getTaskDataFromForm() {
  return {
    title: document.getElementById("task-title")?.value || "",
    boardslot: document.getElementById("board-slot")?.value || "todo",
    description: document.getElementById("task-description")?.value || "",
    category: document.getElementById("task-category")?.value || "",
    assigned: Array.from(window.selectedUsers.keys()),
    priority: document.getElementById("task-priority")?.value || "",
    subtasks: getSubtasksForDB(),
    duedate: document.getElementById("task-due-date")?.value || "",
  };
}

/**
 * Creates a new task and saves it to Firebase
 * @param {Event} event - Submit event
 * @returns {Promise<void>}
 */
async function createTask(event) {
  event.preventDefault();
  if (!validateForm()) return;
  const newTask = getTaskDataFromForm();
  try {
    await saveTaskToFirebase(newTask);
  } catch (error) {
    console.error("Firebase error:", error);
  }
}

/**
 * Saves task to Firebase database
 * @param {Object} newTask - Task object to save
 * @returns {Promise<void>}
 */
async function saveTaskToFirebase(newTask) {
  const response = await fetch(ADD_TASK_PATH + ".json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newTask),
  });
  if (response.ok) {
    showSuccessMessage();
    clearForm();
  } else {
    console.error("Error saving to Firebase");
  }
}

/**
 * Validates all required form fields
 * @returns {boolean} True if all fields are valid, otherwise false
 */
function validateForm() {
  clearPreviousErrors();
  let isValid = true;
  for (const id of REQUIRED_FIELD_IDS) {
    const field = document.getElementById(id);
    if (!field) continue;
    const value = String(field.value ?? "").trim();
    if (!value) {
      markFieldAsInvalid(field);
      isValid = false;
    }
  }
  return isValid;
}

/**
 * Clears previous validation error messages
 */
function clearPreviousErrors() {
  for (const id of REQUIRED_FIELD_IDS) {
    const field = document.getElementById(id);
    if (field) field.classList.remove("input-error");
    const errorEl = document.getElementById(`error-${id}`);
    if (errorEl) errorEl.remove();
  }
}

/**
 * Marks a field as invalid with error message
 * @param {HTMLElement} field - Form field
 */
function markFieldAsInvalid(field) {
  field.classList.add("input-error");
  const existing = document.getElementById(`error-${field.id}`);
  if (existing) existing.remove();
  const error = document.createElement("span");
  error.id = `error-${field.id}`;
  error.className = "error-message";
  error.textContent = "This field is required";
  field.insertAdjacentElement("afterend", error);
}

/**
 * Resets the entire form to default values
 */
function clearForm() {
  clearFormInputs();
  resetPriority();
  clearAssignedDropdown();
  clearSubtasks();
}

/**
 * Clears all form input fields
 */
function clearFormInputs() {
  document.getElementById("task-title").value = "";
  document.getElementById("task-description").value = "";
  document.getElementById("task-category").selectedIndex = 0;
  document.getElementById("subtask-input").value = "";
}

/**
 * Resets priority to medium
 */
function resetPriority() {
  hiddenInput.value = "medium";
  lowBtn.classList.remove(ACTIVE_CLASS);
  urgentBtn.classList.remove(ACTIVE_CLASS);
  mediumBtn.classList.add(ACTIVE_CLASS);
}

/**
 * Clears the assigned dropdown and resets selectedUsers
 */
function clearAssignedDropdown() {
  const options = document.getElementById("assignedOptions");
  if (options) {
    for (const child of options.children) {
      child.classList.remove("checked");
    }
  }

  if (window.selectedUsers) window.selectedUsers.clear();
  updateDisplayText();
}


/**
 * Removes all subtasks from the list
 */
function clearSubtasks() {
  document.getElementById("subtask-list").innerHTML = "";
  clearDivider();
  updateAddUIState();
}


/**
 * Loads user data and creates the assigned dropdown
 * @returns {Promise<void>}
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
 * Fetches user data from Firebase
 * @returns {Promise<Object>} User data from database
 */
async function fetchUserData() {
  const response = await fetch(ADD_TASK_PATH_REGISTER + ".json");
  return await response.json();
}


/**
 * Creates the dropdown menu for user assignments
 * @param {HTMLElement} container - Container for the dropdown
 * @param {Object} data - User data from Firebase
 */
function buildDropdown(container, data) {
  container.innerHTML = "";
  window.selectedUsers = new Set();
  const display = createDisplayElement();        // #assignedDisplay
  const options = createOptionsContainer(data);  // #assignedOptions
  container.append(display, options);
}

/**
 * Creates the display element for the dropdown
 * @returns {HTMLElement} The display element
 */
function createDisplayElement() {
  const el = document.createElement("div");
  el.className = "select-display";
  el.id = "assignedDisplay";
  el.onclick = toggleDropdown;
  const text = document.createElement("span");
  text.className = "select-display-text";
  text.id = "assignedDisplayText";
  text.textContent = "Select contacts to assign";
  const arrow = document.createElement("span");
  arrow.className = "icon-assign";
  arrow.id = "assignedArrow";
  arrow.textContent = "▼";
  el.append(text, arrow);
  return el;
}

/**
 * Creates the container for dropdown options
 * @param {Object} data - User data
 * @returns {HTMLElement} Options container
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
 * Adds a dropdown option element
 * @param {HTMLElement} container - Options container
 * @param {string} id - User ID
 * @param {Object} user - User object with name and color
 */
function addOptionItem(container, id, user) {
  const item = document.createElement("div");
  item.className = "option-item";
  item.id = `option-${id}`;
  item.dataset.id = id;
  const userName = (user?.name || "").trim();
  const userIconText = initials(userName);
  const color = user?.color || "#393737";
  item.innerHTML = `
    <div class="user_icon" id="option-icon-${id}" style="background-color: ${color}">${userIconText}</div>
    <span class="option-user-name" id="option-name-${id}">${userName}</span>
    <span class="checkbox-square"></span>
  `;
  item.onclick = () => toggleUserById(id);
  container.appendChild(item);
}


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
 * Toggles the visibility of the dropdown menu
 */
function toggleDropdown() {
  const options = document.getElementById("assignedOptions");
  if (options) options.classList.toggle("show");
}


/**
 * Toggles a user in the selection and updates the display
 * @param {HTMLElement} item - The clicked option element
 * @param {string} id - User ID
 */
function toggleUser(item, id) {
  const selected = window.selectedUsers;
  selected.has(id) ? selected.delete(id) : selected.add(id);
  item.classList.toggle("checked");
  updateDisplayText();
}

function addSubtask(text) {
  if (!text.trim()) return;
  if (getSubtaskCount() >= MAX_SUBTASKS) {
    showMessage("You can add a maximum of 3 subtasks.", "error");
    clearDivider();
    updateAddUIState();
    return;
  }
  const item = createSubtaskElement(text);
  document.getElementById("subtask-list").appendChild(item);
  clearDivider();
  updateAddUIState();
  document.getElementById("subtask-input").value = "";
}

/**
 * Adds a new subtask
 * @param {string} text - Text of the subtask
 */


function createSubtaskElement(text) {
  subtaskUid++;
  const item = document.createElement("div");
  item.className = "subtask-item";
  item.id = `subtask-item-${subtaskUid}`;
  const left = document.createElement("div");
  left.className = "subtask-left";
  left.id = `subtask-left-${subtaskUid}`;
  const dot = createDot();
  dot.id = `subtask-dot-${subtaskUid}`;
  const span = createSpan(text);
  span.id = `subtask-text-${subtaskUid}`;
  left.append(dot, span);
  const buttons = createButtons(item, span);
  buttons.id = `subtask-buttons-${subtaskUid}`;
  item.dataset.leftId = left.id;
  item.dataset.textId = span.id;
  item.dataset.buttonsId = buttons.id;
  item.append(left, buttons);
  return item;
}


/**
 * Creates edit and delete buttons for a subtask
 * @param {HTMLElement} item - Subtask element
 * @param {HTMLElement} span - Text span
 * @returns {HTMLElement} Button container
 */
function createButtons(item, span) {
  const buttons = document.createElement("div");
  buttons.className = "subtask-buttons";
  const editBtn = createButton(editIcon, () => enterEditMode(item, span, buttons));
  const delBtn = createButton(deleteIcon, () => item.remove());
  buttons.append(editBtn, delBtn);
  return buttons;
}

/**
 * Switches to edit mode for a subtask
 * @param {HTMLElement} item - Subtask element
 * @param {HTMLElement} span - Text span
 * @param {HTMLElement} buttons - Button container
 */
function enterEditMode(item, span, buttons) {
  const left = document.getElementById(item.dataset.leftId);
  const btns = document.getElementById(item.dataset.buttonsId);
  const textSpan = document.getElementById(item.dataset.textId);
  if (!left || !btns || !textSpan) return;
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.value = textSpan.textContent;
  editInput.className = "edit-input";
  editInput.id = `edit-input-${item.id}`;
  btns.style.display = "none";
  rebuildLeft(left, createDot(), editInput);
  appendEditControls(left, editInput, textSpan, btns);
}



/**
 * Appends edit control buttons to the left container
 * @param {HTMLElement} left - Left container
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} span - Text span
 * @param {HTMLElement} buttons - Original buttons
 */
function appendEditControls(left, input, span, buttons) {
  const check = cloneButton("subtask-add");
  const cancel = cloneButton("subtask-clear");
  check.onclick = () => saveEdit(left, span, input, buttons);
  cancel.onclick = () => cancelEdit(left, span, buttons);
  const wrapper = document.createElement("div");
  wrapper.className = "subtask-input-wrapper";
  wrapper.append(input, check, cancel);
  left.append(wrapper);
}

/**
 * Saves changes to a subtask
 * @param {HTMLElement} left - Left container
 * @param {HTMLElement} span - Text span
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} buttons - Button container
 */
function saveEdit(left, span, input, buttons) {
  span.textContent = input.value.trim() || span.textContent;
  rebuildLeft(left, createDot(), span);
  buttons.style.display = "flex";
}

/**
 * Cancels editing a subtask
 * @param {HTMLElement} left - Left container
 * @param {HTMLElement} span - Text span
 * @param {HTMLElement} buttons - Button container
 */
function cancelEdit(left, span, buttons) {
  rebuildLeft(left, createDot(), span);
  buttons.style.display = "flex";
}

/**
 * Rebuilds the left side of a subtask element
 * @param {HTMLElement} left - Left container
 * @param {HTMLElement} dot - Dot element
 * @param {HTMLElement} contentElement - Content element (span or input)
 */
function rebuildLeft(left, dot, contentElement) {
  left.innerHTML = "";
  left.append(dot, contentElement);
}

/**
 * Displays a notification message
 * @param {string} message - Notification text
 * @param {string} type - Notification type ('info', 'error', 'success')
 */
function showMessage(message, type = "info") {
  const container = document.getElementById("notification-container");
  const note = document.createElement("div");
  note.className = `notification ${type}`;
  note.textContent = message;
  container.appendChild(note);
  setTimeout(() => {
    note.style.animation = "fadeOut 0.3s forwards";
  }, 2500);
  setTimeout(() => note.remove(), 3000);
}

/**
 * Disables the subtask input field
 */
function disableSubtaskInput() {
  const input = document.getElementById("subtask-input");
  const add = document.getElementById("subtask-add");
  if (input) input.disabled = true;
  if (add) add.disabled = true;
}

/**
 * Enables the subtask input field
 */
function enableSubtaskInput() {
  const input = document.getElementById("subtask-input");
  const add = document.getElementById("subtask-add");
  if (input) input.disabled = false;
  if (add) add.disabled = false;
}

/**
 * Updates the UI state based on subtask count
 */
function updateAddUIState() {
  if (getSubtaskCount() >= MAX_SUBTASKS) {
    disableSubtaskInput();
  } else {
    enableSubtaskInput();
  }
}
/**
 * Collects all subtasks for the database
 * @returns {Object} Subtask object with name and status
 */
function getSubtasksForDB() {
  const ul = document.getElementById("subtask-list");
  const subtasks = {};
  if (!ul) return subtasks;
  let index = 0;
  for (const item of ul.children) {
    if (!item.classList || !item.classList.contains("subtask-item")) continue;
    const left = item.getElementsByClassName("subtask-left")[0];
    const spans = left ? left.getElementsByTagName("span") : null;
    const name = spans && spans[0] ? spans[0].innerText.trim() : "";
    const done = item.classList.contains("done") || false;
    subtasks[index++] = { name, done };
  }
  return subtasks;
}


/**
 * Displays a success message for task creation
 */
function showSuccessMessage() {
  const msg = document.createElement("div");
  msg.textContent = "Task created successfully ✅";
  msg.style.color = "green";
  msg.style.marginTop = "10px";
  msg.style.fontWeight = "bold";
  msg.style.textAlign = "center";
  const host = document.getElementById("taskControlsButtons");
  if (host) host.appendChild(msg);
  setTimeout(() => msg.remove(), 3000);
}


/**
 * Marks required form fields with an asterisk (*)
 */
function requiredFieldMarker() {
  for (const id of REQUIRED_FIELD_IDS) {
    const field = document.getElementById(id);
    if (!field) continue;
    const label = document.querySelector(`label[for="${id}"]`);
    if (!label) continue;
    if (label.dataset.requiredMarked === "1") continue;
    const star = document.createElement("span");
    star.style.color = "red";
    star.textContent = " *";
    label.appendChild(star);
    label.dataset.requiredMarked = "1";
  }
}

function renderUserIcon() {
  const user = localStorage.getItem("username") || "";
  const iconDiv = document.getElementById("myIcon");
  if (iconDiv) iconDiv.textContent = initials(user);
}


/**
 * Initializes the add task page on load
 */
function init() {
  loadUserAssignments();
  requiredFieldMarker();
  document.getElementById("create-button").addEventListener("click", createTask);
  document.getElementById("clear-button").addEventListener("click", clearForm);
  renderUserIcon();
  updateAddUIState(); // <-- hinzufügen
}

init();