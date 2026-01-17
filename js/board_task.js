/**
 * Closes the task overlay and refreshes the board.
 * Stops the event from propagating, hides the full task view,
 * removes the body scroll lock, and re-initializes the board.
 *
 * @async
 * @param {Event} event - The triggering event
 * @returns {Promise<void>}
 */
async function closeTaskOverlay(event) {
    event.stopPropagation ()
    document.getElementById("task_full_view").classList.add("d_none")
    document.body.classList.remove("no-scroll");
    renderBoardBasics()
    await init()
}

/**
 * Opens the task overlay for a specific task.
 * Renders the full task view and prevents background scrolling.
 *
 * @param {string} id - ID of the task to display
 * @returns {void}
 */
function openTaskOverlay(id) {
    const taskData = allTasks[id];
    renderTaskCardFullView(taskData)
    const overlay = document.getElementById("task_full_view");
    overlay.classList.remove("d_none")
    document.body.classList.add("no-scroll");
}

/**
 * Renders all assigned users for a task.
 * Returns HTML with user initials and names, or a message if no users are assigned.
 *
 * @param {Object} taskData - Task object containing assigned users
 * @returns {string} HTML string representing the assigned users
 */
function renderAssignedUsers(taskData) {
    if (!taskData.assignedUsers || taskData.assignedUsers.length === 0) {
        return '<p class="user_font">No users assigned</p>';
    }
    return taskData.assignedUsers.map((user, i) => {
        const color = taskData.assignedUserColors?.[i] || '#000000';
        return `
            <div class="user_row_layout">
                <div class="user_icon" style="background-color: ${color};">
                    ${initials(user)}
                </div>
                <p class="user_font">${user}</p>
            </div>
        `;
    }).join('');
}

/**
 * Renders all subtasks for a task.
 * Returns a message if no subtasks exist.
 *
 * @param {Object} taskData - Task object containing subtasks
 * @returns {HTMLElement} Container element with subtasks
 */
function renderSubtasks(taskData) {
    if (noSubtasksExist(taskData)) {
        return renderNoSubtasksMessage();
    }

    const container = createSubtasksContainer();
    appendRenderedSubtasks(container, taskData);
    return container;
}

/**
 * Checks if a task has no subtasks.
 *
 * @param {Object} taskData - Task object
 * @returns {boolean} True if no subtasks exist, false otherwise
 */
function noSubtasksExist(taskData) {
    return (
        !taskData.subtasks ||
        Object.keys(taskData.subtasks).length === 0
    );
}

/**
 * Creates a message element indicating that no subtasks exist.
 *
 * @returns {HTMLElement} Paragraph element with "No subtasks yet"
 */
function renderNoSubtasksMessage() {
    const noSubtasks = document.createElement("p");
    noSubtasks.classList.add("no_subtaks");
    noSubtasks.textContent = "No subtasks yet";
    return noSubtasks;
}

/**
 * Creates a container element for subtasks.
 *
 * @returns {HTMLElement} A div element to hold subtasks
 */
function createSubtasksContainer() {
    return document.createElement("div");
}

/**
 * Appends each subtask element to the container.
 *
 * @param {HTMLElement} container - Container for subtasks
 * @param {Object} taskData - Task object containing subtasks
 * @returns {void}
 */
function appendRenderedSubtasks(container, taskData) {
    Object.entries(taskData.subtasks).forEach(([key, subtask]) => {
        const subtaskEl = renderSingleSubtask(key, subtask, taskData);
        container.appendChild(subtaskEl);
    });
}

/**
 * Renders a single subtask as a wrapper containing a checkbox and label.
 *
 * @param {string} key - Subtask key
 * @param {Object} subtask - Subtask object
 * @param {Object} taskData - Parent task object
 * @returns {HTMLElement} Subtask wrapper element
 */
function renderSingleSubtask(key, subtask, taskData) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("subtask_check");
    const checkbox = createSubtaskCheckbox(key, subtask, taskData);
    const label = createSubtaskLabel(key, subtask);
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    return wrapper;
}

/**
 * Creates a checkbox element for a subtask.
 * Adds an event listener to toggle the subtask's done status.
 *
 * @param {string} key - Subtask key
 * @param {Object} subtask - Subtask object
 * @param {Object} taskData - Parent task object
 * @returns {HTMLInputElement} Checkbox element
 */
function createSubtaskCheckbox(key, subtask, taskData) {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `subtask_${key}`;
    checkbox.checked = subtask.done;
    checkbox.addEventListener("change", (event) => {
        toggleSubtask(event, key, taskData);
    });
    return checkbox;
}

/**
 * Creates a label element for a subtask checkbox.
 *
 * @param {string} key - Subtask key
 * @param {Object} subtask - Subtask object containing a name
 * @returns {HTMLLabelElement} Label element for the subtask
 */
function createSubtaskLabel(key, subtask) {
    const label = document.createElement("label");
    label.htmlFor = `subtask_${key}`;
    label.classList.add("subtask_label");
    label.innerHTML = `<p class="subtask_detail_font">${subtask.name}</p>`;
    return label;
}

/**
 * Opens the task edit overlay and hides the full task view.
 * Renders the task edit form for a specific task ID.
 *
 * @param {string} id - Task ID
 * @returns {void}
 */
function editTask(id) {
    const overlay = document.getElementById("task_full_view");
    overlay.classList.add("d_none")
    const overlayEdit = document.getElementById ("task_edit_view")
    overlayEdit.classList.remove("d_none")
    renderEdit (id)
}

/**
 * Renders all editable elements of a task in the edit view,
 * including priority buttons, assigned users, subtasks, and datepicker.
 *
 * @param {string} id - Task ID
 * @returns {void}
 */
function renderEdit (id) {
    const taskData = allTasks[id];
    renderTaskEditCard(taskData)
    highlightCurrentPriority(taskData.priority)
    renderAssignedUserIcons(taskData)
    renderEditSubtasks(taskData)
    initEditDatepicker()
}

/**
 * Initializes the flatpickr date picker for the edit task view.
 * Opens the date picker when the date icon is clicked.
 *
 * @returns {void}
 */
function initEditDatepicker() {
    const input = document.getElementById("edit_due_date");
    const icon = document.getElementById("date_icon");
    if (!input || !icon) return;
    const picker = flatpickr(input, {
        dateFormat: "d/m/Y",
        allowInput: true
    });
    icon.addEventListener("click", () => {
        picker.open();
    });
}

/**
 * Highlights the currently selected priority button in the edit view.
 * Disables interaction for the active priority and resets other buttons.
 *
 * @param {string} priorityValue - Priority value to highlight
 * @returns {void}
 */
function highlightCurrentPriority(priorityValue) {
    const buttons = document.querySelectorAll(".priority_button");
    buttons.forEach(btn => {
        const value = btn.getAttribute("data-value");
        // Zurücksetzen
        btn.classList.remove("active_priority");
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
        // Aktive Prio markieren
        if (value === priorityValue) {
            btn.classList.add("active_priority");
            btn.disabled = true;
            btn.style.pointerEvents = "none";
        }
    });
}

/**
 * Sets a new priority for a task and updates the active button state.
 *
 * @param {string} prio - Priority value to set
 * @param {string} id - Task ID
 * @returns {void}
 */
function setPriority(prio, id) {
    const buttons = document.querySelectorAll(".priority_button");
    buttons.forEach(btn => {
        btn.classList.remove("active_priority");
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
    });
    const activeBtn = document.querySelector(`.priority_button[data-value="${prio}"]`);
    activeBtn.classList.add("active_priority");
    activeBtn.disabled = true;
    activeBtn.style.pointerEvents = "none";
    allTasks[id].priority = prio; 
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
  arrow.src = "./assets/img/arrow_menu_res.svg";
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
async function moveTask (taskId, slot) {
allTasks[taskId].boardSlot = slot
await updateBoardSlotInFirebase(taskId, slot) 
renderBoardBasics()
await init()
closeResMenu() 
}

/**
 * Closes the "move to" menu by adding the 'd_none' class.
 *
 * @returns {void}
 */
function closeResMenu() {
  document
    .getElementById("menu_task_card_res").classList.add("d_none");
}

