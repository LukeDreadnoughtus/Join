const path = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";
const pathRegister = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";
const lowBtn = document.getElementById('low');
const mediumBtn = document.getElementById('medium');
const urgentBtn = document.getElementById('urgent');
const hiddenInput = document.getElementById('task-priority');
const MAX_SUBTASKS = 3;
const editIcon = `
<svg width="19" height="19" viewBox="0 0 19 19" fill="none">
  <path d="M2 16.25H3.4L12.025 7.625L10.625 6.225L2 14.85V16.25ZM16.3 6.175L12.05 1.975L13.45 0.575C13.8333 0.191667 14.3042 0 14.8625 0C15.4208 0 15.8917 0.191667 16.275 0.575L17.675 1.975C18.0583 2.35833 18.2583 2.82083 18.275 3.3625C18.2917 3.90417 18.1083 4.36667 17.725 4.75L16.3 6.175ZM14.85 7.65L4.25 18.25H0V14L10.6 3.4L14.85 7.65Z" fill="#2A3647"/>
</svg>`;
const deleteIcon = `
<svg width="16" height="18" viewBox="0 0 16 18" fill="none">
  <path d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3C0.716667 3 0.479167 2.90417 0.2875 2.7125C0.0958333 2.52083 0 2.28333 0 2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1H5C5 0.716667 5.09583 0.479167 5.2875 0.2875C5.47917 0.0958333 5.71667 0 6 0H10C10.2833 0 10.5208 0.0958333 10.7125 0.2875C10.9042 0.479167 11 0.716667 11 1H15C15.2833 1 15.5208 1.09583 15.7125 1.2875C15.9042 1.47917 16 1.71667 16 2C16 2.28333 15.9042 2.52083 15.7125 2.7125C15.5208 2.90417 15.2833 3 15 3V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3Z" fill="#2A3647"/>
</svg>`;
const input = document.getElementById("subtask-tags");
const addIcon = document.getElementById("subtask-add");
const clearIcon = document.getElementById("subtask-clear");
const list = document.getElementById("subtask-list");
const divider = document.getElementById("dividerSubtasks");
const delBtn = createButton(deleteIcon, () => {
  item.remove();
  updateAddUIState();
});


lowBtn.addEventListener('click', () => {
  setActivePriority(lowBtn);
});


mediumBtn.addEventListener('click', () => {
  setActivePriority(mediumBtn);
});


urgentBtn.addEventListener('click', () => {
  setActivePriority(urgentBtn);
});


function setActivePriority(activeBtn) {
  const priorityButtons = [lowBtn, mediumBtn, urgentBtn];
  priorityButtons.forEach(btn => {
    if (btn !== activeBtn) {
      btn.classList.remove('active');
    }
  });
  activeBtn.classList.add('active');
  hiddenInput.value = activeBtn.dataset.value;
}


function getTaskDataFromForm() {
  return {
    title: document.getElementById("task-title")?.value || "",
    boardslot: document.getElementById("board-slot")?.value || "todo",
    description: document.getElementById("task-description")?.value || "",
    category: document.getElementById("task-category")?.value || "",
    assigned: Array.from(window.selectedUsers.keys()),
    priority: document.getElementById("task-priority")?.value || "",
    subtask: {
      name: document.getElementById("subtask-tags")?.value || "",
      done: false,
    },
    duedate: document.getElementById("task-due-date")?.value || "",
  };
}


async function createTask(event) {
  event.preventDefault();
  if (!validateForm()) return;
  const newTask = getTaskDataFromForm();
  try {
    const response = await fetch(path + ".json", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });
    if (response.ok) { showSuccessMessage(); clearForm(); }
    else { console.error("Fehler beim Speichern in Firebase"); }
  } catch (error) {
    console.error("Firebase Fehler:", error);
  }
}


function validateForm() {
  const requiredFields = document.querySelectorAll("input[required], select[required], textarea[required]");
  let isValid = true;
  document.querySelectorAll(".error_message").forEach(e => e.remove());
  requiredFields.forEach(f => f.classList.remove("input-error"));
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add("input-error");
      const error = document.createElement("span");
      error.classList.add("error-message");
      error.textContent = "Dieses Feld ist erforderlich";
      field.insertAdjacentElement("afterend", error);
    }
  });
  return isValid;
}


function showSuccessMessage() {
  const msg = document.createElement("div");
  msg.textContent = "Task erfolgreich erstellt ✅";
  msg.style.color = "green";
  msg.style.marginTop = "10px";
  msg.style.fontWeight = "bold";
  msg.style.textAlign = "center";
  document.querySelector(".task_controls_buttons").appendChild(msg);
  setTimeout(() => msg.remove(), 3000);
}


function clearForm() {
  document.getElementById("task-title").value = "";
  document.getElementById("task-description").value = "";
  document.getElementById("task-category").selectedIndex = 0;
  document.getElementById("subtask-tags").value = "";
  const hiddenInput = document.getElementById("task-priority");
  hiddenInput.value = "medium";
  const priorityButtons = document.querySelectorAll('.priority_btn');
  priorityButtons.forEach(btn => btn.classList.remove('active'));
  const mediumBtn = document.getElementById('medium');
  if (mediumBtn) mediumBtn.classList.add('active');
  clearAssignedDropdown();
  clearSubtasks();
}


function clearAssignedDropdown() {
  const container = document.getElementById("task-assigned-to");
  const options = container.querySelectorAll(".option-item");
  options.forEach(item => item.classList.remove("checked"));
  if (window.selectedUsers) window.selectedUsers.clear();
  const display = container.querySelector(".select-display");
  updateDisplayText();
}


function clearSubtasks() {
  document.getElementById("subtask-list").innerHTML = "";
  clearDivider();
  updateAddUIState();
}


function requiredFieldMarker() {
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("input[required], select[required], textarea[required]").forEach((field) => {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label && !label.innerHTML.includes("*")) {
        label.innerHTML += ' <span style="color:red">*</span>';
      }
    });
  });
}

function init() {
  loadUserAssignments();
  requiredFieldMarker();
  document.querySelector(".add_task_create_button").addEventListener("click", createTask);
  document.getElementById("clear-button").addEventListener("click", (e) => { clearForm(); e.preventDefault(); });
  document.querySelector(".add_task_clear_button").addEventListener("click", clearForm);
}


async function loadUserAssignments() {
  const container = document.getElementById("task-assigned-to");
  try {
    const data = await fetchUserData();
    buildDropdown(container, data);
  } catch (error) {
    showUserLoadError(container, error);
  }
}


async function fetchUserData() {
  const response = await fetch(pathRegister + ".json");
  return await response.json();
}


function buildDropdown(container, data) {
  container.innerHTML = "";
  const display = createDisplayElement();
  const options = createOptionsContainer(data);
  container.append(display, options);
}


function createDisplayElement() {
  const el = document.createElement("div");
  el.classList.add("select-display");
  el.textContent = "Select contacts to assign";
  const arrow = document.createElement("span");
  arrow.classList.add("icon-assign");
  arrow.textContent = "▼";
  el.appendChild(arrow);
  el.onclick = toggleDropdown;
  return el;
}


function createOptionsContainer(data) {
  const options = document.createElement("div");
  options.classList.add("select-options");
  window.selectedUsers = new Set();
  Object.keys(data).forEach((key) => addOptionItem(options, key, data[key]));
  return options;
}


function addOptionItem(container, id, user) {
  const item = document.createElement("div");
  item.classList.add("option-item");
  item.innerHTML = `
  <span>${user.name}</span>
  <span class="checkbox-square"></span>`;
  item.onclick = () => toggleUser(item, id);
  container.appendChild(item);
}


function toggleDropdown() {
  const options = document.querySelector(".select-options");
  options.classList.toggle("show");
}


function toggleUser(item, id) {
  const selected = window.selectedUsers;
  selected.has(id) ? selected.delete(id) : selected.add(id);
  item.classList.toggle("checked");
  updateDisplayText();
}


function updateDisplayText() {
  const display = document.querySelector(".select-display");
  const arrow = display.querySelector(".icon-assign");
  const count = window.selectedUsers.size;
  display.childNodes[0].nodeValue = count
    ? `${count} user(s) selected `
    : "Select contacts to assign ";
  display.appendChild(arrow);
}


input.addEventListener("input", () => {
  const hasText = input.value.trim().length > 0;
  addIcon.classList.toggle("hidden", !hasText);
  divider.classList.toggle("hidden", !hasText);
  clearIcon.classList.toggle("hidden", !hasText);
});

addIcon.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addIcon.classList.add("hidden");
  clearIcon.classList.add("hidden");
  addSubtask(text);
});

clearIcon.addEventListener("click", () => {
  input.value = "";
  divider.classList.add("hidden");
  addIcon.classList.add("hidden");
  clearIcon.classList.add("hidden");
});

function handleInputIcons(input, addIcon, clearIcon, divider) {
  input.addEventListener("input", () => {
    const hasText = input.value.trim().length > 0;
    addIcon.classList.toggle("hidden", !hasText);
    clearIcon.classList.toggle("hidden", !hasText);
    divider.classList.toggle("hidden", !hasText);
  });
  addIcon.onclick = () => { addSubtask(input.value.trim()); input.value = ""; hideIcons(addIcon, clearIcon, divider); };
  clearIcon.onclick = () => { input.value = ""; hideIcons(addIcon, clearIcon, divider); };
}

function hideIcons(addIcon, clearIcon, divider) {
  addIcon.classList.add("hidden"); clearIcon.classList.add("hidden"); divider.classList.add("hidden");
}


function createDot() {
  const dot = document.createElement("div");
  dot.className = "subtask-dot";
  return dot;
}

function createSpan(text) {
  const span = document.createElement("span");
  span.className = "subtask-text";
  span.textContent = text;
  return span;
}

function createButton(html, onClick) {
  const btn = document.createElement("button");
  btn.innerHTML = html;
  btn.onclick = onClick;
  return btn;
}

function rebuildLeft(left, dot, contentElement) {
  left.innerHTML = "";
  left.append(dot, contentElement);
}


function addSubtask(text) {
  if (!text.trim()) return;
  const list = document.getElementById("subtask-list");
  if (getSubtaskCount() >= MAX_SUBTASKS) {
    showMessage("Du kannst maximal 3 Subtasks hinzufügen.", "error");
    clearDivider();
    updateAddUIState();
    return;
  }
  const item = document.createElement("div");
  item.className = "subtask-item";
  const left = document.createElement("div");
  left.className = "subtask-left";
  const dot = createDot();
  const span = createSpan(text);
  left.append(dot, span);
  const buttons = createButtons(item, span);
  item.append(left, buttons);
  list.appendChild(item);
  clearDivider();
  updateAddUIState();
  document.getElementById("subtask-input").value = "";
}

function createButtons(item, span) {
  const buttons = document.createElement("div");
  buttons.className = "subtask-buttons";
  const editBtn = createButton(editIcon, () => enterEditMode(item, span, buttons));
  const delBtn = createButton(deleteIcon, () => item.remove());
  buttons.append(editBtn, delBtn);
  return buttons;
}


function enterEditMode(item, span, buttons) {
  const left = item.querySelector(".subtask-left");
  const input = document.createElement("input");
  input.type = "text";
  input.value = span.textContent;
  input.className = "edit-input";
  buttons.style.display = "none";
  rebuildLeft(left, createDot(), input);
  const check = cloneButton("subtask-add");
  const cancel = cloneButton("subtask-clear");
  check.onclick = () => saveEdit(left, span, input, buttons);
  cancel.onclick = () => cancelEdit(left, span, buttons);
  const wrapper = document.createElement("div");
  wrapper.className = "subtask-input-wrapper";
  wrapper.append(input, check, cancel);
  left.append(wrapper);
}


function saveEdit(left, span, input, buttons) {
  span.textContent = input.value.trim() || span.textContent;

  rebuildLeft(left, createDot(), span);
  buttons.style.display = "flex";
}

function cancelEdit(left, span, buttons) {
  rebuildLeft(left, createDot(), span);
  buttons.style.display = "flex";
}


function cloneButton(id) {
  const btn = document.getElementById(id).cloneNode(true);
  btn.classList.remove("hidden");
  return btn;
}


function clearDivider() {
  const divider = document.getElementById("dividerSubtasks");
  if (!divider) return;
  divider.classList.add("hidden");
}


function showMessage(message, type = "info") {
  const container = document.getElementById("notification-container");
  const note = document.createElement("div");
  note.className = `notification ${type}`;
  note.textContent = message;
  container.appendChild(note);
  setTimeout(() => {
    note.style.animation = "fadeOut 0.3s forwards";
  }, 2500);
  setTimeout(() => {
    note.remove();
  }, 3000);
}

function getSubtaskCount() {
  return document.querySelectorAll("#subtask-list .subtask-item").length;
}

function disableSubtaskInput() {
  const input = document.getElementById("subtask-input");
  const btn = document.getElementById("subtask-add-btn");
  input.disabled = true;
  btn.disabled = true;
}

function enableSubtaskInput() {
  const input = document.getElementById("subtask-input");
  const btn = document.getElementById("subtask-add-btn");
  input.disabled = false;
  btn.disabled = false;
}

function updateAddUIState() {
  if (getSubtaskCount() >= MAX_SUBTASKS) {
    disableSubtaskInput();
  } else {
    enableSubtaskInput();
  }
}


init();