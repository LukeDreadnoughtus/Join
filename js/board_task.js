/**
 * Closes the task overlay and refreshes the board.
 * Stops the event from propagating, hides the full task view,
 * removes the body scroll lock, and re-initializes the board.
 *
 * @async
 * @param {Event} event - The triggering event
 * @returns {Promise<void>}
 */
function closeTaskOverlay(event) {
    if (event) event.stopPropagation();
    document.getElementById("task_full_view").classList.add("d_none")
    document.body.classList.remove("no-scroll")
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
    taskData.duedate = convertToDatePickerFormat(taskData.duedate);
    renderTaskEditCard(taskData)
    initEditListeners(id);
    highlightCurrentPriority(taskData.priority)
    renderAssignedUserIcons(taskData)
    renderEditSubtasks(taskData)
}

/**
 * Initializes all input listeners for the edit view of a task.
 * Binds change/input events to keep the task state in sync
 * while the user is editing.
 *
 * @param {number|string} id - The identifier of the task in the allTasks array/object.
 */
function initEditListeners(id) {
    initDateListener(id);
    initTitleListener(id);
    initDescriptionListener(id);
}

/**
 * Attaches a change listener to the due date input field.
 * Updates the task's due date whenever the user selects a new date.
 *
 * @param {number|string} id - The identifier of the task in the allTasks array/object.
 */
function initDateListener(id) {
    const input = document.getElementById('edit_due_date');
    const feedback = document.getElementById('pastdate');
    if (!input) return;
    input.min = getTodayISO();
    input.addEventListener('blur', async e => {
    const value = e.target.value;
        if (isPastDate(value)) {
            showDateError(input, feedback);
            e.target.value = allTasks[id].duedate || '';
        } else {
            hideDateError(input, feedback);
            const firebaseDate = convertDateToFirebaseFormat(value);
            allTasks[id].duedate = firebaseDate;
            try {
                await updateTaskInFirebase(id, {
                    duedate: firebaseDate
                });
            } catch (error) {
                console.error("Date update failed:", error);
            }
        }
    });
    input.addEventListener('input', () => {
        hideDateError(input, feedback);
    });
}

/**
 * Checks whether a given date string represents a date in the past.
 * The comparison ignores the current time and only evaluates the date.
 *
 * @param {string} dateStr - The date string to check (e.g., in ISO format "YYYY-MM-DD").
 * @returns {boolean} Returns true if the given date is earlier than today, otherwise false.
 */
function isPastDate(dateStr) {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
}

/** helper: get today's date in yyyy-mm-dd */
function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

/** show feedback and add red border class */
function showDateError(inputEl, feedbackEl) {
    if (feedbackEl) feedbackEl.classList.remove('d_none');
    if (inputEl) inputEl.classList.add('input_style_date');
}

/** hide feedback and remove red border class */
function hideDateError(inputEl, feedbackEl) {
    if (feedbackEl) feedbackEl.classList.add('d_none');
    if (inputEl) inputEl.classList.remove('input_style_date');
}

/**
 * Attaches an input listener to the title textarea.
 * Keeps the task title updated in real time while typing.
 *
 * @param {number|string} id - The identifier of the task in the allTasks array/object.
 */
function initTitleListener(id) {
    const input = document.getElementById('edit_title');
    if (!input) return;
    input.addEventListener('input', e => {
        allTasks[id].title = e.target.value;
    });
    input.addEventListener('blur', async e => {
        const value = e.target.value.trim();
        renderBoardBasics();
        renderTaskCards(allTasks);
        checkNoTasks();
        try {
            await updateTaskInFirebase(id, { title: value });
        } catch (error) {
            console.error("Title update failed:", error);
        }
    });
}

/**
 * Attaches an input listener to the description textarea.
 * Keeps the task description updated in real time while typing.
 *
 * @param {number|string} id - The identifier of the task in the allTasks array/object.
 */
function initDescriptionListener(id) {
    const input = document.getElementById('edit_description');
    if (!input) return;
    input.addEventListener('input', e => {
        allTasks[id].description = e.target.value;
    });
    input.addEventListener('blur', async e => {
        const value = e.target.value.trim();
        renderBoardBasics()
        renderTaskCards(allTasks)
        checkNoTasks();
        try {
            await updateTaskInFirebase(id, {
                description: value
            });
        } catch (error) {
            console.error("Description update failed:", error);
        }
    });
}

/**
 * Converts a date string into the ISO format required by native date inputs.
 * Supports conversion from "dd/mm/yyyy" to "yyyy-mm-dd".
 * If the date is already in ISO format, it is returned unchanged.
 *
 * @param {string} dateStr - The date string to convert.
 * @returns {string} The converted date string in "yyyy-mm-dd" format,
 *                   or an empty string if the input is invalid.
 */
function convertToDatePickerFormat(dateStr) {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }
    console.warn('Unbekanntes Datumsformat:', dateStr);
    return '';
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
        btn.classList.remove("active_priority");
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
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
async function setPriority(prio, id) {
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
    renderBoardBasics()
    renderTaskCards(allTasks)
    checkNoTasks();
    const patchData = buildPatchDataPriority(id) 
    await updateTaskInFirebase(id, patchData);
}

/**
 * Builds the patch data object for updating the priority of a task.
 * Retrieves the task from the global task collection and returns
 * an object containing only the priority field for partial updates
 * (e.g., when sending a PATCH request to a database).
 *
 * @param {string} id - The unique ID of the task.
 * @returns {{priority: string}} An object containing the task priority.
 */
function buildPatchDataPriority(id) {
    const t = allTasks[id];
    return {
        priority: t.priority,
    };
}