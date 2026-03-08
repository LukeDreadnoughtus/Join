"use strict";

/**
 * Collects and returns all task data from the form
 * @returns {Object} The task data object with all form values
 */
function getTaskDataFromForm() {
    const boardSlotEl = getContextElement("board-slot");
    const boardSlot = boardSlotEl?.value || "todo";
    return {
        title: getContextElement("task-title")?.value || "",
        boardslot: boardSlot,
        description: getContextElement("task-description")?.value || "",
        category: getContextElement("task-category")?.getAttribute("data-selected") || "",
        assigned: Array.from(window.selectedUsers?.keys?.() || []),
        priority: getContextElement("task-priority")?.value || "",
        subtasks: getSubtasksForDB(),
        duedate: getContextElement("task-due-date")?.value || "",
    };
}

/**
 * Retrieves subtasks from the list and formats them for database storage
 * @returns {Object} The subtasks object indexed by number
 */
function getSubtasksForDB() {
    const ul = getContextElement("subtask-list");
    const subtasks = {};
    if (!ul) return subtasks;
    collectSubtasksFromList(ul, subtasks);
    return subtasks;
}

/**
 * Collects subtasks from the list and adds them to the subtasks object
 * @param {HTMLElement} ul - The subtask list element
 * @param {Object} subtasks - The subtasks object to populate
 */
function collectSubtasksFromList(ul, subtasks) {
    let index = 0;
    for (const item of ul.children) {
        if (!item.classList || !item.classList.contains("subtask-item")) continue;
        const { name, done } = extractSubtaskItemData(item);
        subtasks[index++] = { name, done };
    }
}

/**
 * Extracts name and done status from a subtask item
 * @param {HTMLElement} item - The subtask item element
 * @returns {Object} Object containing name and done properties
 */
function extractSubtaskItemData(item) {
    const left = item.getElementsByClassName("subtask-left")[0];
    const textSpan = left ? left.getElementsByClassName("subtask-text")[0] : null;
    const name = textSpan ? textSpan.innerText.trim() : "";
    const done = item.classList.contains("done") || false;
    return { name, done };
}

/**
 * Creates a new task from form data and saves it to Firebase
 * @async
 * @param {Event} event - The form submit event
 */
async function createTask(event) {
    event.preventDefault();
    if (!validateForm()) return;
    disableFormButtons(true);
    const newTask = getTaskDataFromForm();
    try {
        await saveTaskToFirebase(newTask);
    } catch (error) {
        console.error("Firebase error:", error);
        disableFormButtons(false);
    }
}

/**
 * Enables or disables all interaction while task is being created
 * @param {boolean} disabled - Whether interaction should be blocked
 */
function disableFormButtons(disabled) {
    const overlay = document.getElementById('overlay');
    if (overlay && !overlay.classList.contains('overlay_hidden')) {
        overlay.classList.toggle("task-creating", disabled);
    } else {
        document.body.classList.toggle("task-creating", disabled);
    }
}

/**
 * Saves the task data to Firebase database
 * @async
 * @param {Object} newTask - The task data object to save
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
 * Validates all required fields in the form
 * @returns {boolean} True if all required fields are valid
 */
function validateForm() {
    clearPreviousErrors();
    const fieldsToValidate = [...REQUIRED_FIELD_IDS, "task-category"];
    return checkAllFields(fieldsToValidate);
}

/**
 * Checks all fields in the validation list
 * @param {string[]} fieldsToValidate - Array of field IDs to validate
 * @returns {boolean} True if all fields are valid
 */
function checkAllFields(fieldsToValidate) {
    let isValid = true;
    for (const id of fieldsToValidate) {
        if (!validateField(id)) isValid = false;
    }
    return isValid;
}

/**
 * Validates a single field by ID
 * @param {string} id - The field ID to validate
 * @returns {boolean} True if the field is valid or not found
 */
function validateField(id) {
    const field = getContextElement(id);
    if (!field) return true;
    const value = field.value !== undefined
        ? String(field.value ?? "").trim()
        : String(field.getAttribute("data-selected") ?? "").trim();
    if (!value) {
        markFieldAsInvalid(field);
        return false;
    }
    if (id === "task-due-date" && value < getTodayString()) {
        markFieldWithCustomError(field, "Due date must be today or in the future");
        return false;
    }
    return true;
}

/**
 * Clears all previous error messages and styling from form fields
 */
function clearPreviousErrors() {
    const fieldsToValidate = [...REQUIRED_FIELD_IDS, "task-category"];
    fieldsToValidate.forEach(id => clearFieldError(id));
}

/**
 * Clears the error state and message for a specific field
 * @param {string} id - The field ID to clear errors from
 */
function clearFieldError(id) {
    const field = getContextElement(id);
    if (field) field.classList.remove("input-error");
    const errorIds = new Set([
        `error-${id}`,
        `error-${getContextId(id)}`,
        field ? `error-${field.id}` : null,
    ]);
    errorIds.forEach((errId) => {
        if (!errId) return;
        const errorEl = document.getElementById(errId);
        if (errorEl) errorEl.remove();
    });
}

/**
 * Marks a field as invalid with error styling and message
 * @param {HTMLElement} field - The field element to mark as invalid
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
 * Marks a field as invalid with a custom error message
 * @param {HTMLElement} field - The field element to mark as invalid
 * @param {string} message - The error message to display
 */
function markFieldWithCustomError(field, message) {
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
 * Returns today's date as a YYYY-MM-DD string
 * @returns {string}
 */
function getTodayString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Validates that the due date is not in the past (live validation on input/change)
 */
function validateDueDateNotPast() {
    const dueDate = document.getElementById("task-due-date");
    if (!dueDate) return;
    clearFieldError("task-due-date");
    const value = dueDate.value;
    if (!value) return;
    if (value < getTodayString()) {
        markFieldWithCustomError(dueDate, "Due date must be today or in the future");
    }
}

/**
 * Displays a success notification message to the user
 */
function showSuccessMessage() {
    const msg = document.createElement("div");
    msg.className = "success-notification";
    msg.append(createSuccessIcon(), createSuccessText());
    document.body.appendChild(msg);
    setTimeout(() => {
        msg.remove();
        reloadBoardIfOnBoardPage();
    }, 3000);
}

/**
 * Navigates to board or reloads it after task creation
 */
function reloadBoardIfOnBoardPage() {
    const currentPage = window.location.pathname.split('/').pop() || '';
    if (currentPage.toLowerCase() === 'add_task.html') {
        window.location.href = 'board.html';
    } else if (currentPage.toLowerCase() === 'board.html' && typeof init === 'function') {
        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.classList.remove('task-creating');
            overlay.classList.add('overlay_hidden');
        }
        document.body.classList.remove('task-creating');
        if (typeof allTasks !== 'undefined') allTasks = {};
        if (typeof clearBoardSlots === 'function') clearBoardSlots();
        init();
    }
}

/**
 * Creates the success icon element with SVG
 * @returns {HTMLDivElement} The icon element
 */
function createSuccessIcon() {
    const icon = document.createElement("div");
    icon.innerHTML = `<svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.9546 5.73855L22.9546 26.1929C22.954 26.7955 22.7143 27.3732 22.2882 27.7993C21.8622 28.2253 21.2844 28.465 20.6819 28.4656L16.1365 28.4656C15.5339 28.465 14.9562 28.2253 14.5301 27.7993C14.104 27.3732 13.8644 26.7955 13.8638 26.1929L13.8638 5.73855C13.8644 5.13597 14.104 4.55825 14.5301 4.13217C14.9562 3.70608 15.5339 3.46644 16.1365 3.46584L20.6819 3.46584C21.2844 3.46644 21.8622 3.70608 22.2882 4.13217C22.7143 4.55825 22.954 5.13597 22.9546 5.73855ZM16.1365 26.1929L20.6819 26.1929L20.6819 5.73855L16.1365 5.73855L16.1365 26.1929ZM16.1365 5.73855L16.1365 26.1929C16.1359 26.7955 15.8962 27.3731 15.4701 27.7992C15.0441 28.2253 14.4663 28.4649 13.8638 28.4655L9.31835 28.4655C8.71578 28.4649 8.13806 28.2253 7.71197 27.7992C7.28589 27.3731 7.04625 26.7954 7.04565 26.1928L7.04565 5.73852C7.04625 5.13595 7.28589 4.55823 7.71197 4.13214C8.13806 3.70606 8.71578 3.46642 9.31835 3.46582L13.8638 3.46582C14.4663 3.46642 15.0441 3.70606 15.4701 4.13214C15.8962 4.55823 16.1359 5.13597 16.1365 5.73855ZM9.31835 26.1928L13.8638 26.1929L13.8638 5.73855L9.31835 5.73852L9.31835 26.1928ZM9.31835 5.73852L9.31835 26.1928C9.31775 26.7954 9.07811 27.3731 8.65203 27.7992C8.22594 28.2253 7.64822 28.4649 7.04565 28.4656L2.50024 28.4656C1.89767 28.4649 1.31995 28.2253 0.893863 27.7992C0.467779 27.3731 0.228141 26.7954 0.227539 26.1928L0.227538 5.73852C0.22814 5.13595 0.467778 4.55823 0.893862 4.13214C1.31995 3.70606 1.89767 3.46642 2.50024 3.46582L7.04565 3.46582C7.64822 3.46642 8.22594 3.70606 8.65203 4.13214C9.07811 4.55823 9.31775 5.13595 9.31835 5.73852ZM2.50024 26.1928L7.04565 26.1928L7.04565 5.73852L2.50024 5.73852L2.50024 26.1928Z" fill="#fff"/>
    <path d="M29.7727 5.7388L29.7727 26.1931C29.7721 26.7957 29.5324 27.3734 29.1064 27.7995C28.6803 28.2256 28.1026 28.4652 27.5 28.4658L22.9546 28.4658C22.352 28.4652 21.7743 28.2256 21.3482 27.7995C20.9221 27.3734 20.6825 26.7955 20.6819 26.1929L20.6819 5.73855C20.6825 5.13597 20.9221 4.5585 21.3482 4.13242C21.7743 3.70633 22.352 3.4667 22.9546 3.46609L27.5 3.46609C28.1026 3.4667 28.6803 3.70633 29.1064 4.13242C29.5324 4.5585 29.7721 5.13622 29.7727 5.7388ZM22.9546 26.1929L27.5 26.1931L27.5 5.7388L22.9546 5.73855L22.9546 26.1929Z" fill="#fff"/>
    </svg>`;
    icon.style.cssText = "display:inline-block;margin-right:8px;vertical-align:middle;";
    return icon;
}

/**
 * Creates the success message text element
 * @returns {HTMLSpanElement} The text element
 */
function createSuccessText() {
    const text = document.createElement("span");
    text.textContent = "Task added to Board";
    text.style.verticalAlign = "middle";
    return text;
}