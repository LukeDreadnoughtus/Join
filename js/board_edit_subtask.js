/**
 * Toggles the completion state of a subtask.
 *
 * Updates the checkbox state, synchronizes the change with local task data,
 * and persists the update to Firebase.
 *
 * @param {Event} event - Change event from the checkbox
 * @param {string|number} indexSubtask - Index of the subtask
 * @param {Object} taskData - Task object from the overlay view
 */
async function toggleSubtask(event, indexSubtask, taskData) {
    event.preventDefault();
    const checkbox = document.getElementById(`subtask_${indexSubtask}`);
    const newValue = checkbox.checked;   // Boolean wird umgedreht und in der UI verändert
    checkbox.checked = newValue;
    taskData.subtasks[indexSubtask].done = newValue; //Hier wird das nur im taskData des Overlays gespeichert.
    const taskId = taskData.id;
    allTasks[taskId].subtasks[indexSubtask].done = newValue;
    await postSubtaskData(taskId, indexSubtask, newValue);
}

/**
 * Updates the completion state of a single subtask in Firebase.
 *
 * @param {string|number} taskId - ID of the parent task
 * @param {string|number} index - Index of the subtask
 * @param {boolean} newValue - New completion state
 */
async function postSubtaskData (taskId, index, newValue){
  const url = `${path}/${taskId}/subtasks/${index}/done.json`;

    await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newValue)
    });
}

/**
 * Renders the list of existing subtasks in the task edit view.
 *
 * @param {Object} taskData - Task object containing subtasks
 * @returns {void}
 */
function renderEditSubtasks(taskData) {
    const subtaskList = document.getElementById("subtask_list");
    subtaskList.innerHTML = "";
    if (!taskData.subtasks || Object.keys(taskData.subtasks).length === 0) {
        return;
    }
    Object.entries(taskData.subtasks).forEach(([index, subtask]) => {
        const li = createSubtaskListItem(taskData, index, subtask);
        addSubtaskHoverBehavior(li);
        subtaskList.appendChild(li);
    });
}

/**
 * Adds hover behavior to show or hide subtask action buttons.
 *
 * @param {HTMLLIElement} li - Subtask list item element
 * @returns {void}
 */
function addSubtaskHoverBehavior(li) {
    const actionContainer = li.querySelector(".subtask_actions");
    li.addEventListener("mouseenter", () => {
        actionContainer.classList.remove("d_none");
    });
    li.addEventListener("mouseleave", () => {
        actionContainer.classList.add("d_none");
    });
}

/**
 * Reindexes a subtask object so that all numeric keys become a continuous
 * zero-based sequence (0, 1, 2, ...).  
 *
 * This function extracts all properties whose keys are strictly numeric,
 * sorts them by their numeric value, and rebuilds a new object with
 * consecutive numeric keys.  
 *
 * Non-numeric keys are ignored.  
 * The original object is not modified.
 *
 * @param {Object} subtasks - The subtask collection as an object with numeric keys.
 * @returns {Object} A new object with sequential numeric keys starting at 0.
 *
 * @example
 * // Input:
 * // { "0": {...}, "2": {...}, "5": {...} }
 *
 * const result = reindexSubtasksObject(subtasks);
 *
 * // Output:
 * // { "0": {...}, "1": {...}, "2": {...} }
 */

function reindexSubtasksObject(subtasks) {
    if (!subtasks || typeof subtasks !== "object") return {};
    const numericEntries = Object.keys(subtasks)
        .map(key => {
            const n = Number(key);
            return (!isNaN(n) && String(n) === key)
                ? { n, val: subtasks[key] }
                : null;
        })
        .filter(e => e !== null)
        .sort((a, b) => a.n - b.n);

    const reindexed = {};
    numericEntries.forEach((entry, index) => {
        reindexed[index] = entry.val;
    });
    return reindexed;
}

/**
 * Deletes a subtask, reindexes remaining subtasks,
 * updates Firebase, and re-renders the edit view.
 *
 * @async
 * @param {string} id - Task ID
 * @param {string} subtaskKey - Key/index of the subtask to delete
 * @returns {Promise<void>}
 */
async function deleteSubtask(id, subtaskKey) {
    delete allTasks[id].subtasks[subtaskKey];
    const reindexed = reindexSubtasksObject(allTasks[id].subtasks);
    allTasks[id].subtasks = reindexed;
    await updateSubtasksInFirebase(id, reindexed);
    renderEdit(id);
    requestAnimationFrame(() => {
        focusSubtaskInput();
    });
}

let currentTaskId = null;
let currentSubtaskKey = null;

/**
 * Stores the currently selected task and subtask
 * and opens the delete confirmation modal.
 *
 * @param {string} id - Task ID
 * @param {string} subtaskKey - Subtask key
 * @returns {void}
 */
function openDeleteModal(event, id, subtaskKey) {
event.stopPropagation();
console.log("Modal öffnen für Task:", id, "Subtask:", subtaskKey);
currentTaskId = id;
currentSubtaskKey = subtaskKey;
document.getElementById("userfeedback_delete_subtask").classList.remove("d_none");
}

/**
 * Confirms the deletion of a subtask and closes the modal.
 *
 * @param {Event} event - Click event
 * @returns {void}
 */
function confirmDeleteSubtask(event) {
    event.stopPropagation();
    if (currentTaskId !== null && currentSubtaskKey !== null) {
        deleteSubtask(currentTaskId, currentSubtaskKey);
    }
    document.getElementById("userfeedback_delete_subtask").classList.add("d_none");
    currentTaskId = null;
    currentSubtaskKey = null;
}

/**
 * Cancels the subtask deletion process and closes the modal.
 *
 * @param {Event} event - Click event
 * @returns {void}
 */
function cancelDeleteSubtask(event) {
    event.stopPropagation();
    document.getElementById("userfeedback_delete_subtask").classList.add("d_none");
    currentTaskId = null;
    currentSubtaskKey = null;
    focusSubtaskInput();
}

/**
 * Focuses the subtask input field in the edit view.
 *
 * @returns {void}
 */
function focusSubtaskInput() {
    const input = document.getElementById("edit_subtask_input");
    if (input) {
        input.focus();
    }
}

/**
 * Updates only the subtasks section of a task in Firebase.
 *
 * @async
 * @param {string} taskId - Task ID
 * @param {Object} subtasks - Subtasks object to store
 * @returns {Promise<void>}
 */
async function updateSubtasksInFirebase(taskId, subtasks) {
    const url = `${path}/${taskId}/subtasks.json`;
    await fetch(url, {
        method: "PUT",
        body: JSON.stringify(subtasks)
    });
}

/**
 * Switches a subtask into edit mode and renders the edit UI.
 *
 * Retrieves the selected subtask, marks its list item as being edited,
 * and replaces its content with the editable template.
 *
 * @param {string|number} taskId - The ID of the parent task
 * @param {string|number} subtaskKey - The key/index of the subtask to edit
 */
function editSubtask(event, taskId, subtaskKey) {
    event.stopPropagation();
    const task = allTasks[taskId];
    const subtask = task.subtasks[subtaskKey];

    const listItem = getSubtaskListItem(subtaskKey);
    setSubtaskEditingState(listItem);
    renderSubtaskEditTemplate(listItem, taskId, subtaskKey, subtask.name);
}

/**
 * Returns the list item element of a subtask based on its index.
 *
 * @param {string|number} subtaskKey - Subtask index
 * @returns {HTMLLIElement}
 */
function getSubtaskListItem(subtaskKey) {
    return document.querySelector(
        `.edit_subtask_item:nth-child(${parseInt(subtaskKey) + 1})`
    );
}

/**
 * Marks a subtask list item as being edited.
 *
 * @param {HTMLLIElement} listItem
 */
function setSubtaskEditingState(listItem) {
    listItem.classList.add("editing");
}

/**
 * Saves the edited subtask name and updates it in Firebase.
 *
 * Reads the new subtask name from the input field, updates the local task data,
 * persists the change to Firebase, and re-renders the edit view.
 *
 * @param {string|number} taskId - ID of the parent task
 * @param {string|number} subtaskKey - Key/index of the subtask
 * @param {HTMLLIElement} liElement - List item element containing the edit input
 */
async function saveSubtaskEdit(event,taskId, subtaskKey, liElement) {
    event.stopPropagation()
    const input = liElement.querySelector(".subtask_edit_input");
    const newName = input.value.trim();
    if (!newName) return;
    allTasks[taskId].subtasks[subtaskKey].name = newName;
    await updateSubtasksInFirebase(taskId, allTasks[taskId].subtasks);
    liElement.classList.remove("editing");
    renderEdit(taskId);
    const newInput = document.getElementById("edit_subtask_input");
    newInput.focus();
}

/**
 * Clears the subtask input field related to the clicked icon.
 *
 * Finds the nearest subtask input wrapper and resets its input value.
 *
 * @param {HTMLElement} icon - Icon element inside the subtask input wrapper
 */
function clearSubtaskInput(icon) {
    const wrapper = icon.closest('.input_edit_subtask_wrapper');
    const input = wrapper.querySelector('.input_edit_subtask');
    input.value = "";
}

/**
 * Adds a new subtask to a task and saves it to Firebase.
 *
 * Reads the subtask name from the input field, updates the local task data,
 * persists the change in Firebase, and re-renders the edit view.
 *
 * @param {string|number} id - ID of the parent task
 */
async function addNewSubtask(id) {
    const input = document.getElementById("edit_subtask_input");
    const newSubtaskName = input.value.trim();
    if (!newSubtaskName) return; 
    const newSubtask = { 
        done: false, 
        name: newSubtaskName 
    };
    allTasks[id].subtasks.push(newSubtask);
    await updateSubtasksInFirebase (id, allTasks[id].subtasks);
    input.value = ""; 
    renderEdit(id);  
    const newInput = document.getElementById("edit_subtask_input");
    newInput.focus();
}

/**
 * Handles the Enter key to add a new subtask.
 *
 * Prevents form submission and triggers subtask creation when Enter is pressed.
 *
 * @param {KeyboardEvent} event - Keydown event
 * @param {string|number} id - ID of the parent task
 */
function handleSubtaskEnter(event, id) {
    if (event.key === 'Enter') {
        event.preventDefault(); // verhindert Formular-Submit
        addNewSubtask(id);
    }
}

/**
 * Handles keyboard interaction while editing a subtask.
 * 
 * When the Enter key is pressed, the current subtask edit
 * is saved by calling {@link saveSubtaskEdit}.
 *
 * @param {KeyboardEvent} event - The keyboard event triggered on the input field.
 * @param {string} taskId - The unique identifier of the parent task.
 * @param {string|number} subtaskKey - The key or index identifying the subtask.
 * @param {HTMLLIElement} liElement - The <li> element representing the subtask.
 */
function handleSubtaskEnterEdit(event, taskId, subtaskKey, liElement) {
    if (event.key === 'Enter') {
        event.preventDefault();
        saveSubtaskEdit(event, taskId, subtaskKey, liElement);
    }
}

/**
 * Automatically adjusts the height of a textarea based on its content.
 * @param {HTMLTextAreaElement} element - The textarea element to resize.
 */
function autoGrow(element) {
    element.style.height = "auto";        // zurücksetzen, um Shrink zu ermöglichen
    element.style.height = element.scrollHeight + "px"; // neue Höhe anhand Inhalt
}
