let path = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/"
let pathUser = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/"

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
     for (const key in tasks) {
      const currentTask = tasks[key];
      let currentBoardSlot = currentTask.boardslot
      let currentCategory = currentTask.category
      let categoryColor = currentCategoryColor(currentCategory)
      let currentTitle = currentTask.title
      let currentDescription = currentTask.description
      let currentSubtasksNumber = currentSubtaskNumber(currentTask)
      let doneSubTasks = currentCompletedTasksNumber(currentTask)
      let currentPriority = currentTask.priority
      let currentAssignedUsers = currentTask.assigned
      let assignedUsers = currentAssignedUsers ? Object.values(currentAssignedUsers) : [];
      let assignedUserColors = await fetchUsercolors(assignedUsers)
      
      taskTemplate(currentBoardSlot, currentCategory, currentTitle, currentDescription, currentSubtasksNumber, categoryColor, currentPriority, assignedUsers, assignedUserColors, doneSubTasks)
      }
    } 
    catch (error) {
    console.error("Fehler beim Laden der Tasks:", error);
    document.getElementById("userfeedback_no_tasks").classList.remove("d_none")
    return true; }
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


}

function openTaskOverlay() {

}