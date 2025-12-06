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
async function getTasksOfCurrentUser(userId, event) {
    if (event && typeof event.preventDefault === "function") {
        event.preventDefault();}
    currentTasks = [];
    prios = [];
    try {
        const response = await fetch(path + ".json");
        const userTasks = await response.json();
        if (!userTasks) return;
        searchTasksForCurrentUser(userTasks, userId);
    } catch (error) {
        console.error("Fehler beim Laden der Tasks aus Firebase:", error);
        alert("Ein Fehler ist aufgetreten. Deine Tasks konnten leider nicht geladen werden.");
    }
}


//Hier werden die Tasks gesucht, zu welchen diese userID assigned ist. 
function searchTasksForCurrentUser(userTasks, userId) {
    const tasks = Object.values(userTasks || {});
    tasks.forEach(task => {
        if (!task || !task.assigned) return;
        const assignedArray = Array.isArray(task.assigned)
            ? task.assigned
            : Object.values(task.assigned);
        if (assignedArray.includes(userId)) {
            currentTasks.push(String(task.boardslot || ""));
            prios.push(String(task.priority || ""));
        }
    });
}

//tasks aus currenttasks herauslesen
//Hier wird gezählt, wie viele Aufgaben jeweils in welchem Boardslot sind
//Im letzten Schritt wird gezählt wie oft das level urgent im Array prios vorkommt, denn nur das wird in summary angezeigt. 

function renderTasksToSummary() {
    document.getElementById("tasks_in_board").innerHTML = currentTasks.length;
    document.getElementById("to_do").innerHTML = countBoardSlot(currentTasks, "todo");
    document.getElementById("done").innerHTML = countBoardSlot(currentTasks, "done");
    document.getElementById("tasks_in_progress").innerHTML = countBoardSlot(currentTasks, "progress");
    document.getElementById("awaiting_feedback").innerHTML = countBoardSlot(currentTasks, "feedback");
    document.getElementById("urgent").innerHTML = countUrgent(prios, "urgent");
}


function countUrgent(arr, value) {
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === value) count++;
    }
    return count;
}

function countBoardSlot(arr, slotName) {
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === slotName) count++;
    }
    return count;
}




