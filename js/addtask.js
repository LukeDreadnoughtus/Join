const path = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/";
const pathRegister = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/";
const lowBtn = document.getElementById('low');
const mediumBtn = document.getElementById('medium');
const urgentBtn = document.getElementById('urgent');
const hiddenInput = document.getElementById('task-priority');


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
    const response = await fetch(path + "tasks.json", {
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
}


function clearAssignedDropdown() {
  const container = document.getElementById("task-assigned-to");
  const options = container.querySelectorAll(".option-item");
  options.forEach(item => item.classList.remove("checked"));
  if (window.selectedUsers) window.selectedUsers.clear();
  const display = container.querySelector(".select-display");
  updateDisplayText();
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


init();