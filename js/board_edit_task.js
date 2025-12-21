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
             onclick="openDeleteModal('${taskId}', '${subtaskKey}')">
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
async function closeTaskOverlayEdit(event) {
    event.stopPropagation()
    document.getElementById("task_edit_view").classList.add("d_none")
    document.getElementById("task_full_view").classList.add("d_none")
    document.body.classList.remove("no-scroll");
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

async function toggleUserDropdown(id, event) {
    event.stopPropagation();
    const dropdown = document.getElementById("userDropdownList");
    // toggle() gibt TRUE zurück, wenn die Klasse *hinzugefügt* wurde
    const isNowHidden = dropdown.classList.toggle("d_none");
    // Wenn das Dropdown JETZT sichtbar ist → loadUserDropdown
    if (!isNowHidden) {
        await loadUserDropdown(id);
    } 
    // Wenn das Dropdown JETZT verborgen ist → renderEdit
    else {
        renderEdit(id)
    }
}
//damit sich karte nicht mit Klick schließt, sondern nur userdropdown
document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("edit_task_overlay");

    overlay.addEventListener("click", () => {
        closeUserDropdown();
    });
});

function closeUserDropdown(event, id) {
    event.stopPropagation(); // verhindert Overlay-Close

    const dropdown = document.getElementById("userDropdownList");
    if (dropdown) {
        dropdown.classList.add("d_none");
    }
    renderEdit(id)
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
    const newInput = document.getElementById("edit_subtask_input");
    newInput.focus();
}

//Um eine subtask mit enter hinzuzufügens

function handleSubtaskEnter(event, id) {
    if (event.key === 'Enter') {
        event.preventDefault(); // verhindert Formular-Submit
        addNewSubtask(id);
    }
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
    const fakeEvent = new Event('click'); 
    await closeTaskOverlay(fakeEvent)
}

let currentId = null

async function openModal(event, id) {
   event.stopPropagation()
   currentId = id
   document.getElementById("userfeedback_delete_task").classList.remove("d_none")
}

function cancelDeleteTask(event) {
    event.stopPropagation()
    document.getElementById("userfeedback_delete_task").classList.add("d_none")
    currentId = null
}

async function confirmDeleteTask(event) {
    event.stopPropagation()
    if (currentId !== null) {
        await deleteTask(currentId)
    }
    document.getElementById("userfeedback_delete_task").classList.add("d_none")
    currentId = null
}





