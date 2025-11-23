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
    document.getElementById(`progress`).innerHTML =`<div class="column_head">
      <h3>In progress</h3>
      <img src="./assets/img/plus button.svg" alt="plus icon" width="24px" height="24px">
      </div>
      <div id="no_progress_tasks" class="no_tasks d_none"> <p class="font_no_task">No tasks To do</p></div>
      </div>`
    document.getElementById(`feedback`).innerHTML =`<div class="column_head">
      <h3>Await feedback</h3>
      <img src="./assets/img/plus button.svg" alt="plus icon" width="24px" height="24px">
      </div>
      <div id="no_feedback_tasks" class="no_tasks d_none"> <p class="font_no_task">No tasks To do</p></div>
      </div>`
    document.getElementById(`done`).innerHTML =`<div class="column_head">
      <h3>Done</h3>
      <img src="./assets/img/plus button.svg" alt="plus icon" width="24px" height="24px">
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
  const iconColor = color.replace('#', '');
  const usericon = initials(user)
 assignedUsersHtml += `<div class="user_icon color${iconColor}">${usericon}</div>`;
 });
 }
 const taskHtml = `
    <div class="task_card" onclick="openTaskOverlay('${taskData.id}')">
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
        <div class="task_view_head">
            <div class="task_category_card_overlay task_category_color_${taskData.categoryColor}">
                ${taskData.category}
            </div>
            <div class="close_icon_wrapper">
                <img src="./assets/img/close.svg" alt="close icon" class="close_icon" onclick="closeTaskOverlay(event,'${taskData.id}')">
            </div>
        </div>
        <h2 class="padding_btm">${taskData.title}</h2>

        <div class="task_description_overlay">
            <h4>${taskData.description}</h4>
        </div>

        <div class="due_date">
            <h4>Due date:</h4>
            <p class="task_detail_font">${taskData.dueDate || 'No date set'}</p>
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
        <div class="edit_delete_task"> <div class="delete_task" onclick="deleteTask('${taskData.id}')"> 
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
  overlayContent.innerHTML = ` 
  <div class="close_icon_wrapper close_icon_margin">
        <img src="./assets/img/close.svg" alt="close icon" class="close_icon" onclick="closeTaskOverlayEdit(event)">
  </div>
  <div class="scroll-area">
  <div class="edit_title">
    <h4>Title</h4>
    <input class="input_edit_title input_style" type="text" id="" placeholder="Enter a title" required value="${taskData.title}" />
  </div>
  <div class="edit_description">
    <h4>Description</h4>
    <input class="input_edit_description input_style" type="text" id="" placeholder="Enter a Description" required value="${taskData.description}"/>
  </div>
  <div class="edit_duedate">
    <h4>Due Date</h4>
    <div class="input_event">
    <img src="./assets/img/event.svg" class="event_icon">
    <input class="input_edit_title input_style" type="text" id="" placeholder="dd/mm/yyyy" required value="${taskData.dueDate}"/>
    </div>
    </div>
  <div class="edit_priority">
    <p class="bold_font">Priority</p>
      <div class="priority_btn_group">
         <button id="" type="button" class="priority_button boxshadow" data-value="urgent">
                    <span class="priority_name">Urgent</span>
                    <svg class="urgent_icon" width="20" height="15" viewBox="0 0 20 15" fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M18.9043 14.5096C18.6696 14.51 18.4411 14.4351 18.2522 14.2961L10.0001 8.21288L1.74809 14.2961C1.63224 14.3816 1.50066 14.4435 1.36086 14.4783C1.22106 14.513 1.07577 14.5199 0.933305 14.4986C0.790837 14.4772 0.653973 14.428 0.530528 14.3538C0.407083 14.2796 0.299474 14.1818 0.213845 14.0661C0.128216 13.9503 0.0662437 13.8188 0.0314671 13.6791C-0.00330956 13.5394 -0.0102098 13.3943 0.0111604 13.2519C0.0543195 12.9644 0.21001 12.7058 0.443982 12.533L9.34809 5.96249C9.53679 5.8229 9.76536 5.74756 10.0001 5.74756C10.2349 5.74756 10.4635 5.8229 10.6522 5.96249L19.5563 12.533C19.7422 12.6699 19.8801 12.862 19.9503 13.0819C20.0204 13.3018 20.0193 13.5382 19.9469 13.7573C19.8746 13.9765 19.7349 14.1673 19.5476 14.3024C19.3604 14.4375 19.1352 14.51 18.9043 14.5096Z"
                        fill="currentColor" />
                      <path
                        d="M18.9043 8.76057C18.6696 8.76097 18.4411 8.68612 18.2522 8.54702L10.0002 2.46386L1.7481 8.54702C1.51412 8.71983 1.22104 8.79269 0.93331 8.74956C0.645583 8.70643 0.386785 8.55086 0.213849 8.31706C0.0409137 8.08326 -0.0319941 7.79039 0.011165 7.50288C0.054324 7.21536 0.210015 6.95676 0.443986 6.78395L9.3481 0.213471C9.5368 0.0738799 9.76537 -0.00146484 10.0002 -0.00146484C10.2349 -0.00146484 10.4635 0.0738799 10.6522 0.213471L19.5563 6.78395C19.7422 6.92087 19.8801 7.11298 19.9503 7.33286C20.0204 7.55274 20.0193 7.78914 19.947 8.00832C19.8746 8.22751 19.7349 8.41826 19.5476 8.55335C19.3604 8.68844 19.1352 8.76096 18.9043 8.76057Z"
                        fill="currentColor" />
                    </svg>
                  </button>
                  <button id="" type="button" class="priority_button boxshadow" data-value="medium">
                    <span class="priority_name medium">Medium</span>
                    <svg class="medium_icon" width="20" height="15" viewBox="0 0 20 15" fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <g clip-path="url(#clip0_395425_5845)">
                        <path
                          d="M18.9041 7.45086H1.09589C0.805242 7.45086 0.526498 7.33456 0.320979 7.12755C0.11546 6.92054 0 6.63977 0 6.34701C0 6.05425 0.11546 5.77349 0.320979 5.56647C0.526498 5.35946 0.805242 5.24316 1.09589 5.24316H18.9041C19.1948 5.24316 19.4735 5.35946 19.679 5.56647C19.8845 5.77349 20 6.05425 20 6.34701C20 6.63977 19.8845 6.92054 19.679 7.12755C19.4735 7.33456 19.1948 7.45086 18.9041 7.45086Z"
                          fill="currentColor" />
                        <path
                          d="M18.9041 2.2077H1.09589C0.805242 2.2077 0.526498 2.0914 0.320979 1.88439C0.11546 1.67738 0 1.39661 0 1.10385C0 0.81109 0.11546 0.530322 0.320979 0.32331C0.526498 0.116298 0.805242 0 1.09589 0L18.9041 0C19.1948 0 19.4735 0.116298 19.679 0.32331C19.8845 0.530322 20 0.81109 20 1.10385C20 1.39661 19.8845 1.67738 19.679 1.88439C19.4735 2.0914 19.1948 2.2077 18.9041 2.2077Z"
                          fill="currentColor" />
                      </g>
                      <defs>
                        <clipPath id="clip0_395425_5845">
                          <rect width="20" height="7.45098" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </button>
                  <button id="" type="button" class="priority_button boxshadow" data-value="low"><span
                      class="priority_name">Low</span>
                    <svg class="low_icon" width="20" height="15" viewBox="0 0 20 15" fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M10 8.76077C9.7654 8.76118 9.53687 8.68634 9.34802 8.54726L0.444913 1.97752C0.329075 1.89197 0.231235 1.78445 0.15698 1.66111C0.0827245 1.53777 0.033508 1.40102 0.0121402 1.25868C-0.031014 0.971193 0.0418855 0.678356 0.214802 0.444584C0.387718 0.210811 0.646486 0.0552534 0.934181 0.0121312C1.22188 -0.0309911 1.51493 0.0418545 1.74888 0.214643L10 6.29712L18.2511 0.214643C18.367 0.129087 18.4985 0.0671675 18.6383 0.0324205C18.7781 -0.00232646 18.9234 -0.00922079 19.0658 0.0121312C19.2083 0.0334832 19.3451 0.0826633 19.4685 0.156864C19.592 0.231064 19.6996 0.328831 19.7852 0.444584C19.8708 0.560336 19.9328 0.691806 19.9676 0.831488C20.0023 0.97117 20.0092 1.11633 19.9879 1.25868C19.9665 1.40102 19.9173 1.53777 19.843 1.66111C19.7688 1.78445 19.6709 1.89197 19.5551 1.97752L10.652 8.54726C10.4631 8.68634 10.2346 8.76118 10 8.76077Z"
                        fill="currentColor" />
                      <path
                        d="M10 14.5093C9.7654 14.5097 9.53687 14.4349 9.34802 14.2958L0.444913 7.72606C0.210967 7.55327 0.0552944 7.29469 0.0121402 7.00721C-0.031014 6.71973 0.0418855 6.42689 0.214802 6.19312C0.387718 5.95935 0.646486 5.80379 0.934181 5.76067C1.22188 5.71754 1.51493 5.79039 1.74888 5.96318L10 12.0457L18.2511 5.96318C18.4851 5.79039 18.7781 5.71754 19.0658 5.76067C19.3535 5.80379 19.6123 5.95935 19.7852 6.19312C19.9581 6.42689 20.031 6.71973 19.9879 7.00721C19.9447 7.29469 19.789 7.55327 19.5551 7.72606L10.652 14.2958C10.4631 14.4349 10.2346 14.5097 10 14.5093Z"
                        fill="currentColor" />
                    </svg>
                  </button>
      </div>
  </div>
  <div class="edit_assigned_to">
    <h4>Assigned to</h4>
    <div class="user-dropdown">
    <div class="user-dropdown-selected" onclick="toggleUserDropdown()">Select contacts to assign</div>
    <div id="userDropdownList" class="user-dropdown-list d-none">
        <!-- Wird mit JS gefüllt -->
    </div>
    </div>
    <div id="already_assigned" class="already_assigned">
    </div>

    <div class="edit_subtasks">
    <h4>Subtasks</h4>
    <input class="input_edit_subtask" type="text" id="" placeholder="Add new subtask" required />
    <ul id="subtask_list" class="subtasklist">
    </ul>
    </div>
  </div>
  </div>
`

}