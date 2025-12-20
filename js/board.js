function openAddTaskOverlay() {
    document.getElementById("taskCreateButton").addEventListener("click", () => {
        const overlay = document.getElementById("overlay");
        overlay.classList.remove("overlay_hidden");
    });
    document.getElementById("overlay").addEventListener("click", (e) => {
        if (e.target.id === "overlay") e.target.classList.add("overlay_hidden");
    });
}

openAddTaskOverlay();


//render Board_functions

let path = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/"
let pathUser = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/"

var allTasks = {}; // globales Objekt: key = Task-ID, value = Task-Daten

async function init(event) {
event.preventDefault();
removeUserfeedback()
await showTasks()
checkNoTasks();
renderUserIcon();
}

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
