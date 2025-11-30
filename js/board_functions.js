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

async function buildTaskData(currentTask, key) {
      const taskId = currentTask.id || key || crypto.randomUUID(); // ID aus der Datenbank übernehmen oder generieren (Fallback)
      const currentBoardSlot = currentTask.boardslot
      const currentCategory = currentTask.category
      const categoryColor = currentCategoryColor(currentCategory)
      const currentTitle = currentTask.title
      const currentDescription = currentTask.description
      const currentPriority = currentTask.priority
      const dateObj = new Date(currentTask.duedate);
      const currentDuedate = dateObj.toLocaleDateString("de-DE");
     

      //subtasks
      const currentSubtask = Array.isArray(currentTask.subtasks)? currentTask.subtasks: [];
      let currentSubtasksNumber = 0;
      let doneSubTasks = 0;
      if (currentSubtask.length > 0) {
      currentSubtasksNumber = currentSubtaskNumber(currentTask);
      doneSubTasks = currentCompletedTasksNumber(currentTask);
      }

       // Assigned Users
      const currentAssignedUserids = Array.isArray(currentTask.assigned) && currentTask.assigned.length > 0 ? currentTask.assigned : null;
      let assignedUsers = [];
      let assignedUserColors = [];
      if (currentAssignedUserids) {
      assignedUsers = await fetchUserNames (currentAssignedUserids)
      assignedUserColors = await fetchUsercolors(currentAssignedUserids)
      } else {// Fallback: Noch keine User assigned
        assignedUsers = [];
        assignedUserColors = []; 
      }
      const taskData = {
        id: taskId,
        boardSlot: currentBoardSlot,
        category: currentCategory,
        categoryColor: categoryColor,
        title: currentTitle,
        description: currentDescription,
        dueDate: currentDuedate,
        subtasksTotal: currentSubtasksNumber,
        subtasksDone: doneSubTasks,
        subtasks: currentSubtask,
        priority: currentPriority,
        assignedUsers: assignedUsers,
        assignedUserColors: assignedUserColors,
      }
      return taskData
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
    let currentSubtasks = currentTask.subtasks //Hier brauchen wir ein Fallback, falls subtask nicht gefunden wird. 
    let numberOfCurrentTasks = currentSubtasks.length //Hier ist das noch undefined, weil das hier in der Datenbank anders abgespeichert wird
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

//Diese zwei Funktionen sind gleich. Man könnte dann eine ersetzen und nur die ohne id nehmen.  

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

function renderSubtasks(taskData) {
    if (!taskData.subtasks || typeof taskData.subtasks !== "object") {
        return '<p class="subtask_detail_font">No subtasks</p>';
    }

    const subtasksContainer = document.createElement("div");

    Object.entries(taskData.subtasks).forEach(([key, currentSubtask]) => {
        const subtaskDiv = document.createElement("div");
        subtaskDiv.classList.add("subtask_check");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `subtask_${key}`;
        checkbox.checked = currentSubtask.done;

        checkbox.addEventListener("change", (event) => {
            toggleSubtask(event, key, taskData);
        });

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.classList.add("subtask_label");
        label.innerHTML = `<p class="subtask_detail_font">${currentSubtask.name}</p>`;

        subtaskDiv.appendChild(checkbox);
        subtaskDiv.appendChild(label);
        subtasksContainer.appendChild(subtaskDiv);
    });

    return subtasksContainer;
}

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
    renderAssignedUserIcons(taskData)
    renderEditSubtasks(taskData)
}

function renderEditSubtasks(taskData) {
    const subtaskList = document.getElementById("subtask_list");
    subtaskList.innerHTML = "";

    if (!taskData.subtasks || Object.keys(taskData.subtasks).length === 0) {
        subtaskList.innerHTML = "<li class='empty'>No subtasks</li>";
        return;
    }
    Object.entries(taskData.subtasks).forEach(([index, subtask]) => {

        const li = document.createElement("li");
        li.classList.add("edit_subtask_item");
        li.innerHTML = `
            <span class="subtask_element">${subtask.name}</span>
        `;
        subtaskList.appendChild(li);
    });
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


async function closeTaskOverlayEdit(event) {
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
// const allUsers = ["Anna Müller", "Ben Kaiser", "Chris Sommer", "David Lenz"];
// let selectedUsers = [];

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
    const allUsers = await fetchAllUsers(id);
    const list = document.getElementById("userDropdownList");
    list.innerHTML = "";
    allUsers.forEach(user => {
        list.innerHTML += createUserTemplate(user, id); 
    });
}

//Hier wird jede Reihe des Dropdowns gebildet

function createUserTemplate(user, id) {
  const color = user.color || "#393737ff"; 
  const iconColor = color.replace('#', '');
  const usericon = initials(user.name)
 
    return `
        <div class="user_option">
        <div class="selectable_user">
          <div class="user_icon color${iconColor}">${usericon}</div>
          <span>${user.name}</span>
        </div>
          <input type="checkbox" class="user_checkbox" onclick="toggleAssignedUsers('${color}','${user.name}','${id}', this)">
        </div>
    `;
}

async function fetchAllUsers(id) {
    let allUsers = [];
    try {
        const response = await fetch(pathUser + ".json");
        const userData = await response.json();

        for (const userId in userData) {
            const userObj = userData[userId];
            const userName = userObj.name;
            const userColor = userObj.color;
            if (assignedUserCheck(id, userName)) continue;
            allUsers.push({
                userId: userId,
                name: userName,
                color: userColor
            });
        }
        return allUsers;
    } catch (error) {
        console.error("Fehler beim Laden der verfügbaren User:", error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
        return [];
    }
}

//Prüft ob der userName schon assigned ist. 

function assignedUserCheck(id, userName) { 
    const assignedUserProof = allTasks[id].assignedUsers
    return assignedUserProof.includes(userName)
}


//Diese Funktion fügt neue assigned user hinzu. 
function toggleAssignedUsers(userColor, userName, id, checkbox) {
    // Wenn angehakt → hinzufügen
    if (checkbox.checked) {
        if (!allTasks[id].assignedUsers.includes(userName)) {
            allTasks[id].assignedUsers.push(userName);
            allTasks[id].assignedUserColors.push(userColor);
        }
    } 
    // Wenn nicht angehakt → entfernen
    else {
        // Index des Users suchen
        const index = allTasks[id].assignedUsers.indexOf(userName);
        // Falls User existiert → beide Arrays synchron entfernen
        if (index !== -1) {
            allTasks[id].assignedUsers.splice(index, 1);
            allTasks[id].assignedUserColors.splice(index, 1);
        }
    }
    // UI aktualisieren
    loadUserDropdown(id);
}


//Funktionen für subTask-Bearbeitung, zeigt auf das Icon
function clearSubtaskInput(icon) {
    const wrapper = icon.closest('.input_edit_subtask_wrapper');
    const input = wrapper.querySelector('.input_edit_subtask');
    input.value = "";
}

// Um eine subtask hinzuzufügen

function addNewSubtask(id) {
    const input = document.getElementById("edit_subtask_input");
    const newSubtaskName = input.value.trim();
    if (!newSubtaskName) return; 
    const newSubtask = { 
        done: false, 
        name: newSubtaskName 
    };
    allTasks[id].subtasks.push(newSubtask);
    input.value = ""; 
    renderEdit(id);   
}



//Funktionen um Bearbeitung in die Datenbank zu speichern. 

//Funktioniert noch nicht - hier weiter machen. 

async function saveEdits(id) {

    const patchData = {
        title: document.getElementById("edit_title").value,
        description: document.getElementById("edit_description").value,
        dueDate: document.getElementById("edit_due_date").value,
        subtasks: allTasks[id].subtasks,
        priority: allTasks[id].priority,
        assignedUsers: allTasks[id].assignedUsers,
        assignedUserColors: allTasks[id].assignedUserColors,
    };

    // alles, was gleich geblieben ist → NICHT senden
    await updateTaskInFirebase(id, patchData);
    document.getElementById("task_edit_view").classList.add("d_none")
    const taskData = allTasks[id];
    renderTaskCardFullView(taskData)
}

async function updateTaskInFirebase(id, data) {
    const url = `${path}/${id}.json`;

    await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
}

