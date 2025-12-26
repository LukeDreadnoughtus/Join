// addtask.form.js
"use strict";

function getTaskDataFromForm() {
    return {
        title: document.getElementById("task-title")?.value || "",
        boardslot: document.getElementById("board-slot")?.value || "todo",
        description: document.getElementById("task-description")?.value || "",
        category: document.getElementById("task-category")?.value || "",
        assigned: Array.from(window.selectedUsers?.keys?.() || []),
        priority: document.getElementById("task-priority")?.value || "",
        subtasks: getSubtasksForDB(),
        duedate: document.getElementById("task-due-date")?.value || "",
    };
}

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

function clearPreviousErrors() {
    for (const id of REQUIRED_FIELD_IDS) {
        const field = document.getElementById(id);
        if (field) field.classList.remove("input-error");

        const errorEl = document.getElementById(`error-${id}`);
        if (errorEl) errorEl.remove();
    }
}

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

function clearForm() {
    clearFormInputs();
    resetPriority();
    clearAssignedDropdown();
    clearSubtasks();
}

function clearFormInputs() {
    const title = document.getElementById("task-title");
    const desc = document.getElementById("task-description");
    const cat = document.getElementById("task-category");
    const subInput = document.getElementById("subtask-input");

    if (title) title.value = "";
    if (desc) desc.value = "";
    if (cat) cat.selectedIndex = 0;
    if (subInput) subInput.value = "";
}

function clearSubtasks() {
    const ul = document.getElementById("subtask-list");
    if (ul) ul.innerHTML = "";
    clearDivider();
    updateAddUIState();
}

function clearAssignedDropdown() {
    const options = document.getElementById("assignedOptions");
    if (options) {
        for (const child of options.children) child.classList.remove("checked");
    }
    window.selectedUsers?.clear?.();
    updateDisplayText();
}


function showSuccessMessage() {
    const msg = document.createElement("div");
    msg.textContent = "Task created successfully ✅";
    msg.style.color = "green";
    msg.style.marginTop = "10px";
    msg.style.fontWeight = "bold";
    msg.style.textAlign = "center";

    const host = document.getElementById("taskControlsButtons") || document.body;
    host.appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}


function setActivePriority(activeBtn) {
    const lowBtn = document.getElementById("low");
    const mediumBtn = document.getElementById("medium");
    const urgentBtn = document.getElementById("urgent");
    const hiddenInput = document.getElementById("task-priority");

    const all = [lowBtn, mediumBtn, urgentBtn].filter(Boolean);
    all.forEach((btn) => btn.classList.remove("active", "overlay_active"));

    activeBtn.classList.add("active", "overlay_active");
    if (hiddenInput) hiddenInput.value = activeBtn.dataset.value;
}

function resetPriority() {
    const lowBtn = document.getElementById("low");
    const mediumBtn = document.getElementById("medium");
    const urgentBtn = document.getElementById("urgent");
    const hiddenInput = document.getElementById("task-priority");

    if (hiddenInput) hiddenInput.value = "medium";
    [lowBtn, urgentBtn, mediumBtn].forEach((btn) => btn?.classList.remove("active", "overlay_active"));
    mediumBtn?.classList.add("active", "overlay_active");
}

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

function initAddTask() {
    const createBtn = document.getElementById("create-button");
    const clearBtn = document.getElementById("clear-button");

    if (createBtn) createBtn.addEventListener("click", createTask);
    if (clearBtn) clearBtn.addEventListener("click", clearForm);

    const lowBtn = document.getElementById("low");
    const mediumBtn = document.getElementById("medium");
    const urgentBtn = document.getElementById("urgent");

    if (lowBtn) lowBtn.addEventListener("click", () => setActivePriority(lowBtn));
    if (mediumBtn) mediumBtn.addEventListener("click", () => setActivePriority(mediumBtn));
    if (urgentBtn) urgentBtn.addEventListener("click", () => setActivePriority(urgentBtn));

    if (document.getElementById("task-assigned-to")) loadUserAssignments();

    requiredFieldMarker();
    renderUserIcon();

    wireSubtaskInputRow();
    updateAddUIState();
}

document.addEventListener("DOMContentLoaded", initAddTask);