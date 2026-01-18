// addtask.form.js
"use strict";

function getTaskDataFromForm() {
    return {
        title: document.getElementById("task-title")?.value || "",
        boardslot: document.getElementById("board-slot")?.value || "todo",
        description: document.getElementById("task-description")?.value || "",
        category: document.getElementById("task-category")?.getAttribute("data-selected") || "",
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
    const fieldsToValidate = [...REQUIRED_FIELD_IDS, "task-category"];
    for (const id of fieldsToValidate) {
        const field = document.getElementById(id);
        if (!field) continue;
        // Check .value for regular inputs or data-selected for custom dropdowns
        const value = field.value !== undefined
            ? String(field.value ?? "").trim()
            : String(field.getAttribute("data-selected") ?? "").trim();
        if (!value) {
            markFieldAsInvalid(field);
            isValid = false;
        }
    }
    return isValid;
}

function clearPreviousErrors() {
    const fieldsToValidate = [...REQUIRED_FIELD_IDS, "task-category"];
    for (const id of fieldsToValidate) {
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
    const dueDate = document.getElementById("task-due-date");
    const subInput = document.getElementById("subtask-input");
    if (title) title.value = "";
    if (desc) desc.value = "";
    if (cat) {
        cat.removeAttribute("data-selected");
        const displayText = document.getElementById("categoryDisplayText");
        if (displayText) displayText.textContent = "Select task category";
    }
    if (dueDate) dueDate.value = "";
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
    msg.className = "success-notification";
    const icon = document.createElement("div");
    icon.innerHTML = `<svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.9546 5.73855L22.9546 26.1929C22.954 26.7955 22.7143 27.3732 22.2882 27.7993C21.8622 28.2253 21.2844 28.465 20.6819 28.4656L16.1365 28.4656C15.5339 28.465 14.9562 28.2253 14.5301 27.7993C14.104 27.3732 13.8644 26.7955 13.8638 26.1929L13.8638 5.73855C13.8644 5.13597 14.104 4.55825 14.5301 4.13217C14.9562 3.70608 15.5339 3.46644 16.1365 3.46584L20.6819 3.46584C21.2844 3.46644 21.8622 3.70608 22.2882 4.13217C22.7143 4.55825 22.954 5.13597 22.9546 5.73855ZM16.1365 26.1929L20.6819 26.1929L20.6819 5.73855L16.1365 5.73855L16.1365 26.1929ZM16.1365 5.73855L16.1365 26.1929C16.1359 26.7955 15.8962 27.3731 15.4701 27.7992C15.0441 28.2253 14.4663 28.4649 13.8638 28.4655L9.31835 28.4655C8.71578 28.4649 8.13806 28.2253 7.71197 27.7992C7.28589 27.3731 7.04625 26.7954 7.04565 26.1928L7.04565 5.73852C7.04625 5.13595 7.28589 4.55823 7.71197 4.13214C8.13806 3.70606 8.71578 3.46642 9.31835 3.46582L13.8638 3.46582C14.4663 3.46642 15.0441 3.70606 15.4701 4.13214C15.8962 4.55823 16.1359 5.13597 16.1365 5.73855ZM9.31835 26.1928L13.8638 26.1929L13.8638 5.73855L9.31835 5.73852L9.31835 26.1928ZM9.31835 5.73852L9.31835 26.1928C9.31775 26.7954 9.07811 27.3731 8.65203 27.7992C8.22594 28.2253 7.64822 28.4649 7.04565 28.4656L2.50024 28.4656C1.89767 28.4649 1.31995 28.2253 0.893863 27.7992C0.467779 27.3731 0.228141 26.7954 0.227539 26.1928L0.227538 5.73852C0.22814 5.13595 0.467778 4.55823 0.893862 4.13214C1.31995 3.70606 1.89767 3.46642 2.50024 3.46582L7.04565 3.46582C7.64822 3.46642 8.22594 3.70606 8.65203 4.13214C9.07811 4.55823 9.31775 5.13595 9.31835 5.73852ZM2.50024 26.1928L7.04565 26.1928L7.04565 5.73852L2.50024 5.73852L2.50024 26.1928Z" fill="#fff"/>
    <path d="M29.7727 5.7388L29.7727 26.1931C29.7721 26.7957 29.5324 27.3734 29.1064 27.7995C28.6803 28.2256 28.1026 28.4652 27.5 28.4658L22.9546 28.4658C22.352 28.4652 21.7743 28.2256 21.3482 27.7995C20.9221 27.3734 20.6825 26.7955 20.6819 26.1929L20.6819 5.73855C20.6825 5.13597 20.9221 4.5585 21.3482 4.13242C21.7743 3.70633 22.352 3.4667 22.9546 3.46609L27.5 3.46609C28.1026 3.4667 28.6803 3.70633 29.1064 4.13242C29.5324 4.5585 29.7721 5.13622 29.7727 5.7388ZM22.9546 26.1929L27.5 26.1931L27.5 5.7388L22.9546 5.73855L22.9546 26.1929Z" fill="#fff"/>
    </svg>`;
    icon.style.display = "inline-block";
    icon.style.marginRight = "8px";
    icon.style.verticalAlign = "middle";
    const text = document.createElement("span");
    text.textContent = "Task added to Board";
    text.style.verticalAlign = "middle";
    msg.append(icon, text);
    document.body.appendChild(msg);
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
    const fieldsToMark = [...REQUIRED_FIELD_IDS, "task-category"];
    for (const id of fieldsToMark) {
        const field = document.getElementById(id);
        if (!field) continue;
        // Check for label or span with data-for attribute
        const label = document.querySelector(`label[for="${id}"]`) || document.querySelector(`span[data-for="${id}"]`);
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

function toggleCategoryDropdown() {
    const options = document.getElementById("categoryOptions");
    const arrow = document.getElementById("categoryArrow");
    if (!options) return;
    options.classList.toggle("show");
    if (arrow) arrow.classList.toggle("rotate");
}

function closeCategoryDropdown() {
    const options = document.getElementById("categoryOptions");
    const arrow = document.getElementById("categoryArrow");
    if (options) options.classList.remove("show");
    if (arrow) arrow.classList.remove("rotate");
}

function createCategoryOptionsContainer() {
    const options = document.createElement("div");
    options.className = "select-options";
    options.id = "categoryOptions";
    const items = [
        { value: "Technical Task", text: "Technical Task" },
        { value: "User Story", text: "User Story" },
    ];

    items.forEach((it) => {
        const item = document.createElement("div");
        item.className = "option-item";
        item.setAttribute("data-value", it.value);
        item.textContent = it.text;
        item.onclick = () => setCategory(it.value, it.text);
        options.appendChild(item);
    });

    return options;
}

function createCategoryDisplayElement() {
    const el = document.createElement("div");
    el.className = "select-display";
    el.id = "categoryDisplay";
    el.onclick = toggleCategoryDropdown;
    const text = document.createElement("span");
    text.className = "select-display-text";
    text.id = "categoryDisplayText";
    text.textContent = "Select task category";
    const arrow = document.createElement("span");
    arrow.className = "icon-assign";
    arrow.id = "categoryArrow";
    arrow.textContent = "▼";
    el.append(text, arrow);
    return el;
}

function buildCategoryDropdown() {
    const container = document.getElementById("task-category");
    if (!container) return;
    container.innerHTML = "";
    const display = createCategoryDisplayElement();
    const options = createCategoryOptionsContainer();
    container.append(display, options);
    attachOutsideClickHandlerForCategoryDropdown();
}

function setCategory(value, text) {
    const container = document.getElementById("task-category");
    const displayText = document.getElementById("categoryDisplayText");
    if (!container || !displayText) return;
    container.setAttribute("data-selected", value); // hier wird der Wert gespeichert
    displayText.textContent = text;
    closeCategoryDropdown();
}

function isClickInsideCategoryDropdown(target) {
    const display = document.getElementById("categoryDisplay");
    const options = document.getElementById("categoryOptions");
    return (display && display.contains(target)) || (options && options.contains(target));
}

function attachOutsideClickHandlerForCategoryDropdown() {
    if (window.__categoryOutsideClickBound) return;
    window.__categoryOutsideClickBound = true;

    document.addEventListener("click", (e) => {
        if (!isClickInsideCategoryDropdown(e.target)) closeCategoryDropdown();
    });
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
    buildCategoryDropdown();
    requiredFieldMarker();
    renderUserIcon();
    wireSubtaskInputRow();
    updateAddUIState();
}



document.addEventListener("DOMContentLoaded", initAddTask);