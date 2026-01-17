"use strict";

function updateDisplayText() {
  const display = document.getElementById("assignedDisplay");
  const assignedUsersContainer = document.getElementById("assigned-users-icons");
  if (!display || !assignedUsersContainer) return;
  const displayText = window.selectedUsers && window.selectedUsers.size > 0 ? "To:" : "Select contacts to assign";
  rebuildDisplayElement(display, displayText);
  assignedUsersContainer.innerHTML = "";
  if (window.selectedUsers && window.selectedUsers.size > 0) {
    window.selectedUsers.forEach((id) => {
      const icon = createSelectedUserIcon(id);
      if (icon) assignedUsersContainer.appendChild(icon);
    });
  }
}

function rebuildDisplayElement(display, textContent = "Select contacts to assign") {
  display.innerHTML = "";
  const text = document.createElement("span");
  text.className = "select-display-text";
  text.id = "assignedDisplayText";
  text.textContent = textContent;
  const arrow = document.createElement("span");
  arrow.className = "icon-assign";
  arrow.id = "assignedArrow";
  arrow.textContent = "▼";
  display.append(text, arrow);
}

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

async function fetchUserData() {
  const response = await fetch(ADD_TASK_PATH_REGISTER + ".json");
  return await response.json();
}

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

function buildDropdown(container, data) {
  container.innerHTML = "";
  window.selectedUsers = new Set();
  const display = createDisplayElement();
  const options = createOptionsContainer(data);
  container.append(display, options);
  attachOutsideClickHandlerForAssignedDropdown();
}

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


function createOptionsContainer(data) {
  const options = document.createElement("div");
  options.className = "select-options";
  options.id = "assignedOptions";
  for (const key of Object.keys(data || {})) {
    addOptionItem(options, key, data[key]);
  }
  return options;
}


function addOptionItem(container, id, user) {
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

function toggleDropdown() {
  const options = document.getElementById("assignedOptions");
  if (!options) return;
  options.classList.toggle("show");
}

function closeAssignedDropdown() {
  const options = document.getElementById("assignedOptions");
  if (options) options.classList.remove("show");
}

function isClickInsideAssignedDropdown(target) {
  const display = document.getElementById("assignedDisplay");
  const options = document.getElementById("assignedOptions");
  return (display && display.contains(target)) || (options && options.contains(target));
}

function attachOutsideClickHandlerForAssignedDropdown() {
  if (window.__assignedOutsideClickBound) return;
  window.__assignedOutsideClickBound = true;

  document.addEventListener("click", (e) => {
    if (!isClickInsideAssignedDropdown(e.target)) closeAssignedDropdown();
  });
}
