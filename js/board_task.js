//close and open TaskOverlay 

async function closeTaskOverlay(event) {
    event.stopPropagation ()
    document.getElementById("task_full_view").classList.add("d_none")
    document.body.classList.remove("no-scroll");
    renderBoardBasics()
    await init(event)
}

function openTaskOverlay(id) {
    const taskData = allTasks[id];
    renderTaskCardFullView(taskData)
    const overlay = document.getElementById("task_full_view");
    overlay.classList.remove("d_none")
    document.body.classList.add("no-scroll");
}

function renderAssignedUsers(taskData) {
    if (!taskData.assignedUsers || taskData.assignedUsers.length === 0) {
        return '<p class="user_font">No users assigned</p>';
    }
    return taskData.assignedUsers.map((user, i) => `
        <div class="user_row_layout">
            <div class="user_icon color${taskData.assignedUserColors[i].replace('#', '')}">
                ${initials(user)}
            </div>
            <p class="user_font">${user}</p>
        </div>
    `).join('');
}

/**
 * Rendert alle Subtasks eines Tasks
 */
function renderSubtasks(taskData) {
    if (noSubtasksExist(taskData)) {
        return renderNoSubtasksMessage();
    }

    const container = createSubtasksContainer();
    appendRenderedSubtasks(container, taskData);
    return container;
}

/**
 * Prüft ob keine Subtasks existieren
 */
function noSubtasksExist(taskData) {
    return (
        !taskData.subtasks ||
        Object.keys(taskData.subtasks).length === 0
    );
}

/**
 * Rendert die "No subtasks yet" Nachricht
 */
function renderNoSubtasksMessage() {
    const noSubtasks = document.createElement("p");
    noSubtasks.classList.add("no_subtaks");
    noSubtasks.textContent = "No subtasks yet";
    return noSubtasks;
}

/**
 * Erstellt den Container für alle Subtasks
 */
function createSubtasksContainer() {
    return document.createElement("div");
}

/**
 * Fügt jeden Subtask dem Container hinzu
 */
function appendRenderedSubtasks(container, taskData) {
    Object.entries(taskData.subtasks).forEach(([key, subtask]) => {
        const subtaskEl = renderSingleSubtask(key, subtask, taskData);
        container.appendChild(subtaskEl);
    });
}

/**
 * Rendert einen einzelnen Subtask
 */
function renderSingleSubtask(key, subtask, taskData) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("subtask_check");
    const checkbox = createSubtaskCheckbox(key, subtask, taskData);
    const label = createSubtaskLabel(key, subtask);
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    return wrapper;
}

/**
 * Checkbox für Subtask
 */
function createSubtaskCheckbox(key, subtask, taskData) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `subtask_${key}`;
    checkbox.checked = subtask.done;
    checkbox.addEventListener("change", (event) => {
        toggleSubtask(event, key, taskData);
    });
    return checkbox;
}

/**
 * Label für Subtask
 */
function createSubtaskLabel(key, subtask) {
    const label = document.createElement("label");
    label.htmlFor = `subtask_${key}`;
    label.classList.add("subtask_label");
    label.innerHTML = `<p class="subtask_detail_font">${subtask.name}</p>`;
    return label;
}

//öffnet Edit-Ansicht

function editTask(id) {
    const overlay = document.getElementById("task_full_view");
    overlay.classList.add("d_none")
    const overlayEdit = document.getElementById ("task_edit_view")
    overlayEdit.classList.remove("d_none")
    renderEdit (id)
}

function renderEdit (id) {
    const taskData = allTasks[id];
    renderTaskEditCard(taskData)
    highlightCurrentPriority(taskData.priority)
    renderAssignedUserIcons(taskData)
    renderEditSubtasks(taskData)
    initEditDatepicker()
}

function initEditDatepicker() {
    const input = document.getElementById("edit_due_date");
    const icon = document.getElementById("date_icon");
    if (!input || !icon) return;
    const picker = flatpickr(input, {
        dateFormat: "d/m/Y",
        allowInput: true
    });
    icon.addEventListener("click", () => {
        picker.open();
    });
}

function highlightCurrentPriority(priorityValue) {
    const buttons = document.querySelectorAll(".priority_button");
    buttons.forEach(btn => {
        const value = btn.getAttribute("data-value");
        // Zurücksetzen
        btn.classList.remove("active_priority");
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
        // Aktive Prio markieren
        if (value === priorityValue) {
            btn.classList.add("active_priority");
            btn.disabled = true;
            btn.style.pointerEvents = "none";
        }
    });
}

function setPriority(prio, id) {
    const buttons = document.querySelectorAll(".priority_button");
    buttons.forEach(btn => {
        btn.classList.remove("active_priority");
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
    });
    const activeBtn = document.querySelector(`.priority_button[data-value="${prio}"]`);
    activeBtn.classList.add("active_priority");
    activeBtn.disabled = true;
    activeBtn.style.pointerEvents = "none";
    allTasks[id].priority = prio; 
}

//Hier werden die schon vorhandenen subtasks in einer Liste gerendert
//funktion für die subtasks in der edit ansicht + ausgelagerte Funktionen

function renderEditSubtasks(taskData) {
    const subtaskList = document.getElementById("subtask_list");
    subtaskList.innerHTML = "";
    if (!taskData.subtasks || Object.keys(taskData.subtasks).length === 0) {
        return;
    }
    Object.entries(taskData.subtasks).forEach(([index, subtask]) => {
        const li = createSubtaskListItem(taskData, index, subtask);
        addSubtaskHoverBehavior(li);
        subtaskList.appendChild(li);
    });
}

function createSubtaskListItem(taskData, index, subtask) {
    const li = document.createElement("li");
    li.classList.add("edit_subtask_item");
    li.innerHTML = `
        <div class="subtask_inner">
            <span class="subtask_element">${subtask.name}</span>

            <div class="subtask_actions d_none">
                <img src="./assets/img/edit.svg" class="subtask_edit_icon"
                     onclick="editSubtask('${taskData.id}', '${index}')">
                <div class="subtask_separator"></div>
                <img src="./assets/img/delete.svg" class="subtask_delete_icon"
                     onclick="openDeleteModal('${taskData.id}', '${index}')">
            </div>
        </div>
    `;
    return li;
}

function addSubtaskHoverBehavior(li) {
    const actionContainer = li.querySelector(".subtask_actions");
    li.addEventListener("mouseenter", () => {
        actionContainer.classList.remove("d_none");
    });
    li.addEventListener("mouseleave", () => {
        actionContainer.classList.add("d_none");
    });
}

//subtask löschen 

/** Reindexiert ein Subtask-Objekt zurück zu 0,1,2,... */
/**
 * Reindexes a subtask object so that all numeric keys become a continuous
 * zero-based sequence (0, 1, 2, ...).  
 *
 * This function extracts all properties whose keys are strictly numeric,
 * sorts them by their numeric value, and rebuilds a new object with
 * consecutive numeric keys.  
 *
 * Non-numeric keys are ignored.  
 * The original object is not modified.
 *
 * @param {Object} subtasks - The subtask collection as an object with numeric keys.
 * @returns {Object} A new object with sequential numeric keys starting at 0.
 *
 * @example
 * // Input:
 * // { "0": {...}, "2": {...}, "5": {...} }
 *
 * const result = reindexSubtasksObject(subtasks);
 *
 * // Output:
 * // { "0": {...}, "1": {...}, "2": {...} }
 */

function reindexSubtasksObject(subtasks) {
    if (!subtasks || typeof subtasks !== "object") return {};
    const numericEntries = Object.keys(subtasks)
        .map(key => {
            const n = Number(key);
            return (!isNaN(n) && String(n) === key)
                ? { n, val: subtasks[key] }
                : null;
        })
        .filter(e => e !== null)
        .sort((a, b) => a.n - b.n);

    const reindexed = {};
    numericEntries.forEach((entry, index) => {
        reindexed[index] = entry.val;
    });
    return reindexed;
}

/** Löscht einen Subtask, indexiert danach neu und speichert in Firebase */
async function deleteSubtask(id, subtaskKey) {
    // if (!confirm("Delete this subtask?")) return;
    // 1) lokal löschen
    delete allTasks[id].subtasks[subtaskKey];
    // 2) neu indexieren
    const reindexed = reindexSubtasksObject(allTasks[id].subtasks);
    // 3) zurückschreiben ins lokale Objekt
    allTasks[id].subtasks = reindexed;
    // 4) in Firebase speichern
    await updateSubtasksInFirebase(id, reindexed);
    // 5) UI neu rendern
    renderEdit(id);
    
    requestAnimationFrame(() => {
        focusSubtaskInput();
    });
}

let currentTaskId = null;
let currentSubtaskKey = null;

function openDeleteModal(id, subtaskKey) {
console.log("Modal öffnen für Task:", id, "Subtask:", subtaskKey);
currentTaskId = id;
currentSubtaskKey = subtaskKey;
document.getElementById("userfeedback_delete_subtask").classList.remove("d_none");
}

function confirmDeleteSubtask(event) {
    event.stopPropagation();
    if (currentTaskId !== null && currentSubtaskKey !== null) {
        deleteSubtask(currentTaskId, currentSubtaskKey);
    }
    document.getElementById("userfeedback_delete_subtask").classList.add("d_none");
    currentTaskId = null;
    currentSubtaskKey = null;
}

function cancelDeleteSubtask(event) {
    event.stopPropagation();
    document.getElementById("userfeedback_delete_subtask").classList.add("d_none");
    currentTaskId = null;
    currentSubtaskKey = null;
    focusSubtaskInput();
}

function focusSubtaskInput() {
    const input = document.getElementById("edit_subtask_input");
    if (input) {
        input.focus();
    }
}


/** Speichert nur den Subtasks-Bereich in Firebase */
async function updateSubtasksInFirebase(taskId, subtasks) {
    const url = `${path}/${taskId}/subtasks.json`;
    await fetch(url, {
        method: "PUT",
        body: JSON.stringify(subtasks)
    });
}


//Drag and Drop

//doc - Dragging-Klasse setzen
// //verhindert das standardmäßige „Ghost“-Bild
// WICHTIG: echtes Element als DragImage verwenden 

let currentDraggedTask;

function startDragging(event, id) {
    currentDraggedTask = id;

    const original = event.currentTarget;
    original.classList.add("dragging");

    // 🔹 Wrapper erstellen (WICHTIG!)
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.top = "-9999px";
    wrapper.style.left = "-9999px";
    wrapper.style.width = `${original.offsetWidth}px`;
    wrapper.style.height = `${original.offsetHeight}px`;
    wrapper.style.borderRadius = "24px";
    wrapper.style.overflow = "hidden"; // 🔥 DAS ist der Fix
    wrapper.style.backgroundColor = "#FFFFFF";

    // 🔹 Clone erzeugen
    const clone = original.cloneNode(true);
    clone.style.margin = "0";
    clone.style.transform = "none";
    clone.style.opacity = "1";
    clone.style.boxShadow = "0px 8px 20px rgba(0,0,0,0.25)";
    clone.style.backgroundColor = "#FFFFFF";

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // 🔹 Ghost setzen
    event.dataTransfer.setDragImage(
        wrapper,
        wrapper.offsetWidth / 2,
        wrapper.offsetHeight / 2
    );

    // 🔹 Cleanup
    setTimeout(() => wrapper.remove(), 0);
}

function onDragOverColumn(event, slot) {
    event.preventDefault();
    highlightDragArea(slot);
}

async function moveTo (slot, event) {
const taskId = currentDraggedTask;
allTasks[taskId].boardSlot = slot
removeHighlight(slot);
await updateBoardSlotInFirebase(taskId, slot) 
renderBoardBasics()
await init(event)
}

async function updateBoardSlotInFirebase(taskId, slot) {
    const url = `${path}/${taskId}.json`;

    await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({boardslot: slot})
    });
}

function onDragLeaveColumn(event, slot) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
        removeHighlight(slot);
    }
}

function highlightDragArea(slot) { //idslot
document.getElementById(slot).classList.add("drag_area_hightlight")
}

function removeHighlight(slot) { //idslot
document.getElementById(slot).classList.remove("drag_area_hightlight")
}

function stopDragging(event) {
    event.currentTarget.classList.remove("dragging");
}

