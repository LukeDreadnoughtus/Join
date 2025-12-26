/**
 * Switches a subtask into edit mode and renders the edit UI.
 *
 * Retrieves the selected subtask, marks its list item as being edited,
 * and replaces its content with the editable template.
 *
 * @param {string|number} taskId - The ID of the parent task
 * @param {string|number} subtaskKey - The key/index of the subtask to edit
 */
function editSubtask(taskId, subtaskKey) {
    const task = allTasks[taskId];
    const subtask = task.subtasks[subtaskKey];

    const listItem = getSubtaskListItem(subtaskKey);
    setSubtaskEditingState(listItem);
    renderSubtaskEditTemplate(listItem, taskId, subtaskKey, subtask.name);
}

/**
 * Returns the list item element of a subtask based on its index.
 *
 * @param {string|number} subtaskKey - Subtask index
 * @returns {HTMLLIElement}
 */
function getSubtaskListItem(subtaskKey) {
    return document.querySelector(
        `.edit_subtask_item:nth-child(${parseInt(subtaskKey) + 1})`
    );
}

/**
 * Marks a subtask list item as being edited.
 *
 * @param {HTMLLIElement} listItem
 */
function setSubtaskEditingState(listItem) {
    listItem.classList.add("editing");
}

/**
 * Saves the edited subtask name and updates it in Firebase.
 *
 * Reads the new subtask name from the input field, updates the local task data,
 * persists the change to Firebase, and re-renders the edit view.
 *
 * @param {string|number} taskId - ID of the parent task
 * @param {string|number} subtaskKey - Key/index of the subtask
 * @param {HTMLLIElement} liElement - List item element containing the edit input
 */
async function saveSubtaskEdit(taskId, subtaskKey, liElement) {
    const input = liElement.querySelector(".subtask_edit_input");
    const newName = input.value.trim();
    if (!newName) return;
    allTasks[taskId].subtasks[subtaskKey].name = newName;
    await updateSubtasksInFirebase(taskId, allTasks[taskId].subtasks);
    liElement.classList.remove("editing");
    renderEdit(taskId);
}

/**
 * Renders the icons of users already assigned to a task.
 *
 * Displays user initials with color-coded backgrounds based on assigned users.
 * Clears the container if no users are assigned.
 *
 * @param {Object} taskData - Task object containing assigned user data
 */
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

/**
 * Closes the task edit overlay and resets the board view.
 *
 * Hides all task overlays, restores page scrolling,
 * re-renders the board, and reloads task data.
 *
 * @param {Event} event - Click event
 */
async function closeTaskOverlayEdit(event) {
    event.stopPropagation()
    document.getElementById("task_edit_view").classList.add("d_none")
    document.getElementById("task_full_view").classList.add("d_none")
    document.body.classList.remove("no-scroll");
    renderBoardBasics()
    await init(event)
}

/**
 * Toggles the completion state of a subtask.
 *
 * Updates the checkbox state, synchronizes the change with local task data,
 * and persists the update to Firebase.
 *
 * @param {Event} event - Change event from the checkbox
 * @param {string|number} indexSubtask - Index of the subtask
 * @param {Object} taskData - Task object from the overlay view
 */
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

/**
 * Updates the completion state of a single subtask in Firebase.
 *
 * @param {string|number} taskId - ID of the parent task
 * @param {string|number} index - Index of the subtask
 * @param {boolean} newValue - New completion state
 */
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

/**
 * Toggles the visibility of the assigned user dropdown.
 *
 * Loads the user list when opened and re-renders the edit view when closed.
 *
 * @param {string|number} id - Task ID
 * @param {Event} event - Click event
 */
async function toggleUserDropdown(id, event) {
    event.stopPropagation();
    const dropdown = document.getElementById("userDropdownList");
    const isNowHidden = dropdown.classList.toggle("d_none");
    if (!isNowHidden) {
        await loadUserDropdown(id);
    } 
    else {
        renderEdit(id)
    }
}
//prevents event bubbling while closing the userDropdownList
document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.getElementById("edit_task_overlay");
    overlay.addEventListener("click", () => {
        closeUserDropdown();
    });
});

/**
 * Closes the user selection dropdown.
 *
 * Prevents overlay closure and re-renders the edit view.
 *
 * @param {Event} event - Click event
 * @param {string|number} id - Task ID
 */
function closeUserDropdown(event, id) {
    event.stopPropagation(); // verhindert Overlay-Close
    const dropdown = document.getElementById("userDropdownList");
    if (dropdown) {
        dropdown.classList.add("d_none");
    }
    renderEdit(id)
}

/**
 * Loads and renders the user selection dropdown.
 *
 * Fetches all users and marks already assigned users as selected.
 *
 * @param {string|number} id - Task ID
 */
async function loadUserDropdown(id) {
    const allUsers = await fetchAllUsers();
    const assigned = allTasks[id].assignedUsers;
    const list = document.getElementById("userDropdownList");

    list.innerHTML = allUsers.map(user =>
        createUserTemplate(user, id, assigned.includes(user.name))
    ).join("");
}

/**
 * Creates the HTML template for a single user row in the user selection dropdown.
 *
 * Prepares the user icon data (initials and color) and builds
 * the HTML structure for the user, including the checkbox
 * to indicate assignment.
 *
 * @param {Object} user - The user object containing at least `name` and optional `color`
 * @param {string|number} id - The ID of the task the user may be assigned to
 * @param {boolean} isAssigned - Whether the user is already assigned to the task
 * @returns {string} HTML string representing the user row in the dropdown
 */
function createUserTemplate(user, id, isAssigned) {
    const iconData = getUserIconData(user);
    return buildUserTemplate(iconData, user, id, isAssigned);
}

/**
 * Extracts icon-related data for a user.
 *
 * @param {Object} user - User object
 * @returns {{iconColor: string, initials: string}}
 */
function getUserIconData(user) {
    const color = user.color || "#393737ff";
    return {
        iconColor: color.replace("#", ""),
        initials: initials(user.name)
    };
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





