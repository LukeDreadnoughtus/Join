function initAddTaskOverlay() {
    const overlay = document.getElementById("overlay");
    const boardSlotSelect = document.getElementById("board-slot");
    if (!overlay) return;
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".add_task_overlay");
        if (!btn) return;
        const slot = btn.dataset.boardslot;
        if (boardSlotSelect && slot) {
            boardSlotSelect.value = slot;
        }
        overlay.classList.remove("overlay_hidden");
    });
    overlay.addEventListener("click", (e) => {
        console.log("Overlay clicked, width:", window.innerWidth, "target:", e.target.id);
        if (window.innerWidth > 1024 && e.target.id === "overlay") {
            console.log("Closing overlay");
            overlay.classList.add("overlay_hidden");
        }
    });
}

// Wichtig: nur einmal aufrufen
document.addEventListener("DOMContentLoaded", initAddTaskOverlay);

let path = "https://board-50cee-default-rtdb.europe-west1.firebasedatabase.app/"
let pathUser = "https://joinregistration-d9005-default-rtdb.europe-west1.firebasedatabase.app/"

var allTasks = {}; // globales Objekt: key = Task-ID, value = Task-Daten

/**
 * Initializes the board after the page has loaded.
 * Prevents the default event, removes user feedback,
 * loads tasks, checks empty columns, and renders the user icon in the header.
 *
 * @async
 * @param {Event} event - The triggered event (e.g. submit or load)
 * @returns {Promise<void>}
 */
async function init() {
    removeUserfeedback()
    await showTasks()
    checkNoTasks();
    renderUserIcon();
}

/**
 * Hides the user feedback element if it is currently visible.
 *
 * @returns {void}
 */
function removeUserfeedback() {
    const userFeedbackEl = document.getElementById("userfeedback");
    if (!userFeedbackEl.classList.contains("d_none")) {
        userFeedbackEl.classList.add("d_none");
    }
}

/**
 * Fetches all tasks from the backend and renders them on the board.
 * Displays a fallback message if no tasks exist or if an error occurs.
 *
 * @async
 * @returns {Promise<boolean|void>} Returns true on error, otherwise void
 */
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
        return true;
    }
}

/**
 * Builds processed task objects and renders each task on the board.
 *
 * @async
 * @param {Object} tasks - Object containing all tasks from the database
 * @returns {Promise<void>}
 */
async function renderAllTasks(tasks) {
    for (const key in tasks) {
        const currentTask = tasks[key];
        const taskData = await buildTaskData(currentTask, key);
        allTasks[taskData.id] = taskData;
        taskTemplate(taskData);
    }
}
/**
 * Builds a complete task data object from raw task data.
 *
 * @async
 * @param {Object} currentTask - Raw task data
 * @param {string} key - Database key of the task
 * @returns {Promise<Object>} Processed task object
 */
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

/**
 * Extracts base information from a task.
 *
 * @param {Object} task - Raw task data
 * @param {string} key - Fallback task ID from the database
 * @returns {Object} Base task data
 */
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

/**
 * Extracts and prepares subtask data including progress counters.
 *
 * @param {Object} task - Task containing subtasks
 * @returns {Object} Subtask-related data
 */
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

/**
 * Fetches names and colors of users assigned to a task.
 *
 * @async
 * @param {Object} task - Task containing assigned user IDs
 * @returns {Promise<Object>} Assigned user names and colors
 */
async function extractAssignedUsers(task) {
    const ids = Array.isArray(task.assigned) && task.assigned.length > 0 ? task.assigned : [];
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

/**
 * Formats a date into DD/MM/YYYY format.
 *
 * @param {string|Date} dateInput - Input date
 * @returns {string} Formatted date
 */
function formatDateDDMMYYYY(dateInput) {
    const dateObj = new Date(dateInput);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Fetches user names for a list of user IDs.
 *
 * @async
 * @param {string[]} currentAssignedUserids - Array of user IDs
 * @returns {Promise<string[]>} Array of user names
 */
async function fetchUserNames(currentAssignedUserids) {
    let assignedUsers = [];
    try {
        const response = await fetch(pathUser + ".json");
        const userData = await response.json();
        for (const user of currentAssignedUserids) {
            let userName = findUserName(user, userData)
            assignedUsers.push(userName)
        }
        return assignedUsers
    } catch (error) {
        console.error("Fehler beim Laden der Usernamen:", error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
        return [];
    }
}

/**
 * Finds the display name of a user by ID.
 *
 * @param {string} user - User ID
 * @param {Object} userData - All user data
 * @returns {string} User name or ID as fallback
 */
function findUserName(user, userData) {
    const searchedUser = userData[user];
    let userName = searchedUser.name || user;
    return userName
}

/**
 * Returns the total number of subtasks of a task.
 *
 * @param {Object} currentTask - Task object containing subtasks
 * @returns {number} Total number of subtasks
 */
function currentSubtaskNumber(currentTask) {
    let currentSubtasks = currentTask.subtasks
    let numberOfCurrentTasks = currentSubtasks.length
    return numberOfCurrentTasks
}

/**
 * Returns the CSS class name for a given task category.
 *
 * @param {string} currentCategory - Task category
 * @returns {string} CSS class name representing the category color
 */
function currentCategoryColor(currentCategory) {
    let categoryColor = "default"
    if (currentCategory === "Technical Task") {
        categoryColor = "technical_task";
    }
    if (currentCategory === "User Story") {
        categoryColor = "user_story";
    }

    return categoryColor
}

/**
 * Fetches color values for assigned users by their IDs.
 *
 * @async
 * @param {string[]} currentAssignedUserids - Array of assigned user IDs
 * @returns {Promise<string[]>} Array of user color values
 */
async function fetchUsercolors(currentAssignedUserids) {
    let assignedUsercolors = [];
    try {
        const response = await fetch(pathUser + ".json");
        const userData = await response.json();
        for (const user of currentAssignedUserids) {
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

/**
 * Finds the color assigned to a user.
 *
 * @param {string} user - User ID
 * @param {Object} userData - Object containing all user data
 * @returns {string} User color or default color as fallback
 */
function findUserColor(user, userData) {
    const searchedUser = userData[user];
    let userColor = searchedUser.color || "#393737ff";
    return userColor
}

/**
 * Checks if board columns contain no rendered tasks.
 * If a column contains only default child elements,
 * a "no tasks" feedback message is displayed.
 *
 * @returns {void}
 */
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

        if (columnEl.children.length === 1) {
            noTasksEl.classList.remove("d_none");
        } else {
            noTasksEl.classList.add("d_none");
        }
    });
}

/**
 * Generates initials from a user name.
 *
 * @param {string} user - Full user name
 * @returns {string} Initials (first and last name)
 */
function initials(user) {
    const parts = String(user || '').trim().split(/\s+/);
    const first = (parts[0] || '').charAt(0).toUpperCase();
    const second = (parts[1] || '').charAt(0).toUpperCase();
    return first + (second || '');
};

/**
 * Counts completed subtasks of a task.
 *
 * @param {Object} currentTask - Task containing subtasks
 * @returns {number} Number of completed subtasks
 */
function currentCompletedTasksNumber(currentTask) {
    let allSubTasks = currentTask.subtasks
    let count = 0
    for (let i = 0; i < allSubTasks.length; i++) {
        if (allSubTasks[i].done === true) { count++ }
        else continue
    }
    return count;
}

/**
 * Performs a real-time search for tasks.
 * - Clears all board columns and renders the basic board structure.
 * - Hides the "No tasks found" message by default.
 * - If the search input is empty, all tasks are displayed.
 * - If a search term is entered, only tasks whose title or description
 *   include the term are displayed.
 * - Shows the "No tasks found" message if no tasks match the search.
 */
function searchTask() {
    const input = document.getElementById("search").value.toLowerCase().trim();
    clearBoardSlots();
    renderBoardBasics()
    toggleNoTasksFound(false);
    const tasksArray = Object.values(allTasks);
    if (!input) {
        tasksArray.forEach(task => taskTemplate(task));
        checkNoTasks();
        return;
    }
    const filteredTasks = filterTasks(tasksArray, input)
    if (filteredTasks.length === 0) {
        toggleNoTasksFound(true);
        return;
    }
    filteredTasks.forEach(task => taskTemplate(task));
    checkNoTasks();
}

function searchTask_res() {
    const input = document.getElementById("search_responsive").value.toLowerCase().trim();
    clearBoardSlots();
    renderBoardBasics()
    toggleNoTasksFound(false);
    const tasksArray = Object.values(allTasks);
    if (!input) {
        tasksArray.forEach(task => taskTemplate(task));
        checkNoTasks();
        return;
    }
    const filteredTasks = filterTasks(tasksArray, input)
    if (filteredTasks.length === 0) {
        toggleNoTasksFound(true);
        return;
    }
    filteredTasks.forEach(task => taskTemplate(task));
    checkNoTasks();
}


/**
 * Clears the content of all board columns so that tasks can be re-rendered.
 */
// function clearBoardSlots() {
//     const boardSlots = document.querySelectorAll(".board_column");
//     boardSlots.forEach(slot => slot.innerHTML = "");
// }

function clearBoardSlots() {
    const boardSlots = document.querySelectorAll(".column_content");
    boardSlots.forEach(slot => slot.innerHTML = "");
}



/**
 * Filters the array of tasks objects by a search term.
 * A task is included if its title or description contains the search term.
 *
 * @param {Array<Object>} tasksArray - Array of task objects ( from allTasks)
 * @param {string} input - Search term to filter tasks
 * @returns {Array<Object>} Filtered array of task objects
 */
function filterTasks(tasksArray, input) {
    return tasksArray.filter(task =>
        task.title.toLowerCase().includes(input) ||
        task.description.toLowerCase().includes(input)
    );
}

/**
 * Shows or hides the "No tasks found" message.
 *
 * @param {boolean} show - true to display the message, false to hide it
 */
function toggleNoTasksFound(show) {
    const element = document.getElementById("no_tasks_found");
    element.classList.toggle("d_none", !show);
}

