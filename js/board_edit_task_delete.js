/**
 * Deletes a task from Firebase and removes it locally.
 *
 * Closes the task overlay after deletion.
 *
 * @param {string|number} id - Task ID
 * @param {Event} event - Trigger event
 */
async function deleteTask(id) {
    const url = `${path}/${id}.json`;
    await fetch(url, {
        method: "DELETE"
    });
}

let currentId = null

/**
 * Opens the delete confirmation modal for a task.
 *
 * Stores the task ID temporarily and prevents event bubbling.
 *
 * @param {Event} event - Click event
 * @param {string|number} id - Task ID
 */
function openModal(event, id) {
   event.stopPropagation()
   currentId = id
   document.getElementById("userfeedback_delete_task").classList.remove("d_none")
}

/**
 * Cancels task deletion and closes the confirmation modal.
 *
 * @param {Event} event - Click event
 */
function cancelDeleteTask(event) {
    event.stopPropagation()
    document.getElementById("userfeedback_delete_task").classList.add("d_none")
    currentId = null
}

/**
 * Confirms and executes task deletion.
 *
 * Deletes the task if a valid task ID is stored and closes the modal.
 *
 * @param {Event} event - Click event
 */
async function confirmDeleteTask(event) {
    event.stopPropagation()
      if (currentId !== null) {
        try {
            await deleteTask(currentId);
            deleteTaskInLocalObject(currentId);
        } catch (error) {
            console.error("Fehler beim Löschen:", error);
        }
    }
    document.getElementById("userfeedback_delete_task").classList.add("d_none")
    currentId = null
}

/**
 * Removes a task from the local task object and updates the board UI.
 *
 * If the task exists in the local `allTasks` object, it will be deleted.
 * Afterwards the board is re-rendered, the task cards are updated,
 * a check for empty task columns is performed, and the task overlay is closed.
 *
 * @param {string|number} id - The ID of the task to be removed from the local object.
 */
function deleteTaskInLocalObject(id) {
    if (allTasks[id]) {
        delete allTasks[id];
        renderBoardBasics()
        renderTaskCards(allTasks)
        checkNoTasks();
        closeTaskOverlay()
    }
}

/**
 * Toggles a user assignment when clicking on the entire user element in the dropdown.
 * This function updates the checkbox state and calls the existing `toggleAssignedUsers` function.
 *
 * @param {string} color - The color associated with the user (used for UI updates).
 * @param {string} name - The name of the user being toggled.
 * @param {string} taskId - The ID of the task for which the user assignment is changed.
 * @param {HTMLElement} containerDiv - The container element representing the user option that was clicked.
 * @returns {void}
 */

async function toggleUserOption(color, name, taskId, containerDiv) {
    const checkbox = containerDiv.querySelector(".user_checkbox");
    checkbox.checked = !checkbox.checked; 
    toggleAssignedUsers(color, name, taskId, checkbox); 
    renderBoardBasics()
    renderTaskCards(allTasks)
    checkNoTasks();
    const assignedUserIds = await prepareAssignedUserIds(taskId);
    const patchData = buildPatchDataAssigned( assignedUserIds)
    await updateTaskInFirebase(taskId, patchData);
}

/**
 * Builds the Firebase PATCH payload for a task update.
 *
 * @param {string|number} id - Task ID
 * @param {string} firebaseDate - Due date in Firebase format
 * @param {Array<string>} assignedUserIds - User IDs assigned to the task
 * @returns {Object} Patch data object
 */

    function buildPatchDataAssigned( assignedUserIds) {
    return {
        assigned: assignedUserIds
    };
}

/**
 * Saves all edits made to a task.
 *
 * Collects input values, updates the local task data,
 * prepares assigned user IDs, persists changes to Firebase,
 * and switches back to the task detail view.
 *
 * @param {string|number} id - Task ID
 */

function saveEdits(id) {
    toggleEditView();
    renderTaskCardFullView(allTasks[id]);
}