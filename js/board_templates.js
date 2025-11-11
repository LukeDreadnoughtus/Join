function noTasksTemplate() {
    document.getElementById("todo").innerHTML +=`<div id="no_todo_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
    document.getElementById("progress").innerHTML +=`<div id="no_progress_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
    document.getElementById("feedback").innerHTML +=`<div id="no_feedback_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
    document.getElementById("done").innerHTML +=`<div id="no_done_tasks" class="no_tasks"> <p class="font_no_task">No tasks To do</p></div>`
}

//Die ids der html Elemente habe ich jetzt mal nach den Boardslots benannt. 

function taskTemplate(currentBoardSlot, currentCategory, currentTitle, currentDescription, currentSubtasksNumber,categoryColor, currentPriority, assignedUsers, assignedUserColors, doneSubTasks) {
 let assignedUsersHtml = "";
 assignedUsers.forEach((user, index) => {
 let iconColor = assignedUserColors[index].replace('#', '');
 let usericon = initials(user)
 assignedUsersHtml += `<div class="user_icon color${iconColor}">${usericon}</div>`;
 });

 const taskHtml = `
    <div class="task_card" onclick="openTaskOverlay()">
      <div class="task_category_card task_category_color_${categoryColor}">${currentCategory}</div>
      <div class="task_titel_card">${currentTitle}</div>
      <div class="task_description_card">${currentDescription}</div>
      <div class="task_progress_subtasks_card">
        <img src="./assets/img/filler.svg" class="progressbar_subtasks" alt=""> 
        <p>${doneSubTasks}/${currentSubtasksNumber} Subtasks</p>
      </div>
      <div class="task_assigned_members_card">
        ${assignedUsersHtml}
        <img src="./assets/img/priority_${currentPriority}.svg" alt="priority icon" class="priority_icon_board">
      </div>
    </div>
    `;
  document.getElementById(`${currentBoardSlot}`).innerHTML += taskHtml;
}