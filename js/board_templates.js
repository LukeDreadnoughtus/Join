function noTasksTemplate() {
    document.getElementById("todo").innerHTML +=`<div id="no_todo_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
    document.getElementById("progress").innerHTML +=`<div id="no_progress_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
    document.getElementById("feedback").innerHTML +=`<div id="no_feedback_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
    document.getElementById("done").innerHTML +=`<div id="no_done_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
}

//Die ids der html Elemente habe ich jetzt mal nach den Boardslots benannt. 

function taskTemplate(taskData) {
let assignedUsersHtml = "";
 taskData.assignedUsers.forEach((user, index) => {
 const iconColor = taskData.assignedUserColors[index].replace('#', '');
 const usericon = initials(user)
 assignedUsersHtml += `<div class="user_icon color${iconColor}">${usericon}</div>`;
 });
 const taskHtml = `
    <div class="task_card" onclick="openTaskOverlay('${taskData.id}')">
      <div class="task_category_card task_category_color_${taskData.categoryColor}">${taskData.category}</div>
      <div class="task_titel_card">${taskData.title}</div>
      <div class="task_description_card">${taskData.description}</div>
      <div class="task_progress_subtasks_card">
        <img src="./assets/img/filler.svg" class="progressbar_subtasks" alt=""> 
        <p>${taskData.subtasksDone}/${taskData.subtasksTotal} Subtasks</p>
      </div>
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
  // Assigned Users rendern
  const assignedUsersHtml = taskData.assignedUsers.map((user, i) => `
    <div class="user_row_layout">
      <div class="user_icon color${taskData.assignedUserColors[i].replace('#', '')}">
        ${initials(user)}
      </div>
      <p class="user_font">${user}</p>
    </div>
  `).join('');

  // Subtasks rendern (Beispiel, falls subtasks im taskData enthalten sind)
  let subtasksHtml = "";
 if (taskData.subtask && typeof taskData.subtask === "object") {
  // in Array umwandeln
  const subtaskEntries = Object.entries(taskData.subtask);
  // subtaskEntries ist jetzt z. B.:
  // [ ["0", { name: "...", done: true }], ["1", { name: "...", done: false }] ]

  subtasksHtml = subtaskEntries
    .map(([key, currentSubtask]) => `
      <div class="subtask_check">
        <input 
          type="checkbox" 
          id="subtask_${key}" 
          ${currentSubtask.done ? "checked" : ""}
        >
        <p class="subtask_detail_font">${currentSubtask.name}</p>
      </div>
    `)
    .join("");
}

  // Inhalt dynamisch einfügen
  overlayContent.innerHTML = `
    <div class="task_category_card_overlay task_category_color_${taskData.categoryColor}">
      ${taskData.category}
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
      <img src="./assets/img/priority_${taskData.priority}.svg" alt="priority icon" class= "priority_fullview">
    </div>

    <div class="assigned_to">
      <h4 class="padding_btm">Assigned To:</h4>
      ${assignedUsersHtml || '<p class="user_font">No users assigned</p>'}
    </div>

    <div class="subtasks_list">
      <h4>Subtasks</h4>
      ${subtasksHtml || '<p class="subtask_detail_font">No subtasks</p>'}
    </div>
    <div class="edit_delete_task"> 
    <div class="delete_task" onclick="deleteTask('${taskData.id}')"> 
    <img src="./assets/img/delete.svg" alt="delete icon" width="16px" height="18px">
    <p class="edit_task_font">Delete</p>
    </div> 
    
    <div class="seperator"> </div>
    <div class="edit_task" onclick="editTask('${taskData.id}')"> 
    <img src="./assets/img/edit.svg" alt="edit icon" width="16px" height="18px">
    <p class="edit_task_font">Edit</p>
    </div> 
    </div>
    
  `;
  ;
}


function renderTaskEditCard(taskData) {
  const overlayContent = document.getElementById("edit_task_overlay");
}