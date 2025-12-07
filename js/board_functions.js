let path = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/"
let pathUser = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/"

let allTasks = {}; // globales Objekt: key = Task-ID, value = Task-Daten

async function init(event) {
event.preventDefault();
removeUserfeedback()
await showTasks()
checkNoTasks();
}

//ToDo: task: overlay erstellen

function removeUserfeedback() {
const userFeedbackEl = document.getElementById("userfeedback");
if (!userFeedbackEl.classList.contains("d_none")) {
    userFeedbackEl.classList.add("d_none");
}
}

async function showTasks() { 
try {
    const getResponse = await fetch(path + ".json");
    const tasks = await getResponse.json();
     if (!tasks) {
        noTasksTemplate()
        return;
     }
      await renderAllTasks(tasks);
      }
    catch (error) {
    console.error("Fehler beim Laden der Tasks:", error);
    document.getElementById("userfeedback_no_tasks").classList.remove("d_none")
    return true; }
}

//Hilfsfunction für Task-Objekt

async function renderAllTasks(tasks) {
  for (const key in tasks) {
    const currentTask = tasks[key];
    const taskData = await buildTaskData(currentTask, key);
    allTasks[taskData.id] = taskData;
    taskTemplate(taskData);
  }
}

//next functions to build taskDataObject
async function buildTaskData(currentTask, key) {
    const base = extractBaseData(currentTask, key);
    const subtasks = extractSubtaskData(currentTask);
    const assigned = await extractAssignedUsers(currentTask);
    return {
        ...base,
        ...subtasks,
        ...assigned,
    };
}

function extractBaseData(task, key) {
    return {
        id: task.id || key || crypto.randomUUID(),
        boardSlot: task.boardslot,
        category: task.category,
        categoryColor: currentCategoryColor(task.category),
        title: task.title,
        description: task.description,
        duedate: formatDateDDMMYYYY(task.duedate),
        priority: task.priority,
    };
}

function extractSubtaskData(task) {
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

    if (subtasks.length === 0) {
        return {
            subtasksTotal: 0,
            subtasksDone: 0,
            subtasks: [],
        };
    }
    return {
        subtasksTotal: currentSubtaskNumber(task),
        subtasksDone: currentCompletedTasksNumber(task),
        subtasks: subtasks,
    };
}

async function extractAssignedUsers(task) {
    const ids = Array.isArray(task.assigned) && task.assigned.length > 0? task.assigned: [];
    if (ids.length === 0) {
        return {
            assignedUsers: [],
            assignedUserColors: [],
        };
    }
    return {
        assignedUsers: await fetchUserNames(ids),
        assignedUserColors: await fetchUsercolors(ids),
    };
}

function formatDateDDMMYYYY(dateInput) {
    const dateObj = new Date(dateInput);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
}

async function fetchUserNames (currentAssignedUserids) {
    let assignedUsers =[]; 
    try {
        const response = await fetch(pathUser + ".json");
        const userData = await response.json();

    for (const user of currentAssignedUserids) {
        let userName = findUserName(user,userData)
        assignedUsers.push(userName)
    }
    return assignedUsers
    } catch (error) {
        console.error("Fehler beim Laden der Usernamen:", error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
        return [];
    }
}

function findUserName(user, userData) {
    const searchedUser = userData[user];
    let userName = searchedUser.name || user;
    return userName
}

function currentSubtaskNumber(currentTask) {
    let currentSubtasks = currentTask.subtasks
    let numberOfCurrentTasks = currentSubtasks.length 
    return numberOfCurrentTasks
}

function currentCategoryColor(currentCategory) {
    let categoryColor = "default"
    if (currentCategory === "Technical Task") {
        categoryColor = "technical_task";}
    if (currentCategory === "User Story") {
        categoryColor = "user_story"; }

    return categoryColor
}

async function fetchUsercolors(currentAssignedUserids) {
    let assignedUsercolors =[]; 
    try {
        const response = await fetch(pathUser + ".json");
        const userData = await response.json();
    for (const user of currentAssignedUserids) {
        let userColor = findUserColor(user,userData)
        assignedUsercolors.push(userColor)
    }
    return assignedUsercolors
    } catch (error) {
        console.error("Fehler beim Laden der Farben:", error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
        return [];
    }
}

function findUserColor(user, userData) {
    const searchedUser = userData[user];
    let userColor = searchedUser.color || "#393737ff";
    return userColor
}

//checkt, ob die einzelnen Spalten genau zwei Kindelemente haben, wenn ja, sind keine Aufgaben gerendert worden
//dann wird das userFeedback angezeigt. 
function checkNoTasks() {
   const columns = [
        { id: "todo", noTasksId: "no_todo_tasks" },
        { id: "progress", noTasksId: "no_progress_tasks" },
        { id: "feedback", noTasksId: "no_feedback_tasks" },
        { id: "done", noTasksId: "no_done_tasks" }
    ];
    columns.forEach(col => {
        const columnEl = document.getElementById(col.id);
        const noTasksEl = document.getElementById(col.noTasksId);

        if (columnEl.children.length === 2) {
            noTasksEl.classList.remove("d_none");
        } else {
            noTasksEl.classList.add("d_none");
        }
    });
}

function initials(user) {
 const parts=String(user||'').trim().split(/\s+/);
  const first=(parts[0]||'').charAt(0).toUpperCase();
  const second=(parts[1]||'').charAt(0).toUpperCase();
  return first+(second||'');
};

function currentCompletedTasksNumber(currentTask) {
    let allSubTasks= currentTask.subtasks
    let count = 0
    for(let i=0; i < allSubTasks.length; i++) {
        if(allSubTasks[i].done ===true) {count++}
        else continue
    }
    return count; 
}

//close and open TaskOverlay 

async function closeTaskOverlay(event) {
    event.stopPropagation ()
    document.getElementById("task_full_view").classList.add("d_none")
    renderBoardBasics()
    await init(event)
}

function openTaskOverlay(id) {
    const taskData = allTasks[id];
    renderTaskCardFullView(taskData)
    const overlay = document.getElementById("task_full_view");
    overlay.classList.remove("d_none")
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
                     onclick="deleteSubtask('${taskData.id}', '${index}')">
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
    if (!confirm("Delete this subtask?")) return;
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
}

/** Speichert nur den Subtasks-Bereich in Firebase */
async function updateSubtasksInFirebase(taskId, subtasks) {
    const url = `${path}/${taskId}/subtasks.json`;
    await fetch(url, {
        method: "PUT",
        body: JSON.stringify(subtasks)
    });
}

//subtask bearbeiten 

function editSubtask(taskId, subtaskKey) {
    const task = allTasks[taskId];
    const subtask = task.subtasks[subtaskKey];

    const listItem = document.querySelector(
        `.edit_subtask_item:nth-child(${parseInt(subtaskKey) + 1})`
    );

    listItem.classList.add("editing");
    const inner = listItem.querySelector(".subtask_inner");

    inner.innerHTML = `
        <input type="text" 
               class="subtask_edit_input"
               value="${subtask.name}"
               autofocus>

    <div class="subtask_edit_actions">
    
    <div class="icon_wrapper_edit">
        <img src="./assets/img/delete.svg" 
             class="subtask_delete_icon" 
             onclick="deleteSubtask('${taskId}', '${subtaskKey}')">
    </div>

    <div class="subtask_separator_edit"></div>

    <div class="icon_wrapper_edit">
        <img src="./assets/img/check_black.svg" 
             class="subtask_check_icon" 
             onclick="saveSubtaskEdit('${taskId}', '${subtaskKey}', this.closest('li'))">
    </div>

</div>

    `;
}


//bearbeitete subtask speichern 
async function saveSubtaskEdit(taskId, subtaskKey, liElement) {
    const input = liElement.querySelector(".subtask_edit_input");
    const newName = input.value.trim();

    if (!newName) return;

    // local update
    allTasks[taskId].subtasks[subtaskKey].name = newName;

    // save to Firebase
    await updateSubtasksInFirebase(taskId, allTasks[taskId].subtasks);
    liElement.classList.remove("editing");
    // re-render UI
    renderEdit(taskId);
}



function renderAssignedUserIcons(taskData) {
    const alreadyAssignedContainer = document.getElementById("already_assigned");
    alreadyAssignedContainer.innerHTML = ""
    if (!taskData.assignedUsers || taskData.assignedUsers.length === 0) {
        alreadyAssignedContainer.innerHTML = ""; 
        return;
    }
    const assignedIconsHtml = taskData.assignedUsers.map((user, i) => `
        <div class="assigned_icon color${taskData.assignedUserColors[i].replace('#', '')}">
            ${initials(user)}
        </div>
    `).join("");
    alreadyAssignedContainer.innerHTML = assignedIconsHtml;
}

//close edit overlay
async function closeTaskOverlayEdit(event, id) {
    event.stopPropagation
    document.getElementById("task_edit_view").classList.add("d_none")
    document.getElementById("task_full_view").classList.add("d_none")
    renderBoardBasics()
    await init(event)
}

//subtasks im overlay anhaken/haken entfernen

async function toggleSubtask(event, indexSubtask, taskData) {
    event.preventDefault();
    const checkbox = document.getElementById(`subtask_${indexSubtask}`);
    const newValue = checkbox.checked;   // Boolean wird umgedreht und in der UI verändert
    checkbox.checked = newValue;
    taskData.subtasks[indexSubtask].done = newValue; //Hier wird das nur im taskData des Overlays gespeichert.
    const taskId = taskData.id;
    allTasks[taskId].subtasks[indexSubtask].done = newValue;
    await postSubtaskData(taskId, indexSubtask, newValue);
}

async function postSubtaskData (taskId, index, newValue){
  const url = `${path}/${taskId}/subtasks/${index}/done.json`;

    await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newValue)
    });
}

//Ab hier functions for edit - hier assigned Users

async function toggleUserDropdown(id) {
    const dropdown = document.getElementById("userDropdownList");
    // toggle() gibt TRUE zurück, wenn die Klasse *hinzugefügt* wurde
    const isNowHidden = dropdown.classList.toggle("d_none");
    // Wenn das Dropdown JETZT sichtbar ist → loadUserDropdown
    if (!isNowHidden) {
        await loadUserDropdown(id);
    } 
    // Wenn das Dropdown JETZT verborgen ist → renderEdit
    else {
        renderEdit(id);
    }
}

//Hier wird das Dropdown zum User-Select geladen
async function loadUserDropdown(id) {
    const allUsers = await fetchAllUsers();
    const assigned = allTasks[id].assignedUsers;
    const list = document.getElementById("userDropdownList");

    list.innerHTML = allUsers.map(user =>
        createUserTemplate(user, id, assigned.includes(user.name))
    ).join("");
}

//Hier wird jede Reihe des Dropdowns gebildet

function createUserTemplate(user, id, isAssigned) {
    const color = user.color || "#393737ff"; 
    const iconColor = color.replace('#', '');
    const usericon = initials(user.name);
    return `
        <div class="user_option">
            <div class="selectable_user">
                <div class="user_icon color${iconColor}">${usericon}</div>
                <span>${user.name}</span>
            </div>
            <input 
                type="checkbox" 
                class="user_checkbox"
                ${isAssigned ? "checked" : ""}
                onclick="toggleAssignedUsers('${user.color}','${user.name}','${id}', this)"
            >
        </div>
    `;
}

async function fetchAllUsers() {
    try {
        const response = await fetch(pathUser + ".json");
        const userData = await response.json();
        return Object.entries(userData).map(([userId, data]) => ({
            userId,
            name: data.name,
            color: data.color
        }));
    } catch (error) {
        console.error("Fehler beim Laden der User:", error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
        return [];
    }
}

//Diese Funktion fügt neue assigned user hinzu. 
// Sicherheit: Falls Arrays noch nicht existieren
function toggleAssignedUsers(userColor, userName, id, checkbox) {
    const task = allTasks[id];
    if (!task.assignedUsers) task.assignedUsers = [];
    if (!task.assignedUserColors) task.assignedUserColors = [];
    if (checkbox.checked) {
        if (!task.assignedUsers.includes(userName)) {
            task.assignedUsers.push(userName);
            task.assignedUserColors.push(userColor);
        }
    } else {
        const index = task.assignedUsers.indexOf(userName);
        if (index !== -1) {
            task.assignedUsers.splice(index, 1);
            task.assignedUserColors.splice(index, 1);
        }
    }
}

//Funktionen für subTask-Bearbeitung, zeigt auf das Icon
function clearSubtaskInput(icon) {
    const wrapper = icon.closest('.input_edit_subtask_wrapper');
    const input = wrapper.querySelector('.input_edit_subtask');
    input.value = "";
}

// Um eine subtask hinzuzufügen und diese in der Datenbank abzuspeichern 

async function addNewSubtask(id) {
    const input = document.getElementById("edit_subtask_input");
    const newSubtaskName = input.value.trim();
    if (!newSubtaskName) return; 
    const newSubtask = { 
        done: false, 
        name: newSubtaskName 
    };
    allTasks[id].subtasks.push(newSubtask);
    await updateSubtasksInFirebase (id, allTasks[id].subtasks);
    input.value = ""; 
    renderEdit(id);   
}

//Funktionen um Bearbeitung in die Datenbank zu speichern. 
/**
 * Speichert die Änderungen eines Tasks
 */
async function saveEdits(id) {
    const input = collectEditInputs();
    const firebaseDate = convertDateToFirebaseFormat(input.rawDueDate);
    updateLocalTask(id, input);
    const assignedUserIds = await prepareAssignedUserIds(id);
    const patchData = buildPatchData(id, firebaseDate, assignedUserIds);
    await updateTaskInFirebase(id, patchData);
    toggleEditView();
    renderTaskCardFullView(allTasks[id]);
}

/**
 * Liest alle Input-Felder ein
 */
function collectEditInputs() {
    return {
        newTitle: document.getElementById("edit_title").value,
        newDescription: document.getElementById("edit_description").value,
        rawDueDate: document.getElementById("edit_due_date").value
    };
}

/**
 * Updated den lokalen Task im allTasks Array
 */
function updateLocalTask(id, input) {
    const task = allTasks[id];
    task.title = input.newTitle;
    task.description = input.newDescription;
    task.duedate = input.rawDueDate;
}

/**
 * Holt User-IDs für assigned Users
 */
async function prepareAssignedUserIds(id) {
    const currentAssignedUser = allTasks[id].assignedUsers;
    return await getUserId(currentAssignedUser);
}

/**
 * Baut das Patch-Objekt für Firebase
 */
function buildPatchData(id, firebaseDate, assignedUserIds) {
    const t = allTasks[id];
    return {
        title: t.title,
        description: t.description,
        duedate: firebaseDate,
        subtasks: t.subtasks,
        priority: t.priority,
        assigned: assignedUserIds
    };
}

/**
 * Wechselt zurück von Edit View zur normalen Detailansicht
 */
function toggleEditView() {
    document.getElementById("task_edit_view").classList.add("d_none");
    document.getElementById("task_full_view").classList.remove("d_none");
}

/**
 * Liefert die User-IDs anhand der zugewiesenen Usernamen.
 */
async function getUserId(currentAssignedUser) {
    try {
        const userData = await loadAllUsers();
        return findMatchingUserIds(userData, currentAssignedUser);
    } catch (error) {
        console.error("Fehler beim Laden der UserIds:", error);
        return [];
    }
}

/**
 * Lädt alle User aus Firebase
 */
async function loadAllUsers() {
    const response = await fetch(pathUser + ".json");
    return await response.json();
}

/**
 * Vergleicht Namen → liefert passende User-IDs zurück
 */
function findMatchingUserIds(userData, currentAssignedUser) {
    const userIds = [];
    for (const userId in userData) {
        const user = userData[userId];
        if (currentAssignedUser.includes(user.name)) {
            userIds.push(userId);
        }
    }
    return userIds;
}

async function updateTaskInFirebase(id, data) {
    const url = `${path}/${id}.json`;

    await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

//Funktion um Kalender zu konvertieren
function convertDateToFirebaseFormat(dateStr) {
    if (!dateStr) return dateStr;
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
}

//Task-delete Funktion
 // Lokal auch entfernen
async function deleteTask(id, event) {
    const url = `${path}/${id}.json`;
    await fetch(url, {
        method: "DELETE"
    });
    delete allTasks[id];
    closeTaskOverlay(event)
}
