function noTasksTemplate() {
    document.getElementById("todo").innerHTML +=`<div id="no_todo_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
    document.getElementById("progress").innerHTML +=`<div id="no_progress_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
    document.getElementById("feedback").innerHTML +=`<div id="no_feedback_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
    document.getElementById("done").innerHTML +=`<div id="no_done_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
}


function renderBoardBasics() {
    document.getElementById(`todo`).innerHTML =`<div class="column_head">
      <h3>To do</h3>
      <img src="./assets/img/plus button.svg" alt="plus icon" width="24px" height="24px">
      </div>
      <div id="no_todo_tasks" class="no_tasks d_none"> <p class="font_no_task">No tasks To do</p></div>
      </div>` 
    document.getElementById(`progress`).innerHTML =`
      <div class="column_head">
      <h3>In progress</h3>
      <img src="./assets/img/plus button.svg" alt="plus icon" width="24px" height="24px">
      </div>
      <div id="no_progress_tasks" class="no_tasks d_none"> 
      <p class="font_no_task">No tasks To do</p></div>
      </div>`
    document.getElementById(`feedback`).innerHTML =`<div class="column_head">
      <h3>Await feedback</h3>
      <img src="./assets/img/plus button.svg" alt="plus icon" width="24px" height="24px">
      </div>
      <div id="no_feedback_tasks" class="no_tasks d_none"> <p class="font_no_task">No tasks To do</p></div>
      </div>`
    document.getElementById(`done`).innerHTML =`<div class="column_head">
      <h3>Done</h3>
      </div>
      <div id="no_done_tasks" class="no_tasks d_none"> <p class="font_no_task">No tasks To do</p></div>
      </div>`
}



function taskTemplate(taskData) {
let assignedUsersHtml = "";
if (taskData.assignedUsers.length === 0) {
   assignedUsersHtml = `<div class="no_assignies"><p>No Users</p>
  <p>assigend</p></div>`;
} else {
 taskData.assignedUsers.forEach((user, index) => {
  const color = taskData.assignedUserColors[index] || "#000000"; 
  const usericon = initials(user)
 assignedUsersHtml += `<div class="user_icon" style="background-color: ${color}">${usericon}</div>`;
 });
 }
 const taskHtml = `
    <div class="task_card" onclick="openTaskOverlay('${taskData.id}')" draggable ="true" ondragstart="startDragging(event,'${taskData.id}')" ondragend="stopDragging(event)">
      <div class="task_category_card task_category_color_${taskData.categoryColor}">${taskData.category}</div>
      <div class="task_titel_card">${taskData.title}</div>
      <div class="task_description_card">${taskData.description}</div>
      ${taskData.subtasksTotal > 0 ? `
      <div class="task_progress_subtasks_card">
      <div class="progressbar_subtasks">
      <div class="progressbar_fill" style="width: ${Math.round((taskData.subtasksDone / taskData.subtasksTotal) * 100)}%;"></div>
      <span class="progressbar_tooltip">${Math.round((taskData.subtasksDone / taskData.subtasksTotal) * 100)}% done</span>
      </div>
      <p>${taskData.subtasksDone}/${taskData.subtasksTotal} Subtasks</p>
      </div>
      ` : ''}
      <div class="task_assigned_members_card">
        ${assignedUsersHtml}
        <img src="./assets/img/priority_${taskData.priority}.svg" alt="priority icon" class="priority_icon_board">
      </div>
    </div>
    `;
  document.getElementById(`${taskData.boardSlot}`).innerHTML += taskHtml;
}

function renderTaskCardFullView(taskData) {
    const overlayContent = document.getElementById("show_task_overlay");
    const assignedUsersHtml = renderAssignedUsers(taskData);
    overlayContent.innerHTML = `
    <div class="userfeedback_delete_subtask d_none" id="userfeedback_delete_task">
    <p>Delete this task?</p>
    <div class="delete_buttons_subtask">
    <button type="button" class="button_delete_subtask button_green" id="deleteYes" onclick="confirmDeleteTask(event)">Yes</button>
    <button type="button" class="button_delete_subtask button_red" id="deleteNo" onclick="cancelDeleteTask(event)" >No</button>
    </div>
    </div>
        <div class="task_view_head">
            <div class="task_category_card_overlay task_category_color_${taskData.categoryColor}">
                ${taskData.category}
            </div>
            <div class="close_icon_wrapper">
                <img src="./assets/img/close.svg" alt="close icon" class="close_icon" onclick="closeTaskOverlay(event,'${taskData.id}')">
            </div>
        </div>
        <div class="scroll-area">
        <h2 class="padding_btm">${taskData.title}</h2>

        <div class="task_description_overlay">
            <h4>${taskData.description}</h4>
        </div>

        <div class="due_date">
            <h4>Due date:</h4>
            <p class="task_detail_font">${taskData.duedate || 'No date set'}</p>
        </div>

        <div class="priority">
            <h4>Priority:</h4>
            <p class="task_detail_font">${taskData.priority}</p>
            <img src="./assets/img/priority_${taskData.priority}.svg" alt="priority icon" class="priority_fullview">
        </div>

        <div class="assigned_to">
            <h4 class="padding_btm">Assigned To:</h4>
            ${assignedUsersHtml}
        </div>

        <div class="subtasks_list">
            <h4>Subtasks</h4>
            <div id="subtasks_container"></div>
        </div>
        </div>
        <div class="edit_delete_task"> <div class="delete_task" onclick="openModal(event,'${taskData.id}')"> 
        <svg class="delete-icon" width="16" height="18" viewBox="0 0 16 18" xmlns="http://www.w3.org/2000/svg"> 
        <path d="M3 18C2.45 18 1.97917 17.8042 1.5875 17.4125C1.19583 17.0208 1 16.55 1 16V3C0.716667 3 0.479167 2.90417 0.2875 2.7125C0.0958333 2.52083 0 2.28333 0 2C0 1.71667 0.0958333 1.47917 0.2875 1.2875C0.479167 1.09583 0.716667 1 1 1H5C5 0.716667 5.09583 0.479167 5.2875 0.2875C5.47917 0.0958333 5.71667 0 6 0H10C10.2833 0 10.5208 0.0958333 10.7125 0.2875C10.9042 0.479167 11 0.716667 11 1H15C15.2833 1 15.5208 1.09583 15.7125 1.2875C15.9042 1.479167 16 1.71667 16 2C16 2.28333 15.9042 2.52083 15.7125 2.7125C15.5208 2.90417 15.2833 3 15 3V16C15 16.55 14.8042 17.0208 14.4125 17.4125C14.0208 17.8042 13.55 18 13 18H3ZM3 3V16H13V3H3ZM5 13C5 13.2833 5.09583 13.5208 5.2875 13.7125C5.47917 13.9042 5.71667 14 6 14C6.28333 14 6.52083 13.9042 6.7125 13.7125C6.90417 13.5208 7 13.2833 7 13V6C7 5.71667 6.90417 5.47917 6.7125 5.2875C6.52083 5.09583 6.28333 5 6 5C5.71667 5 5.47917 5.09583 5.2875 5.2875C5.09583 5.47917 5 5.71667 5 6V13ZM9 13C9 13.2833 9.09583 13.5208 9.2875 13.7125C9.47917 13.9042 9.71667 14 10 14C10.2833 14 10.5208 13.9042 10.7125 13.7125C10.9042 13.5208 11 13.2833 11 13V6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6V13Z" fill="currentColor"/> </svg> 
        <p class="edit_task_font">Delete</p> </div> 
        <div class="seperator"></div> 
        <div class="edit_task" onclick="editTask('${taskData.id}')"> 
        <svg class="edit-icon" width="19" height="19" viewBox="0 0 19 19" xmlns="http://www.w3.org/2000/svg"> 
        <path d="M2 16.25H3.4L12.025 7.625L10.625 6.225L2 14.85V16.25ZM16.3 6.175L12.05 1.975L13.45 0.575C13.8333 0.191667 14.3042 0 14.8625 0C15.4208 0 15.8917 0.191667 16.275 0.575L17.675 1.975C18.0583 2.35833 18.2583 2.82083 18.275 3.3625C18.2917 3.90417 18.1083 4.36667 17.725 4.75L16.3 6.175ZM14.85 7.65L4.25 18.25H0V14L10.6 3.4L14.85 7.65Z" fill="currentColor"/> </svg> <p class="edit_task_font">Edit</p> </div> </div>
    `
    // Subtasks container füllen
    const subtasksContainer = overlayContent.querySelector("#subtasks_container");
    const subtaskElements = renderSubtasks(taskData);
    subtasksContainer.appendChild(subtaskElements);
}

function renderTaskEditCard(taskData) {
    const overlayContent = document.getElementById("edit_task_overlay");
    overlayContent.innerHTML = ""; 
    overlayContent.innerHTML = `
    <div class="userfeedback_delete_subtask d_none" id="userfeedback_delete_subtask">
        <p>Delete this subtask?</p>
        <div class="delete_buttons_subtask">
            <button type="button" class="button_delete_subtask button_green" id="deleteYes" onclick="confirmDeleteSubtask(event)">Yes</button>
            <button type="button" class="button_delete_subtask button_red" id="deleteNo" onclick="cancelDeleteSubtask(event)">No</button>
        </div>
    </div>
    <div class="close_icon_wrapper close_icon_margin">
        <img src="./assets/img/close.svg" alt="close icon" class="close_icon" onclick="closeTaskOverlayEdit(event)">
    </div>
    <div class="scroll-area" onclick="closeUserDropdown(event,'${taskData.id}')">
        <div class="edit_title" onclick="event.stopPropagation()">
            <h4>Title</h4>
            <textarea class="input_edit_title input_style auto-grow" 
                      id="edit_title" 
                      placeholder="Enter a title" 
                      required
                      oninput="autoGrow(this)">${taskData.title}</textarea>
        </div>
        <div class="edit_description" onclick="event.stopPropagation()">
            <h4>Description</h4>
            <textarea class="input_edit_description input_style auto-grow" 
                      id="edit_description" 
                      placeholder="Enter a description" 
                      required
                      oninput="autoGrow(this)">${taskData.description}</textarea>
        </div>
        <div class="edit_duedate">
            <h4>Due Date</h4>
            <div class="input_event">
                <img src="./assets/img/event.svg" class="event_icon" id="date_icon">
                <input class="input_edit_title input_style" 
                       type="text" 
                       id="edit_due_date" 
                       placeholder="dd/mm/yyyy" 
                       required 
                       value="${taskData.duedate || ''}"/>
            </div>
        </div>
        <div class="edit_priority">
            <p class="bold_font">Priority</p>
            <div class="priority_btn_group">
                <!-- Buttons bleiben unverändert -->
            </div>
        </div>
        <div class="edit_assigned_to">
            <h4>Assigned to</h4>
            <div class="user_dropdown">
                <div class="user_dropdown_selected" onclick="toggleUserDropdown('${taskData.id}', event)">Select contacts to assign</div>
                <div id="userDropdownList" class="user_dropdown_list d_none"></div>
            </div>
            <div id="already_assigned" class="already_assigned"></div>
        </div>
        <div class="edit_subtasks">
            <h4>Subtasks</h4>
            <div class="input_edit_subtask_wrapper" onclick="event.stopPropagation()">
                <input id="edit_subtask_input"
                       class="input_edit_subtask input_style" 
                       type="text"
                       placeholder="Add new subtask"
                       required
                       onkeydown="handleSubtaskEnter(event,'${taskData.id}')"/>
                <div class="icon_wrapper subtask_icon left_icon" onclick="clearSubtaskInput(this)">
                    <img src="./assets/img/close.svg">
                </div>
                <div class="subtask_separator_input"></div>
                <div class="icon_wrapper subtask_icon right_icon" onclick="addNewSubtask('${taskData.id}')">
                    <img src="./assets/img/check_black.svg">
                </div>
            </div>
            <ul id="subtask_list" class="subtasklist"></ul>
        </div>
    </div>

    <button type="submit" class="edit_task_button" onclick="saveEdits('${taskData.id}')">
        <span class="font_create">Ok</span>
        <span class="check_svg"><img src="./assets/img/check.svg" alt="check icon" width="24px" height="24px"></span>
    </button>
    `;

    // Stop propagation für Dropdown
    const dropdown = document.getElementById("userDropdownList");
    dropdown.addEventListener("click", (e) => e.stopPropagation());

    // Auto-grow direkt initial auslösen, damit Beschreibung sofort passt
    document.querySelectorAll('.auto-grow').forEach(el => autoGrow(el));
}


/**
 * Creates a list item element for a subtask in the edit view.
 * Includes action icons for editing and deleting the subtask.
 *
 * @param {Object} taskData - Task object
 * @param {string} index - Subtask index
 * @param {Object} subtask - Subtask object
 * @returns {HTMLLIElement} List item element for the subtask
 */
function createSubtaskListItem(taskData, index, subtask) {
    const li = document.createElement("li");
    li.classList.add("edit_subtask_item");
    li.innerHTML = `
        <div class="subtask_inner">
            <span class="subtask_element">${subtask.name}</span>

            <div class="subtask_actions d_none">
                <img src="./assets/img/edit.svg" class="subtask_edit_icon"
                     onclick="editSubtask(event,'${taskData.id}', '${index}')">
                <div class="subtask_separator"></div>
                <img src="./assets/img/delete.svg" class="subtask_delete_icon"
                     onclick="openDeleteModal(event,'${taskData.id}', '${index}')">
            </div>
        </div>
    `;
    return li;
}

/**
 * Renders the edit template for a subtask.
 *
 * @param {HTMLLIElement} listItem - Subtask list item
 * @param {string|number} taskId - Task ID
 * @param {string|number} subtaskKey - Subtask index
 * @param {string} subtaskName - Current subtask name
 */
// function renderSubtaskEditTemplate(listItem, taskId, subtaskKey, subtaskName) {
//     const inner = listItem.querySelector(".subtask_inner");

//     inner.innerHTML = `
//         <input type="text"
//                class="subtask_edit_input"
//                value="${subtaskName}"
//                autofocus
//                onclick="event.stopPropagation()"
//                onkeydown="handleSubtaskEnterEdit(event, '${taskId}', '${subtaskKey}', this.closest('li'))">

//         <div class="subtask_edit_actions">
//             <div class="icon_wrapper_edit">
//                 <img src="./assets/img/delete.svg"
//                      class="subtask_delete_icon"
//                      onclick="openDeleteModal(event,'${taskId}', '${subtaskKey}')">
//             </div>

//             <div class="subtask_separator_edit"></div>

//             <div class="icon_wrapper_edit">
//                 <img src="./assets/img/check_black.svg"
//                      class="subtask_check_icon"
//                      onclick="saveSubtaskEdit(event,'${taskId}', '${subtaskKey}', this.closest('li'))">
//             </div>
//         </div>
//     `;
// }

function renderSubtaskEditTemplate(listItem, taskId, subtaskKey, subtaskName) {
    const inner = listItem.querySelector(".subtask_inner");

    inner.innerHTML = `
        <textarea
            class="subtask_edit_input"
            rows="1"
            onclick="event.stopPropagation()"
            oninput="autoGrow(this)"
            onkeydown="handleSubtaskEnterEdit(event, '${taskId}', '${subtaskKey}', this.closest('li'))"
        >${subtaskName}</textarea>

        <div class="subtask_edit_actions">
            <div class="icon_wrapper_edit">
                <img src="./assets/img/delete.svg"
                     class="subtask_delete_icon"
                     onclick="openDeleteModal(event,'${taskId}', '${subtaskKey}')">
            </div>

            <div class="subtask_separator_edit"></div>

            <div class="icon_wrapper_edit">
                <img src="./assets/img/check_black.svg"
                     class="subtask_check_icon"
                     onclick="saveSubtaskEdit(event,'${taskId}', '${subtaskKey}', this.closest('li'))">
            </div>
        </div>
    `;

    // 🔥 wichtig: initiale Höhe direkt setzen
    const textarea = inner.querySelector(".subtask_edit_input");
    autoGrow(textarea);
}


/**
 * Builds the HTML template for a selectable user entry.
 *
 * @param {{iconColor: string, initials: string}} iconData - Prepared icon data
 * @param {Object} user - User object
 * @param {string|number} taskId - Task ID
 * @param {boolean} isAssigned - Whether the user is already assigned
 * @returns {string} HTML string for the user dropdown item
 */
function buildUserTemplate(iconData, user, taskId, isAssigned) {
    return `
        <div class="user_option">
            <div class="selectable_user">
                <div class="user_icon" style="background-color: ${iconData.iconColor};">
                    ${iconData.initials}
                </div>
                <span>${user.name}</span>
            </div>

            <input 
                type="checkbox"
                class="user_checkbox"
                ${isAssigned ? "checked" : ""}
                onclick="toggleAssignedUsers('${user.color}','${user.name}','${taskId}', this)"
            >
        </div>
    `;
}
