"use strict";

/**
 * Updates the UI state based on subtask count (enables/disables add button)
 */
function updateAddUIState() {
  const ul = getContextElement("subtask-list");
  const input = getContextElement("subtask-input");
  const add = getContextElement("subtask-add");
  if (!ul || !input || !add) return;
  if (getSubtaskCount() >= MAX_SUBTASKS) {
    input.disabled = true;
    add.disabled = true;
  } else {
    input.disabled = false;
    add.disabled = false;
  }
}


/**
 * Wires up all event listeners for the subtask input row
 */
function wireSubtaskInputRow() {
  const elements = getSubtaskInputElements();
  if (!elements) return;
  attachInputEventListener(elements);
  attachAddIconListener(elements);
  attachClearIconListener(elements);
  attachEnterKeyListener(elements);
}


/**
 * Gets all required elements for the subtask input row
 * @returns {Object|null} Object with input elements or null if any missing
 */
function getSubtaskInputElements() {
  const input = getContextElement("subtask-input");
  const addIcon = getContextElement("subtask-add");
  const clearIcon = getContextElement("subtask-clear");
  const divider = getContextElement("dividerSubtasks");
  
  // Try to find wrapper - either regular or overlay version
  let wrapper = null;
  if (isOverlayContext()) {
    wrapper = document.querySelector(".overlay_subtask-icons-wrapper");
  } else {
    wrapper = document.querySelector(".subtask-icons-wrapper");
  }
  
  if (!input || !addIcon || !clearIcon || !divider || !wrapper) return null;
  return { input, addIcon, clearIcon, divider, wrapper };
}


/**
 * Attaches input event listener to show/hide action icons
 * @param {Object} elements - The subtask input elements object
 */
function attachInputEventListener(elements) {
  elements.input.addEventListener("input", () => {
    const hasText = elements.input.value.trim().length > 0;
    elements.wrapper.classList.toggle("hidden", !hasText);
    elements.wrapper.classList.toggle("overlay_hidden", !hasText);
  });
}


/**
 * Attaches click listener to the add subtask icon
 * @param {Object} elements - The subtask input elements object
 */
function attachAddIconListener(elements) {
  elements.addIcon.addEventListener("click", () => {
    const text = elements.input.value.trim();
    if (!text) return;
    addSubtask(text);
    elements.input.value = "";
    elements.wrapper.classList.add("hidden", "overlay_hidden");
  });
}


/**
 * Attaches click listener to the clear input icon
 * @param {Object} elements - The subtask input elements object
 */
function attachClearIconListener(elements) {
  elements.clearIcon.addEventListener("click", () => {
    elements.input.value = "";
    elements.wrapper.classList.add("hidden", "overlay_hidden");
  });
}


/**
 * Attaches Enter key listener to add subtask on Enter press
 * @param {Object} elements - The subtask input elements object
 */
function attachEnterKeyListener(elements) {
  elements.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const text = elements.input.value.trim();
      if (!text) return;
      addSubtask(text);
      elements.input.value = "";
      elements.wrapper.classList.add("hidden", "overlay_hidden");
    }
  });
}


/**
 * Adds a new subtask to the list
 * @param {string} text - The subtask text
 */
function addSubtask(text) {
  if (!text.trim()) return;
  if (getSubtaskCount() >= MAX_SUBTASKS) {
    showMessage("You can add a maximum of 3 subtasks.", "error");
    clearDivider();
    updateAddUIState();
    return;
  }
  const ul = getContextElement("subtask-list");
  if (!ul) return;
  const item = createSubtaskElement(text);
  ul.appendChild(item);
  clearDivider();
  updateAddUIState();
}


/**
 * Creates a complete subtask element with all children
 * @param {string} text - The subtask text
 * @returns {HTMLDivElement} The complete subtask item element
 */
function createSubtaskElement(text) {
  subtaskUid++;
  const item = createSubtaskItemContainer();
  const left = createSubtaskLeftSection(text);
  const actions = createSubtaskActions(item, left);
  setupSubtaskItemClick(item, left, actions);
  item.append(left, actions);
  return item;
}


/**
 * Creates the main container for a subtask item
 * @returns {HTMLDivElement} The subtask item container
 */
function createSubtaskItemContainer() {
  const item = document.createElement("div");
  item.className = "subtask-item";
  item.id = `subtask-item-${subtaskUid}`;
  return item;
}


/**
 * Creates the left section of a subtask (dot and text)
 * @param {string} text - The subtask text
 * @returns {HTMLDivElement} The left section element
 */
function createSubtaskLeftSection(text) {
  const left = document.createElement("div");
  left.className = "subtask-left";
  left.id = `subtask-left-${subtaskUid}`;
  const dot = createSubtaskDot();
  const span = createSubtaskTextSpan(text);
  left.append(dot, span);
  return left;
}


/**
 * Creates a dot element for a subtask
 * @returns {HTMLDivElement} The dot element
 */
function createSubtaskDot() {
  const dot = document.createElement("div");
  dot.className = "subtask-dot";
  dot.id = `subtask-dot-${subtaskUid}`;
  return dot;
}


/**
 * Creates a text span for a subtask
 * @param {string} text - The subtask text
 * @returns {HTMLSpanElement} The text span element
 */
function createSubtaskTextSpan(text) {
  const span = document.createElement("span");
  span.className = "subtask-text";
  span.id = `subtask-text-${subtaskUid}`;
  span.textContent = text;
  return span;
}


/**
 * Creates the actions section with edit and delete buttons
 * @param {HTMLElement} item - The subtask item element
 * @param {HTMLElement} left - The left section element
 * @returns {HTMLDivElement} The actions container element
 */
function createSubtaskActions(item, left) {
  const actions = document.createElement("div");
  actions.className = "subtask-actions";
  actions.id = `subtask-actions-${subtaskUid}`;
  const editBtn = createEditButton(item, left, actions);
  const separator = createActionSeparator();
  const delBtn = createDeleteButton(item);
  actions.append(editBtn, separator, delBtn);
  return actions;
}


/**
 * Creates the edit button for a subtask
 * @param {HTMLElement} item - The subtask item element
 * @param {HTMLElement} left - The left section element
 * @param {HTMLElement} actions - The actions container element
 * @returns {HTMLButtonElement} The edit button element
 */
function createEditButton(item, left, actions) {
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "subtask-action-btn subtask-edit-btn";
  editBtn.innerHTML = editIcon;
  const span = left.querySelector(".subtask-text");
  editBtn.addEventListener("click", () => enterEditMode(item, span, actions));
  return editBtn;
}


/**
 * Creates a separator element between action buttons
 * @returns {HTMLDivElement} The separator element
 */
function createActionSeparator() {
  const separator = document.createElement("div");
  separator.className = "subtask-separator";
  return separator;
}


/**
 * Creates the delete button for a subtask
 * @param {HTMLElement} item - The subtask item element
 * @returns {HTMLButtonElement} The delete button element
 */
function createDeleteButton(item) {
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "subtask-action-btn subtask-delete-btn";
  delBtn.innerHTML = deleteIcon;
  delBtn.addEventListener("click", () => {
    item.remove();
    updateAddUIState();
  });
  return delBtn;
}


/**
 * Sets up click event listener for the subtask item
 * @param {HTMLElement} item - The subtask item element
 * @param {HTMLElement} left - The left section element
 * @param {HTMLElement} actions - The actions container element
 */
function setupSubtaskItemClick(item, left, actions) {
  const span = left.querySelector(".subtask-text");
  const dot = left.querySelector(".subtask-dot");
  item.dataset.leftId = left.id;
  item.dataset.textId = span.id;
  item.dataset.buttonsId = actions.id;
  item.dataset.dotId = dot.id;
  item.addEventListener("click", (e) => {
    if (e.target.closest(".subtask-actions")) return;
    if (e.target.closest(".subtask-edit-wrapper")) return;
    enterEditMode(item, span, actions);
  });
}


/**
 * Creates action buttons for a subtask
 * @param {HTMLElement} item - The subtask item element
 * @param {HTMLSpanElement} span - The text span element
 * @returns {HTMLDivElement} The buttons container element
 */
function createButtons(item, span) {
  const buttons = document.createElement("div");
  buttons.className = "subtask-buttons";
  const editBtn = createButtons(editIcon, () => enterEditMode(item, span, buttons));
  const delBtn = createButtons(deleteIcon, () => {
    item.remove();
    updateAddUIState();
  });
  buttons.append(editBtn, delBtn);
  return buttons;
}


/**
 * Enters edit mode for a subtask item
 * @param {HTMLElement} item - The subtask item element
 * @param {HTMLSpanElement} span - The text span element
 * @param {HTMLElement} buttons - The buttons container element
 */
function enterEditMode(item, span, buttons) {
  const elements = getEditModeElements(item, span, buttons);
  if (!elements) return;
  hideEditModeButtons(elements);
  const editWrap = createEditWrapper(elements);
  rebuildLeft(elements.left, createDot(), editWrap);
  focusEditInput(editWrap);
}


/**
 * Gets all required elements for edit mode
 * @param {HTMLElement} item - The subtask item element
 * @param {HTMLSpanElement} span - The text span element
 * @param {HTMLElement} buttons - The buttons container element
 * @returns {Object|null} Object with edit elements or null if any missing
 */
function getEditModeElements(item, span, buttons) {
  const left = document.getElementById(item.dataset.leftId) || item.querySelector(".subtask-left");
  const btns = document.getElementById(item.dataset.buttonsId) || buttons;
  const textSpan = document.getElementById(item.dataset.textId) || span;
  const dot = document.getElementById(item.dataset.dotId) || item.querySelector(".subtask-dot");
  if (!left || !btns || !textSpan) return null;
  return { left, btns, textSpan, dot };
}


/**
 * Hides the edit mode buttons and dot
 * @param {Object} elements - The edit mode elements object
 */
function hideEditModeButtons(elements) {
  elements.btns.style.display = "none";
  if (elements.dot) elements.dot.style.display = "none";
}


/**
 * Creates the edit wrapper with input and action icons
 * @param {Object} elements - The edit mode elements object
 * @returns {HTMLDivElement} The edit wrapper element
 */
function createEditWrapper(elements) {
  const editInput = createEditInput(elements.textSpan);
  const editWrap = document.createElement("div");
  editWrap.className = "subtask-edit-wrapper";
  editWrap.appendChild(editInput);
  editWrap.addEventListener("click", (e) => e.stopPropagation());
  const divider = createEditDivider();
  const { check, cancel } = createEditIcons(elements, editInput);
  editWrap.append(divider, check, cancel);
  return editWrap;
}


/**
 * Creates an input element for editing subtask text
 * @param {HTMLSpanElement} textSpan - The text span element
 * @returns {HTMLInputElement} The input element
 */
function createEditInput(textSpan) {
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.value = textSpan.textContent.trim();
  editInput.className = "edit-input";
  editInput.name = "subtask-edit";
  return editInput;
}


/**
 * Creates a divider element for the edit mode
 * @returns {HTMLDivElement} The divider element
 */
function createEditDivider() {
  const divider = document.createElement("div");
  divider.className = "subtask-edit-divider";
  return divider;
}


/**
 * Creates check and cancel icons for edit mode
 * @param {Object} elements - The edit mode elements object
 * @param {HTMLInputElement} editInput - The edit input element
 * @returns {Object} Object with check and cancel icon elements
 */
function createEditIcons(elements, editInput) {
  const checkId = getContextId("subtask-add");
  const cancelId = getContextId("subtask-clear");
  const check = cloneSvgIcon(checkId, "subtask-edit-icon subtask-edit-check");
  const cancel = cloneSvgIcon(cancelId, "subtask-edit-icon subtask-edit-cancel");
  attachCheckListener(check, elements, editInput);
  attachCancelListener(cancel, elements);
  return { check, cancel };
}


/**
 * Attaches click listener to the check icon to save changes
 * @param {HTMLElement} check - The check icon element
 * @param {Object} elements - The edit mode elements object
 * @param {HTMLInputElement} editInput - The edit input element
 */
function attachCheckListener(check, elements, editInput) {
  check.addEventListener("click", (e) => {
    e.stopPropagation();
    const newValue = editInput.value.trim();
    if (newValue) elements.textSpan.textContent = newValue;
    restoreNormalMode(elements);
  });
}


/**
 * Attaches click listener to the cancel icon to discard changes
 * @param {HTMLElement} cancel - The cancel icon element
 * @param {Object} elements - The edit mode elements object
 */
function attachCancelListener(cancel, elements) {
  cancel.addEventListener("click", (e) => {
    e.stopPropagation();
    restoreNormalMode(elements);
  });
}


/**
 * Restores the subtask item to normal (non-edit) mode
 * @param {Object} elements - The edit mode elements object
 */
function restoreNormalMode(elements) {
  rebuildLeft(elements.left, createDot(), elements.textSpan);
  elements.btns.style.display = "flex";
  if (elements.dot) elements.dot.style.display = "block";
  updateAddUIState();
}


/**
 * Focuses the edit input and moves cursor to end
 * @param {HTMLElement} editWrap - The edit wrapper element
 */
function focusEditInput(editWrap) {
  const editInput = editWrap.querySelector(".edit-input");
  if (editInput) {
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);
  }
}