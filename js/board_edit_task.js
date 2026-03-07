/**
 * Filters the user dropdown list based on the search term.
 * Only matches the user name inside the <span> element.
 *
 * @param {string} searchTerm - Text typed in the input field
 */
window.filterUsers = function(searchTerm) {
    searchTerm = searchTerm.toLowerCase();
    const users = document.querySelectorAll("#userDropdownList .user_option");

    users.forEach(user => {
        const nameElement = user.querySelector(".selectable_user span");
        if (!nameElement) return;

        const fullName = nameElement.textContent.toLowerCase();
        const nameParts = fullName.split(" "); // trennt Vor- und Nachname

        // Prüfen, ob eines der Teile mit dem Suchbegriff beginnt
        const matches = nameParts.some(part => part.startsWith(searchTerm));

        user.style.display = matches ? "flex" : "none";
    });
};

/**
 * Renders the icons of users already assigned to a task.
 *
 * Displays user initials with color-coded backgrounds based on assigned users.
 * Clears the container if no users are assigned.
 *
 * @param {Object} taskData - Task object containing assigned user data
 */
function renderAssignedUserIcons(taskData) {
    const container = document.getElementById("already_assigned");
    container.innerHTML = "";
    const users = taskData.assignedUsers || [];
    const colors = taskData.assignedUserColors || [];
    const maxVisible = 4;
    if (!users.length) return;
    const visibleIcons = users
        .slice(0, maxVisible)
        .map((user, i) => createUserIcon(user, colors[i]))
        .join("");
    const overflowIcon = users.length > maxVisible
        ? createOverflowIcon(users.length - maxVisible)
        : "";
    container.innerHTML = visibleIcons + overflowIcon;
}

/**
 * Creates the HTML markup for a user icon with the user's initials.
 * The icon is styled with a background color and typically used
 * to display assigned users on a task card.
 *
 * @param {string} user - The name of the user to generate initials from.
 * @param {string} color - The background color of the user icon (e.g., hex, rgb, or CSS color).
 * @returns {string} The HTML string representing the user icon element.
 */
function createUserIcon(user, color) {
    return `<div class="assigned_icon" style="background-color: ${color}">
                ${initials(user)}
            </div>`;
}

/**
 * Creates the HTML markup for an overflow icon indicating
 * that more users are assigned than can be displayed.
 *
 * @param {number} count - The number of additional hidden users.
 * @returns {string} The HTML string representing the overflow icon.
 */
function createOverflowIcon(count) {
    return `<div class="assigned_icon overflow_icon">+${count}</div>`;
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
    const selected = event.currentTarget.closest(".user_dropdown_selected");
    const isNowHidden = dropdown.classList.toggle("d_none");
    selected.classList.toggle("open", !isNowHidden);
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
    overlay.addEventListener("click", (event) => {
        closeUserDropdown(event);
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
    event.stopPropagation();
    const dropdown = document.getElementById("userDropdownList");
    if (dropdown) {
        dropdown.classList.add("d_none");
    }
    if (id !== undefined) {
    renderEdit(id)
    }
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
    const loggedInUser = getLoggedInUser();
    const isCurrentUser = loggedInUser === user.userId;
    return buildUserTemplate(iconData, user, id, isAssigned,isCurrentUser);
}

function getLoggedInUser() {
    return localStorage.getItem("userid");
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
        iconColor: color,
        initials: initials(user.name)
    };
}

/**
 * Fetches all users from Firebase.
 *
 * Converts the user object returned by Firebase into an array of user objects
 * containing ID, name, and color.
 *
 * @returns {Promise<Array<{userId: string, name: string, color: string}>>}
 *          A promise resolving to an array of user objects
 */

async function fetchAllUsers() {
    try {
        const response = await fetch(pathUser + ".json");
        const userData = await response.json();

        return Object.entries(userData).map(([userId, data]) => ({
            userId,
            name: data.name,
            color: data.color || data.colors || "#393737ff"
        }));
    } catch (error) {
        console.error("Fehler beim Laden der User:", error);
        alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
        return [];
    }
}

/**
 * Toggles the assignment of a user to a task.
 *
 * Ensures the assigned user arrays exist and adds or removes
 * the user based on the checkbox state.
 *
 * @param {string} userColor - Color associated with the user
 * @param {string} userName - Name of the user
 * @param {string|number} id - ID of the task
 * @param {HTMLInputElement} checkbox - Checkbox element indicating assignment state
 */
function toggleAssignedUsers(userColor, userName, id, checkbox) {
    const task = allTasks[id];
    ensureAssignedUserArrays(task);
    const userOption = checkbox.closest(".user_option");
    if (checkbox.checked) {
        addAssignedUser(task, userName, userColor);
        userOption.classList.add("assigned");
    } else {
        removeAssignedUser(task, userName);
        userOption.classList.remove("assigned");
    }
}

/**
 * Ensures that assigned user arrays exist on the task.
 *
 * @param {Object} task - Task object
 */
function ensureAssignedUserArrays(task) {
    if (!task.assignedUsers) task.assignedUsers = [];
    if (!task.assignedUserColors) task.assignedUserColors = [];
}

/**
 * Adds a user to the assigned users list if not already present.
 *
 * @param {Object} task - Task object
 * @param {string} userName - User name
 * @param {string} userColor - User color
 */
function addAssignedUser(task, userName, userColor) {
    if (!task.assignedUsers.includes(userName)) {
        task.assignedUsers.push(userName);
        task.assignedUserColors.push(userColor);
    }
}

/**
 * Removes a user from the assigned users list.
 *
 * @param {Object} task - Task object
 * @param {string} userName - User name
 */
function removeAssignedUser(task, userName) {
    const index = task.assignedUsers.indexOf(userName);
    if (index !== -1) {
        task.assignedUsers.splice(index, 1);
        task.assignedUserColors.splice(index, 1);
    }
}

/**
 * Prepares user IDs for assigned users of a task.
 *
 * Converts assigned user names into their corresponding user IDs.
 *
 * @param {string|number} id - Task ID
 * @returns {Promise<Array<string>>}
 */
async function prepareAssignedUserIds(id) {
    const currentAssignedUser = allTasks[id].assignedUsers;
    return await getUserId(currentAssignedUser);
}

/**
 * Switches from the edit view back to the task detail view.
 */
function toggleEditView() {
    document.getElementById("task_edit_view").classList.add("d_none");
    document.getElementById("task_full_view").classList.remove("d_none");
}

/**
 * Resolves user IDs for the given assigned user names.
 *
 * Loads all users and matches their IDs to the provided user names.
 *
 * @param {Array<string>} currentAssignedUser - Assigned user names
 * @returns {Promise<Array<string>>}
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
 * Loads all users from Firebase.
 *
 * @returns {Promise<Object>} A promise resolving to the raw user data object
 */
async function loadAllUsers() {
    const response = await fetch(pathUser + ".json");
    return await response.json();
}

/**
 * Matches assigned user names to their corresponding user IDs.
 *
 * Iterates over all users and returns the IDs of users whose names
 * are included in the assigned user list.
 *
 * @param {Object} userData - Raw user data object from Firebase
 * @param {Array<string>} currentAssignedUser - List of assigned user names
 * @returns {Array<string>} Matching user IDs
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

/**
 * Updates a task in Firebase using a PATCH request.
 *
 * @param {string|number} id - Task ID
 * @param {Object} data - Data object containing updated task fields
 */

async function updateTaskInFirebase(id, data) {
    const url = `${path}/${id}.json`;
    const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firebase PATCH failed: ${response.status} - ${errorText}`);
    }
    return await response.json(); 
}

/**
 * Convert a date string to Firebase format (yyyy-mm-dd)
 * Supports dd/mm/yyyy or yyyy-mm-dd input.
 * @param {string} dateStr
 * @returns {string} formatted date
 */
function convertDateToFirebaseFormat(dateStr) {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month}-${day}`;
    }
    return "";
}