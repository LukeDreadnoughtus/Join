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
      const currentSubtasksNumber = currentSubtaskNumber(currentTask)
      const doneSubTasks = currentCompletedTasksNumber(currentTask)
      const currentPriority = currentTask.priority
      const currentSubtask = currentTask.subtask

       // Assigned Users

      const currentAssignedUsers = currentTask.assigned
      const assignedUsers = currentAssignedUsers ? Object.values(currentAssignedUsers) : [];
      const assignedUserColors = await fetchUsercolors(assignedUsers)

      const taskData = {
        id: taskId,
        boardSlot: currentBoardSlot,
        category: currentCategory,
        categoryColor: categoryColor,
        title: currentTitle,
        description: currentDescription,
        subtasksTotal: currentSubtasksNumber,
        subtasksDone: doneSubTasks,
        subtask: currentSubtask,
        priority: currentPriority,
        assignedUsers: assignedUsers,
        assignedUserColors: assignedUserColors
      }
      return taskData
}



function currentSubtaskNumber(currentTask) {
    let currentSubtasks = currentTask.subtask
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

async function fetchUsercolors(assignedUsers) {
    let assignedUsercolors =[]; 
    try {
        const response = await fetch(pathUser + ".json");
        const userData = await response.json();

    for (const user of assignedUsers) {
        let userColor = findUserColor(user, userData)
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
    for (const key in userData) {
                const searchedUser = userData[key];
                if (searchedUser.name === user) {
                    let userColor = searchedUser.color || "#393737ff";
                    return userColor
                }
        }    
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
    let allSubTasks= currentTask.subtask
    let count = 0
    for(let i=0; i < allSubTasks.length; i++) {
        if(allSubTasks[i].done ===true) {count++}
        else continue
    }
    return count; 
}


function closeTaskOverlay(event) {
    event.stopPropagation
    document.getElementById("task_full_view").classList.add("d_none")

}

function openTaskOverlay(id) {
    const taskData = allTasks[id];
    renderTaskCardFullView(taskData)
    const overlay = document.getElementById("task_full_view");
    overlay.classList.remove("d_none")
}


function editTask(id) {
    const overlay = document.getElementById("task_full_view");
    overlay.classList.add("d_none")
    const taskData = allTasks[id];
    const overlayEdit = document.getElementById ("task_edit_view")
    overlayEdit.classList.remove("d_none")
    renderTaskEditCard(taskData)
}

function closeTaskOverlayEdit(event) {
    event.stopPropagation
    document.getElementById("task_edit_view").classList.add("d_none")
}
