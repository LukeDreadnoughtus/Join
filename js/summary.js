async function init() {
    let username = getUserFromLocalStorage()
    let userId = getUserIdFromLocalStorage()
    if (username) {
      document.getElementById("username").textContent = username;
    }
    await getTasksOfCurrentUser(userId)

}

function getUserFromLocalStorage() {
    return localStorage.getItem("username");
}

function getUserIdFromLocalStorage() {
    return localStorage.getItem("userid");
}

async function getTasksOfCurrentUser(userId) {
    try {
        const response = await fetch(path + ".json");
        const userTasks = await response.json();
        searchTasksForCurrentUser(userTasks)

     } catch (error) {
        console.error("Fehler beim Laden der Tasks aus Firebase:", error);
        alert("Ein Fehler ist aufgetreten. Deine Tasks konnten leider nicht geladen werden.");
    }
}

function searchTasksForCurrentUser(userTasks) {
    let assignedUser = userTasks.assignedUser
    

}
