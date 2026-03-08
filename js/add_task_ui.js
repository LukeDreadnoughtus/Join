"use strict";
/**
 * Clears all form inputs and resets the form to initial state
 */
function clearForm() {
    clearPreviousErrors();
    clearFormInputs();
    resetPriority();
    clearAssignedDropdown();
    clearSubtasks();
}

/**
 * Clears all form input values
 */
function clearFormInputs() {
    const title = document.getElementById("task-title");
    const desc = document.getElementById("task-description");
    const cat = getContextElement("task-category");
    const dueDate = document.getElementById("task-due-date");
    const subInput = getContextElement("subtask-input");
    if (title) title.value = "";
    if (desc) desc.value = "";
    if (cat) {
        cat.removeAttribute("data-selected");
        const displayText = getContextElement("categoryDisplayText");
        if (displayText) displayText.textContent = "Select task category";
    }
    if (dueDate) dueDate.value = "";
    if (subInput) subInput.value = "";
}

/**
 * Clears all subtasks from the subtask list
 */
function clearSubtasks() {
    const ul = getContextElement("subtask-list");
    if (ul) ul.innerHTML = "";
    clearDivider();
    updateAddUIState();
}

/**
 * Clears all selected users from the assigned dropdown
 */
function clearAssignedDropdown() {
    const options = document.getElementById("assignedOptions");
    if (options) {
        for (const child of options.children) child.classList.remove("checked");
    }
    window.selectedUsers?.clear?.();
    updateDisplayText();
}

/**
 * Sets the active priority button and updates the hidden input
 * @param {HTMLElement} activeBtn - The priority button to set as active
 */
function setActivePriority(activeBtn) {
    const hiddenInput = document.getElementById("task-priority");
    const all = ["low", "medium", "urgent"].map(id => document.getElementById(id)).filter(Boolean);
    all.forEach(btn => btn.classList.remove("active", "overlay_active"));
    activeBtn.classList.add("active", "overlay_active");
    if (hiddenInput) hiddenInput.value = activeBtn.dataset.value;
}

/**
 * Resets the priority buttons to default (medium)
 */
function resetPriority() {
    const mediumBtn = document.getElementById("medium");
    const hiddenInput = document.getElementById("task-priority");
    if (hiddenInput) hiddenInput.value = "medium";
    ["low", "urgent", "medium"].forEach(id => document.getElementById(id)?.classList.remove("active", "overlay_active"));
    mediumBtn?.classList.add("active", "overlay_active");
}

/**
 * Adds asterisk markers to all required field labels
 */
function requiredFieldMarker() {
    const fieldsToMark = [...REQUIRED_FIELD_IDS, "task-category"];
    fieldsToMark.forEach(id => markFieldAsRequired(id));
}

/**
 * Marks a specific field's label with a red asterisk
 * @param {string} id - The field ID to mark
 */
function markFieldAsRequired(id) {
    const field = getContextElement(id);
    if (!field) return;
    let label;
    if (isOverlayContext()) {
        const overlay = document.getElementById("overlay");
        label = overlay ? overlay.querySelector(`span[data-for="${id}"]`) : null;
    } else {
        label = document.querySelector(`label[for="${id}"]`) || document.querySelector(`span[data-for="${id}"]`);
    }
    if (!label || label.dataset.requiredMarked === "1") return;
    const star = document.createElement("span");
    star.style.color = "red";
    star.textContent = " *";
    label.appendChild(star);
    label.dataset.requiredMarked = "1";
}

/**
 * Renders the user's initials in the header icon
 */
function renderUserIcon() {
    const user = localStorage.getItem("username") || "";
    const iconDiv = document.getElementById("myIcon");
    if (iconDiv) iconDiv.textContent = initials(user);
}

/**
 * Toggles the visibility of the category dropdown
 */
function toggleCategoryDropdown() {
    const options = getContextElement("categoryOptions");
    const arrow = getContextElement("categoryArrow");
    if (!options) return;
    options.classList.toggle("show");
    if (arrow) arrow.classList.toggle("rotate");
}

/**
 * Closes the category dropdown
 */
function closeCategoryDropdown() {
    const options = getContextElement("categoryOptions");
    const arrow = getContextElement("categoryArrow");
    if (options) options.classList.remove("show");
    if (arrow) arrow.classList.remove("rotate");
}

/**
 * Creates the category options container element
 * @returns {HTMLDivElement} The options container
 */
function createCategoryOptionsContainer() {
    const options = document.createElement("div");
    options.className = "select-options";
    options.id = getContextId("categoryOptions");
    addCategoryItems(options);
    return options;
}

/**
 * Adds category items to the options container
 * @param {HTMLElement} options - The options container element
 */
function addCategoryItems(options) {
    const items = [
        { value: "Technical Task", text: "Technical Task" },
        { value: "User Story", text: "User Story" },
    ];
    items.forEach(it => options.appendChild(createCategoryItem(it)));
}

/**
 * Creates a single category item element
 * @param {Object} it - The category item data with value and text
 * @returns {HTMLDivElement} The category item element
 */
function createCategoryItem(it) {
    const item = document.createElement("div");
    item.className = "option-item";
    item.setAttribute("data-value", it.value);
    item.textContent = it.text;
    item.onclick = () => setCategory(it.value, it.text);
    return item;
}

/**
 * Creates the display element for the category dropdown
 * @returns {HTMLDivElement} The display element
 */
function createCategoryDisplayElement() {
    const el = document.createElement("div");
    el.className = "select-display";
    el.id = getContextId("categoryDisplay");
    el.onclick = toggleCategoryDropdown;
    const text = document.createElement("span");
    text.className = "select-display-text";
    text.id = getContextId("categoryDisplayText");
    text.textContent = "Select task category";
    const arrow = document.createElement("span");
    arrow.className = "icon-assign";
    arrow.id = getContextId("categoryArrow");
    arrow.textContent = "▼";
    el.append(text, arrow);
    return el;
}

/**
 * Builds the complete category dropdown with display and options
 */
function buildCategoryDropdown() {
    const container = getContextElement("task-category");
    if (!container) return;
    container.innerHTML = "";
    container.append(createCategoryDisplayElement(), createCategoryOptionsContainer());
    attachOutsideClickHandlerForCategoryDropdown();
}

/**
 * Sets the selected category value and updates the display
 * @param {string} value - The category value
 * @param {string} text - The category display text
 */
function setCategory(value, text) {
    const container = getContextElement("task-category");
    const displayText = getContextElement("categoryDisplayText");
    if (!container || !displayText) return;
    container.setAttribute("data-selected", value);
    displayText.textContent = text;
    closeCategoryDropdown();
}

/**
 * Checks if a click occurred inside the category dropdown
 * @param {EventTarget} target - The click event target
 * @returns {boolean} True if click was inside the dropdown
 */
function isClickInsideCategoryDropdown(target) {
    const display = getContextElement("categoryDisplay");
    const options = getContextElement("categoryOptions");
    return (display && display.contains(target)) || (options && options.contains(target));
}

/**
 * Attaches a click handler to close dropdown when clicking outside
 */
function attachOutsideClickHandlerForCategoryDropdown() {
    if (window.__categoryOutsideClickBound) return;
    window.__categoryOutsideClickBound = true;
    document.addEventListener("click", e => {
        if (!isClickInsideCategoryDropdown(e.target)) closeCategoryDropdown();
    });
}

/**
 * Sets the minimum selectable due date to today and wires up live validation
 */
function setMinDueDate() {
    const dueDate = document.getElementById("task-due-date");
    if (!dueDate) return;
    dueDate.min = getTodayString();
    dueDate.addEventListener("input", validateDueDateNotPast);
    dueDate.addEventListener("change", validateDueDateNotPast);
}

/**
 * Initializes the add task form with all event listeners and UI elements
 */
function initAddTask() {
    attachEventListeners();
    initializeDropdowns();
    initializeUI();
}

/**
 * Attaches event listeners to form buttons
 */
function attachEventListeners() {
    const createBtn = document.getElementById("create-button");
    const clearBtn = document.getElementById("clear-button");
    if (createBtn) createBtn.addEventListener("click", createTask);
    if (clearBtn) clearBtn.addEventListener("click", clearForm);
    attachPriorityListeners();
}

/**
 * Attaches event listeners to priority buttons
 */
function attachPriorityListeners() {
    ["low", "medium", "urgent"].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener("click", () => setActivePriority(btn));
    });
}

/**
 * Initializes all dropdown elements (assigned users and category)
 */
function initializeDropdowns() {
    if (document.getElementById("task-assigned-to")) loadUserAssignments();
    buildCategoryDropdown();
}

/**
 * Initializes UI elements and states
 */
function initializeUI() {
    requiredFieldMarker();
    renderUserIcon();
    wireSubtaskInputRow();
    updateAddUIState();
    setMinDueDate();
}

document.addEventListener("DOMContentLoaded", initAddTask);