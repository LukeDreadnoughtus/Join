function openAddTaskOverlay() {
    document.getElementById("taskCeateButton").addEventListener("click", () => {
        const overlay = document.getElementById("overlay");
        const frame = document.getElementById("add-task-frame");
        frame.src = "add_task.html";
        overlay.classList.remove("hidden");
    });
    document.getElementById("overlay").addEventListener("click", (e) => {
        if (e.target.id === "overlay") e.target.classList.add("hidden");
    });
}

openAddTaskOverlay();





