const path = "https://join-database-ce37b-default-rtdb.europe-west1.firebasedatabase.app/";
const lowBtn = document.getElementById('low');
const mediumBtn = document.getElementById('medium');
const urgentBtn = document.getElementById('urgent');


async function loadCategories() {
  const select = document.getElementById("task-category");

  try {
    const response = await fetch(path + "categories.json");
    const data = await response.json();
    select.innerHTML = "";
    for (const key in data) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = data[key].name;
      select.appendChild(option);
    }
  } catch (error) {
    console.error("Fehler beim Laden der Kategorien:", error);
  }
}


lowBtn.addEventListener('click', () => {
  setActivePriority(lowBtn);
});


mediumBtn.addEventListener('click', () => {
  setActivePriority(mediumBtn);
});


urgentBtn.addEventListener('click', () => {
  setActivePriority(urgentBtn);
});


function setActivePriority(activeBtn) {
  const priorityButtons = [lowBtn, mediumBtn, urgentBtn];
  priorityButtons.forEach(btn => {
    if (btn !== activeBtn) {
      btn.classList.remove('active');
    }
  });
  activeBtn.classList.toggle('active');
}


async function createTask(event) {
  event.preventDefault();
  const requiredFields = document.querySelectorAll("input[required], select[required], textarea[required]");
  let isValid = true;
  document.querySelectorAll(".error-message").forEach(e => e.remove());
  requiredFields.forEach(f => f.classList.remove("input-error"));
  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add("input-error");
      const error = document.createElement("span");
      error.classList.add("error-message");
      error.textContent = "Dieses Feld ist erforderlich";
      field.insertAdjacentElement("afterend", error);
    }
  });

  if (!isValid) {
    return;
  }

  const title = document.getElementById("task-title")?.value || "";
  const description = document.getElementById("task-description")?.value || "";
  const category = document.getElementById("task-category")?.value || "";
  const assignedTo = document.getElementById("task-assigned-to")?.value || "";
  const priority = document.getElementById("task-priority")?.value || "";
  const subtasks = document.getElementById("subtask-tags")?.value || "";

  const newTask = {
    title,
    description,
    category,
    assignedTo,
    priority,
    subtasks,
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await fetch(path + "tasks.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });

    if (response.ok) {
      showSuccessMessage();
      clearForm();
    } else {
      console.error("Fehler beim Speichern in Firebase");
    }
  } catch (error) {
    console.error("Firebase Fehler:", error);
  }
}


function showSuccessMessage() {
  const msg = document.createElement("div");
  msg.textContent = "Task erfolgreich erstellt ✅";
  msg.style.color = "green";
  msg.style.marginTop = "10px";
  msg.style.fontWeight = "bold";
  msg.style.textAlign = "center";
  document.querySelector(".task-controls-buttons").appendChild(msg);
  setTimeout(() => msg.remove(), 3000);
}


function clearForm() {
  document.getElementById("task-title").value = "";
  document.getElementById("task-description").value = "";
  document.getElementById("task-category").selectedIndex = 0;
  document.getElementById("task-assigned-to").selectedIndex = 0;
  document.getElementById("subtask-tags").value = "";
  document.getElementById("task-priority").value = "medium";
}


function requiredFieldMarker() {
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("input[required], select[required], textarea[required]").forEach((field) => {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label && !label.innerHTML.includes("*")) {
        label.innerHTML += ' <span style="color:red">*</span>';
      }
    });
  });
}

requiredFieldMarker();
document.querySelector(".add-task-create-button").addEventListener("click", createTask);

document.addEventListener("DOMContentLoaded", loadCategories);