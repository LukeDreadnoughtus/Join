let currentTasks = []; //object mit allen Aufgaben des Users
let prios =[]; //priority aller Aufgaben des Users
let path = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/"

//Fehlt noch: Anrede je nach Tageszeit

async function init(event) {
    let username = getUserFromLocalStorage()
    let userId = getUserIdFromLocalStorage()
    if (username) {
      document.getElementById("username").textContent = username;
    }
    await getTasksOfCurrentUser(userId,event)
    renderTasksToSummary()
}

function getUserFromLocalStorage() {
    return localStorage.getItem("username");
}

function getUserIdFromLocalStorage() {
    return localStorage.getItem("userid");
}


//tasks des aktuellen Nutzers aus Firebase laden und dann in Array current tasks pushen
async function getTasksOfCurrentUser(userId,event) {
    event.preventDefault();
    try {
        const response = await fetch(path + ".json");
        const userTasks = await response.json();
        searchTasksForCurrentUser(userTasks, userId)

     } catch (error) {
        console.error("Fehler beim Laden der Tasks aus Firebase:", error);
        alert("Ein Fehler ist aufgetreten. Deine Tasks konnten leider nicht geladen werden.");
    }
}


//Hier werden die Tasks gesucht, zu welchen diese userID assigned ist. 
function searchTasksForCurrentUser(userTasks, userId) {

    const keys = Object.keys(userTasks); 

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];       
        const task = userTasks[key]; 
        const assignedUsers = task.assigned;
       
         for (const userkey in assignedUsers) {
            if(userId === userkey) {
                let boardPosition = task.boardslot
                let taskPrio = task.priority
                currentTasks.push(boardPosition) //alle Aufgaben des Users werden in currentTask gepusht
                prios.push(taskPrio) //alle priorities werden der Reihenfolge nach in dieses array gepusht
            } 
         }
    }
}

//tasks aus currenttasks herauslesen
//Hier wird gezählt, wie viele Aufgaben jeweils in welchem Boardslot sind
//Im letzten Schritt wird gezählt wie oft das level urgent im Array prios vorkommt, denn nur das wird in summary angezeigt. 

function renderTasksToSummary (){
    document.getElementById("tasks_in_board").innerHTML = currentTasks.length
/** so müssten dann die boardslots auch bei den tasks heißen, wenn wir das board mit dem drag&drop aufsetzen */
    let toDo = "todo"
    let done ="done"
    let tasksInProgress = "progress"
    let awaitingFeedback = "feedback"

    for (let i = 0; i < currentTasks.length; i++) {
        let count = 0
    if (currentTasks[i] === toDo) {count++;}
    document.getElementById("to_do").innerHTML = count
    }   

    for (let i = 0; i < currentTasks.length; i++) {
        let count = 0
    if (currentTasks[i] === done) {count++;}
    document.getElementById("done").innerHTML = count
    }   

    for (let i = 0; i < currentTasks.length; i++) {
        let count = 0
    if (currentTasks[i] === tasksInProgress) {count++;}
    document.getElementById("tasks_in_progress").innerHTML = count
    }   

    for (let i = 0; i < currentTasks.length; i++) {
        let count = 0
    if (currentTasks[i] === awaitingFeedback) {count++;}
    document.getElementById("awaiting_feedback").innerHTML = count
    }   

    for (let i = 0; i < prios.length; i++) {
        let count = 0
    if (prios[i] === "urgent") {count++;}
    document.getElementById("urgent").innerHTML = count
    } 
}



