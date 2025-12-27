"use strict";

function updateAddUIState() {
  const ul = document.getElementById("subtask-list");
  const input = document.getElementById("subtask-input");
  const add = document.getElementById("subtask-add");
  if (!ul || !input || !add) return;
  if (getSubtaskCount() >= MAX_SUBTASKS) {
    input.disabled = true;
    add.disabled = true;
  } else {
    input.disabled = false;
    add.disabled = false;
  }
}

function wireSubtaskInputRow() {
  const input = document.getElementById("subtask-input");
  const addIcon = document.getElementById("subtask-add");
  const clearIcon = document.getElementById("subtask-clear");
  const divider = document.getElementById("dividerSubtasks");
  if (!input || !addIcon || !clearIcon || !divider) return;
  input.addEventListener("input", () => {
    const hasText = input.value.trim().length > 0
    addIcon.classList.toggle("hidden", !hasText);
    addIcon.classList.toggle("overlay_hidden", !hasText);
    divider.classList.toggle("hidden", !hasText);
    divider.classList.toggle("overlay_hidden", !hasText);
    clearIcon.classList.toggle("hidden", !hasText);
    clearIcon.classList.toggle("overlay_hidden", !hasText);
  });

  addIcon.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;
    addSubtask(text);
    input.value = "";
    addIcon.classList.add("hidden", "overlay_hidden");
    clearIcon.classList.add("hidden", "overlay_hidden");
    divider.classList.add("hidden", "overlay_hidden");
  });

  clearIcon.addEventListener("click", () => {
    input.value = "";
    divider.classList.add("hidden", "overlay_hidden");
    addIcon.classList.add("hidden", "overlay_hidden");
    clearIcon.classList.add("hidden", "overlay_hidden");
  });
}

function addSubtask(text) {
  if (!text.trim()) return;
  if (getSubtaskCount() >= MAX_SUBTASKS) {
    showMessage("You can add a maximum of 3 subtasks.", "error");
    clearDivider();
    updateAddUIState();
    return;
  }
  const ul = document.getElementById("subtask-list");
  if (!ul) return;
  const item = createSubtaskElement(text);
  ul.appendChild(item);
  clearDivider();
  updateAddUIState();
}

function createSubtaskElement(text) {
  subtaskUid++;
  const item = document.createElement("div");
  item.className = "subtask-item";
  item.id = `subtask-item-${subtaskUid}`;
  const left = document.createElement("div");
  left.className = "subtask-left";
  left.id = `subtask-left-${subtaskUid}`;
  const dot = document.createElement("div");
  dot.className = "subtask-dot";
  dot.id = `subtask-dot-${subtaskUid}`;
  const span = document.createElement("span");
  span.className = "subtask-text";
  span.id = `subtask-text-${subtaskUid}`;
  span.textContent = text;
  left.append(dot, span);
  const actions = document.createElement("div");
  actions.className = "subtask-actions";
  actions.id = `subtask-actions-${subtaskUid}`;
  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "subtask-action-btn subtask-edit-btn";
  editBtn.innerHTML = editIcon;
  editBtn.addEventListener("click", () => enterEditMode(item, span, actions));
  const separator = document.createElement("div");
  separator.className = "subtask-separator";
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "subtask-action-btn subtask-delete-btn";
  delBtn.innerHTML = deleteIcon;
  delBtn.addEventListener("click", () => {
    item.remove();
    updateAddUIState();
  });
  actions.append(editBtn, separator, delBtn);
  item.dataset.leftId = left.id;
  item.dataset.textId = span.id;
  item.dataset.buttonsId = actions.id;
  item.append(left, actions);
  return item;
}


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


function enterEditMode(item, span, buttons) {
  const left = document.getElementById(item.dataset.leftId) || item.querySelector(".subtask-left");
  const btns = document.getElementById(item.dataset.buttonsId) || buttons;
  const textSpan = document.getElementById(item.dataset.textId) || span;
  if (!left || !btns || !textSpan) return;
  btns.style.display = "none";
  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.value = textSpan.textContent.trim();
  editInput.className = "edit-input";
  const editWrap = document.createElement("div");
  editWrap.className = "subtask-edit-wrapper";
  editWrap.appendChild(editInput);
  const divider = document.createElement("div");
  divider.className = "subtask-edit-divider";
  const check = cloneSvgIcon("subtask-add", "subtask-edit-icon subtask-edit-check");
  const cancel = cloneSvgIcon("subtask-clear", "subtask-edit-icon subtask-edit-cancel");
  check.addEventListener("click", () => {
    const newValue = editInput.value.trim();
    if (newValue) textSpan.textContent = newValue;
    rebuildLeft(left, createDot(), textSpan);
    btns.style.display = "flex";
    updateAddUIState();
  });
  cancel.addEventListener("click", () => {
    rebuildLeft(left, createDot(), textSpan);
    btns.style.display = "flex";
    updateAddUIState();
  });
  editWrap.append(divider, check, cancel);
  rebuildLeft(left, createDot(), editWrap);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);
}
