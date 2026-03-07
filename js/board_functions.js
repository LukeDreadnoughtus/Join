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
    const inputElement = document.getElementById("search");
    const input = inputElement.value.toLowerCase().trim();
    const iconElement = document.getElementById("icon_search");
    const tasksArray = Object.values(allTasks);
    toggleInputHighlight(inputElement, iconElement, input !== "");
    clearBoardSlots();
    renderBoardBasics()
    toggleNoTasksFound_Header(false);
    renderFilteredTasks_Header(tasksArray, input)
}

/**
 * Searchtask-Funktion in the responsive mode
 */
function searchTask_res() {
    const inputElement = document.getElementById("search_responsive");
    const input = inputElement.value.toLowerCase().trim();
    const iconElement = document.getElementById("icon_search_responsive");
    const tasksArray = Object.values(allTasks);
    toggleInputHighlight(inputElement, iconElement, input !== "");
    clearBoardSlots();
    renderBoardBasics()
    toggleNoTasksFound(false);
    renderFilteredTasks(tasksArray, input)
}

/**
 * Renders tasks on the board based on the search input.
 *
 * If no search input is provided, all tasks from the given array are rendered.
 * If a search term exists, the tasks are filtered and only matching tasks are displayed.
 * If no matching tasks are found, a "no tasks found" message is shown.
 * After rendering, the function checks whether any task columns are empty.
 *
 * @param {Array<Object>} tasksArray - Array of task objects to render.
 * @param {string} input - The search string used to filter tasks.
 */
function renderFilteredTasks(tasksArray, input) {
    if (!input) {
        tasksArray.forEach(task => taskTemplate(task));
    } else {
        const filteredTasks = filterTasks(tasksArray, input);
        if (filteredTasks.length === 0) {
            toggleNoTasksFound(true);
            return;
        }
        filteredTasks.forEach(task => taskTemplate(task));
    }
    checkNoTasks();
}

/**
 * Renderfunction for responsive mode
 */
function renderFilteredTasks_Header(tasksArray, input) {
    if (!input) {
        tasksArray.forEach(task => taskTemplate(task));
    } else {
        const filteredTasks = filterTasks(tasksArray, input);
        if (filteredTasks.length === 0) {
            toggleNoTasksFound_Header(true);
            return;
        }
        filteredTasks.forEach(task => taskTemplate(task));
    }
    checkNoTasks();
}

/**
 * Toggles highlight styles for a search input field and its icon.
 *
 * When active, a highlight class is added to both the input
 * and the icon. When inactive, the highlight classes are removed.
 *
 * @param {HTMLElement} inputElement - The search input element.
 * @param {HTMLElement} iconElement - The icon associated with the input field.
 * @param {boolean} active - Determines whether the highlight should be applied.
 */
function toggleInputHighlight(inputElement, iconElement, active) {
    if (active) {
        inputElement.classList.add("blue_input");
        iconElement.classList.add("blue_icon");
    } else {
        inputElement.classList.remove("blue_input");
        iconElement.classList.remove("blue_icon");
    }
}

/**
 * Clears the content of all board columns so that tasks can be re-rendered.
 */
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

/**
 * For responsive mode
 */
function toggleNoTasksFound_Header(show) {
    const element = document.getElementById("no_tasks_found_header");
    element.classList.toggle("d_none", !show);
}

/**
 * Creates a single user icon for a task card.
 *
 * @param {string} user - The full name of the user.
 * @param {string} color - The background color for the icon (hex or CSS color).
 * @returns {string} HTML string representing the user icon.
 */
function createTaskUserIcon(user, color) {
    return `<div class="user_icon_task_card" style="background-color: ${color}">${initials(user)}</div>`;
}

/**
 * Creates an overflow icon for a task card showing how many extra users are assigned.
 *
 * @param {number} count - Number of additional users beyond the visible limit.
 * @returns {string} HTML string representing the overflow icon (e.g., "+2").
 */
function createTaskOverflowIcon(count) {
    return `<div class="user_icon_task_card overflow_icon">+${count}</div>`;
}

/**
 * Renders the progress bar for subtasks on a task card.
 *
 * @param {Object} taskData - The task data object containing subtasks info.
 * @param {number} taskData.subtasksDone - Number of completed subtasks.
 * @param {number} taskData.subtasksTotal - Total number of subtasks.
 * @returns {string} HTML string for the task's subtask progress bar, or empty string if no subtasks.
 */
function renderTaskProgress(taskData) {
    if (!taskData.subtasksTotal || taskData.subtasksTotal === 0) return "";
    const progressPercent = Math.round((taskData.subtasksDone / taskData.subtasksTotal) * 100);
    return `
    <div class="task_progress_subtasks_card">
        <div class="progressbar_subtasks">
            <div class="progressbar_fill" style="width: ${progressPercent}%;"></div>
            <span class="progressbar_tooltip">${progressPercent}% done</span>
        </div>
        <p>${taskData.subtasksDone}/${taskData.subtasksTotal} Subtasks</p>
    </div>
    `;
}

/**
 * Renders the assigned users for a task card, including a max of 4 visible icons
 * and an overflow icon if more users are assigned.
 *
 * @param {Object} taskData - The task data object containing assigned users.
 * @param {string[]} taskData.assignedUsers - Array of user names assigned to the task.
 * @param {string[]} taskData.assignedUserColors - Array of colors corresponding to each user.
 * @returns {string} HTML string representing all assigned user icons, including overflow if necessary.
 */
function renderAssignedUsersTaskCard(taskData) {
    const users = taskData.assignedUsers || [];
    const colors = taskData.assignedUserColors || [];
    const maxVisible = 4;
    if (!users.length) {
        return `<div class="no_assignies"><p>No Users</p><p>assigned</p></div>`;
    }
    const visibleIcons = users
        .slice(0, maxVisible)
        .map((user, i) => createTaskUserIcon(user, colors[i] || "#000000"))
        .join("");
    const overflowIcon = users.length > maxVisible
        ? createTaskOverflowIcon(users.length - maxVisible)
        : "";
    return visibleIcons + overflowIcon;
}

/**
 * Defines the possible move options for tasks on the board.
 * Each board slot (todo, progress, feedback, done) has a set of
 * options with a label, target slot, and arrow direction.
 * 
 * @type {Object<string, Array<{label: string, target: string, direction: string}>>}
 */
const moveOptions = {
  todo: [
    { label: "In Progress", target: "progress", direction: "down"}
  ],
  progress: [
    { label: "To do", target: "todo", direction: "up" },
    { label: "Await Feedback", target: "feedback" , direction: "down" }
  ],
  feedback: [
    { label: "In Progress", target: "progress" , direction: "up" },
    { label: "Done", target: "done" , direction: "down"}
  ],
  done: [
    { label: "Await Feedback", target: "feedback", direction: "up" }
  ]
};

/**
 * Opens the task "move to" menu for a specific task card.
 * Stops event propagation to prevent closing immediately,
 * constructs the menu items, and sets up a click listener
 * to close the menu when clicking outside of it.
 *
 * @param {string} slot - Current board slot of the task (e.g., "todo", "progress")
 * @param {string} id - Unique ID of the task
 * @param {Event} event - The click event that triggered the menu
 * @returns {void}
 */
function openResMenu(slot, id, event) {
  event.stopPropagation();
  const menu = document.getElementById(`menu_task_card_res_${id}`);
  menu.classList.remove("d_none");
  constructMenu(slot, id, menu);
    const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.classList.add("d_none");
      document.removeEventListener("click", closeMenu);
    }};
  document.addEventListener("click", closeMenu);
}

/**
 * Constructs the menu items inside the "move to" menu for a task.
 * Adds a header and all options based on the current slot.
 *
 * @param {string} slot - Current board slot of the task
 * @param {string} id - Unique ID of the task
 * @param {HTMLElement} menu - The menu container element
 * @returns {void}
 */
function constructMenu(slot, id, menu) {
  menu.innerHTML = "";
  const header = document.createElement("div");
  header.classList.add("menu_header");
  header.textContent = "Move to";
  menu.appendChild(header);
  const options = moveOptions[slot];
  if (!options) return;
  options.forEach(option => {
    menu.appendChild(createMenuItem(option, id));
  });
}

/**
 * Creates a single menu item element for the "move to" menu.
 * Adds an arrow image indicating direction and sets the click handler
 * to move the task to the selected board slot.
 *
 * @param {{label: string, target: string, direction: string}} option - The menu option data
 * @param {string} id - Unique ID of the task
 * @returns {HTMLElement} The constructed menu item element
 */
function createMenuItem(option, id) {
  const item = document.createElement("div");
  item.classList.add("menu_item");
  const text = document.createElement("span");
  text.textContent = option.label;
  const arrow = document.createElement("img");
  arrow.src = "assets/img/arrow_menu_res.svg";
  arrow.classList.add("menu_arrow", option.direction);
  item.append(arrow,text);
    item.onclick = (event) => {
    event.stopPropagation();
    moveTask(id, option.target);
  };
  return item;
}

/**
 * Moves a task to a new board slot.
 * Updates the local allTasks object, writes the change to Firebase,
 * re-renders the board, re-initializes page state, and closes the menu.
 *
 * @async
 * @param {string} taskId - Unique ID of the task
 * @param {string} slot - Target board slot to move the task to
 * @returns {Promise<void>}
 */
async function moveTask(taskId, slot) {
  try {
    allTasks[taskId].boardSlot = slot;
    renderBoardBasics();
    renderTaskCards(allTasks);
    checkNoTasks();
    closeResMenu();
    await updateBoardSlotInFirebase(taskId, slot);
  } catch (error) {
    console.error("MoveTask Error:", error);
  }
}

/**
 * Closes the "move to" menu by adding the 'd_none' class.
 *
 * @returns {void}
 */
function closeResMenu(id) {
  const menu = document.getElementById(`menu_task_card_res_${id}`);
  if (menu) {
    menu.classList.add("d_none");
  }
}